// ============================================================
// src/pages/Explore.jsx — Galerie des cartes publiques
// ============================================================
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Explore = () => {
  const navigate = useNavigate();
  const [maps,    setMaps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const LIMIT = 12;

  const load = async (p = 1, q = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/maps/public?page=${p}&limit=${LIMIT}&search=${q}`);
      setMaps(res.data.maps);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1, search); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load(1, search);
  };

  return (
    <div className="explore-page">
      <header className="explore-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Retour</button>
        <h1>🌍 Explorer les cartes</h1>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Rechercher une carte…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit">🔍</button>
        </form>
      </header>

      <main className="explore-main">
        {loading ? (
          <div className="loading-grid"><div className="spinner" /></div>
        ) : maps.length === 0 ? (
          <div className="empty-state">
            <p>Aucune carte publique trouvée.</p>
          </div>
        ) : (
          <>
            <p className="result-count">{total} carte{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}</p>
            <div className="maps-grid">
              {maps.map(map => (
                <div key={map._id} className="map-card" onClick={() => navigate(`/share/${map.shareId}`)}>
                  <div
                    className="map-thumb"
                    style={{ backgroundImage: `url(${process.env.REACT_APP_UPLOADS_URL || ''}${map.imageUrl})` }}
                  >
                    <div className="map-thumb-overlay"><span>👁️ Voir</span></div>
                  </div>
                  <div className="map-card-info">
                    <h3>{map.title}</h3>
                    <p className="map-meta">
                      par <strong>{map.owner?.username}</strong> ·&nbsp;
                      {new Date(map.createdAt).toLocaleDateString('fr-FR')}
                      {map.viewCount > 0 && ` · 👁️ ${map.viewCount}`}
                    </p>
                    {map.description && <p className="map-desc">{map.description}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {total > LIMIT && (
              <div className="pagination">
                <button disabled={page === 1} onClick={() => { setPage(page-1); load(page-1, search); }}>← Précédent</button>
                <span>Page {page} / {Math.ceil(total/LIMIT)}</span>
                <button disabled={page >= Math.ceil(total/LIMIT)} onClick={() => { setPage(page+1); load(page+1, search); }}>Suivant →</button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Explore;
