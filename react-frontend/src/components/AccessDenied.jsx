import { Link } from 'react-router-dom';

export default function AccessDenied({ userRole }) {
  const defaultPaths = {
    admin: '/employees',
    manager: '/tasks',
    hr: '/employees',
    itsupport: '/tickets',
    employee: '/',
  };

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl text-red-400">lock</span>
        </div>
        <h2 className="text-2xl font-bold text-[#001e40] tracking-tight mb-2">Accès refusé</h2>
        <p className="text-sm text-gray-500 mb-6">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <Link
          to={defaultPaths[userRole] || '/'}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-semibold hover:bg-[#001e40] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
        >
          <span className="material-symbols-outlined text-lg">home</span>
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
