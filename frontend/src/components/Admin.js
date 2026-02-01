import React, { useState, useEffect } from 'react';
import { getSigner } from '../services/wallet';
import { mintCard, getContractOwner, getUserCardCount } from '../services/contracts';

function Admin({ account, provider }) {
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    to: '',
    name: '',
    cardType: '0',
    rarity: '0',
    power: '',
    defense: '',
    edition: '1',
    maxEdition: '100',
    ipfsURI: '',
  });

  useEffect(() => {
const checkOwner = async () => {
      if (provider && account) {
        try {
          const owner = await getContractOwner(provider);
          
          // --- AJOUTEZ CES LIGNES ---
          console.log("=== DEBUG ADMIN ===");
          console.log("1. Compte connecté (MetaMask) :", account);
          console.log("2. Propriétaire du contrat    :", owner);
          console.log("3. Comparaison (lowercase)    :", owner.toLowerCase() === account.toLowerCase());
          console.log("===================");
          // --------------------------

          setIsOwner(owner.toLowerCase() === account.toLowerCase());
        } catch (err) {
          console.error("Erreur verification:", err);
        }
      }
      setLoading(false);
    };

    checkOwner();
  }, [provider, account]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.to || !formData.name || !formData.power || !formData.defense) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const power = parseInt(formData.power);
    const defense = parseInt(formData.defense);

    if (power < 1 || power > 100 || defense < 1 || defense > 100) {
      setError("Power et Defense doivent etre entre 1 et 100");
      return;
    }

    try {
      setMinting(true);

      const recipientCardCount = await getUserCardCount(provider, formData.to);
      if (recipientCardCount >= 4) {
        setError("Le destinataire possede deja 4 cartes (limite atteinte)");
        return;
      }

      const signer = await getSigner();
      const ipfsURI = formData.ipfsURI || `ipfs://placeholder/${Date.now()}`;

      await mintCard(
        signer,
        formData.to,
        formData.name,
        parseInt(formData.cardType),
        parseInt(formData.rarity),
        power,
        defense,
        parseInt(formData.edition),
        parseInt(formData.maxEdition),
        ipfsURI
      );

      setSuccess(`Carte "${formData.name}" creee avec succes !`);
      setFormData({
        to: '',
        name: '',
        cardType: '0',
        rarity: '0',
        power: '',
        defense: '',
        edition: '1',
        maxEdition: '100',
        ipfsURI: '',
      });
    } catch (err) {
      console.error("Erreur lors du mint:", err);
      setError(err.reason || "Erreur lors de la creation de la carte");
    } finally {
      setMinting(false);
    }
  };

  if (!account) {
    return (
      <div className="admin">
        <h1 className="page-title">Administration</h1>
        <div className="no-wallet">
          <p>Connectez votre wallet pour acceder a l'administration</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin">
        <h1 className="page-title">Administration</h1>
        <div className="loading">Verification des droits...</div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="admin">
        <h1 className="page-title">Administration</h1>
        <div className="message error">
          Vous n'etes pas autorise a acceder a cette page.
          Seul le proprietaire du contrat peut creer des cartes.
        </div>
      </div>
    );
  }

  return (
    <div className="admin">
      <h1 className="page-title">Administration</h1>

      <div className="admin-content">
        <div className="admin-card">
          <h2>Creer une nouvelle carte</h2>

          {error && <div className="message error">{error}</div>}
          {success && <div className="message success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Adresse du destinataire *</label>
              <input
                type="text"
                name="to"
                value={formData.to}
                onChange={handleChange}
                placeholder="0x..."
                required
              />
            </div>

            <div className="form-group">
              <label>Nom de la carte *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Dragon des Abysses"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select name="cardType" value={formData.cardType} onChange={handleChange}>
                  <option value="0">Guerrier</option>
                  <option value="1">Mage</option>
                  <option value="2">Creature</option>
                  <option value="3">Artefact</option>
                </select>
              </div>

              <div className="form-group">
                <label>Rarete</label>
                <select name="rarity" value={formData.rarity} onChange={handleChange}>
                  <option value="0">Commune (10)</option>
                  <option value="1">Rare (50)</option>
                  <option value="2">Epique (200)</option>
                  <option value="3">Legendaire (1000)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Power (1-100) *</label>
                <input
                  type="number"
                  name="power"
                  value={formData.power}
                  onChange={handleChange}
                  min="1"
                  max="100"
                  placeholder="50"
                  required
                />
              </div>

              <div className="form-group">
                <label>Defense (1-100) *</label>
                <input
                  type="number"
                  name="defense"
                  value={formData.defense}
                  onChange={handleChange}
                  min="1"
                  max="100"
                  placeholder="50"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Edition</label>
                <input
                  type="number"
                  name="edition"
                  value={formData.edition}
                  onChange={handleChange}
                  min="1"
                  placeholder="1"
                />
              </div>

              <div className="form-group">
                <label>Max Edition</label>
                <input
                  type="number"
                  name="maxEdition"
                  value={formData.maxEdition}
                  onChange={handleChange}
                  min="1"
                  placeholder="100"
                />
              </div>
            </div>

            <div className="form-group">
              <label>URI IPFS (optionnel)</label>
              <input
                type="text"
                name="ipfsURI"
                value={formData.ipfsURI}
                onChange={handleChange}
                placeholder="ipfs://..."
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={minting}
            >
              {minting ? 'Creation en cours...' : 'Creer la carte'}
            </button>
          </form>
        </div>

        <div className="admin-info">
          <h3>Informations</h3>
          <ul>
            <li>Chaque utilisateur peut posseder maximum 4 cartes</li>
            <li>Power et Defense doivent etre entre 1 et 100</li>
            <li>La carte sera verrouillee pendant 10 minutes apres creation</li>
            <li>La valeur est determinee automatiquement par la rarete</li>
          </ul>

          <h3>Valeurs par rarete</h3>
          <ul>
            <li><span className="commune">Commune</span>: 10</li>
            <li><span className="rare">Rare</span>: 50</li>
            <li><span className="epique">Epique</span>: 200</li>
            <li><span className="legendaire">Legendaire</span>: 1000</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .admin-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .admin-card {
          background: linear-gradient(145deg, #232946 0%, #1a1a2e 100%);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid #393e56;
        }

        .admin-card h2 {
          color: #fff;
          margin-bottom: 1.5rem;
        }

        .btn-block {
          width: 100%;
          margin-top: 1rem;
        }

        .admin-info {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .admin-info h3 {
          color: #4ecca3;
          margin-bottom: 1rem;
          font-size: 1rem;
        }

        .admin-info ul {
          list-style: none;
          margin-bottom: 1.5rem;
        }

        .admin-info li {
          color: #888;
          padding: 0.5rem 0;
          border-bottom: 1px solid #393e56;
          font-size: 0.9rem;
        }

        .admin-info .commune {
          color: #95a5a6;
        }

        .admin-info .rare {
          color: #3498db;
        }

        .admin-info .epique {
          color: #9b59b6;
        }

        .admin-info .legendaire {
          color: #f39c12;
        }

        @media (max-width: 768px) {
          .admin-content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Admin;