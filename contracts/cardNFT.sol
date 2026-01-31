// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CardNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    
    enum Rarity { Commune, Rare, Epique, Legendaire }
    enum CardType { Guerrier, Mage, Creature, Artefact }

    struct Card {
        string name;
        CardType cardType;
        Rarity rarity;
        uint256 value;
        uint256 power;
        uint256 defense;
        address[] previousOwners;
        uint256 createdAt;
        uint256 lastTransferAt;
        uint256 edition;
        uint256 maxEdition;
        address creator;
        bool exists;
    }

    uint256 private _tokenIdCounter;

    uint256 public constant MAX_CARDS_PER_USER = 4;
    uint256 public constant TRANSACTION_COOLDOWN = 5 minutes;
    uint256 public constant ACQUISITION_LOCK = 10 minutes;

    uint256 public constant VALUE_COMMUNE = 10;
    uint256 public constant VALUE_RARE = 50;
    uint256 public constant VALUE_EPIQUE = 200;
    uint256 public constant VALUE_LEGENDAIRE = 1000;

    mapping(uint256 => Card) private _cards;
    mapping(address => uint256) private _lastTransactionTime;
    mapping(uint256 => uint256) private _acquisitionTime;
    mapping(address => uint256) private _userCardCount;

    event CardMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string name,
        CardType cardType,
        Rarity rarity,
        uint256 value
    );

    event CardTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    error MaxCardsReached(address user, uint256 currentCount);
    error CooldownNotElapsed(address user, uint256 remainingTime);
    error CardLocked(uint256 tokenId, uint256 remainingTime);
    error InvalidCardData();
    error CardDoesNotExist(uint256 tokenId);
    error InvalidPowerOrDefense();
    error InvalidEdition();

    constructor() ERC721("CardCollection", "CARD") Ownable(msg.sender) {
        _tokenIdCounter = 0;
    }

    function mint(
        address to,
        string memory name,
        CardType cardType,
        Rarity rarity,
        uint256 power,
        uint256 defense,
        uint256 edition,
        uint256 maxEdition,
        string memory ipfsURI
    ) public onlyOwner nonReentrant returns (uint256) {
        if (bytes(name).length == 0) revert InvalidCardData();
        if (power == 0 || power > 100 || defense == 0 || defense > 100) revert InvalidPowerOrDefense();
        if (edition == 0 || edition > maxEdition) revert InvalidEdition();
        if (_userCardCount[to] >= MAX_CARDS_PER_USER) revert MaxCardsReached(to, _userCardCount[to]);

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        uint256 value = _getValueByRarity(rarity);

        address[] memory emptyPreviousOwners = new address[](0);

        Card memory newCard = Card({
            name: name,
            cardType: cardType,
            rarity: rarity,
            value: value,
            power: power,
            defense: defense,
            previousOwners: emptyPreviousOwners,
            createdAt: block.timestamp,
            lastTransferAt: block.timestamp,
            creator: msg.sender,
            edition: edition,
            maxEdition: maxEdition,
            exists: true
        });

        _cards[tokenId] = newCard;
        _userCardCount[to]++;
        _acquisitionTime[tokenId] = block.timestamp;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, ipfsURI);

        emit CardMinted(tokenId, to, name, cardType, rarity, value);

        return tokenId;
    }

    function transferCard(address from, address to, uint256 tokenId) public nonReentrant {
        if (!_cards[tokenId].exists) revert CardDoesNotExist(tokenId);
        
        if (_userCardCount[to] >= MAX_CARDS_PER_USER) {
            revert MaxCardsReached(to, _userCardCount[to]);
        }

        uint256 lastTransaction = _lastTransactionTime[from];
        if (block.timestamp < lastTransaction + TRANSACTION_COOLDOWN) {
            revert CooldownNotElapsed(from, (lastTransaction + TRANSACTION_COOLDOWN) - block.timestamp);
        }

        uint256 acquisitionTime = _acquisitionTime[tokenId];
        if (block.timestamp < acquisitionTime + ACQUISITION_LOCK) {
            revert CardLocked(tokenId, (acquisitionTime + ACQUISITION_LOCK) - block.timestamp);
        }

        _cards[tokenId].previousOwners.push(from);
        _cards[tokenId].lastTransferAt = block.timestamp;

        _lastTransactionTime[from] = block.timestamp;
        _acquisitionTime[tokenId] = block.timestamp;

        _userCardCount[from]--;
        _userCardCount[to]++;

        _transfer(from, to, tokenId);

        emit CardTransferred(tokenId, from, to, block.timestamp);
    }

    function _getValueByRarity(Rarity rarity) internal pure returns (uint256) {
        if (rarity == Rarity.Commune) return VALUE_COMMUNE;
        if (rarity == Rarity.Rare) return VALUE_RARE;
        if (rarity == Rarity.Epique) return VALUE_EPIQUE;
        if (rarity == Rarity.Legendaire) return VALUE_LEGENDAIRE;
        return VALUE_COMMUNE;
    }

    function getCard(uint256 tokenId) public view returns (
        string memory name,
        CardType cardType,
        Rarity rarity,
        uint256 value,
        uint256 power,
        uint256 defense,
        uint256 createdAt,
        uint256 lastTransferAt,
        uint256 edition,
        uint256 maxEdition,
        address creator
    ) {
        if (!_cards[tokenId].exists) revert CardDoesNotExist(tokenId);
        Card storage card = _cards[tokenId];
        return (
            card.name,
            card.cardType,
            card.rarity,
            card.value,
            card.power,
            card.defense,
            card.createdAt,
            card.lastTransferAt,
            card.edition,
            card.maxEdition,
            card.creator
        );
    }

    function getCardPreviousOwners(uint256 tokenId) public view returns (address[] memory) {
        if (!_cards[tokenId].exists) revert CardDoesNotExist(tokenId);
        return _cards[tokenId].previousOwners;
    }

    function getUserCardCount(address user) public view returns (uint256) {
        return _userCardCount[user];
    }

    function getLastTransactionTime(address user) public view returns (uint256) {
        return _lastTransactionTime[user];
    }

    function getAcquisitionTime(uint256 tokenId) public view returns (uint256) {
        return _acquisitionTime[tokenId];
    }

    function canUserTransact(address user) public view returns (bool) {
        return block.timestamp >= _lastTransactionTime[user] + TRANSACTION_COOLDOWN;
    }

    function isCardLocked(uint256 tokenId) public view returns (bool) {
        return block.timestamp < _acquisitionTime[tokenId] + ACQUISITION_LOCK;
    }

    function getRemainingCooldown(address user) public view returns (uint256) {
        uint256 lastTransaction = _lastTransactionTime[user];
        if (block.timestamp >= lastTransaction + TRANSACTION_COOLDOWN) {
            return 0;
        }
        return (lastTransaction + TRANSACTION_COOLDOWN) - block.timestamp;
    }

    function getRemainingLockTime(uint256 tokenId) public view returns (uint256) {
        uint256 acquisitionTime = _acquisitionTime[tokenId];
        if (block.timestamp >= acquisitionTime + ACQUISITION_LOCK) {
            return 0;
        }
        return (acquisitionTime + ACQUISITION_LOCK) - block.timestamp;
    }

    function getCardValue(uint256 tokenId) public view returns (uint256) {
        if (!_cards[tokenId].exists) revert CardDoesNotExist(tokenId);
        return _cards[tokenId].value;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
