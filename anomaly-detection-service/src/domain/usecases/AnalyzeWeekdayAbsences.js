/**
 * Use Case — AnalyzeWeekdayAbsences
 *
 * Détecte les absences répétées le même jour de la semaine.
 * Ex : absent tous les lundis → suspect (long weekend systématique).
 *
 * Algorithme :
 *   1. Pour chaque jour de semaine (lun-ven), calculer le taux de présence
 *   2. Comparer avec le taux de présence global
 *   3. Si taux pour un jour < seuil → ALERTE
 */
class AnalyzeWeekdayAbsences {
  constructor() {
    // Taux en dessous duquel on alerte (0.4 = présent moins de 40% des fois)
    this.absenceThreshold = parseFloat(process.env.WEEKDAY_ABSENCE_THRESHOLD || '0.4');
    this.minRecords = parseInt(process.env.MIN_RECORDS_FOR_ANALYSIS || '5', 10);
  }

  /**
   * @param {string} employeeId
   * @param {string} employeeUsername
   * @param {Array} records - Pointages de l'employee
   * @param {Array} allWorkDates - Toutes les dates ouvrées analysées (pour compter les absences)
   * @returns {Object|null} Anomalie ou null
   */
  execute(employeeId, employeeUsername, records, allWorkDates) {
    if (records.length < this.minRecords) return null;

    const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    // Compter les jours ouvrés disponibles par jour de semaine (lun=1 à ven=5)
    const workDayCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allWorkDates.forEach(dateStr => {
      const day = new Date(dateStr).getDay();
      if (day >= 1 && day <= 5) {
        workDayCount[day] = (workDayCount[day] || 0) + 1;
      }
    });

    // Compter les présences par jour de semaine
    const presenceByDay = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    records.forEach(r => {
      const day = new Date(r.workDate).getDay();
      if (day >= 1 && day <= 5) {
        presenceByDay[day] = (presenceByDay[day] || 0) + 1;
      }
    });

    const suspiciousDays = [];

    for (let day = 1; day <= 5; day++) {
      const total = workDayCount[day] || 0;
      if (total < 2) continue; // Pas assez de données pour ce jour

      const present = presenceByDay[day] || 0;
      const rate = present / total;

      if (rate < this.absenceThreshold) {
        suspiciousDays.push({
          weekday: day,
          weekdayName: WEEKDAYS[day],
          presenceCount: present,
          totalOpportunities: total,
          presenceRate: Math.round(rate * 100),
          absenceRate: Math.round((1 - rate) * 100),
        });
      }
    }

    if (suspiciousDays.length === 0) return null;

    // Construire la description
    const dayNames = suspiciousDays.map(d =>
      `${d.weekdayName} (${d.presenceRate}% présence)`
    ).join(', ');

    return {
      type: 'REPEATED_WEEKDAY_ABSENCE',
      severity: suspiciousDays.some(d => d.presenceRate < 20) ? 'CRITICAL' : 'WARNING',
      employeeId,
      employeeUsername,
      suspiciousDays,
      description: `Absences répétées : ${dayNames}`,
      recommendation: 'Vérifier si ces absences sont justifiées (congés non déclarés, maladie récurrente).',
      data: { presenceByDay, workDayCount },
    };
  }
}

module.exports = AnalyzeWeekdayAbsences;
