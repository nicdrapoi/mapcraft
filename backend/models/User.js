// ============================================================
// models/User.js — Schéma utilisateur
// ============================================================
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Le nom d\'utilisateur est obligatoire'],
    unique: true,
    trim: true,
    minlength: [3, 'Minimum 3 caractères'],
    maxlength: [30, 'Maximum 30 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est obligatoire'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire'],
    minlength: [6, 'Minimum 6 caractères'],
    select: false  // Jamais retourné par défaut dans les requêtes
  },
  avatar: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// ── Hash du mot de passe avant sauvegarde ────────────────────
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Méthode de comparaison de mot de passe ───────────────────
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
