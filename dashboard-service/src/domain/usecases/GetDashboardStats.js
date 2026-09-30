const GetEmployeeStats = require('./GetEmployeeStats');
const GetLeaveStats = require('./GetLeaveStats');
const GetMeetingStats = require('./GetMeetingStats');

/**
 * Use Case — GetDashboardStats
 * Use case principal qui orchestre les 3 use cases de statistiques.
 * Retourne une vue complète et agrégée pour le dashboard admin.
 * Exécute les 3 appels en parallèle (Promise.all) pour minimiser la latence.
 */
class GetDashboardStats {
  constructor(employeeServicePort, leaveServicePort, meetingServicePort) {
    this.getEmployeeStats = new GetEmployeeStats(employeeServicePort);
    this.getLeaveStats = new GetLeaveStats(leaveServicePort);
    this.getMeetingStats = new GetMeetingStats(meetingServicePort);
  }

  /**
   * Exécute l'agrégation complète des statistiques du dashboard
   * Les 3 use cases sont exécutés en parallèle pour de meilleures performances
   * @param {string} authToken - Token JWT admin pour les appels aux services protégés
   * @returns {Promise<Object>} Vue complète structurée pour le dashboard
   */
  async execute(authToken) {
    // Exécution parallèle des 3 use cases pour minimiser la latence totale
    const [employeeStats, leaveStats, meetingStats] = await Promise.all([
      this.getEmployeeStats.execute(authToken),
      this.getLeaveStats.execute(authToken),
      this.getMeetingStats.execute(authToken),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      employees: employeeStats,
      leaves: leaveStats,
      meetings: meetingStats,
    };
  }
}

module.exports = GetDashboardStats;
