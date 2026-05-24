// ============================================================
// src/pages/MapEditor.jsx — Éditeur de carte complet
// ============================================================
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MapCanvas       from '../components/Canvas/MapCanvas';
import RegionSidebar   from '../components/Sidebar/RegionSidebar';
import api             from '../utils/api';
import { useAuth }     from '../context/AuthContext';

const MapEditor = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const canvasRef   = useRef(null);

  const [map,     setMap]     = useState(null);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [showHistory, setShowHistory]       = useState(false);
  const [history,     setHistory]           = useState([]);
  const [isPublic,    setIsPublic]          = useState(false);
  const [shareUrl,    setShareUrl]          = useState('');
  const [toast,       setToast]             = useState('');
  const [mode,        setMode]              = useState('select');

  // ── Chargement de la carte ────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/maps/${id}`);
        setMap(res.data.map);
        setRegions(res.data.regions || []);
        setIsPublic(res.data.map.isPublic);
        if (res.data.map.shareId) {
          setShareUrl(`${window.location.origin}/share/${res.data.map.shareId}`);
        }
      } catch (err) {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // ── Gestion des régions ───────────────────────────────────
  const handleRegionCreate = useCallback((regionData) => {
    setRegions(prev => [...prev, regionData]);
    setSelectedRegion(regionData);
  }, []);

  const handleRegionUpdate = useCallback((updated) => {
    setRegions(prev => prev.map(r => r._id === updated._id ? updated : r));
  }, []);

  const handleRegionSave = useCallback((saved) => {
    setRegions(prev => prev.map(r => (r._id === saved._id || r._id?.startsWith('new_')) ? saved : r));
    setSelectedRegion(saved);
    showToast('✅ Région sauvegardée !');
  }, []);

  const handleRegionDelete = useCallback((regionId) => {
    setRegions(prev => prev.filter(r => r._id !== regionId));
    setSelectedRegion(null);
    showToast('🗑️ Région supprimée');
  }, []);

  // ── Publication ───────────────────────────────────────────
  const togglePublish = async () => {
    try {
      const res = await api.put(`/maps/${id}`, { isPublic: !isPublic });
      setIsPublic(res.data.map.isPublic);
      if (res.data.map.shareId) {
        const url = `${window.location.origin}/share/${res.data.map.shareId}`;
        setShareUrl(url);
        showToast(res.data.map.isPublic ? '🌍 Carte publiée !' : '🔒 Carte dépubliée');
      }
    } catch (err) {
      showToast('❌ Erreur de publication');
    }
  };

  // ── Copier le lien ────────────────────────────────────────
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    showToast('📋 Lien copié !');
  };

  // ── Export PNG ────────────────────────────────────────────
  const exportPNG = () => {
    const dataUrl = canvasRef.current?.exportPNG();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${map?.title || 'carte'}.png`;
    a.click();
    showToast('📥 Export PNG en cours…');
  };

  // ── Export SVG ────────────────────────────────────────────
  const exportSVG = () => {
    const svg = canvasRef.current?.exportSVG();
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${map?.title || 'carte'}.svg`;
    a.click();
    showToast('📥 Export SVG en cours…');
  };

  // ── Historique ────────────────────────────────────────────
  const loadHistory = async () => {
    const res = await api.get(`/maps/${id}/history`);
    setHistory(res.data.history.reverse());
    setShowHistory(true);
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Chargement de la carte…</p></div>;

  const imageUrl = map ? `${process.env.REACT_APP_UPLOADS_URL || ''}${map.imageUrl}` : '';

  return (
    <div className="editor-layout">
      {/* ── Barre d'outils ───────────────────────────────── */}
      <header className="editor-toolbar">
        <div className="toolbar-left">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>← Retour</button>
          <h1 className="map-title">{map?.title}</h1>
        </div>

        <div className="toolbar-center">
          <button className={`tool-btn ${mode === 'select' ? 'active' : ''}`} onClick={() => { setMode('select'); canvasRef.current?.setMode('select'); }} title="Sélectionner / déplacer une région">🖱️</button>
          <button className={`tool-btn ${mode === 'detect' ? 'active' : ''}`} onClick={() => { setMode('detect'); canvasRef.current?.setMode('detect'); }} title="Détecter automatiquement un pays par clic">🪄 Détecter un pays</button>
        </div>

        <div className="toolbar-right">
          <button className="tool-btn" onClick={loadHistory} title="Historique">📜</button>
          <button className="tool-btn" onClick={exportPNG}  title="Exporter PNG">📷 PNG</button>
          <button className="tool-btn" onClick={exportSVG}  title="Exporter SVG">📐 SVG</button>
          <button className={`publish-btn ${isPublic ? 'published' : ''}`} onClick={togglePublish}>
            {isPublic ? '🌍 Publié' : '🔒 Privé'}
          </button>
          {isPublic && shareUrl && (
            <button className="share-btn" onClick={copyShareLink}>🔗 Copier le lien</button>
          )}
        </div>
      </header>

      {/* ── Zone principale ───────────────────────────────── */}
      <div className="editor-body">
        <div className={`canvas-wrapper ${selectedRegion ? 'with-sidebar' : ''}`}>
          <MapCanvas
            ref={canvasRef}
            imageUrl={imageUrl}
            regions={regions}
            readOnly={false}
            onRegionClick={setSelectedRegion}
            onRegionCreate={handleRegionCreate}
            onRegionUpdate={handleRegionUpdate}
          />
        </div>

        {/* Panneau latéral */}
        {selectedRegion && (
          <RegionSidebar
            region={selectedRegion}
            mapId={id}
            onClose={() => { setSelectedRegion(null); canvasRef.current?.deselectAll(); }}
            onSave={handleRegionSave}
            onDelete={handleRegionDelete}
            readOnly={false}
          />
        )}
      </div>

      {/* ── Historique (modal) ────────────────────────────── */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-box history-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📜 Historique des modifications</h2>
              <button onClick={() => setShowHistory(false)}>✕</button>
            </div>
            <div className="history-list">
              {history.length === 0 && <p className="empty">Aucune modification enregistrée.</p>}
              {history.map((entry, i) => (
                <div key={i} className="history-entry">
                  <span className="history-action">{actionLabel(entry.action)}</span>
                  <span className="history-name">{entry.regionName}</span>
                  <span className="history-user">par {entry.changedBy?.username || 'vous'}</span>
                  <span className="history-date">{new Date(entry.createdAt).toLocaleString('fr-FR')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast de notification */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

const actionLabel = (action) => ({
  create_region: '➕ Création',
  edit_region:   '✏️ Modification',
  delete_region: '🗑️ Suppression',
}[action] || action);

export default MapEditor;
