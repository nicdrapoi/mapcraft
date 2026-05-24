// ============================================================
// src/components/Auth/AuthForms.jsx — Connexion + Inscription
// ============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export const LoginForm = () => {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-logo">🗺️</div>
      <h1 className="auth-title">MapCraft</h1>
      <p className="auth-subtitle">Bienvenue ! Connectez-vous pour continuer</p>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="auth-error">{error}</div>}
        <div className="field-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="votre@email.fr" />
        </div>
        <div className="field-group">
          <label>Mot de passe</label>
          <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required placeholder="••••••••" />
        </div>
        <button type="submit" className="btn-primary full-width" disabled={loading}>
          {loading ? 'Connexion…' : '🔐 Se connecter'}
        </button>
        <p className="auth-switch">
          Pas encore de compte ? <a href="/register">Créer un compte</a>
        </p>
      </form>
    </div>
  );
};

export const RegisterForm = () => {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]       = useState({ username: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur d\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-logo">🗺️</div>
      <h1 className="auth-title">MapCraft</h1>
      <p className="auth-subtitle">Créez votre compte cartographe</p>
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="auth-error">{error}</div>}
        <div className="field-group">
          <label>Nom d'utilisateur</label>
          <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required placeholder="CartographeXXI" minLength={3} />
        </div>
        <div className="field-group">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="votre@email.fr" />
        </div>
        <div className="field-group">
          <label>Mot de passe</label>
          <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required placeholder="Minimum 6 caractères" minLength={6} />
        </div>
        <button type="submit" className="btn-primary full-width" disabled={loading}>
          {loading ? 'Création…' : '🚀 Créer mon compte'}
        </button>
        <p className="auth-switch">
          Déjà un compte ? <a href="/login">Se connecter</a>
        </p>
      </form>
    </div>
  );
};
