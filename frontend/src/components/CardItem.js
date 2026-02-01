import React, { useState, useEffect } from 'react';
import { RARITY, CARD_TYPE, getRemainingLockTime } from '../services/contracts';
import { formatAddress } from '../services/wallet';

function CardItem({ card, showActions, onTrade, onSelect, selected, provider }) {
  const [lockTime, setLockTime] = useState(0);

  useEffect(() => {
    const updateLockTime = async () => {
      if (provider && card.isLocked) {
        try {
          const remaining = await getRemainingLockTime(provider, card.tokenId);
          setLockTime(remaining);
        } catch (error) {
          console.error("Erreur lors de la recuperation du temps de lock:", error);
        }
      }
    };

    updateLockTime();
    const interval = setInterval(updateLockTime, 10000);

    return () => clearInterval(interval);
  }, [provider, card.tokenId, card.isLocked]);

  const rarityClass = RARITY[card.rarity].toLowerCase();
  const cardTypeName = CARD_TYPE[card.cardType];
  const rarityName = RARITY[card.rarity];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div 
      className={`card ${rarityClass} ${selected ? 'selected' : ''} ${onSelect ? 'selectable' : ''}`}
      onClick={() => onSelect && onSelect(card)}
    >
      <div className="card-header">
        <span className="card-name">{card.name}</span>
        <span className={`card-rarity ${rarityClass}`}>{rarityName}</span>
      </div>

      <div className="card-type">{cardTypeName}</div>

      <div className="card-stats">
        <div className="stat">
          <div className="stat-label">Power</div>
          <div className="stat-value">{card.power}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Defense</div>
          <div className="stat-value">{card.defense}</div>
        </div>
      </div>

      <div className="card-value">
        Valeur: <span>{card.value}</span>
      </div>

      <div className="card-info">
        <div className="info-row">
          <span className="info-label">Edition:</span>
          <span className="info-value">{card.edition} / {card.maxEdition}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Token ID:</span>
          <span className="info-value">#{card.tokenId}</span>
        </div>
        {card.owner && (
          <div className="info-row">
            <span className="info-label">Proprietaire:</span>
            <span className="info-value">{formatAddress(card.owner)}</span>
          </div>
        )}
      </div>

      {card.isLocked && (
        <div className="card-locked">
          <span className="lock-icon">🔒</span>
          <span>Verrouillee - {formatTime(lockTime)}</span>
        </div>
      )}

      {showActions && !card.isLocked && (
        <div className="card-actions">
          <button className="btn btn-primary" onClick={() => onTrade && onTrade(card)}>
            Proposer echange
          </button>
        </div>
      )}

      <style jsx>{`
        .card.selected {
          border: 2px solid #4ecca3;
          box-shadow: 0 0 20px rgba(78, 204, 163, 0.3);
        }

        .card.selectable {
          cursor: pointer;
        }

        .card.selectable:hover {
          border-color: #4ecca3;
        }

        .card-info {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #393e56;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
        }

        .info-label {
          color: #888;
        }

        .info-value {
          color: #ccc;
          font-family: monospace;
        }

        .card-locked {
          margin-top: 1rem;
          padding: 0.75rem;
          background: rgba(231, 76, 60, 0.2);
          border: 1px solid #e74c3c;
          border-radius: 8px;
          text-align: center;
          color: #e74c3c;
          font-size: 0.9rem;
        }

        .lock-icon {
          margin-right: 0.5rem;
        }
      `}</style>
    </div>
  );
}

export default CardItem;