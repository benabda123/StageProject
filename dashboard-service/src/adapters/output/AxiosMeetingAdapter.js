const axios = require('axios');
const IMeetingServicePort = require('../../ports/IMeetingServicePort');

/**
 * Outbound Adapter — AxiosMeetingAdapter
 * Implémente IMeetingServicePort via des appels HTTP vers meeting-service.
 * Transmet le token JWT admin pour accéder à la route GET /meetings (admin only).
 */
class AxiosMeetingAdapter extends IMeetingServicePort {
  constructor() {
    super();
    this.baseUrl = process.env.MEETING_SERVICE_URL || 'http://meeting-service:8088';
    this.internalApiKey = process.env.INTERNAL_API_KEY || '';
  }

  /**
   * Récupère toutes les réunions depuis meeting-service (vue admin)
   * Transmet le token JWT de la requête entrante pour l'autorisation
   * En cas d'échec (service indisponible), retourne un tableau vide (resilience)
   * @param {string} authToken - Token JWT Bearer de la requête admin entrante
   * @returns {Promise<Array>}
   */
  async getAll(authToken) {
    try {
      const headers = {
        'x-internal-key': this.internalApiKey,
      };

      // Transmettre le token JWT admin pour passer le requireRole('admin') du meeting-service
      if (authToken) {
        headers['Authorization'] = authToken.startsWith('Bearer ')
          ? authToken
          : `Bearer ${authToken}`;
      }

      const response = await axios.get(`${this.baseUrl}/meetings`, {
        headers,
        timeout: 5000,
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(
        `[AxiosMeetingAdapter] Erreur lors de l'appel à meeting-service: ${error.message}`
      );
      // Resilience: retourne un tableau vide si le service est indisponible
      return [];
    }
  }
}

module.exports = AxiosMeetingAdapter;
