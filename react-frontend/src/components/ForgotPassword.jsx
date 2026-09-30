import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/passwordResetService';
import AuthShell from './AuthShell';
import ResetPassword from './ResetPassword';

const getInputStyle = () => {
  return "w-full py-2.5 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg outline-none text-sm font-normal transition shadow-sm px-4 focus:ring-2 focus:ring-purple-600 focus:border-purple-600";
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'confirm' | 'reset'
  const [accountName, setAccountName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Étape 1 : vérifier que l'email correspond à un compte existant
  const handleCheck = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      setError('Veuillez saisir un email valide');
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword(email.trim(), false);
      if (res.found) {
        setAccountName(res.firstName || '');
        setStep('confirm');
      } else {
        setError('Aucun utilisateur avec cet email. Vérifiez votre saisie.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : l'utilisateur confirme que le compte lui appartient -> envoyer le code
  const handleConfirm = async () => {
    setError(null);
    try {
      setLoading(true);
      await forgotPassword(email.trim(), true);
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'reset') {
    return <ResetPassword initialEmail={email} />;
  }

  if (step === 'confirm') {
    return (
      <AuthShell
        title="Keystone"
        subtitle="Vérification du compte"
        footer={
          <Link to="/" className="text-violet-300 hover:text-white font-medium">
            Retour à la connexion
          </Link>
        }
      >
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-white/10 text-violet-300 ring-1 ring-white/20 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>verified_user</span>
          </div>
          <p className="text-white font-semibold mb-1">Ce compte existe.</p>
          {accountName && <p className="text-sm text-white/70 mb-1">{accountName}</p>}
          <p className="text-sm text-white/60 mb-1">{email}</p>
          <p className="text-sm text-white/60 mb-6">
            Confirmez-vous qu'il s'agit de votre compte pour recevoir le code de réinitialisation ?
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-400/30 text-red-300 text-sm rounded-lg text-left">
              {error}
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-blue-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-300 hover:brightness-110 hover:shadow-[0_10px_30px_rgba(124,58,237,0.45)] active:scale-[0.98]"
          >
            {loading ? "Envoi du code..." : "Oui, c'est mon compte — envoyer le code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep('email');
            }}
            className="w-full py-2 text-sm text-white/60 hover:text-white font-medium"
          >
            Non, revenir
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Keystone"
      subtitle="Réinitialisation du mot de passe"
      footer={
        <Link to="/" className="text-violet-300 hover:text-white font-medium">
          Retour à la connexion
        </Link>
      }
    >
      <form onSubmit={handleCheck} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Adresse email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder="vous@entreprise.com"
            className={getInputStyle()}
          />
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-400/30 text-red-300 text-sm rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-violet-600 to-blue-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all duration-300 hover:brightness-110 hover:shadow-[0_10px_30px_rgba(124,58,237,0.45)] active:scale-[0.98]"
        >
          {loading ? 'Vérification...' : "Vérifier l'email"}
        </button>
      </form>
    </AuthShell>
  );
}
