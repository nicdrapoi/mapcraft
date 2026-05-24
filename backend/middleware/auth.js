// ============================================================
// middleware/auth.js — Vérification du token JWT
// ============================================================
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Middleware obligatoire : l'utilisateur DOIT être connecté
const protect = async (req, res, next) => {
  let token;

  // Récupère le token depuis le header Authorization: Bearer <token>
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Accès refusé. Veuillez vous connecter.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
};

// Middleware optionnel : on récupère l'utilisateur si connecté, mais on ne bloque pas
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (_) { /* token invalide, on continue sans utilisateur */ }
  }
  next();
};

module.exports = { protect, optionalAuth };
