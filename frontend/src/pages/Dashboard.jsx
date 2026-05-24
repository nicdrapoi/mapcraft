// ============================================================
// src/pages/Dashboard.jsx — Tableau de bord utilisateur
// ============================================================
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [maps,    setMaps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newMap,  setNewMap]  = useState({ title: '', description: '' });
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [creating,   setCreating]   = useState(false);

  useEffect(() => {
    api.get('/maps/my').then(res => setMaps(res.data.maps)).finally(() => setLoading(false));
  }, []);

  const handleImgSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!imgFile || !newMap.title) return;
    setCreating(true);
    try {
      // 1. Upload de l'image
      const form = new FormData();
      form.append('image', imgFile);
      const uploadRes = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' }});

      // 2. Récupère les dimensions de l'image
      const img = new Image();
      img.src = imgPreview;
      await new Promise(res => { img.onload = res; });

      // 3. Crée la carte
      const mapRes = await api.post('/maps', {
        title:       newMap.title,
        description: newMap.description,
        imageUrl:    uploadRes.data.url,
        imageWidth:  img.naturalWidth,
        imageHeight: img.naturalHeight,
      });

      navigate(`/editor/${mapRes.data.map._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur de création');
    } finally {
      setCreating(false);
    }
  };

  const deleteMap = async (mapId) => {
    if (!window.confirm('Supprimer cette carte et toutes ses régions ?')) return;
    await api.delete(`/maps/${mapId}`);
    setMaps(prev => prev.filter(m => m._id !== mapId));
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-brand">
          <span className="brand-icon">🗺️</span>
          <h1>MapCraft</h1>
        </div>
        <div className="header-user">
          <span>Bonjour, <strong>{user?.username}</strong></span>
          <button className="btn-ghost" onClick={() => navigate('/explore')}>🌍 Explorer</button>
          <button className="btn-ghost" onClick={logout}>Déconnexion</button>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Titre + bouton créer */}
        <div className="section-header">
          <h2>Mes cartes ({maps.length})</h2>
          <button className="btn-primary" onClick={() => setShowNew(true)}>+ Nouvelle carte</button>
        </div>

        {/* Grille de cartes */}
        {loading ? (
          <div className="loading-grid"><div className="spinner" /></div>
        ) : maps.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">🗺️</p>
            <p>Vous n'avez pas encore de carte.</p>
            <button className="btn-primary" onClick={() => setShowNew(true)}>Créer ma première carte</button>
          </div>
        ) : (
          <div className="maps-grid">
            {maps.map(map => (
              <div key={map._id} className="map-card">
                <div
                  className="map-thumb"
                  style={{ backgroundImage: `url(${process.env.REACT_APP_UPLOADS_URL || ''}${map.imageUrl})` }}
                  onClick={() => navigate(`/editor/${map._id}`)}
                >
                  <div className="map-thumb-overlay">
                    <span>✏️ Éditer</span>
                  </div>
                </div>
                <div className="map-card-info">
                  <h3>{map.title}</h3>
                  <p className="map-meta">
                    {new Date(map.updatedAt).toLocaleDateString('fr-FR')} ·&nbsp;
                    <span className={map.isPublic ? 'badge-public' : 'badge-private'}>
                      {map.isPublic ? '🌍 Public' : '🔒 Privé'}
                    </span>
                  </p>
                </div>
                <div className="map-card-actions">
                  <button onClick={() => navigate(`/editor/${map._id}`)}>✏️</button>
                  {map.isPublic && (
                    <button onClick={() => navigate(`/share/${map.shareId}`)}>👁️</button>
                  )}
                  <button className="danger" onClick={() => deleteMap(map._id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de création */}
      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal-box create-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🗺️ Nouvelle carte</h2>
              <button onClick={() => setShowNew(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="create-form">
              <div className="field-group">
                <label>Titre *</label>
                <input type="text" value={newMap.title} onChange={e => setNewMap({...newMap, title: e.target.value})} required placeholder="Ma carte du monde fantasy" />
              </div>
              <div className="field-group">
                <label>Description</label>
                <input type="text" value={newMap.description} onChange={e => setNewMap({...newMap, description: e.target.value})} placeholder="Optionnel" />
              </div>
              <div className="field-group">
                <label>Image de la carte * (PNG, JPG, SVG)</label>
                <label className="upload-zone">
                  {imgPreview ? (
                    <img src={imgPreview} alt="Aperçu" className="img-preview" />
                  ) : (
                    <span>📂 Cliquez pour choisir une image</span>
                  )}
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleImgSelect} hidden required />
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setShowNew(false)}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={creating || !imgFile || !newMap.title}>
                  {creating ? 'Création…' : '🚀 Créer la carte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
