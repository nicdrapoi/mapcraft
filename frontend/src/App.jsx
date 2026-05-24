// ============================================================
// src/App.jsx — Routeur principal
// ============================================================
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Dashboard  from './pages/Dashboard';
import MapEditor  from './pages/MapEditor';
import Explore    from './pages/Explore';
import SharedMap  from './pages/SharedMap';
import { LoginForm, RegisterForm } from './components/Auth/AuthForms';
import './styles/global.css';

// Protège les routes qui nécessitent une connexion
const PrivateRoute = ({ children }) => {
  const { isAuth, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return isAuth ? children : <Navigate to="/login" replace />;
};

// Redirige vers le dashboard si déjà connecté
const PublicOnlyRoute = ({ children }) => {
  const { isAuth, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return !isAuth ? children : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => (
  <Routes>
    {/* Accueil → explore ou dashboard */}
    <Route path="/" element={<Navigate to="/explore" replace />} />

    {/* Auth */}
    <Route path="/login"    element={<PublicOnlyRoute><div className="auth-page"><LoginForm /></div></PublicOnlyRoute>} />
    <Route path="/register" element={<PublicOnlyRoute><div className="auth-page"><RegisterForm /></div></PublicOnlyRoute>} />

    {/* Espace utilisateur */}
    <Route path="/dashboard"    element={<PrivateRoute><Dashboard /></PrivateRoute>} />
    <Route path="/editor/:id"   element={<PrivateRoute><MapEditor /></PrivateRoute>} />

    {/* Public */}
    <Route path="/explore"        element={<Explore />} />
    <Route path="/share/:shareId" element={<SharedMap />} />

    {/* 404 */}
    <Route path="*" element={<Navigate to="/explore" replace />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
