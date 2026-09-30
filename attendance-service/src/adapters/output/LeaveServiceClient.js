/**
 * Adapter Output — LeaveServiceClient
 * Appelle leave-service via la route interne /internal/leaves
 * pour vérifier si un employee est en congé approuvé aujourd'hui.
 *
 * Utilise x-internal-api-key (pas de JWT — appel inter-service sur le réseau Docker).
 * Resilience : en cas d'erreur réseau, on laisse passer le pointage (non bloquant).
 */
const fetch = require('node-fetch');

class LeaveServiceClient {
  constructor() {
    this.leaveServiceUrl = process.env.LEAVE_SERVICE_URL || 'http://leave-service:8086';
    this.internalApiKey = process.env.INTERNAL_API_KEY || '';
  }

  /**
   * Vérifie si l'employee a un congé approuvé couvrant la date d'aujourd'hui
   * @param {string} employeeId - Keycloak sub
   * @returns {Promise<boolean>} true si en congé approuvé aujourd'hui
   */
  async isOnLeaveToday(employeeId) {
    try {
      const url = `${this.leaveServiceUrl}/internal/leaves?status=accepte`;
      const response = await fetch(url, {
        headers: { 'x-internal-api-key': this.internalApiKey },
        timeout: 4000,
      });

      if (!response.ok) {
        console.warn(`[LeaveServiceClient] leave-service returned ${response.status}`);
        // Resilience : on ne bloque pas le pointage si le service est indisponible
        return false;
      }

      const leaves = await response.json();
      const today = new Date().toISOString().split('T')[0];

      // Chercher un congé approuvé de cet employee qui couvre aujourd'hui
      return leaves.some(leave => {
        if (leave.employeeId !== employeeId) return false;
        if (leave.status !== 'accepte') return false;

        const start = new Date(leave.startDate).toISOString().split('T')[0];
        const end = new Date(leave.endDate).toISOString().split('T')[0];

        return today >= start && today <= end;
      });
    } catch (err) {
      // Réseau indisponible — on laisse passer (ne pas bloquer le pointage)
      console.warn(`[LeaveServiceClient] Impossible de joindre leave-service: ${err.message}`);
      return false;
    }
  }
}

module.exports = LeaveServiceClient;
