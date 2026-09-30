import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const CATEGORIES = [
  { name: 'Cloud', icon: 'cloud', color: 'bg-blue-500/15 text-blue-300' },
  { name: 'Cyber Security', icon: 'security', color: 'bg-red-500/15 text-red-300' },
  { name: 'React', icon: 'code', color: 'bg-cyan-500/15 text-cyan-300' },
  { name: 'Docker', icon: 'dns', color: 'bg-indigo-500/15 text-indigo-300' },
  { name: 'Node.js', icon: 'hub', color: 'bg-green-500/15 text-green-300' },
  { name: 'AI', icon: 'smart_toy', color: 'bg-purple-500/15 text-purple-300' },
  { name: 'DevOps', icon: 'settings_suggest', color: 'bg-orange-500/15 text-orange-300' },
  { name: 'Flutter', icon: 'phone_android', color: 'bg-sky-500/15 text-sky-300' },
  { name: 'Linux', icon: 'terminal', color: 'bg-white/10 text-gray-200' },
];

export default function LearningHome() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/learning/results?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/learning/results?q=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Centre de formation</h2>
          <p className="text-sm text-white/70 mt-1">Explorez des tutoriels et formations pour développer vos compétences</p>
        </div>
        <Link
          to="/learning/favorites"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-semibold hover:bg-[#001e40] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
        >
          <span className="material-symbols-outlined text-lg">favorite</span>
          Mes formations
        </Link>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-10">
        <div className="relative max-w-2xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xl">search</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une formation... (ex: Docker, React, Cyber Security)"
            className="glass-input w-full pl-12 pr-32 py-4 rounded-xl text-sm shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 bg-[#003366] text-white rounded-lg text-sm font-semibold hover:bg-[#001e40] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Rechercher
          </button>
        </div>
      </form>

      {/* Categories Grid */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Catégories populaires</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((category) => (
            <button
              key={category.name}
              onClick={() => handleCategoryClick(category.name)}
              className="glass-category p-6 flex items-center gap-4 group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${category.color} transition-transform duration-200 group-hover:scale-110`}>
                <span className="material-symbols-outlined text-2xl">{category.icon}</span>
              </div>
              <span className="font-semibold text-sm text-white">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
