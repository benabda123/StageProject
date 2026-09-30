/**
 * Use Case — GenerateAnomalyReport (orchestrateur principal)
 *
 * Coordonne les 3 analyseurs et produit un rapport complet :
 *   1. Récupère les données de pointage via AttendanceServiceClient
 *   2. Regroupe les données par employee
 *   3. Lance les 3 analyses en parallèle
 *   4. Envoie les résultats à Gemini pour générer le rapport narratif
 *   5. Sauvegarde en base pour l'historique
 */
const AnalyzeRoboticCheckins = require('./AnalyzeRoboticCheckins');
const AnalyzeWeekdayAbsences = require('./AnalyzeWeekdayAbsences');
const AnalyzeWorkDuration = require('./AnalyzeWorkDuration');

class GenerateAnomalyReport {
  constructor(attendanceClient, geminiGenerator, reportRepository) {
    this.attendanceClient = attendanceClient;
    this.geminiGenerator = geminiGenerator;
    this.repo = reportRepository;

    this.analyzeRobotic = new AnalyzeRoboticCheckins();
    this.analyzeAbsences = new AnalyzeWeekdayAbsences();
    this.analyzeDuration = new AnalyzeWorkDuration();
  }

  /**
   * @param {string} requestedBy - Username de l'admin qui lance l'analyse
   * @param {number} days - Période d'analyse en jours (défaut: 30)
   * @returns {Promise<Object>} Rapport complet
   */
  async execute(requestedBy, days = 30) {
    const periodDays = parseInt(process.env.ANALYSIS_PERIOD_DAYS || days, 10);

    console.log(`[GenerateAnomalyReport] Démarrage analyse sur ${periodDays} jours pour ${requestedBy}`);

    // ── 1. Récupérer toutes les données de pointage ───────────────────────────
    const { records, allWorkDates } = await this.attendanceClient.getRecordsForPeriod(periodDays);

    if (records.length === 0) {
      return this._buildEmptyReport(requestedBy, periodDays);
    }

    // ── 2. Regrouper par employee ─────────────────────────────────────────────
    const employeeMap = this._groupByEmployee(records);
    const totalEmployees = employeeMap.size;

    // ── 3. Lancer les 3 analyses ──────────────────────────────────────────────
    const allAnomalies = [];

    // Analyse robotique + absences par employee
    for (const [empId, { username, records: empRecords }] of employeeMap) {
      const roboticAnomaly = this.analyzeRobotic.execute(empId, username, empRecords);
      if (roboticAnomaly) allAnomalies.push(roboticAnomaly);

      const absenceAnomaly = this.analyzeAbsences.execute(empId, username, empRecords, allWorkDates);
      if (absenceAnomaly) allAnomalies.push(absenceAnomaly);
    }

    // Analyse durée (nécessite toutes les données en même temps pour le Z-score)
    const durationAnomalies = this.analyzeDuration.execute(employeeMap);
    allAnomalies.push(...durationAnomalies);

    console.log(`[GenerateAnomalyReport] ${allAnomalies.length} anomalies détectées sur ${totalEmployees} employees`);

    // ── 4. Regrouper les anomalies par employee ───────────────────────────────
    const employeeResults = this._groupAnomaliesByEmployee(employeeMap, allAnomalies);

    // ── 5. Générer le rapport AI avec Gemini ──────────────────────────────────
    let aiReport = null;
    try {
      aiReport = await this.geminiGenerator.generateReport({
        periodDays,
        totalEmployees,
        anomalyCount: allAnomalies.length,
        employeeResults,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[GenerateAnomalyReport] Gemini error:', err.message);
      aiReport = this._fallbackReport(employeeResults, allAnomalies.length);
    }

    // ── 6. Sauvegarder en base ────────────────────────────────────────────────
    const saved = await this.repo.save({
      periodDays,
      totalEmployees,
      anomalyCount: allAnomalies.length,
      rawAnomalies: allAnomalies,
      aiReport,
      employeeResults,
      createdBy: requestedBy,
      status: 'completed',
    });

    return {
      id: saved.id,
      generatedAt: saved.generatedAt,
      periodDays,
      totalEmployees,
      anomalyCount: allAnomalies.length,
      employeeResults,
      aiReport,
      rawAnomalies: allAnomalies,
    };
  }

  /** Regroupe les records par employee */
  _groupByEmployee(records) {
    const map = new Map();
    for (const record of records) {
      if (!map.has(record.employeeId)) {
        map.set(record.employeeId, {
          username: record.employeeUsername,
          records: [],
        });
      }
      map.get(record.employeeId).records.push(record);
    }
    return map;
  }

  /** Regroupe les anomalies par employee avec niveau de sévérité global */
  _groupAnomaliesByEmployee(employeeMap, anomalies) {
    const results = [];

    for (const [empId, { username }] of employeeMap) {
      const empAnomalies = anomalies.filter(a => a.employeeId === empId);
      const hasCritical = empAnomalies.some(a => a.severity === 'CRITICAL');
      const hasWarning = empAnomalies.some(a => a.severity === 'WARNING');

      results.push({
        employeeId: empId,
        employeeUsername: username,
        anomalyCount: empAnomalies.length,
        globalSeverity: hasCritical ? 'CRITICAL' : hasWarning ? 'WARNING' : 'NORMAL',
        anomalies: empAnomalies,
      });
    }

    // Trier : CRITICAL d'abord, puis WARNING, puis NORMAL
    return results.sort((a, b) => {
      const order = { CRITICAL: 0, WARNING: 1, NORMAL: 2 };
      return order[a.globalSeverity] - order[b.globalSeverity];
    });
  }

  _buildEmptyReport(requestedBy, periodDays) {
    return {
      id: null,
      generatedAt: new Date().toISOString(),
      periodDays,
      totalEmployees: 0,
      anomalyCount: 0,
      employeeResults: [],
      aiReport: `Aucune donnée de pointage disponible sur les ${periodDays} derniers jours. Impossible d'effectuer une analyse.`,
      rawAnomalies: [],
    };
  }

  /** Rapport de secours si Gemini est indisponible */
  _fallbackReport(employeeResults, anomalyCount) {
    const criticals = employeeResults.filter(e => e.globalSeverity === 'CRITICAL');
    const warnings = employeeResults.filter(e => e.globalSeverity === 'WARNING');

    if (anomalyCount === 0) {
      return '✅ Aucune anomalie détectée sur la période analysée. Tous les comportements de pointage sont dans les normes.';
    }

    let report = `📊 Analyse de présence terminée.\n\n`;
    report += `${anomalyCount} anomalie(s) détectée(s) :\n`;
    if (criticals.length > 0) {
      report += `\n🔴 CRITIQUE (${criticals.length}) : ${criticals.map(e => e.employeeUsername).join(', ')}\n`;
      criticals.forEach(e => {
        e.anomalies.forEach(a => report += `  • ${a.description}\n`);
      });
    }
    if (warnings.length > 0) {
      report += `\n🟡 ATTENTION (${warnings.length}) : ${warnings.map(e => e.employeeUsername).join(', ')}\n`;
      warnings.forEach(e => {
        e.anomalies.forEach(a => report += `  • ${a.description}\n`);
      });
    }
    return report;
  }
}

module.exports = GenerateAnomalyReport;
