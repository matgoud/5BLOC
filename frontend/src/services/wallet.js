import { ethers } from 'ethers';

export const connectWallet = async () => {
  if (!window.ethereum) {
    alert("MetaMask n'est pas installe. Veuillez l'installer pour utiliser cette application.");
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (accounts.length > 0) {
      return accounts[0];
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la connexion au wallet:", error);
    throw error;
  }
};

export const checkIfWalletIsConnected = async () => {
  if (!window.ethereum) {
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    if (accounts.length > 0) {
      return accounts[0];
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la verification du wallet:", error);
    return null;
  }
};

export const getProvider = async () => {
  if (!window.ethereum) {
    return null;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider;
};

export const getSigner = async () => {
  const provider = await getProvider();
  if (!provider) {
    return null;
  }

  const signer = await provider.getSigner();
  return signer;
};

export const getNetwork = async () => {
  const provider = await getProvider();
  if (!provider) {
    return null;
  }

  const network = await provider.getNetwork();
  return network;
};

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const switchToSepolia = async () => {
  if (!window.ethereum) {
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }],
    });
    return true;
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0xaa36a7',
              chainName: 'Sepolia Testnet',
              nativeCurrency: {
                name: 'SepoliaETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error("Erreur lors de l'ajout du reseau Sepolia:", addError);
        return false;
      }
    }
    console.error("Erreur lors du changement de reseau:", switchError);
    return false;
  }
};

export const switchToLocalhost = async () => {
  if (!window.ethereum) {
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x7a69' }],
    });
    return true;
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x7a69',
              chainName: 'Localhost 8545',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['http://127.0.0.1:8545'],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error("Erreur lors de l'ajout du reseau localhost:", addError);
        return false;
      }
    }
    console.error("Erreur lors du changement de reseau:", switchError);
    return false;
  }
};