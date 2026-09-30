const axios = require('axios');
const IEmployeeServicePort = require('../../ports/IEmployeeServicePort');

/**
 * Outbound Adapter — AxiosEmployeeAdapter
 * Implémente IEmployeeServicePort via des appels HTTP vers employee-service.
 * Le domaine ne connaît que le port, jamais cet adaptateur.
 */
class AxiosEmployeeAdapter extends IEmployeeServicePort {
  constructor() {
    super();
    this.baseUrl = process.env.EMPLOYEE_SERVICE_URL || 'http://employee-service:8082';
    this.internalApiKey = process.env.INTERNAL_API_KEY || '';
  }

  /**
   * Récupère tous les employés depuis employee-service
   * En cas d'échec (service indisponible), retourne un tableau vide (resilience)
   * @returns {Promise<Array>}
   */
  async getAll() {
    try {
      const response = await axios.get(`${this.baseUrl}/employees`, {
        headers: {
          'x-internal-key': this.internalApiKey,
        },
        timeout: 5000,
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(
        `[AxiosEmployeeAdapter] Erreur lors de l'appel à employee-service: ${error.message}`
      );
      // Resilience: retourne un tableau vide si le service est indisponible
      return [];
    }
  }
}

module.exports = AxiosEmployeeAdapter;
