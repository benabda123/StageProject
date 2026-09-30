/**
 * Use Case — GetLeaveStats
 * Calcule les statistiques sur les demandes de congé (pur métier, pas de dépendance framework).
 * Responsabilité unique: agréger les congés en statistiques structurées pour graphiques.
 */
class GetLeaveStats {
  constructor(leaveServicePort) {
    this.leaveServicePort = leaveServicePort;
  }

  /**
   * Exécute le calcul des statistiques congés
   * @param {string} authToken - Token JWT admin requis pour l'appel au leave-service
   * @returns {Promise<Object>} Statistiques structurées pour graphiques
   */
  async execute(authToken) {
    // Récupérer les données brutes depuis le service externe
    const leaves = await this.leaveServicePort.getAll(authToken);

    // Calculer le total
    const total = leaves.length;

    // Calculer la répartition par statut (en_attente, accepte, refuse)
    const byStatus = this._groupByField(leaves, 'status');

    // Calculer la répartition par type (annuel, maladie, personnel, sans_solde)
    const byType = this._groupByField(leaves, 'type');

    // Calculer la répartition par mois (12 derniers mois)
    const byMonth = this._groupByMonth(leaves);

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
   * Groupe les congés par mois (12 derniers mois) basé sur startDate
   * Retourne un tableau de 12 mois avec compteurs (Line chart, Area chart)
   * @private
   * @param {Array} leaves - Liste des congés
   * @returns {Array<Object>} Tableau [{ month: "2024-01", count }]
   */
  _groupByMonth(leaves) {
    const now = new Date();
    const monthsMap = {};

    // Initialiser les 12 derniers mois avec count = 0
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = this._formatMonthKey(date);
      monthsMap[monthKey] = 0;
    }

    // Compter les congés par mois
    leaves.forEach((leave) => {
      if (leave.startDate) {
        const startDate = new Date(leave.startDate);
        const monthKey = this._formatMonthKey(startDate);
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

module.exports = GetLeaveStats;
