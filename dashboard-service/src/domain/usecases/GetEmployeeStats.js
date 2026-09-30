/**
 * Use Case — GetEmployeeStats
 * Calcule les statistiques sur les employés (pur métier, pas de dépendance framework).
 * Responsabilité unique: agréger les données employés en statistiques structurées pour graphiques.
 */
class GetEmployeeStats {
  constructor(employeeServicePort) {
    this.employeeServicePort = employeeServicePort;
  }

  /**
   * Exécute le calcul des statistiques employés
   * @param {string|null} authToken - Token JWT optionnel pour les appels authentifiés
   * @returns {Promise<Object>} Statistiques structurées pour graphiques
   */
  async execute(authToken = null) {
    // Récupérer les données brutes depuis le service externe
    const employees = await this.employeeServicePort.getAll();

    // Calculer le total
    const total = employees.length;

    // Calculer la répartition par département
    const byDepartment = this._groupByField(employees, 'departmentId');

    // Calculer la répartition par poste
    const byPosition = this._groupByField(employees, 'position');

    return {
      total,
      byDepartment: this._formatForChart(byDepartment),
      byPosition: this._formatForChart(byPosition),
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
   * Formate un objet de compteurs en tableau pour graphiques (Bar chart, Pie chart)
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
}

module.exports = GetEmployeeStats;
