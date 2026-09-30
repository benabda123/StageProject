/**
 * Use Case — AnalyzeWorkDuration
 *
 * Détecte les durées de travail anormalement courtes ou longues.
 * Utilise le Z-score pour comparer chaque employé à la moyenne de l'équipe.
 *
 * Algorithme :
 *   1. Calculer la durée moyenne de travail par employee
 *   2. Calculer la moyenne et l'écart-type de TOUTE l'équipe
 *   3. Z-score = (durée_employee - moyenne_equipe) / ecart_type_equipe
 *   4. Si |Z-score| > seuil → ALERTE
 */
class AnalyzeWorkDuration {
  constructor() {
    this.zScoreThreshold = parseFloat(process.env.DURATION_ZSCORE_THRESHOLD || '2');
    this.minRecords = parseInt(process.env.MIN_RECORDS_FOR_ANALYSIS || '5', 10);
  }

  /**
   * @param {Map} employeeRecordsMap - Map<employeeId, {username, records[]}>
   * @returns {Array} Liste des anomalies de durée détectées
   */
  execute(employeeRecordsMap) {
    const anomalies = [];

    // Calculer la durée moyenne par employee (uniquement les checkout complets)
    const employeeAvgDurations = [];

    for (const [empId, { username, records }] of employeeRecordsMap) {
      const completedRecords = records.filter(
        r => r.durationMinutes !== null && r.durationMinutes > 0
      );
      if (completedRecords.length < this.minRecords) continue;

      const avgDuration = completedRecords.reduce(
        (sum, r) => sum + r.durationMinutes, 0
      ) / completedRecords.length;

      employeeAvgDurations.push({
        employeeId: empId,
        employeeUsername: username,
        avgDuration,
        samplesCount: completedRecords.length,
        durations: completedRecords.map(r => r.durationMinutes),
      });
    }

    if (employeeAvgDurations.length < 2) return anomalies; // Pas assez d'employees

    // Calculer moyenne et écart-type de l'équipe
    const teamAvg = this._mean(employeeAvgDurations.map(e => e.avgDuration));
    const teamStdDev = this._standardDeviation(
      employeeAvgDurations.map(e => e.avgDuration)
    );

    if (teamStdDev === 0) return anomalies; // Tout le monde a la même durée

    // Calculer le Z-score de chaque employee
    for (const emp of employeeAvgDurations) {
      const zScore = (emp.avgDuration - teamAvg) / teamStdDev;

      if (Math.abs(zScore) > this.zScoreThreshold) {
        const isTooShort = zScore < 0;
        const severityAbs = Math.abs(zScore);

        anomalies.push({
          type: isTooShort ? 'DURATION_TOO_SHORT' : 'DURATION_TOO_LONG',
          severity: severityAbs > 3 ? 'CRITICAL' : 'WARNING',
          employeeId: emp.employeeId,
          employeeUsername: emp.employeeUsername,
          avgDurationMinutes: Math.round(emp.avgDuration),
          avgDurationFormatted: this._formatDuration(Math.round(emp.avgDuration)),
          teamAvgMinutes: Math.round(teamAvg),
          teamAvgFormatted: this._formatDuration(Math.round(teamAvg)),
          zScore: Math.round(zScore * 100) / 100,
          samplesCount: emp.samplesCount,
          description: isTooShort
            ? `Durée moyenne ${this._formatDuration(Math.round(emp.avgDuration))} — bien en dessous de la moyenne équipe (${this._formatDuration(Math.round(teamAvg))})`
            : `Durée moyenne ${this._formatDuration(Math.round(emp.avgDuration))} — bien au dessus de la moyenne équipe (${this._formatDuration(Math.round(teamAvg))})`,
          recommendation: isTooShort
            ? 'Vérifier si les sorties sont bien enregistrées ou si des départs anticipés sont fréquents.'
            : 'Vérifier si les check-outs sont oubliés ou si des heures supplémentaires excessives sont effectuées.',
          data: { zScore, teamAvg, teamStdDev, durations: emp.durations },
        });
      }
    }

    return anomalies;
  }

  _mean(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  _standardDeviation(values) {
    if (values.length < 2) return 0;
    const avg = this._mean(values);
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(this._mean(squaredDiffs));
  }

  _formatDuration(minutes) {
    if (!minutes || minutes <= 0) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
  }
}

module.exports = AnalyzeWorkDuration;
