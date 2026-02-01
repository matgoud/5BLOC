import React, { useState, useEffect } from 'react';
import { getSigner } from '../services/wallet';
import {
  getAllCards,
  getUserCards,
  getUserTrades,
  getTrade,
  proposeTrade,
  acceptTrade,
  cancelTrade,
  canAcceptTrade,
  checkExchangeRatio,
  RARITY,
  CARD_TYPE,
  TRADE_STATUS,
} from '../services/contracts';
import CardItem from './CardItem';

function Marketplace({ account, provider }) {
  const [allCards, setAllCards] = useState([]);
  const [myCards, setMyCards] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showTradeForm, setShowTradeForm] = useState(false);
  const [selectedMyCard, setSelectedMyCard] = useState(null);
  const [selectedOtherCard, setSelectedOtherCard] = useState(null);
  const [ratioCheck, setRatioCheck] = useState(null);

  useEffect(() => {
    loadData();
  }, [provider, account]);

  useEffect(() => {
    const checkRatio = async () => {
      if (selectedMyCard && selectedOtherCard && provider) {
        try {
          const result = await checkExchangeRatio(provider, selectedMyCard.tokenId, selectedOtherCard.tokenId);
          setRatioCheck(result);
        } catch (err) {
          console.error("Erreur lors de la verification du ratio:", err);
        }
      } else {
        setRatioCheck(null);
      }
    };

    checkRatio();
  }, [selectedMyCard, selectedOtherCard, provider]);

  const loadData = async () => {
    if (!provider || !account) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const cards = await getAllCards(provider);
      setAllCards(cards);

      const userCards = cards.filter(c => c.owner.toLowerCase() === account.toLowerCase());
      setMyCards(userCards);

      const tradeIds = await getUserTrades(provider, account);
      const tradesData = await Promise.all(
        tradeIds.map(async (id) => {
          const trade = await getTrade(provider, id);
          const canAccept = await canAcceptTrade(provider, id);
          return { ...trade, tradeId: id, ...canAccept };
        })
      );
      setTrades(tradesData.filter(t => t.status === 0));
    } catch (err) {
      console.error("Erreur lors du chargement:", err);
      setError("Erreur lors du chargement des donnees");
    } finally {
      setLoading(false);
    }
  };

  const handleProposeTrade = async () => {
    if (!selectedMyCard || !selectedOtherCard) {
      setError("Selectionnez deux cartes pour proposer un echange");
      return;
    }

    if (!ratioCheck?.isValid) {
      setError("Le ratio d'echange depasse la limite de 1:5");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const signer = await getSigner();
      await proposeTrade(
        signer,
        selectedMyCard.tokenId,
        selectedOtherCard.owner,
        selectedOtherCard.tokenId
      );
      setSuccess("Proposition d'echange envoyee avec succes !");
      setSelectedMyCard(null);
      setSelectedOtherCard(null);
      setShowTradeForm(false);
      await loadData();
    } catch (err) {
      console.error("Erreur lors de la proposition:", err);
      setError(err.reason || "Erreur lors de la proposition d'echange");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTrade = async (tradeId) => {
    try {
      setLoading(true);
      setError(null);
      const signer = await getSigner();
      await acceptTrade(signer, tradeId);
      setSuccess("Echange accepte avec succes !");
      await loadData();
    } catch (err) {
      console.error("Erreur lors de l'acceptation:", err);
      setError(err.reason || "Erreur lors de l'acceptation de l'echange");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTrade = async (tradeId) => {
    try {
      setLoading(true);
      setError(null);
      const signer = await getSigner();
      await cancelTrade(signer, tradeId);
      setSuccess("Echange annule avec succes !");
      await loadData();
    } catch (err) {
      console.error("Erreur lors de l'annulation:", err);
      setError(err.reason || "Erreur lors de l'annulation de l'echange");
    } finally {
      setLoading(false);
    }
  };

  const otherCards = allCards.filter(
    c => c.owner.toLowerCase() !== account?.toLowerCase()
  );

  if (!account) {
    return (
      <div className="marketplace">
        <h1 className="page-title">Marketplace</h1>
        <div className="no-wallet">
          <p>Connectez votre wallet pour acceder au marketplace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace">
      <h1 className="page-title">Marketplace</h1>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      {trades.length > 0 && (
        <section className="trades-section">
          <h2>Echanges en cours</h2>
          <div className="trades-list">
            {trades.map((trade) => (
              <TradeItem
                key={trade.tradeId}
                trade={trade}
                account={account}
                allCards={allCards}
                onAccept={handleAcceptTrade}
                onCancel={handleCancelTrade}
              />
            ))}
          </div>
        </section>
      )}

      <section className="new-trade-section">
        <div className="section-header">
          <h2>Proposer un echange</h2>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowTradeForm(!showTradeForm);
              setSelectedMyCard(null);
              setSelectedOtherCard(null);
            }}
          >
            {showTradeForm ? 'Annuler' : 'Nouveau'}
          </button>
        </div>

        {showTradeForm && (
          <div className="trade-form">
            <div className="trade-selection">
              <div className="selection-column">
                <h3>Votre carte</h3>
                {myCards.length === 0 ? (
                  <p className="empty-text">Vous n'avez pas de carte</p>
                ) : (
                  <div className="mini-card-list">
                    {myCards.filter(c => !c.isLocked).map((card) => (
                      <CardItem
                        key={card.tokenId}
                        card={card}
                        selected={selectedMyCard?.tokenId === card.tokenId}
                        onSelect={setSelectedMyCard}
                        provider={provider}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="trade-arrow-container">
                <div className="trade-arrow">⇄</div>
                {ratioCheck && (
                  <div className={`ratio-indicator ${ratioCheck.isValid ? 'valid' : 'invalid'}`}>
                    Ratio: 1:{ratioCheck.ratio}
                    <br />
                    {ratioCheck.isValid ? 'Valide' : 'Invalide'}
                  </div>
                )}
              </div>

              <div className="selection-column">
                <h3>Carte desiree</h3>
                {otherCards.length === 0 ? (
                  <p className="empty-text">Aucune carte disponible</p>
                ) : (
                  <div className="mini-card-list">
                    {otherCards.map((card) => (
                      <CardItem
                        key={card.tokenId}
                        card={card}
                        selected={selectedOtherCard?.tokenId === card.tokenId}
                        onSelect={setSelectedOtherCard}
                        provider={provider}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="trade-form-actions">
              <button
                className="btn btn-primary"
                onClick={handleProposeTrade}
                disabled={!selectedMyCard || !selectedOtherCard || !ratioCheck?.isValid || loading}
              >
                {loading ? 'Envoi en cours...' : 'Proposer l\'echange'}
              </button>
            </div>
          </div>
        )}
      </section>

      <style jsx>{`
        .marketplace {
          max-width: 1200px;
          margin: 0 auto;
        }

        .trades-section,
        .new-trade-section {
          margin-bottom: 3rem;
        }

        .trades-section h2,
        .new-trade-section h2 {
          color: #fff;
          margin-bottom: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .trades-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .trade-form {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 2rem;
        }

        .trade-selection {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 2rem;
          align-items: start;
        }

        .selection-column h3 {
          color: #4ecca3;
          margin-bottom: 1rem;
          text-align: center;
        }

        .mini-card-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 500px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .trade-arrow-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
        }

        .trade-arrow {
          font-size: 3rem;
          color: #4ecca3;
        }

        .ratio-indicator {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          text-align: center;
          font-size: 0.9rem;
        }

        .ratio-indicator.valid {
          background: rgba(78, 204, 163, 0.2);
          color: #4ecca3;
          border: 1px solid #4ecca3;
        }

        .ratio-indicator.invalid {
          background: rgba(231, 76, 60, 0.2);
          color: #e74c3c;
          border: 1px solid #e74c3c;
        }

        .empty-text {
          color: #888;
          text-align: center;
          padding: 2rem;
        }

        .trade-form-actions {
          margin-top: 2rem;
          text-align: center;
        }

        @media (max-width: 900px) {
          .trade-selection {
            grid-template-columns: 1fr;
          }

          .trade-arrow-container {
            padding: 1rem;
          }

          .trade-arrow {
            transform: rotate(90deg);
          }
        }
      `}</style>
    </div>
  );
}

function TradeItem({ trade, account, allCards, onAccept, onCancel }) {
  const proposerCard = allCards.find(c => c.tokenId === trade.proposerTokenId);
  const receiverCard = allCards.find(c => c.tokenId === trade.receiverTokenId);
  const isProposer = trade.proposer.toLowerCase() === account.toLowerCase();
  const isReceiver = trade.receiver.toLowerCase() === account.toLowerCase();

  return (
    <div className="trade-card">
      <div className="trade-header">
        <span className="trade-id">Echange #{trade.tradeId}</span>
        <span className={`trade-status ${TRADE_STATUS[trade.status].toLowerCase()}`}>
          {TRADE_STATUS[trade.status]}
        </span>
      </div>

      <div className="trade-details">
        <div className="trade-card-info">
          <div className="trade-label">{isProposer ? 'Votre carte' : 'Carte proposee'}</div>
          {proposerCard && (
            <>
              <div className="trade-card-name">{proposerCard.name}</div>
              <div className="trade-card-value">Valeur: {proposerCard.value}</div>
            </>
          )}
        </div>

        <div className="trade-arrow">→</div>

        <div className="trade-card-info">
          <div className="trade-label">{isReceiver ? 'Votre carte' : 'Carte demandee'}</div>
          {receiverCard && (
            <>
              <div className="trade-card-name">{receiverCard.name}</div>
              <div className="trade-card-value">Valeur: {receiverCard.value}</div>
            </>
          )}
        </div>
      </div>

      {!trade.canAccept && trade.message && (
        <div className="trade-warning">
          {trade.message}
        </div>
      )}

      <div className="trade-actions">
        {isReceiver && trade.canAccept && (
          <button className="btn btn-primary" onClick={() => onAccept(trade.tradeId)}>
            Accepter
          </button>
        )}
        <button className="btn btn-danger" onClick={() => onCancel(trade.tradeId)}>
          Annuler
        </button>
      </div>

      <style jsx>{`
        .trade-card {
          background: linear-gradient(145deg, #232946 0%, #1a1a2e 100%);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid #393e56;
        }

        .trade-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .trade-id {
          color: #888;
          font-size: 0.9rem;
        }

        .trade-details {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1rem;
        }

        .trade-card-info {
          text-align: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .trade-label {
          font-size: 0.8rem;
          color: #888;
          margin-bottom: 0.5rem;
        }

        .trade-card-name {
          color: #fff;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .trade-card-value {
          color: #f39c12;
          font-size: 0.9rem;
        }

        .trade-arrow {
          font-size: 2rem;
          color: #4ecca3;
        }

        .trade-warning {
          background: rgba(243, 156, 18, 0.2);
          border: 1px solid #f39c12;
          color: #f39c12;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          text-align: center;
        }

        .trade-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}

export default Marketplace;