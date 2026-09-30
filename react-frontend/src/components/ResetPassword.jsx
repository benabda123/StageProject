import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../services/passwordResetService';
import AuthShell from './AuthShell';

const getInputStyle = () => {
  return "w-full py-2.5 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm px-4 focus:ring-2 focus:ring-purple-600 focus:border-purple-600";
};

export default function ResetPassword({ initialEmail = '' }) {
  const [form, setForm] = useState({
    email: initialEmail,
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email.trim())) {
      setError('Veuillez saisir un email valide');
      return;
    }
    if (!/^\d{6}$/.test(form.code)) {
      setError('Le code doit contenir exactement 6 chiffres');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setLoading(true);
      await resetPassword({
        email: form.email.trim(),
        code: form.code,
        newPassword: form.newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setInfo(null);
    try {
      await forgotPassword(form.email.trim(), true);
      setInfo('Un nouveau code vous a été envoyé par email.');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Une erreur est survenue');
    }
  };

  if (success) {
    return (
      <AuthShell title="Keystone" subtitle="Réinitialisation du mot de passe">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>check_circle</span>
          </div>
          <p className="text-white font-medium mb-2">Mot de passe réinitialisé avec succès !</p>
          <p className="text-sm text-white/60 mb-6">
            Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </p>
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#003366] to-[#1e5aa8] text-white font-semibold rounded-xl transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>login</span>
            Se connecter
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Keystone"
      subtitle="Saisissez le code reçu par email"
      footer={
        <Link to="/forgot-password" className="text-violet-300 hover:text-white font-medium">
          Changer d'email
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Adresse email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="vous@entreprise.com"
            className={getInputStyle()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Code à 6 chiffres</label>
          <input
            type="text"
            name="code"
            value={form.code}
            onChange={handleChange}
            maxLength={6}
            inputMode="numeric"
            placeholder="000000"
            className={`${getInputStyle()} text-center tracking-[0.5em] font-semibold`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Nouveau mot de passe</label>
          <input
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            placeholder="Au moins 6 caractères"
            className={getInputStyle()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Confirmer le mot de passe</label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Confirmez le nouveau mot de passe"
            className={getInputStyle()}
          />
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-400/30 text-red-300 text-sm rounded-lg">
            {error}
          </div>
        )}
        {info && (
          <div className="px-4 py-3 bg-violet-500/10 border border-violet-400/30 text-violet-300 text-sm rounded-lg">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-violet-600 to-blue-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-300 hover:brightness-110 hover:shadow-[0_10px_30px_rgba(124,58,237,0.45)] active:scale-[0.98]"
        >
          {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
        </button>

        <button
          type="button"
          onClick={handleResend}
          className="w-full py-2 text-sm text-violet-300 hover:text-white font-medium"
        >
          Renvoyer le code
        </button>
      </form>
    </AuthShell>
  );
}
