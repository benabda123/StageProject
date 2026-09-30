/**
 * Adapter Output — AttendanceServiceClient
 * Appelle attendance-service via les routes internes pour récupérer
 * les données de pointage sur une période donnée.
 */
const fetch = require('node-fetch');

class AttendanceServiceClient {
  constructor() {
    this.baseUrl = process.env.ATTENDANCE_SERVICE_URL || 'http://attendance-service:8094';
    this.internalApiKey = process.env.INTERNAL_API_KEY || '';
  }

  /**
   * Récupère tous les pointages sur les N derniers jours
   * @param {number} days - Nombre de jours à analyser
   * @returns {Promise<{records: Array, allWorkDates: Array}>}
   */
  async getRecordsForPeriod(days) {
    const records = [];
    const allWorkDates = [];

    const today = new Date();

    // Récupérer les données jour par jour
    // On utilise l'endpoint /attendance/team?date=YYYY-MM-DD
    const fetchPromises = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayOfWeek = date.getDay();

      // Ignorer les weekends (sam=6, dim=0)
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const dateStr = date.toISOString().split('T')[0];
      allWorkDates.push(dateStr);

      fetchPromises.push(
        this._fetchDayRecords(dateStr).then(dayRecords => ({ dateStr, dayRecords }))
      );
    }

    // Exécuter en parallèle par lots de 10 pour ne pas surcharger
    const results = await this._batchedPromises(fetchPromises, 10);

    for (const { dayRecords } of results) {
      records.push(...dayRecords);
    }

    console.log(`[AttendanceServiceClient] Récupéré ${records.length} records sur ${allWorkDates.length} jours ouvrés`);
    return { records, allWorkDates };
  }

  /**
   * Récupère les pointages d'une journée
   * @private
   */
  async _fetchDayRecords(dateStr) {
    try {
      const url = `${this.baseUrl}/attendance/internal/team?date=${dateStr}`;
      const response = await fetch(url, {
        headers: { 'x-internal-api-key': this.internalApiKey },
        timeout: 5000,
      });

      if (!response.ok) {
        // 404 = pas de données ce jour = normal
        if (response.status === 404) return [];
        console.warn(`[AttendanceServiceClient] ${dateStr}: HTTP ${response.status}`);
        return [];
      }

      const data = await response.json();
      // Retourner les records avec la date intégrée
      return (data.records || []).map(r => ({ ...r, workDate: dateStr }));
    } catch (err) {
      console.warn(`[AttendanceServiceClient] Erreur pour ${dateStr}: ${err.message}`);
      return [];
    }
  }

  /**
   * Exécute des promises par lots pour limiter la concurrence
   * @private
   */
  async _batchedPromises(promises, batchSize) {
    const results = [];
    for (let i = 0; i < promises.length; i += batchSize) {
      const batch = promises.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }
    return results;
  }
}

module.exports = AttendanceServiceClient;
