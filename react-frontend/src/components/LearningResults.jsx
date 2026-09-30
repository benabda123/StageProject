import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { searchLearning, getFavorites, addFavorite, removeFavorite } from '../services/learningService';

export default function LearningResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get('q') || '';

  const [searchInput, setSearchInput] = useState(queryParam);
  const [results, setResults] = useState([]);
  const [favoritesMap, setFavoritesMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (query) => {
    if (!query) return;
    try {
      setLoading(true);
      setError(null);

      const [searchData, favsData] = await Promise.all([
        searchLearning(query),
        getFavorites().catch(() => []),
      ]);

      setResults(Array.isArray(searchData) ? searchData : searchData.results || []);

      const map = {};
      if (Array.isArray(favsData)) {
        favsData.forEach((fav) => {
          map[fav.video_id || fav.videoId] = fav.id;
        });
      }
      setFavoritesMap(map);
    } catch (err) {
      console.error('Error fetching learning results:', err);
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message;
      if (status === 503 || msg.includes('YouTube API') || msg.includes('quota')) {
        setError('Le service YouTube est temporairement indisponible. Veuillez réessayer plus tard.');
      } else {
        setError('Une erreur est survenue lors de la recherche.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (queryParam) {
      setSearchInput(queryParam);
      fetchData(queryParam);
    }
  }, [queryParam, fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed });
    }
  };

  const handleToggleFavorite = async (video) => {
    const videoId = video.videoId || video.id?.videoId || video.id;
    const existingFavId = favoritesMap[videoId];

    try {
      if (existingFavId) {
        await removeFavorite(existingFavId);
        setFavoritesMap((prev) => {
          const next = { ...prev };
          delete next[videoId];
          return next;
        });
      } else {
        const payload = {
          videoId: video.videoId,
          title: video.title,
          thumbnail: video.thumbnail,
          url: video.url,
        };
        const created = await addFavorite(payload);
        setFavoritesMap((prev) => ({
          ...prev,
          [videoId]: created.id,
        }));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const getVideoData = (item) => {
    const videoId = item.videoId;
    const title = item.title || 'Sans titre';
    const channelTitle = item.channelTitle || '';
    const description = item.description || '';
    const thumbnail = item.thumbnail || '';
    const url = item.url || `https://www.youtube.com/watch?v=${videoId}`;
    return { videoId, title, channelTitle, description, thumbnail, url };
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Résultats de recherche</h2>
          {queryParam && (
            <p className="text-sm text-white/70 mt-1">
              Résultats pour : <span className="font-semibold text-violet-300">{queryParam}</span>
            </p>
          )}
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
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-2xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xl">search</span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher une formation..."
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

      {/* Back link */}
      <Link
        to="/learning"
        className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white font-medium transition-colors duration-200 mb-6"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Retour aux catégories
      </Link>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-white/40 animate-spin">hourglass_empty</span>
            </div>
            <p className="text-sm text-white/60 font-medium">Recherche en cours...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-red-300">error</span>
          </div>
          <p className="text-sm font-medium text-red-200">{error}</p>
          <button
            onClick={() => fetchData(queryParam)}
            className="mt-4 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && queryParam && results.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-white/40">search_off</span>
          </div>
          <p className="text-sm font-medium text-white/70">Aucun résultat trouvé pour cette recherche.</p>
          <Link
            to="/learning"
            className="mt-4 inline-block text-sm text-violet-300 font-semibold hover:underline"
          >
            Explorer les catégories
          </Link>
        </div>
      )}

      {/* Results Grid */}
      {!loading && !error && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((item, index) => {
            const video = getVideoData(item);
            const isFavorite = !!favoritesMap[video.videoId];

            return (
              <div
                key={video.videoId || index}
                className="glass-category overflow-hidden group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Heart button */}
                  <button
                    onClick={() => handleToggleFavorite(item)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all duration-150"
                    title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <span className={`material-symbols-outlined text-lg ${isFavorite ? 'text-red-500' : 'text-gray-400'}`} style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>
                      favorite
                    </span>
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h4 className="font-semibold text-sm text-white line-clamp-2 mb-1">{video.title}</h4>
                  {video.channelTitle && (
                    <p className="text-xs text-white/60 mb-2">{video.channelTitle}</p>
                  )}
                  <p className="text-xs text-white/50 line-clamp-2 mb-4">{video.description}</p>

                  <a
                    href={video.url}
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
