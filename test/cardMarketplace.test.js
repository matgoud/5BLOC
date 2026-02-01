const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CardMarketplace", function () {
  let cardNFT;
  let marketplace;
  let owner;
  let user1;
  let user2;
  let user3;

  const CardType = {
    Guerrier: 0,
    Mage: 1,
    Creature: 2,
    Artefact: 3,
  };

  const Rarity = {
    Commune: 0,
    Rare: 1,
    Epique: 2,
    Legendaire: 3,
  };

  const VALUES = {
    Commune: 10,
    Rare: 50,
    Epique: 200,
    Legendaire: 1000,
  };

  const COOLDOWN = 5 * 60;
  const LOCK_TIME = 10 * 60;
  const TRADE_EXPIRATION = 24 * 60 * 60;

  async function mintCard(to, name, cardType, rarity, tokenId) {
    await cardNFT.mint(
      to,
      name,
      cardType,
      rarity,
      50,
      50,
      1,
      100,
      `ipfs://card${tokenId}`
    );
  }

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const CardNFT = await ethers.getContractFactory("CardNFT");
    cardNFT = await CardNFT.deploy();
    await cardNFT.waitForDeployment();

    const CardMarketplace = await ethers.getContractFactory("CardMarketplace");
    marketplace = await CardMarketplace.deploy(await cardNFT.getAddress());
    await marketplace.waitForDeployment();
  });

  describe("Deploiement", function () {
    it("devrait deployer le marketplace avec la bonne adresse CardNFT", async function () {
      expect(await marketplace.cardNFT()).to.equal(await cardNFT.getAddress());
    });

    it("devrait definir le bon owner", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it("devrait avoir le bon ratio d'echange maximum", async function () {
      expect(await marketplace.MAX_EXCHANGE_RATIO()).to.equal(5);
    });

    it("devrait refuser le deploiement avec une adresse nulle", async function () {
      const CardMarketplace = await ethers.getContractFactory("CardMarketplace");
      await expect(
        CardMarketplace.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(marketplace, "InvalidCardNFTAddress");
    });
  });

  describe("Proposition d'echange", function () {
    beforeEach(async function () {
      await mintCard(user1.address, "Carte User1", CardType.Guerrier, Rarity.Commune, 0);
      await mintCard(user2.address, "Carte User2", CardType.Mage, Rarity.Commune, 1);
    });

    it("devrait permettre de proposer un echange valide", async function () {
      const tx = await marketplace.connect(user1).proposeTrade(0, user2.address, 1);

      await expect(tx)
        .to.emit(marketplace, "TradeProposed");

      const trade = await marketplace.getTrade(1);
      expect(trade.proposer).to.equal(user1.address);
      expect(trade.receiver).to.equal(user2.address);
      expect(trade.proposerTokenId).to.equal(0);
      expect(trade.receiverTokenId).to.equal(1);
      expect(trade.status).to.equal(0);
      expect(trade.expiresAt).to.be.greaterThan(trade.createdAt);
    });

    it("devrait enregistrer le trade dans les listes des utilisateurs", async function () {
      await marketplace.connect(user1).proposeTrade(0, user2.address, 1);

      const user1Trades = await marketplace.getUserTrades(user1.address);
      const user2Trades = await marketplace.getUserTrades(user2.address);

      expect(user1Trades.length).to.equal(1);
      expect(user2Trades.length).to.equal(1);
      expect(user1Trades[0]).to.equal(1);
      expect(user2Trades[0]).to.equal(1);
    });

    it("devrait marquer les tokens comme etant dans un trade actif", async function () {
      await marketplace.connect(user1).proposeTrade(0, user2.address, 1);

      expect(await marketplace.getTokenActiveTrade(0)).to.equal(1);
      expect(await marketplace.getTokenActiveTrade(1)).to.equal(1);
    });

    it("devrait refuser un echange avec soi-meme", async function () {
      await mintCard(user1.address, "Carte User1 Bis", CardType.Mage, Rarity.Commune, 2);

      await expect(
        marketplace.connect(user1).proposeTrade(0, user1.address, 2)
      ).to.be.revertedWithCustomError(marketplace, "CannotTradeWithSelf");
    });

    it("devrait refuser si le proposeur ne possede pas la carte", async function () {
      await expect(
        marketplace.connect(user2).proposeTrade(0, user1.address, 1)
      ).to.be.revertedWithCustomError(marketplace, "NotTokenOwner");
    });

    it("devrait refuser si le receveur ne possede pas la carte", async function () {
      await expect(
        marketplace.connect(user1).proposeTrade(0, user2.address, 0)
      ).to.be.revertedWithCustomError(marketplace, "NotTokenOwner");
    });

    it("devrait refuser si le token du proposeur est deja dans un trade", async function () {
      await marketplace.connect(user1).proposeTrade(0, user2.address, 1);

      await mintCard(user3.address, "Carte User3", CardType.Creature, Rarity.Commune, 2);

      await expect(
        marketplace.connect(user1).proposeTrade(0, user3.address, 2)
      ).to.be.revertedWithCustomError(marketplace, "TokenAlreadyInTrade");
    });

    it("devrait refuser si le token du receveur est deja dans un trade", async function () {
      await marketplace.connect(user1).proposeTrade(0, user2.address, 1);

      await mintCard(user3.address, "Carte User3", CardType.Creature, Rarity.Commune, 2);

      await expect(
        marketplace.connect(user3).proposeTrade(2, user2.address, 1)
      ).to.be.revertedWithCustomError(marketplace, "TokenAlreadyInTrade");
    });
  });

  describe("Validation du ratio d'echange", function () {
    it("devrait accepter un ratio de 1:1 (Commune vs Commune)", async function () {
      await mintCard(user1.address, "Commune 1", CardType.Guerrier, Rarity.Commune, 0);
      await mintCard(user2.address, "Commune 2", CardType.Mage, Rarity.Commune, 1);

      await expect(
        marketplace.connect(user1).proposeTrade(0, user2.address, 1)
      ).to.not.be.reverted;
    });

    it("devrait accepter un ratio de 1:5 (Commune vs Rare)", async function () {
      await mintCard(user1.address, "Commune", CardType.Guerrier, Rarity.Commune, 0);
      await mintCard(user2.address, "Rare", CardType.Mage, Rarity.Rare, 1);

      await expect(
        marketplace.connect(user1).proposeTrade(0, user2.address, 1)
      ).to.not.be.reverted;
    });

    it("devrait accepter un ratio de 1:4 (Rare vs Epique)", async function () {
      await mintCard(user1.address, "Rare", CardType.Guerrier, Rarity.Rare, 0);
      await mintCard(user2.address, "Epique", CardType.Mage, Rarity.Epique, 1);

      await expect(
        marketplace.connect(user1).proposeTrade(0, user2.address, 1)
      ).to.not.be.reverted;
    });

    it("devrait accepter un ratio de 1:5 (Epique vs Legendaire)", async function () {
      await mintCard(user1.address, "Epique", CardType.Guerrier, Rarity.Epique, 0);
      await mintCard(user2.address, "Legendaire", CardType.Mage, Rarity.Legendaire, 1);

      await expect(
        marketplace.connect(user1).proposeTrade(0, user2.address, 1)
      ).to.not.be.reverted;
    });

    it("devrait refuser un ratio superieur a 1:5 (Commune vs Epique)", async function () {
      await mintCard(user1.address, "Commune", CardType.Guerrier, Rarity.Commune, 0);
      await mintCard(user2.address, "Epique", CardType.Mage, Rarity.Epique, 1);

      await expect(
        marketplace.connect(user1).proposeTrade(0, user2.address, 1)
      ).to.be.revertedWithCustomError(marketplace, "InvalidExchangeRatio");
    });

    it("devrait refuser un ratio superieur a 1:5 (Commune vs Legendaire)", async function () {
      await mintCard(user1.address, "Commune", CardType.Guerrier, Rarity.Commune, 0);
      await mintCard(user2.address, "Legendaire", CardType.Mage, Rarity.Legendaire, 1);

      await expect(
        marketplace.connect(user1).proposeTrade(0, user2.address, 1)
      ).to.be.revertedWithCustomError(marketplace, "InvalidExchangeRatio");
    });

    it("devrait refuser un ratio superieur a 1:5 (Rare vs Legendaire)", async function () {
      await mintCard(user1.address, "Rare", CardType.Guerrier, Rarity.Rare, 0);
      await mintCard(user2.address, "Legendaire", CardType.Mage, Rarity.Legendaire, 1);

      await expect(
        marketplace.connect(user1).proposeTrade(0, user2.address, 1)
      ).to.be.revertedWithCustomError(marketplace, "InvalidExchangeRatio");
    });

    it("devrait retourner le bon ratio via checkExchangeRatio", async function () {
      await mintCard(user1.address, "Commune", CardType.Guerrier, Rarity.Commune, 0);
      await mintCard(user2.address, "Rare", CardType.Mage, Rarity.Rare, 1);
      await mintCard(user2.address, "Epique", CardType.Creature, Rarity.Epique, 2);

      const [isValid1, ratio1] = await marketplace.checkExchangeRatio(0, 1);
      expect(isValid1).to.be.true;
      expect(ratio1).to.equal(5);

      const [isValid2, ratio2] = await marketplace.checkExchangeRatio(0, 2);
      expect(isValid2).to.be.false;
      expect(ratio2).to.equal(20);
    });
  });

  describe("Acceptation d'echange", function () {
    beforeEach(async function () {
      await mintCard(user1.address, "Carte User1", CardType.Guerrier, Rarity.Commune, 0);
      await mintCard(user2.address, "Carte User2", CardType.Mage, Rarity.Commune, 1);
      await time.increase(LOCK_TIME + 1);
      await marketplace.connect(user1).proposeTrade(0, user2.address, 1);
    });

    it("devrait permettre au receveur d'accepter l'echange", async function () {
      await time.increase(COOLDOWN + 1);

      const tx = await marketplace.connect(user2).acceptTrade(1);

      await expect(tx)
        .to.emit(marketplace, "TradeAccepted")
        .withArgs(1, user1.address, user2.address, 0, 1);

      expect(await cardNFT.ownerOf(0)).to.equal(user2.address);
      expect(await cardNFT.ownerOf(1)).to.equal(user1.address);
    });

    it("devrait mettre a jour le statut du trade apres acceptation", async function () {
      await time.increase(COOLDOWN + 1);
      await marketplace.connect(user2).acceptTrade(1);

      const trade = await marketplace.getTrade(1);
      expect(trade.status).to.equal(1);
    });

    it("devrait liberer les tokens du trade actif apres acceptation", async function () {
      await time.increase(COOLDOWN + 1);
      await marketplace.connect(user2).acceptTrade(1);

      expect(await marketplace.getTokenActiveTrade(0)).to.equal(0);
      expect(await marketplace.getTokenActiveTrade(1)).to.equal(0);
    });

    it("devrait refuser si l'appelant n'est pas le receveur", async function () {
      await time.increase(COOLDOWN + 1);

      await expect(
        marketplace.connect(user1).acceptTrade(1)
      ).to.be.revertedWithCustomError(marketplace, "NotTradeReceiver");

      await expect(
        marketplace.connect(user3).acceptTrade(1)
      ).to.be.revertedWithCustomError(marketplace, "NotTradeReceiver");
    });

    it("devrait refuser si le trade n'existe pas", async function () {
      await expect(
        marketplace.connect(user2).acceptTrade(999)
      ).to.be.revertedWithCustomError(marketplace, "TradeDoesNotExist");
    });

    it("devrait refuser si le trade n'est pas en attente", async function () {
      await time.increase(COOLDOWN + 1);
      await marketplace.connect(user2).acceptTrade(1);

      await expect(
        marketplace.connect(user2).acceptTrade(1)
      ).to.be.revertedWithCustomError(marketplace, "TradeNotPending");
    });

    it("devrait refuser si une carte est verrouillee", async function () {
      await mintCard(user1.address, "Nouvelle Carte", CardType.Creature, Rarity.Commune, 2);
      await mintCard(user2.address, "Nouvelle Carte 2", CardType.Artefact, Rarity.Commune, 3);

      await marketplace.connect(user1).proposeTrade(2, user2.address, 3);

      await expect(
        marketplace.connect(user2).acceptTrade(2)
      ).to.be.revertedWithCustomError(marketplace, "CardIsLocked");
    });

    it("devrait refuser si le cooldown est actif", async function () {
      await marketplace.connect(user1).cancelTrade(1);
      
      await mintCard(user1.address, "Carte Extra", CardType.Creature, Rarity.Commune, 2);
      await time.increase(LOCK_TIME + 1);
      
      await cardNFT.transferCard(user1.address, user3.address, 2);
      
      await marketplace.connect(user1).proposeTrade(0, user2.address, 1);

      await expect(
        marketplace.connect(user2).acceptTrade(2)
      ).to.be.revertedWithCustomError(marketplace, "CooldownActive");
    });
  });

  describe("Annulation d'echange", function () {
    beforeEach(async function () {
      await mintCard(user1.address, "Carte User1", CardType.Guerrier, Rarity.Commune, 0);
      await mintCard(user2.address, "Carte User2", CardType.Mage, Rarity.Commune, 1);
      await marketplace.connect(user1).proposeTrade(0, user2.address, 1);
    });

    it("devrait permettre au proposeur d'annuler", async function () {
      const tx = await marketplace.connect(user1).cancelTrade(1);

      await expect(tx)
        .to.emit(marketplace, "TradeCancelled")
        .withArgs(1, user1.address);

      const trade = await marketplace.getTrade(1);
      expect(trade.status).to.equal(2);
    });

    it("devrait permettre au receveur d'annuler", async function () {
      const tx = await marketplace.connect(user2).cancelTrade(1);

      await expect(tx)
        .to.emit(marketplace, "TradeCancelled")
        .withArgs(1, user2.address);

      const trade = await marketplace.getTrade(1);
      expect(trade.status).to.equal(2);
    });

    it("devrait liberer les tokens apres annulation", async function () {
      await marketplace.connect(user1).cancelTrade(1);

      expect(await marketplace.getTokenActiveTrade(0)).to.equal(0);
      expect(await marketplace.getTokenActiveTrade(1)).to.equal(0);
    });

    it("devrait permettre de reproposer apres annulation", async function () {
      await marketplace.connect(user1).cancelTrade(1);

      await expect(
        marketplace.connect(user1).proposeTrade(0, user2.address, 1)
      ).to.not.be.reverted;
    });

    it("devrait refuser l'annulation par un tiers", async function () {
      await expect(
        marketplace.connect(user3).cancelTrade(1)
      ).to.be.revertedWithCustomError(marketplace, "NotTradeParticipant");
    });

    it("devrait refuser l'annulation d'un trade inexistant", async function () {
      await expect(
        marketplace.connect(user1).cancelTrade(999)
      ).to.be.revertedWithCustomError(marketplace, "TradeDoesNotExist");
    });

    it("devrait refuser l'annulation d'un trade deja annule", async function () {
      await marketplace.connect(user1).cancelTrade(1);

      await expect(
        marketplace.connect(user1).cancelTrade(1)
      ).to.be.revertedWithCustomError(marketplace, "TradeNotPending");
    });
  });

  describe("Expiration d'echange", function () {
    beforeEach(async function () {
      await mintCard(user1.address, "Carte User1", CardType.Guerrier, Rarity.Commune, 0);
      await mintCard(user2.address, "Carte User2", CardType.Mage, Rarity.Commune, 1);
      await time.increase(LOCK_TIME + 1);
      await marketplace.connect(user1).proposeTrade(0, user2.address, 1);
    });

    it("devrait marquer un trade comme expire apres le delai", async function () {
      await time.increase(TRADE_EXPIRATION + 1);

      const tx = await marketplace.expireTrade(1);

      await expect(tx)
        .to.emit(marketplace, "TradeExpired")
        .withArgs(1);

      const trade = await marketplace.getTrade(1);
      expect(trade.status).to.equal(3);
    });

    it("devrait liberer les tokens apres expiration", async function () {
      await time.increase(TRADE_EXPIRATION + 1);
      await marketplace.expireTrade(1);

      expect(await marketplace.getTokenActiveTrade(0)).to.equal(0);
      expect(await marketplace.getTokenActiveTrade(1)).to.equal(0);
    });

    it("devrait refuser l'acceptation d'un trade expire", async function () {
      await time.increase(TRADE_EXPIRATION + 1);

      await expect(
        marketplace.connect(user2).acceptTrade(1)
      ).to.be.revertedWithCustomError(marketplace, "TradeExpiredError");
    });

    it("ne devrait pas expirer un trade encore valide", async function () {
      await time.increase(TRADE_EXPIRATION - 100);

      await marketplace.expireTrade(1);

      const trade = await marketplace.getTrade(1);
      expect(trade.status).to.equal(0);
    });
  });

  describe("Fonctions de verification", function () {
    beforeEach(async function () {
      await mintCard(user1.address, "Carte User1", CardType.Guerrier, Rarity.Commune, 0);
      await mintCard(user2.address, "Carte User2", CardType.Mage, Rarity.Commune, 1);
      await time.increase(LOCK_TIME + 1);
      await marketplace.connect(user1).proposeTrade(0, user2.address, 1);
    });

    it("devrait retourner true pour un trade valide via isTradeValid", async function () {
      expect(await marketplace.isTradeValid(1)).to.be.true;
    });

    it("devrait retourner false pour un trade annule via isTradeValid", async function () {
      await marketplace.connect(user1).cancelTrade(1);
      expect(await marketplace.isTradeValid(1)).to.be.false;
    });

    it("devrait retourner false pour un trade expire via isTradeValid", async function () {
      await time.increase(TRADE_EXPIRATION + 1);
      expect(await marketplace.isTradeValid(1)).to.be.false;
    });

    it("devrait retourner les bonnes informations via canAcceptTrade", async function () {
      const [canAccept, message] = await marketplace.canAcceptTrade(1);
      expect(canAccept).to.be.true;
      expect(message).to.equal("Trade can be accepted");

      await marketplace.connect(user1).cancelTrade(1);

      await mintCard(user1.address, "Carte Extra", CardType.Creature, Rarity.Commune, 2);
      await time.increase(LOCK_TIME + 1);
      await cardNFT.transferCard(user1.address, user3.address, 2);

      await marketplace.connect(user1).proposeTrade(0, user2.address, 1);

      const [canAccept2, message2] = await marketplace.canAcceptTrade(2);
      expect(canAccept2).to.be.false;
      expect(message2).to.equal("Proposer cooldown active");

      await time.increase(COOLDOWN + 1);

      const [canAccept3, message3] = await marketplace.canAcceptTrade(2);
      expect(canAccept3).to.be.true;
      expect(message3).to.equal("Trade can be accepted");
    });

    it("devrait retourner les details d'un trade via getTrade", async function () {
      const trade = await marketplace.getTrade(1);

      expect(trade.proposer).to.equal(user1.address);
      expect(trade.receiver).to.equal(user2.address);
      expect(trade.proposerTokenId).to.equal(0);
      expect(trade.receiverTokenId).to.equal(1);
      expect(trade.status).to.equal(0);
    });

    it("devrait refuser getTrade pour un trade inexistant", async function () {
      await expect(
        marketplace.getTrade(999)
      ).to.be.revertedWithCustomError(marketplace, "TradeDoesNotExist");
    });
  });

  describe("Scenarios complexes", function () {
    it("devrait gerer plusieurs trades successifs", async function () {
      await mintCard(user1.address, "Carte 1", CardType.Guerrier, Rarity.Commune, 0);
      await mintCard(user2.address, "Carte 2", CardType.Mage, Rarity.Commune, 1);
      await time.increase(LOCK_TIME + 1);

      await marketplace.connect(user1).proposeTrade(0, user2.address, 1);
      await time.increase(COOLDOWN + 1);
      await marketplace.connect(user2).acceptTrade(1);

      expect(await cardNFT.ownerOf(0)).to.equal(user2.address);
      expect(await cardNFT.ownerOf(1)).to.equal(user1.address);

      await time.increase(LOCK_TIME + COOLDOWN + 1);

      await marketplace.connect(user2).proposeTrade(0, user1.address, 1);
      await time.increase(COOLDOWN + 1);
      await marketplace.connect(user1).acceptTrade(2);

      expect(await cardNFT.ownerOf(0)).to.equal(user1.address);
      expect(await cardNFT.ownerOf(1)).to.equal(user2.address);
    });

    it("devrait mettre a jour l'historique des proprietaires apres echange", async function () {
      await mintCard(user1.address, "Carte 1", CardType.Guerrier, Rarity.Commune, 0);
      await mintCard(user2.address, "Carte 2", CardType.Mage, Rarity.Commune, 1);
      await time.increase(LOCK_TIME + 1);

      await marketplace.connect(user1).proposeTrade(0, user2.address, 1);
      await time.increase(COOLDOWN + 1);
      await marketplace.connect(user2).acceptTrade(1);

      const previousOwners0 = await cardNFT.getCardPreviousOwners(0);
      const previousOwners1 = await cardNFT.getCardPreviousOwners(1);

      expect(previousOwners0.length).to.equal(1);
      expect(previousOwners0[0]).to.equal(user1.address);
      expect(previousOwners1.length).to.equal(1);
      expect(previousOwners1[0]).to.equal(user2.address);
    });

    it("devrait permettre a un utilisateur d'avoir plusieurs trades en tant que receveur", async function () {
      await mintCard(user1.address, "Carte User1", CardType.Guerrier, Rarity.Commune, 0);
      await mintCard(user2.address, "Carte User2 A", CardType.Mage, Rarity.Commune, 1);
      await mintCard(user2.address, "Carte User2 B", CardType.Creature, Rarity.Commune, 2);
      await mintCard(user3.address, "Carte User3", CardType.Artefact, Rarity.Commune, 3);

      await marketplace.connect(user1).proposeTrade(0, user2.address, 1);
      await marketplace.connect(user3).proposeTrade(3, user2.address, 2);

      const user2Trades = await marketplace.getUserTrades(user2.address);
      expect(user2Trades.length).to.equal(2);
    });
  });
});