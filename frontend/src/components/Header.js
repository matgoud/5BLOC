import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatAddress } from '../services/wallet';
import './Header.css';

function Header({ account, onConnect }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          Card Collection
        </Link>

        <nav className="nav">
          <Link to="/" className={`nav-link ${isActive('/')}`}>
            Accueil
          </Link>
          <Link to="/collection" className={`nav-link ${isActive('/collection')}`}>
            Ma Collection
          </Link>
          <Link to="/marketplace" className={`nav-link ${isActive('/marketplace')}`}>
            Marketplace
          </Link>
          <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>
            Admin
          </Link>
        </nav>

        <div className="wallet-section">
          {account ? (
            <div className="wallet-connected">
              <span className="wallet-indicator"></span>
              <span className="wallet-address">{formatAddress(account)}</span>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={onConnect}>
              Connecter Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;