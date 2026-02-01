import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserCardCount, getContractOwner } from '../services/contracts';

function Home({ account, provider }) {
  const [cardCount, setCardCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (provider && account) {
        try {
          const count = await getUserCardCount(provider, account);
          setCardCount(count);

          const owner = await getContractOwner(provider);
          setIsOwner(owner.toLowerCase() === account.toLowerCase());
        } catch (error) {
          console.error("Erreur lors du chargement des donnees:", error);
        }
      }
    };

    loadData();
  }, [provider, account]);

  return (
    <div className="home">
      <h1 className="page-title">Bienvenue sur Card Collection</h1>

      <div className="home-content">
        <div className="intro-section">
          <p>
            Collectionnez, echangez et gerez vos cartes numeriques uniques sur la blockchain Ethereum.
            Chaque carte est un NFT avec des attributs uniques et une rarete differente.
          </p>
        </div>

        {!account ? (
          <div className="no-wallet">
            <p>Connectez votre wallet MetaMask pour commencer</p>
          </div>
        ) : (
          <div className="dashboard">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-value">{cardCount}</div>
                <div className="stat-card-label">Cartes possedees</div>
                <div className="stat-card-max">/ 4 maximum</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-value">{4 - cardCount}</div>
                <div className="stat-card-label">Places disponibles</div>
              </div>

              {isOwner && (
                <div className="stat-card owner">
                  <div className="stat-card-value">Admin</div>
                  <div className="stat-card-label">Vous etes proprietaire du contrat</div>
                </div>
              )}
            </div>

            <div className="quick-actions">
              <h2>Actions rapides</h2>
              <div className="actions-grid">
                <Link to="/collection" className="action-card">
                  <div className="action-icon">🃏</div>
                  <div className="action-title">Ma Collection</div>
                  <div className="action-desc">Voir mes cartes</div>
                </Link>

                <Link to="/marketplace" className="action-card">
                  <div className="action-icon">🔄</div>
                  <div className="action-title">Marketplace</div>
                  <div className="action-desc">Echanger des cartes</div>
                </Link>

                {isOwner && (
                  <Link to="/admin" className="action-card admin">
                    <div className="action-icon">⚙️</div>
                    <div className="action-title">Administration</div>
                    <div className="action-desc">Creer des cartes</div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="rules-section">
          <h2>Regles du jeu</h2>
          <div className="rules-grid">
            <div className="rule-card">
              <h3>Limite de possession</h3>
              <p>Chaque joueur peut posseder maximum 4 cartes</p>
            </div>
            <div className="rule-card">
              <h3>Cooldown</h3>
              <p>5 minutes d'attente entre chaque transaction</p>
            </div>
            <div className="rule-card">
              <h3>Verrouillage</h3>
              <p>10 minutes de verrouillage apres acquisition</p>
            </div>
            <div className="rule-card">
              <h3>Ratio d'echange</h3>
              <p>Maximum 1:5 entre les valeurs des cartes</p>
            </div>
          </div>
        </div>

        <div className="rarity-section">
          <h2>Niveaux de rarete</h2>
          <div className="rarity-grid">
            <div className="rarity-card commune">
              <div className="rarity-name">Commune</div>
              <div className="rarity-value">Valeur: 10</div>
            </div>
            <div className="rarity-card rare">
              <div className="rarity-name">Rare</div>
              <div className="rarity-value">Valeur: 50</div>
            </div>
            <div className="rarity-card epique">
              <div className="rarity-name">Epique</div>
              <div className="rarity-value">Valeur: 200</div>
            </div>
            <div className="rarity-card legendaire">
              <div className="rarity-name">Legendaire</div>
              <div className="rarity-value">Valeur: 1000</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .home-content {
          max-width: 1000px;
          margin: 0 auto;
        }

        .intro-section {
          text-align: center;
          margin-bottom: 3rem;
          color: #888;
          font-size: 1.1rem;
          line-height: 1.8;
        }

        .dashboard {
          margin-bottom: 3rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: linear-gradient(145deg, #232946 0%, #1a1a2e 100%);
          border-radius: 16px;
          padding: 1.5rem;
          text-align: center;
          border: 1px solid #393e56;
        }

        .stat-card.owner {
          border-color: #4ecca3;
          background: linear-gradient(145deg, #1a3a2e 0%, #1a1a2e 100%);
        }

        .stat-card-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #4ecca3;
        }

        .stat-card-label {
          color: #888;
          margin-top: 0.5rem;
        }

        .stat-card-max {
          color: #666;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .quick-actions h2,
        .rules-section h2,
        .rarity-section h2 {
          color: #fff;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .action-card {
          background: linear-gradient(145deg, #232946 0%, #1a1a2e 100%);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          text-decoration: none;
          border: 1px solid #393e56;
          transition: all 0.3s ease;
        }

        .action-card:hover {
          transform: translateY(-5px);
          border-color: #4ecca3;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .action-card.admin {
          border-color: #f39c12;
        }

        .action-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .action-title {
          color: #fff;
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .action-desc {
          color: #888;
          font-size: 0.9rem;
        }

        .rules-section,
        .rarity-section {
          margin-top: 3rem;
        }

        .rules-grid,
        .rarity-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .rule-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .rule-card h3 {
          color: #4ecca3;
          margin-bottom: 0.5rem;
          font-size: 1rem;
        }

        .rule-card p {
          color: #888;
          font-size: 0.9rem;
        }

        .rarity-card {
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }

        .rarity-card.commune {
          background: linear-gradient(145deg, #95a5a6 0%, #7f8c8d 100%);
        }

        .rarity-card.rare {
          background: linear-gradient(145deg, #3498db 0%, #2980b9 100%);
        }

        .rarity-card.epique {
          background: linear-gradient(145deg, #9b59b6 0%, #8e44ad 100%);
        }

        .rarity-card.legendaire {
          background: linear-gradient(145deg, #f39c12 0%, #e74c3c 100%);
        }

        .rarity-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .rarity-value {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}

export default Home;