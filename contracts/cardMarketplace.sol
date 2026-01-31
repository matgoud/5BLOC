// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./cardNFT.sol";

contract CardMarketplace is Ownable, ReentrancyGuard {

    CardNFT public cardNFT;

    uint256 public constant MAX_EXCHANGE_RATIO = 5;

    enum TradeStatus { Pending, Accepted, Cancelled, Expired }

    struct Trade {
        uint256 tradeId;
        address proposer;
        address receiver;
        uint256 proposerTokenId;
        uint256 receiverTokenId;
        uint256 createdAt;
        uint256 expiresAt;
        TradeStatus status;
    }

    uint256 private _tradeIdCounter;
    uint256 public constant TRADE_EXPIRATION = 1 days;

    mapping(uint256 => Trade) private _trades;
    mapping(address => uint256[]) private _userTrades;
    mapping(uint256 => uint256) private _tokenActiveTrade;

    event TradeProposed(
        uint256 indexed tradeId,
        address indexed proposer,
        address indexed receiver,
        uint256 proposerTokenId,
        uint256 receiverTokenId,
        uint256 expiresAt
    );

    event TradeAccepted(
        uint256 indexed tradeId,
        address indexed proposer,
        address indexed receiver,
        uint256 proposerTokenId,
        uint256 receiverTokenId
    );

    event TradeCancelled(
        uint256 indexed tradeId,
        address indexed cancelledBy
    );

    event TradeExpired(
        uint256 indexed tradeId
    );

    error InvalidCardNFTAddress();
    error TradeDoesNotExist(uint256 tradeId);
    error TradeNotPending(uint256 tradeId);
    error TradeExpiredError(uint256 tradeId);
    error NotTradeParticipant(address caller, uint256 tradeId);
    error NotTradeReceiver(address caller, uint256 tradeId);
    error NotTradeProposer(address caller, uint256 tradeId);
    error InvalidExchangeRatio(uint256 proposerValue, uint256 receiverValue, uint256 ratio);
    error TokenAlreadyInTrade(uint256 tokenId, uint256 existingTradeId);
    error NotTokenOwner(address caller, uint256 tokenId);
    error CannotTradeWithSelf();
    error CardIsLocked(uint256 tokenId, uint256 remainingTime);
    error CooldownActive(address user, uint256 remainingTime);
    error MaxCardsReached(address user);

    constructor(address cardNFTAddress) Ownable(msg.sender) {
        if (cardNFTAddress == address(0)) revert InvalidCardNFTAddress();
        cardNFT = CardNFT(cardNFTAddress);
        _tradeIdCounter = 0;
    }

    function proposeTrade(
        uint256 proposerTokenId,
        address receiver,
        uint256 receiverTokenId
    ) public nonReentrant returns (uint256) {
        address proposer = msg.sender;

        if (proposer == receiver) revert CannotTradeWithSelf();

        if (cardNFT.ownerOf(proposerTokenId) != proposer) {
            revert NotTokenOwner(proposer, proposerTokenId);
        }
        if (cardNFT.ownerOf(receiverTokenId) != receiver) {
            revert NotTokenOwner(receiver, receiverTokenId);
        }

        if (_tokenActiveTrade[proposerTokenId] != 0) {
            uint256 existingTradeId = _tokenActiveTrade[proposerTokenId];
            if (_trades[existingTradeId].status == TradeStatus.Pending) {
                revert TokenAlreadyInTrade(proposerTokenId, existingTradeId);
            }
        }
        if (_tokenActiveTrade[receiverTokenId] != 0) {
            uint256 existingTradeId = _tokenActiveTrade[receiverTokenId];
            if (_trades[existingTradeId].status == TradeStatus.Pending) {
                revert TokenAlreadyInTrade(receiverTokenId, existingTradeId);
            }
        }

        uint256 proposerValue = cardNFT.getCardValue(proposerTokenId);
        uint256 receiverValue = cardNFT.getCardValue(receiverTokenId);
        
        uint256 ratio;
        if (proposerValue >= receiverValue) {
            ratio = proposerValue / receiverValue;
        } else {
            ratio = receiverValue / proposerValue;
        }
        
        if (ratio > MAX_EXCHANGE_RATIO) {
            revert InvalidExchangeRatio(proposerValue, receiverValue, ratio);
        }

        _tradeIdCounter++;
        uint256 tradeId = _tradeIdCounter;

        Trade memory newTrade = Trade({
            tradeId: tradeId,
            proposer: proposer,
            receiver: receiver,
            proposerTokenId: proposerTokenId,
            receiverTokenId: receiverTokenId,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + TRADE_EXPIRATION,
            status: TradeStatus.Pending
        });

        _trades[tradeId] = newTrade;
        _userTrades[proposer].push(tradeId);
        _userTrades[receiver].push(tradeId);
        _tokenActiveTrade[proposerTokenId] = tradeId;
        _tokenActiveTrade[receiverTokenId] = tradeId;

        emit TradeProposed(
            tradeId,
            proposer,
            receiver,
            proposerTokenId,
            receiverTokenId,
            newTrade.expiresAt
        );

        return tradeId;
    }

    function acceptTrade(uint256 tradeId) public nonReentrant {
        Trade storage trade = _trades[tradeId];

        if (trade.tradeId == 0) revert TradeDoesNotExist(tradeId);
        if (trade.status != TradeStatus.Pending) revert TradeNotPending(tradeId);
        if (block.timestamp > trade.expiresAt) {
            trade.status = TradeStatus.Expired;
            _clearTokenTrades(trade.proposerTokenId, trade.receiverTokenId);
            emit TradeExpired(tradeId);
            revert TradeExpiredError(tradeId);
        }
        if (msg.sender != trade.receiver) revert NotTradeReceiver(msg.sender, tradeId);

        if (cardNFT.ownerOf(trade.proposerTokenId) != trade.proposer) {
            revert NotTokenOwner(trade.proposer, trade.proposerTokenId);
        }
        if (cardNFT.ownerOf(trade.receiverTokenId) != trade.receiver) {
            revert NotTokenOwner(trade.receiver, trade.receiverTokenId);
        }

        if (cardNFT.isCardLocked(trade.proposerTokenId)) {
            revert CardIsLocked(trade.proposerTokenId, cardNFT.getRemainingLockTime(trade.proposerTokenId));
        }
        if (cardNFT.isCardLocked(trade.receiverTokenId)) {
            revert CardIsLocked(trade.receiverTokenId, cardNFT.getRemainingLockTime(trade.receiverTokenId));
        }

        if (!cardNFT.canUserTransact(trade.proposer)) {
            revert CooldownActive(trade.proposer, cardNFT.getRemainingCooldown(trade.proposer));
        }
        if (!cardNFT.canUserTransact(trade.receiver)) {
            revert CooldownActive(trade.receiver, cardNFT.getRemainingCooldown(trade.receiver));
        }

        trade.status = TradeStatus.Accepted;
        _clearTokenTrades(trade.proposerTokenId, trade.receiverTokenId);

        cardNFT.transferCard(trade.proposer, trade.receiver, trade.proposerTokenId);
        cardNFT.transferCard(trade.receiver, trade.proposer, trade.receiverTokenId);

        emit TradeAccepted(
            tradeId,
            trade.proposer,
            trade.receiver,
            trade.proposerTokenId,
            trade.receiverTokenId
        );
    }

    function cancelTrade(uint256 tradeId) public nonReentrant {
        Trade storage trade = _trades[tradeId];

        if (trade.tradeId == 0) revert TradeDoesNotExist(tradeId);
        if (trade.status != TradeStatus.Pending) revert TradeNotPending(tradeId);
        if (msg.sender != trade.proposer && msg.sender != trade.receiver) {
            revert NotTradeParticipant(msg.sender, tradeId);
        }

        trade.status = TradeStatus.Cancelled;
        _clearTokenTrades(trade.proposerTokenId, trade.receiverTokenId);

        emit TradeCancelled(tradeId, msg.sender);
    }

    function expireTrade(uint256 tradeId) public {
        Trade storage trade = _trades[tradeId];

        if (trade.tradeId == 0) revert TradeDoesNotExist(tradeId);
        if (trade.status != TradeStatus.Pending) revert TradeNotPending(tradeId);
        
        if (block.timestamp > trade.expiresAt) {
            trade.status = TradeStatus.Expired;
            _clearTokenTrades(trade.proposerTokenId, trade.receiverTokenId);
            emit TradeExpired(tradeId);
        }
    }

    function _clearTokenTrades(uint256 tokenId1, uint256 tokenId2) internal {
        delete _tokenActiveTrade[tokenId1];
        delete _tokenActiveTrade[tokenId2];
    }

    function getTrade(uint256 tradeId) public view returns (
        address proposer,
        address receiver,
        uint256 proposerTokenId,
        uint256 receiverTokenId,
        uint256 createdAt,
        uint256 expiresAt,
        TradeStatus status
    ) {
        Trade storage trade = _trades[tradeId];
        if (trade.tradeId == 0) revert TradeDoesNotExist(tradeId);
        
        return (
            trade.proposer,
            trade.receiver,
            trade.proposerTokenId,
            trade.receiverTokenId,
            trade.createdAt,
            trade.expiresAt,
            trade.status
        );
    }

    function getUserTrades(address user) public view returns (uint256[] memory) {
        return _userTrades[user];
    }

    function getTokenActiveTrade(uint256 tokenId) public view returns (uint256) {
        return _tokenActiveTrade[tokenId];
    }

    function isTradeValid(uint256 tradeId) public view returns (bool) {
        Trade storage trade = _trades[tradeId];
        
        if (trade.tradeId == 0) return false;
        if (trade.status != TradeStatus.Pending) return false;
        if (block.timestamp > trade.expiresAt) return false;
        if (cardNFT.ownerOf(trade.proposerTokenId) != trade.proposer) return false;
        if (cardNFT.ownerOf(trade.receiverTokenId) != trade.receiver) return false;
        
        return true;
    }

    function canAcceptTrade(uint256 tradeId) public view returns (bool, string memory) {
        Trade storage trade = _trades[tradeId];

        if (trade.tradeId == 0) return (false, "Trade does not exist");
        if (trade.status != TradeStatus.Pending) return (false, "Trade is not pending");
        if (block.timestamp > trade.expiresAt) return (false, "Trade has expired");
        if (cardNFT.ownerOf(trade.proposerTokenId) != trade.proposer) return (false, "Proposer no longer owns the card");
        if (cardNFT.ownerOf(trade.receiverTokenId) != trade.receiver) return (false, "Receiver no longer owns the card");
        if (cardNFT.isCardLocked(trade.proposerTokenId)) return (false, "Proposer card is locked");
        if (cardNFT.isCardLocked(trade.receiverTokenId)) return (false, "Receiver card is locked");
        if (!cardNFT.canUserTransact(trade.proposer)) return (false, "Proposer cooldown active");
        if (!cardNFT.canUserTransact(trade.receiver)) return (false, "Receiver cooldown active");

        return (true, "Trade can be accepted");
    }

    function checkExchangeRatio(uint256 tokenId1, uint256 tokenId2) public view returns (bool isValid, uint256 ratio) {
        uint256 value1 = cardNFT.getCardValue(tokenId1);
        uint256 value2 = cardNFT.getCardValue(tokenId2);

        if (value1 >= value2) {
            ratio = value1 / value2;
        } else {
            ratio = value2 / value1;
        }

        isValid = ratio <= MAX_EXCHANGE_RATIO;
        return (isValid, ratio);
    }
}
