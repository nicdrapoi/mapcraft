// ============================================================
// routes/upload.js — Upload d'images (cartes + drapeaux)
// ============================================================
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── Configuration Multer ─────────────────────────────────────
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subdir = req.query.type === 'flag' ? 'flags' : 'maps';
    const dir = path.join(uploadDir, subdir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Format non supporté. Utilisez PNG, JPG, SVG ou WebP.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 }
});

// ── POST /api/upload — Upload d'une image ────────────────────
router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Aucun fichier reçu.' });

  const subdir  = req.query.type === 'flag' ? 'flags' : 'maps';
  const fileUrl = `/uploads/${subdir}/${req.file.filename}`;

  res.json({
    url:      fileUrl,
    filename: req.file.filename,
    size:     req.file.size,
    mimetype: req.file.mimetype
  });
});

// Gestion des erreurs Multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: `Fichier trop volumineux (max ${process.env.MAX_FILE_SIZE_MB || 10} Mo).` });
    }
  }
  res.status(400).json({ message: err.message });
});

module.exports = router;
