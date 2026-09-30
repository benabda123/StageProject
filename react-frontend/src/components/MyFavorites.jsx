import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFavorites, removeFavorite } from '../services/learningService';

export default function MyFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFavorites();
      setFavorites(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Impossible de charger vos favoris.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (fav) => {
    const favId = fav.id;
    const videoId = fav.video_id || fav.videoId;

    // Optimistic removal
    setFavorites((prev) => prev.filter((f) => f.id !== favId));

    try {
      await removeFavorite(favId);
    } catch (err) {
      console.error('Error removing favorite:', err);
      // Revert on error
      setFavorites((prev) => [...prev, fav]);
    }
  };

  const getVideoUrl = (fav) => {
    return fav.url || `https://www.youtube.com/watch?v=${fav.video_id || fav.videoId}`;
  };

  const getThumbnail = (fav) => {
    return fav.thumbnail || '';
  };

  const getTitle = (fav) => {
    return fav.title || 'Sans titre';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-white/40">hourglass_empty</span>
          </div>
          <p className="text-sm text-white/60 font-medium">Chargement des favoris...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-red-300">error</span>
        </div>
        <p className="text-sm font-medium text-red-200">{error}</p>
        <button
          onClick={fetchFavorites}
          className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Mes formations favorites</h2>
          <p className="text-sm text-white/70 mt-1">Retrouvez toutes les formations que vous avez sauvegardées</p>
        </div>
        <Link
          to="/learning"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-semibold hover:bg-[#001e40] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
        >
          <span className="material-symbols-outlined text-lg">explore</span>
          Explorer
        </Link>
      </div>

      {/* Empty state */}
      {favorites.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-white/40">favorite_border</span>
          </div>
          <p className="text-sm font-medium text-white/70 mb-4">
            Vous n'avez pas encore de formation favorite. Explorez les catégories pour en ajouter !
          </p>
          <Link
            to="/learning"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#003366] text-white rounded-xl text-sm font-semibold hover:bg-[#001e40] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            <span className="material-symbols-outlined text-lg">explore</span>
            Explorer les catégories
          </Link>
        </div>
      )}

      {/* Favorites Grid */}
      {favorites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => {
            const videoUrl = getVideoUrl(fav);
            const thumbnail = getThumbnail(fav);
            const title = getTitle(fav);

            return (
              <div
                key={fav.id}
                className="glass-category overflow-hidden group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={thumbnail}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Heart button (always filled) */}
                  <button
                    onClick={() => handleRemoveFavorite(fav)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all duration-150"
                    title="Retirer des favoris"
                  >
                    <span className="material-symbols-outlined text-lg text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                      favorite
                    </span>
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h4 className="font-semibold text-sm text-white line-clamp-2 mb-4">{title}</h4>

                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#003366] text-white rounded-lg text-xs font-semibold hover:bg-[#001e40] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-sm">play_circle</span>
                    Voir la formation
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
