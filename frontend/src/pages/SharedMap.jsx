// ============================================================
// src/pages/SharedMap.jsx — Vue publique (lecture seule)
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MapCanvas     from '../components/Canvas/MapCanvas';
import RegionSidebar from '../components/Sidebar/RegionSidebar';
import api           from '../utils/api';

const SharedMap = () => {
  const { shareId } = useParams();
  const navigate    = useNavigate();
  const canvasRef   = useRef(null);

  const [map,     setMap]     = useState(null);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [toast,    setToast]    = useState('');

  useEffect(() => {
    api.get(`/maps/share/${shareId}`)
      .then(res => { setMap(res.data.map); setRegions(res.data.regions); })
      .catch(() => navigate('/explore'))
      .finally(() => setLoading(false));
  }, [shareId]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setToast('🔗 Lien copié !');
    setTimeout(() => setToast(''), 3000);
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Chargement…</p></div>;

  const imageUrl = `${process.env.REACT_APP_UPLOADS_URL || ''}${map?.imageUrl}`;

  return (
    <div className="editor-layout">
      <header className="editor-toolbar">
        <div className="toolbar-left">
          <button className="back-btn" onClick={() => navigate('/explore')}>← Explorer</button>
          <h1 className="map-title">{map?.title}</h1>
          <span className="meta-author">par <strong>{map?.owner?.username}</strong></span>
        </div>
        <div className="toolbar-right">
          <button className="tool-btn" onClick={copyLink}>🔗 Partager</button>
          <span className="view-count">👁️ {map?.viewCount} vue{map?.viewCount > 1 ? 's' : ''}</span>
        </div>
      </header>

      <div className="editor-body">
        <div className={`canvas-wrapper ${selected ? 'with-sidebar' : ''}`}>
          <MapCanvas
            ref={canvasRef}
            imageUrl={imageUrl}
            regions={regions}
            readOnly={true}
            onRegionClick={setSelected}
          />
        </div>

        {selected && (
          <RegionSidebar
            region={selected}
            mapId={map._id}
            onClose={() => setSelected(null)}
            readOnly={true}
          />
        )}
      </div>

      {/* Instructions */}
      {!selected && (
        <div className="hint-bar">
          💡 Cliquez sur une région colorée pour voir ses informations
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

export default SharedMap;
