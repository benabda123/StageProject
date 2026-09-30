export default function FrontOffice() {
  return (
    <div className="min-h-screen bg-[#f9f9ff]">
      {/* Navbar simple */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#003366] text-white font-bold flex items-center justify-center text-lg">
              K
            </div>
            <div>
              <h1 className="font-bold text-[#111c2d] text-lg">Keystone</h1>
              <p className="text-xs text-gray-500">Employee Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Bienvenue, Employé</span>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#111c2d] mb-4">
            Bienvenue sur le portail employé
          </h2>
          <p className="text-gray-600 mb-6">
            Ceci est la page front office pour les employés. Vous pouvez ajouter plus de contenu ici.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-xl p-6">
              <span className="material-symbols-outlined text-4xl text-[#003366] mb-3">info</span>
              <h3 className="font-semibold text-[#111c2d] mb-2">Informations</h3>
              <p className="text-sm text-gray-600">Accédez aux informations de l'entreprise</p>
            </div>

            <div className="bg-green-50 rounded-xl p-6">
              <span className="material-symbols-outlined text-4xl text-green-600 mb-3">calendar_month</span>
              <h3 className="font-semibold text-[#111c2d] mb-2">Planning</h3>
              <p className="text-sm text-gray-600">Consultez votre planning de travail</p>
            </div>

            <div className="bg-purple-50 rounded-xl p-6">
              <span className="material-symbols-outlined text-4xl text-purple-600 mb-3">badge</span>
              <h3 className="font-semibold text-[#111c2d] mb-2">Profil</h3>
              <p className="text-sm text-gray-600">Gérez votre profil employé</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
