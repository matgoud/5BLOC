const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CardNFT", function () {
  let cardNFT;
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
  const MAX_CARDS = 4;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const CardNFT = await ethers.getContractFactory("CardNFT");
    cardNFT = await CardNFT.deploy();
    await cardNFT.waitForDeployment();
  });

  describe("Deploiement", function () {
    it("devrait deployer le contrat avec le bon nom et symbole", async function () {
      expect(await cardNFT.name()).to.equal("CardCollection");
      expect(await cardNFT.symbol()).to.equal("CARD");
    });

    it("devrait definir le bon owner", async function () {
      expect(await cardNFT.owner()).to.equal(owner.address);
    });

    it("devrait avoir les bonnes constantes", async function () {
      expect(await cardNFT.MAX_CARDS_PER_USER()).to.equal(MAX_CARDS);
      expect(await cardNFT.TRANSACTION_COOLDOWN()).to.equal(COOLDOWN);
      expect(await cardNFT.ACQUISITION_LOCK()).to.equal(LOCK_TIME);
      expect(await cardNFT.VALUE_COMMUNE()).to.equal(VALUES.Commune);
      expect(await cardNFT.VALUE_RARE()).to.equal(VALUES.Rare);
      expect(await cardNFT.VALUE_EPIQUE()).to.equal(VALUES.Epique);
      expect(await cardNFT.VALUE_LEGENDAIRE()).to.equal(VALUES.Legendaire);
    });
  });

  describe("Mint de cartes", function () {
    it("devrait permettre au owner de mint une carte Commune", async function () {
      const tx = await cardNFT.mint(
        user1.address,
        "Guerrier de Bronze",
        CardType.Guerrier,
        Rarity.Commune,
        50,
        30,
        1,
        100,
        "ipfs://QmTest123"
      );

      await expect(tx)
        .to.emit(cardNFT, "CardMinted")
        .withArgs(0, user1.address, "Guerrier de Bronze", CardType.Guerrier, Rarity.Commune, VALUES.Commune);

      expect(await cardNFT.ownerOf(0)).to.equal(user1.address);
      expect(await cardNFT.getUserCardCount(user1.address)).to.equal(1);
    });

    it("devrait mint une carte avec les bons attributs", async function () {
      await cardNFT.mint(
        user1.address,
        "Dragon Ancestral",
        CardType.Creature,
        Rarity.Legendaire,
        95,
        80,
        1,
        10,
        "ipfs://QmDragon"
      );

      const card = await cardNFT.getCard(0);
      expect(card.name).to.equal("Dragon Ancestral");
      expect(card.cardType).to.equal(CardType.Creature);
      expect(card.rarity).to.equal(Rarity.Legendaire);
      expect(card.value).to.equal(VALUES.Legendaire);
      expect(card.power).to.equal(95);
      expect(card.defense).to.equal(80);
      expect(card.edition).to.equal(1);
      expect(card.maxEdition).to.equal(10);
    });

    it("devrait assigner la bonne valeur selon la rarete", async function () {
      await cardNFT.mint(user1.address, "Carte Commune", CardType.Guerrier, Rarity.Commune, 50, 50, 1, 100, "ipfs://1");
      await cardNFT.mint(user1.address, "Carte Rare", CardType.Mage, Rarity.Rare, 60, 60, 1, 50, "ipfs://2");
      await cardNFT.mint(user1.address, "Carte Epique", CardType.Creature, Rarity.Epique, 70, 70, 1, 20, "ipfs://3");
      await cardNFT.mint(user1.address, "Carte Legendaire", CardType.Artefact, Rarity.Legendaire, 80, 80, 1, 5, "ipfs://4");

      expect(await cardNFT.getCardValue(0)).to.equal(VALUES.Commune);
      expect(await cardNFT.getCardValue(1)).to.equal(VALUES.Rare);
      expect(await cardNFT.getCardValue(2)).to.equal(VALUES.Epique);
      expect(await cardNFT.getCardValue(3)).to.equal(VALUES.Legendaire);
    });

    it("devrait stocker l'URI IPFS correctement", async function () {
      const ipfsURI = "ipfs://QmTestURI123456789";
      await cardNFT.mint(user1.address, "Test Card", CardType.Guerrier, Rarity.Commune, 50, 50, 1, 100, ipfsURI);

      expect(await cardNFT.tokenURI(0)).to.equal(ipfsURI);
    });

    it("devrait refuser le mint avec un nom vide", async function () {
      await expect(
        cardNFT.mint(user1.address, "", CardType.Guerrier, Rarity.Commune, 50, 50, 1, 100, "ipfs://test")
      ).to.be.revertedWithCustomError(cardNFT, "InvalidCardData");
    });

    it("devrait refuser le mint avec power invalide", async function () {
      await expect(
        cardNFT.mint(user1.address, "Test", CardType.Guerrier, Rarity.Commune, 0, 50, 1, 100, "ipfs://test")
      ).to.be.revertedWithCustomError(cardNFT, "InvalidPowerOrDefense");

      await expect(
        cardNFT.mint(user1.address, "Test", CardType.Guerrier, Rarity.Commune, 101, 50, 1, 100, "ipfs://test")
      ).to.be.revertedWithCustomError(cardNFT, "InvalidPowerOrDefense");
    });

    it("devrait refuser le mint avec defense invalide", async function () {
      await expect(
        cardNFT.mint(user1.address, "Test", CardType.Guerrier, Rarity.Commune, 50, 0, 1, 100, "ipfs://test")
      ).to.be.revertedWithCustomError(cardNFT, "InvalidPowerOrDefense");

      await expect(
        cardNFT.mint(user1.address, "Test", CardType.Guerrier, Rarity.Commune, 50, 101, 1, 100, "ipfs://test")
      ).to.be.revertedWithCustomError(cardNFT, "InvalidPowerOrDefense");
    });

    it("devrait refuser le mint avec edition invalide", async function () {
      await expect(
        cardNFT.mint(user1.address, "Test", CardType.Guerrier, Rarity.Commune, 50, 50, 0, 100, "ipfs://test")
      ).to.be.revertedWithCustomError(cardNFT, "InvalidEdition");

      await expect(
        cardNFT.mint(user1.address, "Test", CardType.Guerrier, Rarity.Commune, 50, 50, 101, 100, "ipfs://test")
      ).to.be.revertedWithCustomError(cardNFT, "InvalidEdition");
    });

    it("devrait refuser le mint par un non-owner", async function () {
      await expect(
        cardNFT.connect(user1).mint(user1.address, "Test", CardType.Guerrier, Rarity.Commune, 50, 50, 1, 100, "ipfs://test")
      ).to.be.revertedWithCustomError(cardNFT, "OwnableUnauthorizedAccount");
    });
  });

  describe("Limite de possession", function () {
    it("devrait permettre de posseder jusqu'a 4 cartes", async function () {
      for (let i = 0; i < MAX_CARDS; i++) {
        await cardNFT.mint(user1.address, `Carte ${i}`, CardType.Guerrier, Rarity.Commune, 50, 50, 1, 100, `ipfs://${i}`);
      }

      expect(await cardNFT.getUserCardCount(user1.address)).to.equal(MAX_CARDS);
    });

    it("devrait refuser le mint d'une 5eme carte", async function () {
      for (let i = 0; i < MAX_CARDS; i++) {
        await cardNFT.mint(user1.address, `Carte ${i}`, CardType.Guerrier, Rarity.Commune, 50, 50, 1, 100, `ipfs://${i}`);
      }

      await expect(
        cardNFT.mint(user1.address, "Carte 5", CardType.Guerrier, Rarity.Commune, 50, 50, 1, 100, "ipfs://5")
      ).to.be.revertedWithCustomError(cardNFT, "MaxCardsReached");
    });

    it("devrait permettre le mint apres un transfert", async function () {
      for (let i = 0; i < MAX_CARDS; i++) {
        await cardNFT.mint(user1.address, `Carte ${i}`, CardType.Guerrier, Rarity.Commune, 50, 50, 1, 100, `ipfs://${i}`);
      }

      await time.increase(LOCK_TIME + 1);
      await cardNFT.transferCard(user1.address, user2.address, 0);

      expect(await cardNFT.getUserCardCount(user1.address)).to.equal(MAX_CARDS - 1);

      await cardNFT.mint(user1.address, "Nouvelle Carte", CardType.Guerrier, Rarity.Commune, 50, 50, 1, 100, "ipfs://new");
      expect(await cardNFT.getUserCardCount(user1.address)).to.equal(MAX_CARDS);
    });
  });

  describe("Contraintes temporelles - Cooldown", function () {
    beforeEach(async function () {
      await cardNFT.mint(user1.address, "Carte 1", CardType.Guerrier, Rarity.Commune, 50, 50, 1, 100, "ipfs://1");
      await cardNFT.mint(user1.address, "Carte 2", CardType.Mage, Rarity.Commune, 50, 50, 1, 100, "ipfs://2");
    });

    it("devrait permettre une transaction apres le cooldown", async function () {
      await time.increase(LOCK_TIME + 1);
      await cardNFT.transferCard(user1.address, user2.address, 0);

      await time.increase(COOLDOWN + 1);
      await time.increase(LOCK_TIME + 1);

      await expect(
        cardNFT.transferCard(user1.address, user2.address, 1)
      ).to.not.be.reverted;
    });

    it("devrait refuser une transaction pendant le cooldown", async function () {
      await time.increase(LOCK_TIME + 1);
      await cardNFT.transferCard(user1.address, user2.address, 0);

      await expect(
        cardNFT.transferCard(user1.address, user3.address, 1)
      ).to.be.revertedWithCustomError(cardNFT, "CooldownNotElapsed");
    });

    it("devrait retourner le bon temps de cooldown restant", async function () {
      await time.increase(LOCK_TIME + 1);
      await cardNFT.transferCard(user1.address, user2.address, 0);

      const remaining = await cardNFT.getRemainingCooldown(user1.address);
      expect(remaining).to.be.closeTo(COOLDOWN, 5);

      await time.increase(COOLDOWN + 1);
      expect(await cardNFT.getRemainingCooldown(user1.address)).to.equal(0);
    });

    it("devrait indiquer si l'utilisateur peut effectuer une transaction", async function () {
      expect(await cardNFT.canUserTransact(user1.address)).to.be.true;

      await time.increase(LOCK_TIME + 1);
      await cardNFT.transferCard(user1.address, user2.address, 0);

      expect(await cardNFT.canUserTransact(user1.address)).to.be.false;

      await time.increase(COOLDOWN + 1);
      expect(await cardNFT.canUserTransact(user1.address)).to.be.true;
    });
  });

  describe("Contraintes temporelles - Lock", function () {
    beforeEach(async function () {
      await cardNFT.mint(user1.address, "Carte Test", CardType.Guerrier, Rarity.Commune, 50, 50, 1, 100, "ipfs://test");
    });

    it("devrait verrouiller une carte apres le mint", async function () {
      expect(await cardNFT.isCardLocked(0)).to.be.true;
    });

    it("devrait refuser le transfert d'une carte verrouillee", async function () {
      await expect(
        cardNFT.transferCard(user1.address, user2.address, 0)
      ).to.be.revertedWithCustomError(cardNFT, "CardLocked");
    });

    it("devrait permettre le transfert apres la periode de lock", async function () {
      await time.increase(LOCK_TIME + 1);

      await expect(
        cardNFT.transferCard(user1.address, user2.address, 0)
      ).to.not.be.reverted;
    });

    it("devrait retourner le bon temps de lock restant", async function () {
      const remaining = await cardNFT.getRemainingLockTime(0);
      expect(remaining).to.be.closeTo(LOCK_TIME, 5);

      await time.increase(LOCK_TIME + 1);
      expect(await cardNFT.getRemainingLockTime(0)).to.equal(0);
    });

    it("devrait reverrouiller une carte apres un transfert", async function () {
      await time.increase(LOCK_TIME + 1);
      await cardNFT.transferCard(user1.address, user2.address, 0);

      expect(await cardNFT.isCardLocked(0)).to.be.true;
    });
  });

  describe("Transfert de cartes", function () {
    beforeEach(async function () {
      await cardNFT.mint(user1.address, "Carte Test", CardType.Guerrier, Rarity.Commune, 50, 50, 1, 100, "ipfs://test");
      await time.increase(LOCK_TIME + 1);
    });

    it("devrait transferer une carte correctement", async function () {
      await cardNFT.transferCard(user1.address, user2.address, 0);

      expect(await cardNFT.ownerOf(0)).to.equal(user2.address);
      expect(await cardNFT.getUserCardCount(user1.address)).to.equal(0);
      expect(await cardNFT.getUserCardCount(user2.address)).to.equal(1);
    });

    it("devrait emettre l'evenement CardTransferred", async function () {
      await expect(cardNFT.transferCard(user1.address, user2.address, 0))
        .to.emit(cardNFT, "CardTransferred")
        .withArgs(0, user1.address, user2.address, await time.latest() + 1);
    });

    it("devrait mettre a jour les anciens proprietaires", async function () {
      await cardNFT.transferCard(user1.address, user2.address, 0);

      const previousOwners = await cardNFT.getCardPreviousOwners(0);
      expect(previousOwners.length).to.equal(1);
      expect(previousOwners[0]).to.equal(user1.address);
    });

    it("devrait conserver l'historique des proprietaires sur plusieurs transferts", async function () {
      await cardNFT.transferCard(user1.address, user2.address, 0);

      await time.increase(LOCK_TIME + COOLDOWN + 1);

      await cardNFT.transferCard(user2.address, user3.address, 0);

      const previousOwners = await cardNFT.getCardPreviousOwners(0);
      expect(previousOwners.length).to.equal(2);
      expect(previousOwners[0]).to.equal(user1.address);
      expect(previousOwners[1]).to.equal(user2.address);
    });

    it("devrait mettre a jour lastTransferAt", async function () {
      const cardBefore = await cardNFT.getCard(0);
      const timeBefore = cardBefore.lastTransferAt;

      await time.increase(100);
      await cardNFT.transferCard(user1.address, user2.address, 0);

      const cardAfter = await cardNFT.getCard(0);
      expect(cardAfter.lastTransferAt).to.be.greaterThan(timeBefore);
    });

    it("devrait refuser le transfert vers un utilisateur ayant deja 4 cartes", async function () {
      for (let i = 0; i < MAX_CARDS; i++) {
        await cardNFT.mint(user2.address, `Carte User2 ${i}`, CardType.Mage, Rarity.Commune, 50, 50, 1, 100, `ipfs://u2-${i}`);
      }

      await expect(
        cardNFT.transferCard(user1.address, user2.address, 0)
      ).to.be.revertedWithCustomError(cardNFT, "MaxCardsReached");
    });

    it("devrait refuser le transfert d'une carte inexistante", async function () {
      await expect(
        cardNFT.transferCard(user1.address, user2.address, 999)
      ).to.be.revertedWithCustomError(cardNFT, "CardDoesNotExist");
    });
  });

  describe("Fonctions de lecture", function () {
    beforeEach(async function () {
      await cardNFT.mint(user1.address, "Carte Test", CardType.Creature, Rarity.Epique, 75, 65, 3, 20, "ipfs://test");
    });

    it("devrait retourner les informations completes d'une carte", async function () {
      const card = await cardNFT.getCard(0);

      expect(card.name).to.equal("Carte Test");
      expect(card.cardType).to.equal(CardType.Creature);
      expect(card.rarity).to.equal(Rarity.Epique);
      expect(card.value).to.equal(VALUES.Epique);
      expect(card.power).to.equal(75);
      expect(card.defense).to.equal(65);
      expect(card.edition).to.equal(3);
      expect(card.maxEdition).to.equal(20);
      expect(card.creator).to.equal(owner.address);
    });

    it("devrait retourner la valeur d'une carte", async function () {
      expect(await cardNFT.getCardValue(0)).to.equal(VALUES.Epique);
    });

    it("devrait refuser la lecture d'une carte inexistante", async function () {
      await expect(cardNFT.getCard(999)).to.be.revertedWithCustomError(cardNFT, "CardDoesNotExist");
    });

    it("devrait retourner le nombre de cartes d'un utilisateur", async function () {
      expect(await cardNFT.getUserCardCount(user1.address)).to.equal(1);
      expect(await cardNFT.getUserCardCount(user2.address)).to.equal(0);
    });

    it("devrait retourner le dernier temps de transaction", async function () {
      expect(await cardNFT.getLastTransactionTime(user1.address)).to.equal(0);

      await time.increase(LOCK_TIME + 1);
      await cardNFT.transferCard(user1.address, user2.address, 0);

      expect(await cardNFT.getLastTransactionTime(user1.address)).to.be.greaterThan(0);
    });

    it("devrait retourner le temps d'acquisition d'une carte", async function () {
      const acquisitionTime = await cardNFT.getAcquisitionTime(0);
      expect(acquisitionTime).to.be.greaterThan(0);
    });
  });
});