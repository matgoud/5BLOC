# 5BLOC
Projet Web3 – Développement d'une DApp basée sur la Blockchain Contexte

# Card Collection DApp

DApp de marche decentralise de cartes de collection numeriques sur Ethereum.

## Stack technique

- Solidity 0.8.20
- Hardhat
- OpenZeppelin Contracts
- React 18
- Ethers.js 6
- IPFS (Pinata)

## Installation

```bash
# Installation des dependances
npm install

# Compilation des contrats
npx hardhat compile

# Lancement des tests
npx hardhat test

# Deploiement local
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

# Deploiement Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

## Frontend

```bash
cd frontend
npm install
npm start
```

## Configuration

Creer un fichier `.env` a la racine :

```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_key
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret
```

## Contrats deployes (Sepolia)

| Contrat | Adresse |
|---------|---------|
| CardNFT | 0x8de801AE67Fb1E7Ed0Ac9E843a5c802413AE6d95 |
| CardMarketplace | 0xB72D7BA1524d6757B8b050fB57bfeb0Fcbf06A5C |

## Structure du projet

```
├── contracts/          # Smart contracts Solidity
├── scripts/            # Scripts de deploiement
├── test/               # Tests unitaires
├── frontend/           # Application React
├── utils/              # Utilitaires (IPFS)
└── documents/          # Documentation
```

## Fonctionnalites

- Mint de cartes NFT (ERC-721)
- 4 niveaux de rarete (Commune, Rare, Epique, Legendaire)
- 4 types de cartes (Guerrier, Mage, Creature, Artefact)
- Systeme d'echange entre utilisateurs
- Limite de 4 cartes par utilisateur
- Cooldown de 5 min entre transactions
- Lock de 10 min apres acquisition

