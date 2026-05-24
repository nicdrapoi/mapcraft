// ============================================================
// routes/maps.js — CRUD cartes + liens partageables
// ============================================================
const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const Map      = require('../models/Map');
const Region   = require('../models/Region');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/maps/public — Liste des cartes publiques ────────
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '' } = req.query;
    const query = { isPublic: true };
    if (search) query.title = { $regex: search, $options: 'i' };

    const maps = await Map.find(query)
      .populate('owner', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-history');

    const total = await Map.countDocuments(query);
    res.json({ maps, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/maps/my — Cartes de l'utilisateur connecté ──────
router.get('/my', protect, async (req, res) => {
  try {
    const maps = await Map.find({ owner: req.user._id })
      .sort({ updatedAt: -1 })
      .select('-history');
    res.json({ maps });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/maps/share/:shareId — Accès par lien partageable
router.get('/share/:shareId', optionalAuth, async (req, res) => {
  try {
    const map = await Map.findOne({ shareId: req.params.shareId, isPublic: true })
      .populate('owner', 'username');
    if (!map) return res.status(404).json({ message: 'Carte introuvable ou non publique.' });

    // Incrémenter les vues
    map.viewCount += 1;
    await map.save();

    const regions = await Region.find({ map: map._id });
    res.json({ map, regions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/maps/:id — Détail d'une carte ───────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const map = await Map.findById(req.params.id).populate('owner', 'username');
    if (!map) return res.status(404).json({ message: 'Carte introuvable.' });

    // Carte privée : uniquement le propriétaire
    if (!map.isPublic) {
      if (!req.user || map.owner._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Accès refusé.' });
      }
    }

    const regions = await Region.find({ map: map._id });
    res.json({ map, regions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/maps — Créer une carte ─────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, imageUrl, imageWidth, imageHeight } = req.body;
    if (!title || !imageUrl) {
      return res.status(400).json({ message: 'Titre et image requis.' });
    }

    const map = await Map.create({
      owner: req.user._id,
      title,
      description,
      imageUrl,
      imageWidth:  imageWidth  || 1920,
      imageHeight: imageHeight || 1080,
    });

    res.status(201).json({ map });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/maps/:id — Mettre à jour une carte ──────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const map = await Map.findOne({ _id: req.params.id, owner: req.user._id });
    if (!map) return res.status(404).json({ message: 'Carte introuvable ou accès refusé.' });

    const { title, description, isPublic } = req.body;
    if (title !== undefined)       map.title       = title;
    if (description !== undefined) map.description = description;

    // Publication : génère un shareId si nécessaire
    if (isPublic !== undefined) {
      map.isPublic = isPublic;
      if (isPublic && !map.shareId) {
        map.shareId = uuidv4().split('-')[0]; // ID court (8 chars)
      }
    }

    await map.save();
    res.json({ map });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/maps/:id — Supprimer une carte ───────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const map = await Map.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!map) return res.status(404).json({ message: 'Carte introuvable ou accès refusé.' });

    // Supprimer toutes les régions associées
    await Region.deleteMany({ map: req.params.id });
    res.json({ message: 'Carte supprimée.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/maps/:id/history — Historique des modifications ─
router.get('/:id/history', protect, async (req, res) => {
  try {
    const map = await Map.findOne({ _id: req.params.id, owner: req.user._id })
      .populate('history.changedBy', 'username');
    if (!map) return res.status(404).json({ message: 'Carte introuvable.' });
    res.json({ history: map.history });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
