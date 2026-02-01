import React, { useState, useEffect } from 'react';
import { getUserCards, RARITY, CARD_TYPE, getRemainingLockTime } from '../services/contracts';
import CardItem from './CardItem';

function Collection({ account, provider }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCards = async () => {
      if (!provider || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userCards = await getUserCards(provider, account);
        setCards(userCards);
      } catch (err) {
        console.error("Erreur lors du chargement des cartes:", err);
        setError("Erreur lors du chargement de votre collection");
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, [provider, account]);

  const refreshCards = async () => {
    if (!provider || !account) return;
    
    try {
      setLoading(true);
      const userCards = await getUserCards(provider, account);
      setCards(userCards);
    } catch (err) {
      console.error("Erreur lors du rafraichissement:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="collection">
        <h1 className="page-title">Ma Collection</h1>
        <div className="no-wallet">
          <p>Connectez votre wallet pour voir votre collection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="collection">
      <h1 className="page-title">Ma Collection</h1>

      <div className="collection-header">
        <div className="collection-stats">
          <span>{cards.length} / 4 cartes</span>
        </div>
        <button className="btn btn-secondary" onClick={refreshCards} disabled={loading}>
          Rafraichir
        </button>
      </div>

      {error && (
        <div className="message error">{error}</div>
      )}

      {loading ? (
        <div className="loading">Chargement de votre collection...</div>
      ) : cards.length === 0 ? (
        <div className="empty-state">
          <p>Vous ne possedez aucune carte pour le moment.</p>
          <p>Rendez-vous sur le Marketplace pour en acquerir !</p>
        </div>
      ) : (
        <div className="card-container">
          {cards.map((card) => (
            <CardItem
              key={card.tokenId}
              card={card}
              showActions={false}
              provider={provider}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .collection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
        }

        .collection-stats {
          color: #4ecca3;
          font-size: 1.25rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

export default Collection;