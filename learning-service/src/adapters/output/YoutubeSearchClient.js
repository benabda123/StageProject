// ============================================================
// Output Adapter — YoutubeSearchClient
// Adapter externe vers l'API YouTube Data v3
// ⚠️ SÉCURITÉ : La clé API YouTube n'est utilisée QUE côté serveur.
// Elle n'est JAMAIS exposée au frontend ni transmise dans les réponses.
// Tous les appels à googleapis.com se font ici, de façon opaque pour le client.
// ============================================================

const fetch = require('node-fetch');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

/**
 * Recherche des vidéos sur YouTube via l'API Data v3
 * @param {string} query - Terme de recherche
 * @param {number} maxResults - Nombre maximum de résultats (défaut 12)
 * @returns {Promise<Array>} Liste simplifiée de vidéos (jamais la clé API)
 */
async function searchVideos(query, maxResults = 12) {
  const url = `${YOUTUBE_SEARCH_URL}?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`YouTube API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();

  // Simplifie la réponse — ne renvoie QUE ce dont le frontend a besoin.
  // La clé API n'apparaît jamais dans cette réponse.
  return data.items.map(item => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    channelTitle: item.snippet.channelTitle,
  }));
}

module.exports = { searchVideos };
