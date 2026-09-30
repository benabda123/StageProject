/**
 * Use Case — GetMeetingStats
 * Calcule les statistiques sur les réunions (pur métier, pas de dépendance framework).
 * Responsabilité unique: agréger les réunions en statistiques structurées pour graphiques.
 */
class GetMeetingStats {
  constructor(meetingServicePort) {
    this.meetingServicePort = meetingServicePort;
  }

  /**
   * Exécute le calcul des statistiques réunions
   * @param {string} authToken - Token JWT admin requis pour l'appel au meeting-service
   * @returns {Promise<Object>} Statistiques structurées pour graphiques
   */
  async execute(authToken) {
    // Récupérer les données brutes depuis le service externe
    const meetings = await this.meetingServicePort.getAll(authToken);

    // Calculer le total
    const total = meetings.length;

    // Calculer la répartition par statut (pending, approved, rejected, cancelled, etc.)
    const byStatus = this._groupByField(meetings, 'status');

    // Calculer la répartition par type (ONLINE, PRESENTIEL)
    const byType = this._groupByField(meetings, 'type');

    // Calculer la répartition par mois (12 derniers mois)
    const byMonth = this._groupByMonth(meetings);

    return {
      total,
      byStatus: this._formatForChart(byStatus),
      byType: this._formatForChart(byType),
      byMonth,
    };
  }

  /**
   * Groupe les éléments par un champ spécifique et compte les occurrences
   * @private
   * @param {Array} items - Liste d'objets à grouper
   * @param {string} field - Nom du champ à utiliser pour le groupement
   * @returns {Object} Objet clé-valeur avec compteurs
   */
  _groupByField(items, field) {
    return items.reduce((acc, item) => {
      const key = item[field] || 'Non défini';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Formate un objet de compteurs en tableau pour graphiques
   * @private
   * @param {Object} grouped - Objet avec compteurs { key: count }
   * @returns {Array<Object>} Tableau formaté [{ label, count }]
   */
  _formatForChart(grouped) {
    return Object.entries(grouped).map(([label, count]) => ({
      label: String(label),
      count,
    }));
  }

  /**
   * Groupe les réunions par mois (12 derniers mois) basé sur date
   * Retourne un tableau de 12 mois avec compteurs (Area chart, Line chart)
   * @private
   * @param {Array} meetings - Liste des réunions
   * @returns {Array<Object>} Tableau [{ month: "2024-01", count }]
   */
  _groupByMonth(meetings) {
    const now = new Date();
    const monthsMap = {};

    // Initialiser les 12 derniers mois avec count = 0
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = this._formatMonthKey(date);
      monthsMap[monthKey] = 0;
    }

    // Compter les réunions par mois
    meetings.forEach((meeting) => {
      if (meeting.date) {
        const meetingDate = new Date(meeting.date);
        const monthKey = this._formatMonthKey(meetingDate);
        if (monthsMap.hasOwnProperty(monthKey)) {
          monthsMap[monthKey]++;
        }
      }
    });

    // Convertir en tableau ordonné chronologiquement
    return Object.entries(monthsMap).map(([month, count]) => ({
      month,
      count,
    }));
  }

  /**
   * Formate une date en clé mois "YYYY-MM"
   * @private
   * @param {Date} date
   * @returns {string} Format "YYYY-MM"
   */
  _formatMonthKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}

module.exports = GetMeetingStats;
