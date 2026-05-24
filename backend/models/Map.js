// ============================================================
// models/Map.js — Schéma d'une carte personnalisée
// ============================================================
const mongoose = require('mongoose');

const MapSchema = new mongoose.Schema({
  // ── Propriétaire ────────────────────────────────────────────
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ── Métadonnées de la carte ──────────────────────────────────
  title: {
    type: String,
    required: [true, 'Le titre est obligatoire'],
    trim: true,
    maxlength: [100, 'Maximum 100 caractères']
  },
  description: { type: String, maxlength: 500 },

  // ── Image de fond ───────────────────────────────────────────
  imageUrl: { type: String, required: true },    // Chemin du fichier uploadé
  imageWidth:  { type: Number, required: true },
  imageHeight: { type: Number, required: true },

  // ── Publication ─────────────────────────────────────────────
  isPublic: { type: Boolean, default: false },
  shareId: { type: String, sparse: true },

  // ── Historique des modifications ────────────────────────────
  history: [{
    action:    { type: String },  // 'create_region', 'edit_region', 'delete_region', etc.
    regionId:  { type: mongoose.Schema.Types.ObjectId },
    regionName:{ type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    snapshot:  { type: mongoose.Schema.Types.Mixed }, // Copie de l'état avant modification
    createdAt: { type: Date, default: Date.now }
  }],

  // ── Statistiques ────────────────────────────────────────────
  viewCount: { type: Number, default: 0 }

}, { timestamps: true });

// Index pour les cartes publiques (listing rapide)
MapSchema.index({ isPublic: 1, createdAt: -1 });
MapSchema.index({ shareId: 1 });
MapSchema.index({ owner: 1 });

module.exports = mongoose.model('Map', MapSchema);
