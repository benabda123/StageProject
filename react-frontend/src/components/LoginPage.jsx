import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Veuillez saisir votre identifiant et mot de passe.');
      return;
    }

    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/5 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#003366] to-[#1e5aa8] text-xl font-bold text-white shadow-lg ring-1 ring-white/20">
            K
          </div>
          <h1 className="mt-4 text-xl font-bold text-white">Keystone</h1>
          <p className="mt-1 text-sm text-white/60">Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-white/80">
              Identifiant
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/40"
              placeholder="Nom d'utilisateur"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white/80">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none transition focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/40"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#003366] to-[#1e5aa8] py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                Connexion...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">login</span>
                Se connecter
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            Mot de passe oublié ?
          </Link>
        </div>
      </div>
    </div>
  );
}
