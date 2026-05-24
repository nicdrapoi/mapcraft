// ============================================================
// src/components/Canvas/MapCanvas.jsx — Cœur de l'éditeur de carte
// Fabric.js + Flood Fill + édition de polygones
// ============================================================
import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { fabric } from 'fabric';
import { floodFillMask, maskToPolygon } from '../../utils/floodFill';

const STATUS_COLORS = {
  ally:      '#22c55e',
  enemy:     '#ef4444',
  neutral:   '#94a3b8',
  vassal:    '#f59e0b',
  contested: '#f97316',
  unknown:   '#3b82f6',
};

const MapCanvas = forwardRef(({
  imageUrl,
  regions = [],
  readOnly = false,
  onRegionClick,
  onRegionCreate,
  onRegionUpdate,
}, ref) => {
  const canvasEl  = useRef(null);
  const fabricRef = useRef(null);
  const imgRef    = useRef(null);
  const [mode, setMode]           = useState('select'); // 'select' | 'detect' | 'draw'
  const [detecting, setDetecting] = useState(false);
  const [activeRegion, setActiveRegion] = useState(null);

  // ── Expose des méthodes au parent ─────────────────────────
  useImperativeHandle(ref, () => ({
    setMode: (m) => setMode(m),
    getMode: () => mode,
    exportPNG: () => fabricRef.current?.toDataURL({ format: 'png', multiplier: 2 }),
    exportSVG: () => fabricRef.current?.toSVG(),
    deselectAll: () => { fabricRef.current?.discardActiveObject(); fabricRef.current?.renderAll(); },
  }));

  // ── Initialisation Fabric.js ──────────────────────────────
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasEl.current, {
      selection: !readOnly,
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    // Chargement de l'image de fond
    if (imageUrl) {
      fabric.Image.fromURL(imageUrl, (img) => {
        imgRef.current = img;
        const ratio  = Math.min(canvas.width / img.width, canvas.height / img.height);
        img.scale(ratio);
        img.set({
          left: (canvas.width  - img.getScaledWidth())  / 2,
          top:  (canvas.height - img.getScaledHeight()) / 2,
          selectable: false,
          evented: false,
          crossOrigin: 'anonymous',
        });
        canvas.add(img);
        canvas.sendToBack(img);
        canvas.renderAll();
      }, { crossOrigin: 'anonymous' });
    }

    // Redimensionnement responsive
    const resize = () => {
      const container = canvasEl.current?.parentElement;
      if (!container) return;
      canvas.setWidth(container.clientWidth);
      canvas.setHeight(container.clientHeight);
      canvas.renderAll();
    };
    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      canvas.dispose();
    };
  }, [imageUrl, readOnly]);

  // ── Rendu des régions depuis la BDD ───────────────────────
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Supprime les anciens polygones (garde l'image de fond)
    canvas.getObjects().forEach(obj => {
      if (obj.regionData) canvas.remove(obj);
    });

    regions.forEach(region => addRegionToCanvas(canvas, region, readOnly));
    canvas.renderAll();
  }, [regions, readOnly]);

  // ── Mode détection : clic sur canvas ─────────────────────
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const handleClick = async (e) => {
      if (mode !== 'detect' || readOnly) return;

      const pointer = canvas.getPointer(e.e);
      const img = imgRef.current;
      if (!img) return;

      // Convertit les coordonnées canvas en coordonnées image
      const imgX = Math.round((pointer.x - img.left) / img.scaleX);
      const imgY = Math.round((pointer.y - img.top)  / img.scaleY);

      if (imgX < 0 || imgY < 0 || imgX >= img.width || imgY >= img.height) return;

      setDetecting(true);
      try {
        await detectAndCreateRegion(canvas, img, imgX, imgY, pointer);
      } finally {
        setDetecting(false);
      }
    };

    canvas.on('mouse:down', handleClick);
    return () => canvas.off('mouse:down', handleClick);
  }, [mode, readOnly]);

  // ── Détection Flood Fill + création polygone ──────────────
  const detectAndCreateRegion = async (canvas, img, imgX, imgY, pointer) => {
    // Crée un canvas temporaire pour lire les pixels de l'image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width  = img.width;
    tempCanvas.height = img.height;
    const ctx = tempCanvas.getContext('2d');

    // Dessine l'image originale
    const imgElement = img.getElement();
    ctx.drawImage(imgElement, 0, 0, img.width, img.height);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const mask      = floodFillMask(imageData, imgX, imgY, 35);
    const rawPoints = maskToPolygon(mask, img.width, img.height, 4);

    if (rawPoints.length < 3) {
      alert('Zone trop petite ou non détectable. Essayez ailleurs.');
      return;
    }

    // Convertit en coordonnées canvas
    const canvasPoints = rawPoints.map(p => ({
      x: p.x * img.scaleX + img.left,
      y: p.y * img.scaleY + img.top,
    }));

    const regionData = {
      _id: `new_${Date.now()}`,
      points: canvasPoints,
      fillColor: STATUS_COLORS.unknown,
      fillOpacity: 0.45,
      strokeColor: '#000000',
      strokeWidth: 1.5,
      strokeEnabled: true,
      info: { name: '', status: 'unknown' }
    };

    addRegionToCanvas(canvas, regionData, false);
    canvas.renderAll();

    onRegionCreate && onRegionCreate(regionData);
    setMode('select');
  };

  // ── Ajoute un polygone Fabric sur le canvas ───────────────
  const addRegionToCanvas = (canvas, region, isReadOnly) => {
    const flatPoints = region.points.flatMap(p => [p.x, p.y]);

    const poly = new fabric.Polygon(region.points, {
      fill:            hexToRgba(region.fillColor || '#3b82f6', region.fillOpacity ?? 0.45),
      stroke:          region.strokeEnabled !== false ? (region.strokeColor || '#000') : 'transparent',
      strokeWidth:     region.strokeWidth ?? 1.5,
      selectable:      !isReadOnly,
      hasControls:     !isReadOnly,
      hasBorders:      !isReadOnly,
      perPixelTargetFind: true,
      hoverCursor:     isReadOnly ? 'pointer' : 'move',
      // Métadonnées custom
      regionData:      { ...region },
    });

    // Clic sur une région existante
    poly.on('mousedown', () => {
      setActiveRegion(region);
      onRegionClick && onRegionClick(region);
    });

    // Mise à jour après déplacement/redimension
    if (!isReadOnly) {
      poly.on('modified', () => {
        const updatedPoints = poly.points.map((p, i) => ({
          x: p.x * poly.scaleX + poly.left,
          y: p.y * poly.scaleY + poly.top,
        }));
        onRegionUpdate && onRegionUpdate({ ...region, points: updatedPoints });
      });
    }

    canvas.add(poly);
    return poly;
  };

  // ── Mise à jour de la couleur d'une région active ─────────
  const updateActiveRegionColor = useCallback((color, opacity) => {
    const canvas = fabricRef.current;
    const active = canvas?.getActiveObject();
    if (!active || !active.regionData) return;
    active.set('fill', hexToRgba(color, opacity ?? 0.45));
    canvas.renderAll();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Indicateur de mode */}
      {!readOnly && (
        <div className="canvas-mode-bar">
          <button
            className={`mode-btn ${mode === 'select' ? 'active' : ''}`}
            onClick={() => setMode('select')}
            title="Sélectionner / déplacer"
          >🖱️ Sélectionner</button>
          <button
            className={`mode-btn ${mode === 'detect' ? 'active' : ''}`}
            onClick={() => setMode('detect')}
            title="Cliquer sur la carte pour détecter un pays"
          >🪄 Détecter</button>
        </div>
      )}

      {/* Spinner de détection */}
      {detecting && (
        <div className="detecting-overlay">
          <div className="detecting-spinner" />
          <span>Détection en cours…</span>
        </div>
      )}

      <canvas ref={canvasEl} />
    </div>
  );
});

// Convertit hex + opacité → rgba
function hexToRgba(hex, opacity = 0.5) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

export default MapCanvas;
