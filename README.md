# Card Collection DApp

Marche decentralise de cartes de collection numeriques sur la blockchain Ethereum.

## Presentation

Cette DApp permet de collectionner, gerer et echanger des cartes numeriques uniques sous forme de NFTs. Chaque carte possede des attributs (rarete, type, puissance, defense) et peut etre echangee entre utilisateurs selon des regles definies dans les smart contracts.

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Smart Contracts | Solidity 0.8.20 |
| Framework | Hardhat |
| Bibliotheques | OpenZeppelin Contracts |
| Frontend | React 18 |
| Blockchain | Ethers.js 6 |
| Stockage | IPFS (Pinata) |
| Testnet | Sepolia |

## Installation

### Prerequis

- Node.js >= 18
- npm
- MetaMask

### Smart Contracts

```bash
npm install
npx hardhat compile
npx hardhat test
```

### Deploiement

```bash
# Local
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

# Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

### Frontend

```bash
cd frontend
npm install
```

Copier les ABIs apres compilation :

```powershell
# Windows
Copy-Item .\artifacts\contracts\CardNFT.sol\CardNFT.json .\frontend\src\contracts\
Copy-Item .\artifacts\contracts\CardMarketplace.sol\CardMarketplace.json .\frontend\src\contracts\
```

Creer le fichier `frontend/.env` :

```
REACT_APP_CARDNFT_ADDRESS=<adresse_cardnft>
REACT_APP_MARKETPLACE_ADDRESS=<adresse_marketplace>
```

Lancer :

```bash
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

### Obtenir les cles

| Variable | Service | Instructions |
|----------|---------|--------------|
| SEPOLIA_RPC_URL | [Infura](https://infura.io) | Creer un projet > Copier l'URL Sepolia |
| PRIVATE_KEY | MetaMask | Parametres > Informations du compte > Afficher la cle privee |
| ETHERSCAN_API_KEY | [Etherscan](https://etherscan.io) | API Keys > Creer une cle |
| PINATA_API_KEY | [Pinata](https://pinata.cloud) | API Keys > New Key > Copier API Key |
| PINATA_SECRET_KEY | [Pinata](https://pinata.cloud) | API Keys > New Key > Copier Secret |

## Contrats deployes (Sepolia)

| Contrat | Adresse |
|---------|---------|
| CardNFT | [`0x8de801AE67Fb1E7Ed0Ac9E843a5c802413AE6d95`](https://sepolia.etherscan.io/address/0x8de801AE67Fb1E7Ed0Ac9E843a5c802413AE6d95) |
| CardMarketplace | [`0xB72D7BA1524d6757B8b050fB57bfeb0Fcbf06A5C`](https://sepolia.etherscan.io/address/0xB72D7BA1524d6757B8b050fB57bfeb0Fcbf06A5C) |

## Structure du projet

```
├── contracts/
│   ├── CardNFT.sol             # Contrat ERC-721
│   └── CardMarketplace.sol     # Gestion des echanges
├── scripts/
│   └── deploy.js
├── test/
│   ├── CardNFT.test.js
│   └── CardMarketplace.test.js
├── frontend/src/
│   ├── components/             # UI React
│   ├── services/               # Wallet & Contracts
│   └── styles/
├── utils/
│   └── ipfs.js                 # Upload IPFS
└── documents/
    └── rapport_technique.md
```

## Regles metier

### Raretes et valeurs

| Rarete | Valeur |
|--------|--------|
| Commune | 10 |
| Rare | 50 |
| Epique | 200 |
| Legendaire | 1000 |

### Types de cartes

Guerrier, Mage, Creature, Artefact

### Contraintes

| Regle | Valeur |
|-------|--------|
| Limite de possession | 4 cartes max |
| Cooldown | 5 min entre transactions |
| Lock | 10 min apres acquisition |
| Ratio d'echange | 1:5 max |

## Tests

```bash
npx hardhat test
```

47 tests couvrant : deploiement, mint, limites, cooldown, lock, transferts, echanges, ratio, expiration.

## Securite

- ReentrancyGuard (OpenZeppelin)
- Ownable pour les fonctions admin
- Pattern Checks-Effects-Interactions
- Validation des entrees

Bourdin Mathéo & Goudal Mathieu