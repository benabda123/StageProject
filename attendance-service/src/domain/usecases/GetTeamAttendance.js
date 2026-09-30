/**
 * Use Case — GetTeamAttendance
 * Vue admin/manager : présents aujourd'hui + historique équipe.
 * Agrège les données pour le dashboard de présence.
 */
class GetTeamAttendance {
  constructor(attendanceRepository) {
    this.repo = attendanceRepository;
  }

  /**
   * @param {string} date - YYYY-MM-DD, défaut: aujourd'hui
   * @returns {Promise<Object>} { date, records, summary }
   */
  async execute(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const records = await this.repo.findByDate(targetDate);

    // Trier : present d'abord, puis checked_out
    records.sort((a, b) => {
      if (a.status === 'present' && b.status !== 'present') return -1;
      if (a.status !== 'present' && b.status === 'present') return 1;
      return new Date(a.checkInTime) - new Date(b.checkInTime);
    });

    const presentCount = records.filter(r => r.status === 'present').length;
    const checkedOutCount = records.filter(r => r.status === 'checked_out').length;
    const totalMinutes = records.reduce((sum, r) => sum + (r.durationMinutes || 0), 0);
    const avgMinutes = records.length > 0 ? Math.round(totalMinutes / records.length) : 0;

    return {
      date: targetDate,
      records,
      summary: {
        total: records.length,
        present: presentCount,
        checkedOut: checkedOutCount,
        avgDurationMinutes: avgMinutes,
        avgDurationFormatted: this._formatDuration(avgMinutes),
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

module.exports = GetTeamAttendance;
