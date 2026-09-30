import { Link } from 'react-router-dom';
import keycloak from '../keycloak';

export default function LoginGate() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/5 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        {/* Logo */}
        <div className="mb-9 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-blue-600 text-lg font-bold text-white shadow-[0_0_24px_rgba(124,58,237,0.6)] ring-1 ring-white/20">
            K
          </div>
        </div>

        {/* Se connecter */}
        <button
          onClick={() => keycloak.login()}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-semibold text-white transition-all duration-300 hover:brightness-110 hover:shadow-[0_10px_30px_rgba(124,58,237,0.45)] active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-base transition-transform duration-300 group-hover:translate-x-1">
            login
          </span>
          Se connecter
        </button>

        {/* Mot de passe oublié */}
        <div className="mt-7 text-center">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-violet-200/80 transition-colors hover:text-white"
          >
            Mot de passe oublié ?
          </Link>
        </div>
      </div>
    </div>
  );
}
