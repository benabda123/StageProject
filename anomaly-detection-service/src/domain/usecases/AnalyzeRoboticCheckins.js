/**
 * Use Case — AnalyzeRoboticCheckins
 *
 * Détecte les pointages suspects : un humain n'arrive jamais exactement
 * à la même seconde. Si l'écart-type des secondes de check-in est très faible
 * sur plusieurs jours, c'est suspect (possible script automatique).
 *
 * Algorithme :
 *   1. Extraire les secondes de chaque check-in (0-59)
 *   2. Calculer l'écart-type (standard deviation)
 *   3. Si stdDev < seuil configurable ET échantillon suffisant → ALERTE
 */
class AnalyzeRoboticCheckins {
  constructor() {
    this.stdDevThreshold = parseFloat(process.env.ROBOTIC_STDDEV_THRESHOLD || '5');
    this.minRecords = parseInt(process.env.MIN_RECORDS_FOR_ANALYSIS || '5', 10);
  }

  /**
   * @param {string} employeeId
   * @param {string} employeeUsername
   * @param {Array} records - Tableau de pointages de cet employee
   * @returns {Object|null} Anomalie détectée ou null
   */
  execute(employeeId, employeeUsername, records) {
    // Filtrer les records avec check-in valide
    const validRecords = records.filter(r => r.checkInTime);
    if (validRecords.length < this.minRecords) return null;

    // Extraire les secondes de chaque check-in
    const seconds = validRecords.map(r => new Date(r.checkInTime).getSeconds());

    // Calculer l'écart-type
    const stdDev = this._standardDeviation(seconds);

    if (stdDev < this.stdDevThreshold) {
      return {
        type: 'ROBOTIC_CHECKIN',
        severity: stdDev < 2 ? 'CRITICAL' : 'WARNING',
        employeeId,
        employeeUsername,
        stdDevSeconds: Math.round(stdDev * 100) / 100,
        samplesCount: validRecords.length,
        threshold: this.stdDevThreshold,
        description: `Pointages anormalement précis : écart-type de ${stdDev.toFixed(2)}s sur ${validRecords.length} jours (seuil: ${this.stdDevThreshold}s)`,
        recommendation: 'Vérifier si un script automatise le pointage de cet employé.',
        data: {
          seconds,
          mean: this._mean(seconds),
          stdDev,
        },
      };
    }

    return null;
  }

  /** Calcule la moyenne */
  _mean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /** Calcule l'écart-type (standard deviation) */
  _standardDeviation(values) {
    const avg = this._mean(values);
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquaredDiff = this._mean(squaredDiffs);
    return Math.sqrt(avgSquaredDiff);
  }
}

module.exports = AnalyzeRoboticCheckins;
