// ============================================================
// models/Region.js — Schéma d'une région/pays sur une carte
// ============================================================
const mongoose = require('mongoose');

const RegionSchema = new mongoose.Schema({
  // ── Carte parente ───────────────────────────────────────────
  map: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Map',
    required: true
  },

  // ── Géométrie (polygone) ────────────────────────────────────
  // Tableau de points [{x, y}, ...] en coordonnées canvas
  points: [{
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  }],

  // ── Apparence ───────────────────────────────────────────────
  fillColor:    { type: String, default: '#3B82F6' },   // Couleur de remplissage
  fillOpacity:  { type: Number, default: 0.5, min: 0, max: 1 },
  strokeColor:  { type: String, default: '#000000' },   // Couleur de bordure
  strokeWidth:  { type: Number, default: 2 },
  strokeEnabled:{ type: Boolean, default: true },

  // ── Informations sur le pays/région ─────────────────────────
  info: {
    name:        { type: String, default: 'Sans nom' },
    capital:     { type: String, default: '' },
    population:  { type: String, default: '' },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['ally', 'enemy', 'neutral', 'vassal', 'contested', 'unknown'],
      default: 'unknown'
    },
    politicalColor: { type: String, default: '' },  // Ex : 'monarchie', 'démocratie'
    flagUrl:     { type: String, default: null }     // URL du drapeau uploadé
  },

  // ── Ordre d'affichage ────────────────────────────────────────
  zIndex: { type: Number, default: 0 }

}, { timestamps: true });

RegionSchema.index({ map: 1 });

module.exports = mongoose.model('Region', RegionSchema);
