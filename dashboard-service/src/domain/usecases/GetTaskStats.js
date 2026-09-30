/**
 * Use Case — GetTaskStats
 * Calcule les statistiques sur les tâches (pur métier, pas de dépendance framework).
 * Responsabilité : agréger les tâches en statistiques structurées pour graphiques.
 */
class GetTaskStats {
  constructor(taskServicePort, employeeServicePort) {
    this.taskServicePort = taskServicePort;
    this.employeeServicePort = employeeServicePort;
  }

  /**
   * Exécute le calcul des statistiques tâches
   * @param {string} authToken - Token JWT admin requis pour l'appel au task-service
   * @returns {Promise<Object>} Statistiques structurées pour graphiques
   */
  async execute(authToken) {
    // Récupérer les données brutes depuis le service externe
    const [tasks, employees] = await Promise.all([
      this.taskServicePort.getAll(authToken),
      this.employeeServicePort.getAll(),
    ]);

    // Calculer le total
    const total = tasks.length;

    // Calculer la répartition par statut
    const byStatus = this._groupByField(tasks, 'status');

    // Calculer la répartition par priorité
    const byPriority = this._groupByField(tasks, 'priority');

    // Calculer le taux de complétion global
    const completedCount = tasks.filter((t) => t.status === 'DONE').length;
    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    // Calculer la productivité par employé
    const productivityByEmployee = this._calculateProductivityByEmployee(tasks, employees);

    return {
      total,
      byStatus: this._formatForChart(byStatus),
      byPriority: this._formatForChart(byPriority),
      completionRate,
      completedCount,
      productivityByEmployee,
    };
  }

  /**
   * Groupe les éléments par un champ spécifique et compte les occurrences
   * @private
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
   */
  _formatForChart(grouped) {
    return Object.entries(grouped).map(([label, count]) => ({
      label: String(label),
      count,
    }));
  }

  /**
   * Calcule la productivité par employé (tâches terminées / assignées) * 100
   * Enrichit avec les informations du department depuis employee-service
   * @private
   */
  _calculateProductivityByEmployee(tasks, employees) {
    // Map employeeId -> employee info
    // Les tasks stockent le Keycloak sub (UUID) comme employeeId
    // Les employees peuvent avoir userId (Keycloak sub) ou id (DB int)
    const employeeMap = employees.reduce((map, emp) => {
      const key = emp.userId || String(emp.id);
      map[key] = {
        name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Inconnu',
        departmentId: emp.departmentId,
      };
      return map;
    }, {});

    // Grouper les tâches par employeeId
    const tasksByEmployee = tasks.reduce((acc, task) => {
      const empId = task.employeeId;
      if (!empId) return acc;

      if (!acc[empId]) {
        acc[empId] = { assigned: 0, completed: 0 };
      }

      acc[empId].assigned++;
      if (task.status === 'DONE') {
        acc[empId].completed++;
      }

      return acc;
    }, {});

    // Convertir en tableau avec productivité calculée
    return Object.entries(tasksByEmployee)
      .map(([employeeId, stats]) => {
        // Fallback : utiliser employeeUsername depuis la tâche si pas de match dans employeeMap
        const empInfo = employeeMap[employeeId] || {
          name: tasks.find(t => t.employeeId === employeeId)?.employeeUsername || employeeId,
          departmentId: null,
        };
        const rate = stats.assigned > 0 ? Math.round((stats.completed / stats.assigned) * 100) : 0;

        return {
          employeeId,
          employeeName: empInfo.name,
          departmentId: empInfo.departmentId,
          assigned: stats.assigned,
          completed: stats.completed,
          rate,
        };
      })
      .sort((a, b) => b.rate - a.rate); // Trier par productivité décroissante
  }
}

module.exports = GetTaskStats;
