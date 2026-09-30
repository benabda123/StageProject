/**
 * Use Case — GetMyAttendance
 * Récupère l'historique de pointage d'un employee (30 derniers jours par défaut).
 * Inclut le record d'aujourd'hui s'il existe.
 */
class GetMyAttendance {
  constructor(attendanceRepository) {
    this.repo = attendanceRepository;
  }

  /**
   * @param {string} employeeId
   * @param {number} days - Nombre de jours d'historique (défaut: 30)
   * @returns {Promise<Object>} { today, history, stats }
   */
  async execute(employeeId, days = 30) {
    if (!employeeId) throw new Error('Employee ID requis');

    const today = new Date().toISOString().split('T')[0];

    // Historique des N derniers jours
    const records = await this.repo.findByEmployeeId(employeeId, days);

    // Séparer le record d'aujourd'hui du reste
    const todayRecord = records.find(r => {
      const d = new Date(r.workDate);
      return d.toISOString().split('T')[0] === today;
    }) || null;

    const history = records.filter(r => {
      const d = new Date(r.workDate);
      return d.toISOString().split('T')[0] !== today;
    });

    // Stats rapides
    const totalDays = records.length;
    const totalMinutes = records.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
    const avgMinutes = totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0;

    return {
      today: todayRecord,
      history,
      stats: {
        totalDays,
        totalMinutes,
        avgMinutesPerDay: avgMinutes,
        avgFormatted: this._formatDuration(avgMinutes),
        totalFormatted: this._formatDuration(totalMinutes),
      },
    };
  }

  _formatDuration(minutes) {
    if (!minutes) return '0h 0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  }
}

module.exports = GetMyAttendance;
