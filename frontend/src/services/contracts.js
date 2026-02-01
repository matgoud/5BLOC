import { ethers } from 'ethers';
import CardNFTABI from '../contracts/cardNFT.json';
import CardMarketplaceABI from '../contracts/cardMarketplace.json';

// Ajoutez ceci tout en haut de services/contracts.js
console.log("=== CONFIGURATION DEBUG ===");
console.log("Adresse NFT utilisée :", process.env.REACT_APP_CARDNFT_ADDRESS);
console.log("Adresse Marketplace utilisée :", process.env.REACT_APP_MARKETPLACE_ADDRESS);
console.log("===========================");

const CARDNFT_ADDRESS = process.env.REACT_APP_CARDNFT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const MARKETPLACE_ADDRESS = process.env.REACT_APP_MARKETPLACE_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

export const getCardNFTContract = async (providerOrSigner) => {
  return new ethers.Contract(CARDNFT_ADDRESS, CardNFTABI.abi, providerOrSigner);
};

export const getMarketplaceContract = async (providerOrSigner) => {
  return new ethers.Contract(MARKETPLACE_ADDRESS, CardMarketplaceABI.abi, providerOrSigner);
};

export const RARITY = {
  0: 'Commune',
  1: 'Rare',
  2: 'Epique',
  3: 'Legendaire',
};

export const RARITY_VALUES = {
  Commune: 10,
  Rare: 50,
  Epique: 200,
  Legendaire: 1000,
};

export const CARD_TYPE = {
  0: 'Guerrier',
  1: 'Mage',
  2: 'Creature',
  3: 'Artefact',
};

export const TRADE_STATUS = {
  0: 'Pending',
  1: 'Accepted',
  2: 'Cancelled',
  3: 'Expired',
};

export const mintCard = async (signer, to, name, cardType, rarity, power, defense, edition, maxEdition, ipfsURI) => {
  const contract = await getCardNFTContract(signer);
  const tx = await contract.mint(to, name, cardType, rarity, power, defense, edition, maxEdition, ipfsURI);
  const receipt = await tx.wait();
  return receipt;
};

export const transferCard = async (signer, from, to, tokenId) => {
  const contract = await getCardNFTContract(signer);
  const tx = await contract.transferCard(from, to, tokenId);
  const receipt = await tx.wait();
  return receipt;
};

export const getCard = async (provider, tokenId) => {
  const contract = await getCardNFTContract(provider);
  const card = await contract.getCard(tokenId);
  return {
    name: card.name,
    cardType: Number(card.cardType),
    rarity: Number(card.rarity),
    value: Number(card.value),
    power: Number(card.power),
    defense: Number(card.defense),
    createdAt: Number(card.createdAt),
    lastTransferAt: Number(card.lastTransferAt),
    edition: Number(card.edition),
    maxEdition: Number(card.maxEdition),
    creator: card.creator,
  };
};

export const getCardValue = async (provider, tokenId) => {
  const contract = await getCardNFTContract(provider);
  const value = await contract.getCardValue(tokenId);
  return Number(value);
};

export const getUserCardCount = async (provider, address) => {
  const contract = await getCardNFTContract(provider);
  const count = await contract.getUserCardCount(address);
  return Number(count);
};

export const getCardPreviousOwners = async (provider, tokenId) => {
  const contract = await getCardNFTContract(provider);
  const owners = await contract.getCardPreviousOwners(tokenId);
  return owners;
};

export const canUserTransact = async (provider, address) => {
  const contract = await getCardNFTContract(provider);
  const canTransact = await contract.canUserTransact(address);
  return canTransact;
};

export const isCardLocked = async (provider, tokenId) => {
  const contract = await getCardNFTContract(provider);
  const locked = await contract.isCardLocked(tokenId);
  return locked;
};

export const getRemainingCooldown = async (provider, address) => {
  const contract = await getCardNFTContract(provider);
  const remaining = await contract.getRemainingCooldown(address);
  return Number(remaining);
};

export const getRemainingLockTime = async (provider, tokenId) => {
  const contract = await getCardNFTContract(provider);
  const remaining = await contract.getRemainingLockTime(tokenId);
  return Number(remaining);
};

export const getOwnerOf = async (provider, tokenId) => {
  const contract = await getCardNFTContract(provider);
  const owner = await contract.ownerOf(tokenId);
  return owner;
};

export const getContractOwner = async (provider) => {
  const contract = await getCardNFTContract(provider);
  const owner = await contract.owner();
  return owner;
};

export const getTokenURI = async (provider, tokenId) => {
  const contract = await getCardNFTContract(provider);
  const uri = await contract.tokenURI(tokenId);
  return uri;
};

export const proposeTrade = async (signer, proposerTokenId, receiver, receiverTokenId) => {
  const contract = await getMarketplaceContract(signer);
  const tx = await contract.proposeTrade(proposerTokenId, receiver, receiverTokenId);
  const receipt = await tx.wait();
  return receipt;
};

export const acceptTrade = async (signer, tradeId) => {
  const contract = await getMarketplaceContract(signer);
  const tx = await contract.acceptTrade(tradeId);
  const receipt = await tx.wait();
  return receipt;
};

export const cancelTrade = async (signer, tradeId) => {
  const contract = await getMarketplaceContract(signer);
  const tx = await contract.cancelTrade(tradeId);
  const receipt = await tx.wait();
  return receipt;
};

export const getTrade = async (provider, tradeId) => {
  const contract = await getMarketplaceContract(provider);
  const trade = await contract.getTrade(tradeId);
  return {
    proposer: trade.proposer,
    receiver: trade.receiver,
    proposerTokenId: Number(trade.proposerTokenId),
    receiverTokenId: Number(trade.receiverTokenId),
    createdAt: Number(trade.createdAt),
    expiresAt: Number(trade.expiresAt),
    status: Number(trade.status),
  };
};

export const getUserTrades = async (provider, address) => {
  const contract = await getMarketplaceContract(provider);
  const trades = await contract.getUserTrades(address);
  return trades.map(t => Number(t));
};

export const isTradeValid = async (provider, tradeId) => {
  const contract = await getMarketplaceContract(provider);
  const valid = await contract.isTradeValid(tradeId);
  return valid;
};

export const canAcceptTrade = async (provider, tradeId) => {
  const contract = await getMarketplaceContract(provider);
  const result = await contract.canAcceptTrade(tradeId);
  return {
    canAccept: result[0],
    message: result[1],
  };
};

export const checkExchangeRatio = async (provider, tokenId1, tokenId2) => {
  const contract = await getMarketplaceContract(provider);
  const result = await contract.checkExchangeRatio(tokenId1, tokenId2);
  return {
    isValid: result[0],
    ratio: Number(result[1]),
  };
};

export const getUserCards = async (provider, address) => {
  const contract = await getCardNFTContract(provider);
  const cards = [];
  
  let tokenId = 0;
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    try {
      const owner = await contract.ownerOf(tokenId);
      if (owner.toLowerCase() === address.toLowerCase()) {
        const cardData = await getCard(provider, tokenId);
        const uri = await getTokenURI(provider, tokenId);
        const locked = await isCardLocked(provider, tokenId);
        cards.push({
          tokenId,
          ...cardData,
          tokenURI: uri,
          isLocked: locked,
        });
      }
      tokenId++;
      attempts++;
    } catch (error) {
      break;
    }
  }

  return cards;
};

export const getAllCards = async (provider) => {
  const contract = await getCardNFTContract(provider);
  const cards = [];
  
  let tokenId = 0;
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    try {
      const owner = await contract.ownerOf(tokenId);
      const cardData = await getCard(provider, tokenId);
      const uri = await getTokenURI(provider, tokenId);
      const locked = await isCardLocked(provider, tokenId);
      cards.push({
        tokenId,
        owner,
        ...cardData,
        tokenURI: uri,
        isLocked: locked,
      });
      tokenId++;
      attempts++;
    } catch (error) {
      break;
    }
  }

  return cards;
};