// ============================================================
// Use Case — SearchTrainings
// Recherche des vidéos de formation via YouTube Data API v3
// L'appel YouTube se fait exclusivement côté serveur (jamais exposé au frontend)
// ============================================================

const { searchVideos } = require('../../adapters/output/YoutubeSearchClient');

class SearchTrainings {
  /**
   * @param {string} query - Terme de recherche (ex: "Docker", "AWS Cloud")
   * @param {number} maxResults - Nombre max de résultats (défaut 12)
   * @returns {Promise<Array>} Liste simplifiée de vidéos
   */
  async execute(query, maxResults = 12) {
    if (!query || !query.trim()) {
      throw new Error('Search query is required');
    }

    // Vérification précoce de la clé API pour un message d'erreur clair
    if (!process.env.YOUTUBE_API_KEY) {
      throw new Error(
        'YouTube API key not configured. Please set YOUTUBE_API_KEY in your .env file ' +
        '(obtain it from Google Cloud Console → YouTube Data API v3).'
      );
    }

    // On enrichit le terme de recherche pour cibler les contenus pédagogiques
    const enrichedQuery = `${query.trim()} course tutorial`;

    try {
      const results = await searchVideos(enrichedQuery, maxResults);
      return results;
    } catch (err) {
      // Quota dépassé, clé invalide, erreur réseau...
      if (err.message && err.message.includes('403')) {
        throw new Error(
          'YouTube API quota exceeded or API key is invalid. ' +
          'Please check your YOUTUBE_API_KEY and your daily quota on Google Cloud Console.'
        );
      }
      throw new Error(`YouTube search failed: ${err.message}`);
    }
  }
}

module.exports = SearchTrainings;
