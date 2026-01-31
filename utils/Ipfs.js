const fs = require("fs");
const path = require("path");
require("dotenv").config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_BASE_URL = "https://api.pinata.cloud";

async function uploadJSONToIPFS(jsonData, name) {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error("Les cles API Pinata ne sont pas configurees dans le fichier .env");
  }

  const url = `${PINATA_BASE_URL}/pinning/pinJSONToIPFS`;

  const body = {
    pinataContent: jsonData,
    pinataMetadata: {
      name: name || "metadata.json",
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de l'upload sur IPFS: ${error}`);
  }

  const result = await response.json();
  return {
    success: true,
    ipfsHash: result.IpfsHash,
    ipfsUrl: `ipfs://${result.IpfsHash}`,
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
  };
}

async function uploadFileToIPFS(filePath) {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error("Les cles API Pinata ne sont pas configurees dans le fichier .env");
  }

  const url = `${PINATA_BASE_URL}/pinning/pinFileToIPFS`;
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer]);

  const formData = new FormData();
  formData.append("file", blob, fileName);
  formData.append(
    "pinataMetadata",
    JSON.stringify({
      name: fileName,
    })
  );

  const response = await fetch(url, {
    method: "POST",
    headers: {
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur lors de l'upload sur IPFS: ${error}`);
  }

  const result = await response.json();
  return {
    success: true,
    ipfsHash: result.IpfsHash,
    ipfsUrl: `ipfs://${result.IpfsHash}`,
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
  };
}

async function uploadCardMetadata(cardData) {
  const metadata = {
    name: cardData.name,
    type: cardData.type,
    rarity: cardData.rarity,
    value: cardData.value,
    power: cardData.power,
    defense: cardData.defense,
    description: cardData.description,
    image: cardData.image || "",
    hash: "",
    previousOwners: cardData.previousOwners || [],
    createdAt: cardData.createdAt || Math.floor(Date.now() / 1000),
    lastTransferAt: cardData.lastTransferAt || Math.floor(Date.now() / 1000),
    edition: cardData.edition || 1,
    maxEdition: cardData.maxEdition || 1,
    creator: cardData.creator || "",
  };

  const result = await uploadJSONToIPFS(metadata, `${cardData.name}_metadata.json`);
  metadata.hash = result.ipfsHash;

  return {
    metadata: metadata,
    ...result,
  };
}

async function testConnection() {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    console.log("Erreur: Les cles API Pinata ne sont pas configurees");
    return false;
  }

  const url = `${PINATA_BASE_URL}/data/testAuthentication`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
    });

    if (response.ok) {
      console.log("Connexion a Pinata reussie");
      return true;
    } else {
      console.log("Erreur de connexion a Pinata");
      return false;
    }
  } catch (error) {
    console.log("Erreur:", error.message);
    return false;
  }
}

module.exports = {
  uploadJSONToIPFS,
  uploadFileToIPFS,
  uploadCardMetadata,
  testConnection,
};

if (require.main === module) {
  testConnection();
}