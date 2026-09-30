import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import VantaBackground from './components/VantaBackground';

function AuthShellLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0">
        <div className="aurora absolute inset-0" />
        <VantaBackground />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function PublicRoutes() {
  return (
    <BrowserRouter>
      <AuthShellLayout>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthShellLayout>
    </BrowserRouter>
  );
}

function AuthenticatedApp() {
  const { userRole } = useAuth();

  return (
    <BrowserRouter>
      <App userRole={userRole} />
    </BrowserRouter>
  );
}

function Root() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1428] text-white/60">
        Chargement...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PublicRoutes />;
  }

  return <AuthenticatedApp />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>,
);
