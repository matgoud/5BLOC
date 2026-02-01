import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Collection from './components/Collection';
import Marketplace from './components/Marketplace';
import Admin from './components/Admin';
import { connectWallet, checkIfWalletIsConnected, getProvider } from './services/wallet';
import './styles/App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const connectedAccount = await checkIfWalletIsConnected();
        if (connectedAccount) {
          setAccount(connectedAccount);
          const web3Provider = await getProvider();
          setProvider(web3Provider);
        }
      } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
      } finally {
        setLoading(false);
      }
    };

    init();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setProvider(null);
      setIsOwner(false);
    } else {
      setAccount(accounts[0]);
      const web3Provider = await getProvider();
      setProvider(web3Provider);
    }
  };

  const handleConnect = async () => {
    try {
      const connectedAccount = await connectWallet();
      if (connectedAccount) {
        setAccount(connectedAccount);
        const web3Provider = await getProvider();
        setProvider(web3Provider);
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header account={account} onConnect={handleConnect} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home account={account} provider={provider} />} />
          <Route path="/collection" element={<Collection account={account} provider={provider} />} />
          <Route path="/marketplace" element={<Marketplace account={account} provider={provider} />} />
          <Route path="/admin" element={<Admin account={account} provider={provider} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;