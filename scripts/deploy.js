const hre = require("hardhat");

async function main() {
  console.log("Deploiement des contrats...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Adresse du deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance du deployer:", hre.ethers.formatEther(balance), "ETH\n");

  console.log("Deploiement de CardNFT...");
  const CardNFT = await hre.ethers.getContractFactory("CardNFT");
  const cardNFT = await CardNFT.deploy();
  await cardNFT.waitForDeployment();
  const cardNFTAddress = await cardNFT.getAddress();
  console.log("CardNFT deploye a l'adresse:", cardNFTAddress);

  console.log("\nDeploiement de CardMarketplace...");
  const CardMarketplace = await hre.ethers.getContractFactory("CardMarketplace");
  const marketplace = await CardMarketplace.deploy(cardNFTAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("CardMarketplace deploye a l'adresse:", marketplaceAddress);

  console.log("\n========================================");
  console.log("Deploiement termine avec succes!");
  console.log("========================================");
  console.log("CardNFT:", cardNFTAddress);
  console.log("CardMarketplace:", marketplaceAddress);
  console.log("========================================\n");

  console.log("Configuration pour le frontend:");
  console.log(`REACT_APP_CARDNFT_ADDRESS=${cardNFTAddress}`);
  console.log(`REACT_APP_MARKETPLACE_ADDRESS=${marketplaceAddress}`);

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nAttente de confirmations pour la verification...");
    await cardNFT.deploymentTransaction().wait(5);
    await marketplace.deploymentTransaction().wait(5);

    console.log("\nVerification des contrats sur Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: cardNFTAddress,
        constructorArguments: [],
      });
      console.log("CardNFT verifie sur Etherscan");
    } catch (error) {
      console.log("Erreur lors de la verification de CardNFT:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: marketplaceAddress,
        constructorArguments: [cardNFTAddress],
      });
      console.log("CardMarketplace verifie sur Etherscan");
    } catch (error) {
      console.log("Erreur lors de la verification de CardMarketplace:", error.message);
    }
  }

  return {
    cardNFT: cardNFTAddress,
    marketplace: marketplaceAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });