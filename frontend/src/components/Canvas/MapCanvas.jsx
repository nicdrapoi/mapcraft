// MapCanvas.jsx — Éditeur de carte (Fabric.js + Flood Fill)
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { fabric } from 'fabric';
import { floodFillMask, maskToPolygon } from '../../utils/floodFill';

const MapCanvas = forwardRef(({
  imageUrl, regions = [], readOnly = false,
  onRegionClick, onRegionCreate, onRegionUpdate,
}, ref) => {
  const canvasEl  = useRef(null);
  const fabricRef = useRef(null);
  const imgRef    = useRef(null);
  const imgDataRef = useRef(null); // Stocke les données pixel localement
  const [mode, setMode]           = useState('select');
  const [detecting, setDetecting] = useState(false);

  useImperativeHandle(ref, () => ({
    setMode: (m) => setMode(m),
    getMode: () => mode,
    exportPNG: () => fabricRef.current?.toDataURL({ format: 'png', multiplier: 2 }),
    exportSVG: () => fabricRef.current?.toSVG(),
    deselectAll: () => { fabricRef.current?.discardActiveObject(); fabricRef.current?.renderAll(); },
  }));

  // ── Init canvas ───────────────────────────────────────────
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight - 56;

    canvasEl.current.width  = w;
    canvasEl.current.height = h;
    canvasEl.current.style.width  = w + 'px';
    canvasEl.current.style.height = h + 'px';

    const canvas = new fabric.Canvas(canvasEl.current, {
      selection: !readOnly,
      preserveObjectStacking: true,
      width: w, height: h,
    });
    fabricRef.current = canvas;

    // Zoom molette
    canvas.on('mouse:wheel', (opt) => {
      let zoom = canvas.getZoom() * (0.999 ** opt.e.deltaY);
      zoom = Math.min(Math.max(zoom, 0.1), 10);
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Chargement image avec CORS
    if (imageUrl) {
      const htmlImg = new Image();
      htmlImg.crossOrigin = 'anonymous';
      htmlImg.onload = () => {
        // Stocke les pixels AVANT que Fabric ne touche à l'image
        const tmpC = document.createElement('canvas');
        tmpC.width  = htmlImg.naturalWidth;
        tmpC.height = htmlImg.naturalHeight;
        const tmpCtx = tmpC.getContext('2d');
        tmpCtx.drawImage(htmlImg, 0, 0);
        try {
          imgDataRef.current = tmpCtx.getImageData(0, 0, tmpC.width, tmpC.height);
        } catch(e) {
          console.warn('Impossible de lire les pixels (CORS):', e);
        }

        const fImg = new fabric.Image(htmlImg, {
          selectable: false, evented: false,
        });
        imgRef.current = fImg;
        const ratio = Math.min(w / htmlImg.naturalWidth, h / htmlImg.naturalHeight);
        fImg.scale(ratio);
        fImg.set({
          left: (w - fImg.getScaledWidth())  / 2,
          top:  (h - fImg.getScaledHeight()) / 2,
        });
        canvas.add(fImg);
        canvas.sendToBack(fImg);
        canvas.renderAll();
      };
      htmlImg.onerror = () => console.error('Erreur chargement image');
      htmlImg.src = imageUrl;
    }

    const resize = () => {
      canvas.setWidth(window.innerWidth);
      canvas.setHeight(window.innerHeight - 56);
      canvas.renderAll();
    };
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); canvas.dispose(); };
  }, [imageUrl, readOnly]);

  // ── Rendu régions ─────────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.getObjects().forEach(obj => { if (obj.regionData) canvas.remove(obj); });
    regions.forEach(r => addRegionToCanvas(canvas, r, readOnly));
    canvas.renderAll();
  }, [regions, readOnly]);

  // ── Clic détection ────────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const handleClick = async (e) => {
      if (mode !== 'detect' || readOnly) return;
      const pointer = canvas.getPointer(e.e);
      const img = imgRef.current;
      if (!img) return;
      const vpt = canvas.viewportTransform;
      const imgX = Math.round((pointer.x - img.left) / img.scaleX);
      const imgY = Math.round((pointer.y - img.top)  / img.scaleY);
      if (imgX < 0 || imgY < 0 || imgX >= img.width || imgY >= img.height) return;
      setDetecting(true);
      try { await detect(canvas, img, imgX, imgY); }
      catch(err) { alert('Erreur : ' + err.message); }
      finally { setDetecting(false); }
    };
    canvas.on('mouse:down', handleClick);
    return () => canvas.off('mouse:down', handleClick);
  }, [mode, readOnly]);

  // ── Flood Fill ────────────────────────────────────────────
  const detect = async (canvas, img, imgX, imgY) => {
    const imageData = imgDataRef.current;
    if (!imageData) {
      alert('Impossible de lire les pixels de la carte. Vérifiez que l\'image est accessible.');
      return;
    }
    const mask      = floodFillMask(imageData, imgX, imgY, 35);
    const rawPoints = maskToPolygon(mask, imageData.width, imageData.height, 4);
    if (rawPoints.length < 3) { alert('Zone trop petite. Essayez ailleurs.'); return; }

    const canvasPoints = rawPoints.map(p => ({
      x: p.x * img.scaleX + img.left,
      y: p.y * img.scaleY + img.top,
    }));

    const regionData = {
      _id: `new_${Date.now()}`,
      points: canvasPoints,
      fillColor: '#3b82f6', fillOpacity: 0.45,
      strokeColor: '#000000', strokeWidth: 1.5, strokeEnabled: true,
      info: { name: '', status: 'unknown' }
    };
    addRegionToCanvas(canvas, regionData, false);
    canvas.renderAll();
    onRegionCreate && onRegionCreate(regionData);
    setMode('select');
  };

  // ── Ajoute polygone ───────────────────────────────────────
  const addRegionToCanvas = (canvas, region, isReadOnly) => {
    const poly = new fabric.Polygon(region.points, {
      fill:    hexToRgba(region.fillColor || '#3b82f6', region.fillOpacity ?? 0.45),
      stroke:  region.strokeEnabled !== false ? (region.strokeColor || '#000') : 'transparent',
      strokeWidth: region.strokeWidth ?? 1.5,
      selectable: !isReadOnly, hasControls: !isReadOnly, hasBorders: !isReadOnly,
      perPixelTargetFind: true,
      hoverCursor: isReadOnly ? 'pointer' : 'move',
      regionData: { ...region },
    });
    poly.on('mousedown', () => { onRegionClick && onRegionClick(region); });
    if (!isReadOnly) {
      poly.on('modified', () => {
        const pts = poly.points.map(p => ({ x: p.x * poly.scaleX + poly.left, y: p.y * poly.scaleY + poly.top }));
        onRegionUpdate && onRegionUpdate({ ...region, points: pts });
      });
    }
    canvas.add(poly);
    return poly;
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: 'calc(100vh - 56px)' }}>
      {!readOnly && (
        <div className="canvas-mode-bar">
          <button className={`mode-btn ${mode === 'select' ? 'active' : ''}`} onClick={() => setMode('select')}>🖱️ Sélectionner</button>
          <button className={`mode-btn ${mode === 'detect' ? 'active' : ''}`} onClick={() => setMode('detect')}>🪄 Détecter</button>
        </div>
      )}
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

function hexToRgba(hex, opacity = 0.5) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

export default MapCanvas;