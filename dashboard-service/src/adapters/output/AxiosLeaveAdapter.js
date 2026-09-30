const axios = require('axios');
const ILeaveServicePort = require('../../ports/ILeaveServicePort');

/**
 * Outbound Adapter — AxiosLeaveAdapter
 * Implémente ILeaveServicePort via des appels HTTP vers leave-service.
 * Transmet le token JWT admin pour accéder à la route GET / (admin only).
 */
class AxiosLeaveAdapter extends ILeaveServicePort {
  constructor() {
    super();
    this.baseUrl = process.env.LEAVE_SERVICE_URL || 'http://leave-service:8086';
    this.internalApiKey = process.env.INTERNAL_API_KEY || '';
  }

  /**
   * Récupère toutes les demandes de congé depuis leave-service (vue admin)
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

      // Transmettre le token JWT admin pour passer le requireRole('admin') du leave-service
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
        `[AxiosLeaveAdapter] Erreur lors de l'appel à leave-service: ${error.message}`
      );
      // Resilience: retourne un tableau vide si le service est indisponible
      return [];
    }
  }
}

module.exports = AxiosLeaveAdapter;
