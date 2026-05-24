// ============================================================
// server.js — Point d'entrée principal du backend MapCraft
// ============================================================
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes    = require('./routes/auth');
const mapRoutes     = require('./routes/maps');
const regionRoutes  = require('./routes/regions');
const uploadRoutes  = require('./routes/upload');

const app = express();

// ── Middlewares globaux ──────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Dossier de fichiers statiques (images uploadées)
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// ── Routes API ───────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/maps',    mapRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/upload',  uploadRoutes);

// ── Route de santé ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Connexion MongoDB + démarrage ────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mapcraft';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connecté');
    app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Erreur MongoDB :', err.message);
    process.exit(1);
  });

module.exports = app;
