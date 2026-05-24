// ============================================================
// routes/regions.js — CRUD régions/pays sur une carte
// ============================================================
const express = require('express');
const Map     = require('../models/Map');
const Region  = require('../models/Region');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Vérifie que l'utilisateur est propriétaire de la carte
const checkMapOwner = async (req, res, next) => {
  const map = await Map.findOne({ _id: req.params.mapId, owner: req.user._id });
  if (!map) return res.status(403).json({ message: 'Accès refusé ou carte introuvable.' });
  req.map = map;
  next();
};

// ── POST /api/regions/:mapId — Créer une région ──────────────
router.post('/:mapId', protect, checkMapOwner, async (req, res) => {
  try {
    const { points, fillColor, fillOpacity, strokeColor, strokeWidth, strokeEnabled, info } = req.body;
    if (!points || points.length < 3) {
      return res.status(400).json({ message: 'Un polygone nécessite au moins 3 points.' });
    }

    const region = await Region.create({
      map: req.params.mapId,
      points,
      fillColor,
      fillOpacity,
      strokeColor,
      strokeWidth,
      strokeEnabled,
      info
    });

    // Enregistre l'action dans l'historique de la carte
    req.map.history.push({
      action:     'create_region',
      regionId:   region._id,
      regionName: info?.name || 'Sans nom',
      changedBy:  req.user._id,
      snapshot:   { points, fillColor, info }
    });
    await req.map.save();

    res.status(201).json({ region });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/regions/:mapId/:regionId — Mettre à jour ────────
router.put('/:mapId/:regionId', protect, checkMapOwner, async (req, res) => {
  try {
    const region = await Region.findOne({ _id: req.params.regionId, map: req.params.mapId });
    if (!region) return res.status(404).json({ message: 'Région introuvable.' });

    // Snapshot avant modification (pour l'historique)
    const snapshot = {
      points:       region.points,
      fillColor:    region.fillColor,
      strokeColor:  region.strokeColor,
      info:         region.info
    };

    // Mise à jour des champs fournis
    const allowed = ['points', 'fillColor', 'fillOpacity', 'strokeColor', 'strokeWidth', 'strokeEnabled', 'info', 'zIndex'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) region[field] = req.body[field];
    });
    await region.save();

    // Historique
    req.map.history.push({
      action:     'edit_region',
      regionId:   region._id,
      regionName: region.info?.name || 'Sans nom',
      changedBy:  req.user._id,
      snapshot
    });
    // Limiter l'historique aux 100 dernières entrées
    if (req.map.history.length > 100) req.map.history = req.map.history.slice(-100);
    await req.map.save();

    res.json({ region });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /api/regions/:mapId/:regionId — Supprimer ─────────
router.delete('/:mapId/:regionId', protect, checkMapOwner, async (req, res) => {
  try {
    const region = await Region.findOneAndDelete({ _id: req.params.regionId, map: req.params.mapId });
    if (!region) return res.status(404).json({ message: 'Région introuvable.' });

    req.map.history.push({
      action:     'delete_region',
      regionId:   region._id,
      regionName: region.info?.name || 'Sans nom',
      changedBy:  req.user._id,
      snapshot:   { points: region.points, info: region.info }
    });
    await req.map.save();

    res.json({ message: 'Région supprimée.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
