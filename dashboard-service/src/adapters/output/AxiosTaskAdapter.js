const axios = require('axios');
const ITaskServicePort = require('../../ports/ITaskServicePort');

/**
 * Outbound Adapter — AxiosTaskAdapter
 * Implémente ITaskServicePort via des appels HTTP vers task-service.
 * Transmet le token JWT admin pour accéder à la route GET / (admin only).
 */
class AxiosTaskAdapter extends ITaskServicePort {
  constructor() {
    super();
    this.baseUrl = process.env.TASK_SERVICE_URL || 'http://task-service:8087';
    this.internalApiKey = process.env.INTERNAL_API_KEY || '';
  }

  /**
   * Récupère toutes les tâches depuis task-service (vue admin)
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

      // Transmettre le token JWT admin pour passer le requireRole('admin') du task-service
      if (authToken) {
        headers['Authorization'] = authToken.startsWith('Bearer ')
          ? authToken
          : `Bearer ${authToken}`;
      }

      const response = await axios.get(`${this.baseUrl}/`, {
        headers,
        timeout: 5000,
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(
        `[AxiosTaskAdapter] Erreur lors de l'appel à task-service: ${error.message}`
      );
      // Resilience: retourne un tableau vide si le service est indisponible
      return [];
    }
  }
}

module.exports = AxiosTaskAdapter;
