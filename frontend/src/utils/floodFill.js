// ============================================================
// src/utils/floodFill.js — Détection de zone par Flood Fill
// ============================================================

/**
 * Effectue un flood fill depuis un point (x,y) sur les données ImageData.
 * Retourne le masque binaire de la zone remplie (tableau Uint8Array).
 */
export function floodFillMask(imageData, startX, startY, tolerance = 30) {
  const { width, height, data } = imageData;
  const mask = new Uint8Array(width * height);

  const idx = (x, y) => (y * width + x) * 4;
  const startIdx = idx(startX, startY);
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];

  const colorMatch = (x, y) => {
    const i = idx(x, y);
    return (
      Math.abs(data[i]     - targetR) <= tolerance &&
      Math.abs(data[i + 1] - targetG) <= tolerance &&
      Math.abs(data[i + 2] - targetB) <= tolerance
    );
  };

  // BFS itératif (évite le stack overflow)
  const queue = [[startX, startY]];
  const visited = new Uint8Array(width * height);
  visited[startY * width + startX] = 1;

  while (queue.length > 0) {
    const [x, y] = queue.shift();
    mask[y * width + x] = 1;

    const neighbors = [[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const ni = ny * width + nx;
        if (!visited[ni] && colorMatch(nx, ny)) {
          visited[ni] = 1;
          queue.push([nx, ny]);
        }
      }
    }
  }

  return mask;
}

/**
 * Extrait le contour d'un masque binaire (algorithme de Moore neighborhood).
 * Retourne un tableau de points [{x, y}] formant le polygone.
 */
export function maskToPolygon(mask, width, height, simplifyFactor = 3) {
  // Trouve le premier pixel du masque
  let startX = -1, startY = -1;
  for (let y = 0; y < height && startX === -1; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x]) { startX = x; startY = y; break; }
    }
  }
  if (startX === -1) return [];

  // Marching squares simplifié : extraction du contour externe
  const contour = [];
  const visited = new Set();

  // Directions : droite, bas-droite, bas, bas-gauche, gauche, haut-gauche, haut, haut-droite
  const dx = [1, 1, 0,-1,-1,-1, 0, 1];
  const dy = [0, 1, 1, 1, 0,-1,-1,-1];

  let cx = startX, cy = startY, dir = 0;
  let maxSteps = width * height;
  let steps = 0;

  do {
    const key = `${cx},${cy}`;
    if (!visited.has(key)) {
      visited.add(key);
      contour.push({ x: cx, y: cy });
    }

    // Cherche le prochain pixel du contour dans le sens horaire
    let found = false;
    for (let i = 0; i < 8; i++) {
      const nd = (dir + i) % 8;
      const nx = cx + dx[nd];
      const ny = cy + dy[nd];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && mask[ny * width + nx]) {
        cx = nx; cy = ny; dir = (nd + 5) % 8;
        found = true;
        break;
      }
    }
    if (!found) break;
    steps++;
  } while ((cx !== startX || cy !== startY) && steps < maxSteps);

  // Simplification du polygone (Douglas-Peucker léger)
  return simplifyPolygon(contour, simplifyFactor);
}

/**
 * Simplifie un polygone en gardant 1 point sur N.
 */
function simplifyPolygon(points, factor) {
  if (factor <= 1 || points.length <= 10) return points;
  return points.filter((_, i) => i % factor === 0);
}

/**
 * Calcule le bounding box d'un ensemble de points.
 */
export function getBoundingBox(points) {
  if (!points.length) return null;
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  return {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys),
  };
}

/**
 * Centre d'un polygone (centroïde)
 */
export function getCentroid(points) {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  return { x: cx, y: cy };
}
