// ============================================================
// src/components/Sidebar/RegionSidebar.jsx
// Panneau latéral d'édition d'une région/pays
// ============================================================
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const STATUS_OPTIONS = [
  { value: 'unknown',   label: '❓ Inconnu',   color: '#3b82f6' },
  { value: 'ally',      label: '✅ Allié',      color: '#22c55e' },
  { value: 'enemy',     label: '❌ Ennemi',     color: '#ef4444' },
  { value: 'neutral',   label: '⚪ Neutre',     color: '#94a3b8' },
  { value: 'vassal',    label: '🔶 Vassal',     color: '#f59e0b' },
  { value: 'contested', label: '🔥 Contesté',   color: '#f97316' },
];

const RegionSidebar = ({ region, mapId, onClose, onSave, onDelete, readOnly }) => {
  const [info, setInfo]         = useState({ name:'', capital:'', population:'', description:'', status:'unknown', politicalColor:'', flagUrl:'' });
  const [fillColor, setFillColor]     = useState('#3b82f6');
  const [fillOpacity, setFillOpacity] = useState(0.45);
  const [strokeEnabled, setStrokeEnabled] = useState(true);
  const [saving, setSaving]     = useState(false);
  const [flagFile, setFlagFile] = useState(null);

  useEffect(() => {
    if (!region) return;
    setInfo({ name:'', capital:'', population:'', description:'', status:'unknown', politicalColor:'', flagUrl:'', ...region.info });
    setFillColor(region.fillColor || '#3b82f6');
    setFillOpacity(region.fillOpacity ?? 0.45);
    setStrokeEnabled(region.strokeEnabled !== false);
  }, [region]);

  if (!region) return null;

  const handleChange = (field, value) => setInfo(prev => ({ ...prev, [field]: value }));

  const handleFlagUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('image', file);
    try {
      const res = await api.post('/upload?type=flag', form, { headers: { 'Content-Type': 'multipart/form-data' }});
      setInfo(prev => ({ ...prev, flagUrl: res.data.url }));
    } catch (err) {
      alert('Erreur upload drapeau');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { info, fillColor, fillOpacity, strokeEnabled };
      if (region._id?.startsWith('new_')) {
        // Création
        const res = await api.post(`/regions/${mapId}`, { ...payload, points: region.points });
        onSave && onSave({ ...region, ...payload, _id: res.data.region._id });
      } else {
        // Mise à jour
        const res = await api.put(`/regions/${mapId}/${region._id}`, payload);
        onSave && onSave({ ...region, ...payload });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette région ?')) return;
    if (!region._id?.startsWith('new_')) {
      await api.delete(`/regions/${mapId}/${region._id}`);
    }
    onDelete && onDelete(region._id);
  };

  const currentStatus = STATUS_OPTIONS.find(s => s.value === info.status);

  return (
    <aside className="region-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">{info.name || 'Nouvelle région'}</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="sidebar-body">
        {/* Drapeau */}
        <div className="flag-section">
          {info.flagUrl && (
            <img
              src={`${process.env.REACT_APP_UPLOADS_URL || ''}${info.flagUrl}`}
              alt="Drapeau"
              className="flag-preview"
            />
          )}
          {!readOnly && (
            <label className="upload-flag-btn">
              📷 {info.flagUrl ? 'Changer le drapeau' : 'Ajouter un drapeau'}
              <input type="file" accept="image/*" onChange={handleFlagUpload} hidden />
            </label>
          )}
        </div>

        {/* Informations */}
        <div className="field-group">
          <label>Nom</label>
          <input type="text" value={info.name} onChange={e => handleChange('name', e.target.value)} disabled={readOnly} placeholder="Ex : Royaume d'Arendelle" />
        </div>

        <div className="field-group">
          <label>Capitale</label>
          <input type="text" value={info.capital} onChange={e => handleChange('capital', e.target.value)} disabled={readOnly} placeholder="Ex : Arendelle" />
        </div>

        <div className="field-group">
          <label>Population</label>
          <input type="text" value={info.population} onChange={e => handleChange('population', e.target.value)} disabled={readOnly} placeholder="Ex : 2 400 000" />
        </div>

        <div className="field-group">
          <label>Statut</label>
          <div className="status-grid">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s.value}
                className={`status-chip ${info.status === s.value ? 'selected' : ''}`}
                style={{ '--status-color': s.color }}
                onClick={() => !readOnly && handleChange('status', s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field-group">
          <label>Couleur politique / régime</label>
          <input type="text" value={info.politicalColor} onChange={e => handleChange('politicalColor', e.target.value)} disabled={readOnly} placeholder="Ex : Monarchie absolue" />
        </div>

        <div className="field-group">
          <label>Description</label>
          <textarea value={info.description} onChange={e => handleChange('description', e.target.value)} disabled={readOnly} rows={4} placeholder="Histoire, ressources, culture…" />
        </div>

        {/* Apparence */}
        {!readOnly && (
          <div className="appearance-section">
            <h3>🎨 Apparence</h3>
            <div className="field-row">
              <label>Couleur</label>
              <input type="color" value={fillColor} onChange={e => setFillColor(e.target.value)} />
            </div>
            <div className="field-row">
              <label>Opacité ({Math.round(fillOpacity * 100)}%)</label>
              <input type="range" min="0" max="1" step="0.05" value={fillOpacity} onChange={e => setFillOpacity(Number(e.target.value))} />
            </div>
            <div className="field-row">
              <label>Bordure noire</label>
              <input type="checkbox" checked={strokeEnabled} onChange={e => setStrokeEnabled(e.target.checked)} />
            </div>
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      {!readOnly && (
        <div className="sidebar-footer">
          <button className="btn-delete" onClick={handleDelete}>🗑️ Supprimer</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Sauvegarde…' : '💾 Sauvegarder'}
          </button>
        </div>
      )}
    </aside>
  );
};

export default RegionSidebar;
