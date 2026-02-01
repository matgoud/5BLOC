Les fichiers ABI doivent etre copies depuis le dossier artifacts apres compilation.

Apres avoir execute "npx hardhat compile", copiez les fichiers suivants :

1. CardNFT.json :
   Source : artifacts/contracts/CardNFT.sol/CardNFT.json
   Destination : frontend/src/contracts/CardNFT.json

2. CardMarketplace.json :
   Source : artifacts/contracts/CardMarketplace.sol/CardMarketplace.json
   Destination : frontend/src/contracts/CardMarketplace.json

Commandes (Windows PowerShell) :
Copy-Item .\artifacts\contracts\cardNFT.sol\CardNFT.json .\frontend\src\contracts\
Copy-Item .\artifacts\contracts\cardMarketplace.sol\CardMarketplace.json .\frontend\src\contracts\

Commandes (Linux/Mac) :
cp artifacts/contracts/cardNFT.sol/cardNFT.json frontend/src/contracts/
cp artifacts/contracts/cardMarketplace.sol/cardMarketplace.json frontend/src/contracts/
