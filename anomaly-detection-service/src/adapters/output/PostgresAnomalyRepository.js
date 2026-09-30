const { Pool } = require('pg');

class PostgresAnomalyRepository {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'anomaly-db',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'anomaly_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
  }

  /** Sauvegarder un rapport d'anomalies */
  async save({ periodDays, totalEmployees, anomalyCount, rawAnomalies, aiReport, employeeResults, createdBy, status }) {
    const query = `
      INSERT INTO anomaly_reports
        (period_days, total_employees, anomaly_count, raw_anomalies, ai_report, employee_results, created_by, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, generated_at
    `;
    const values = [
      periodDays,
      totalEmployees,
      anomalyCount,
      JSON.stringify(rawAnomalies),
      aiReport,
      JSON.stringify(employeeResults),
      createdBy,
      status,
    ];
    const result = await this.pool.query(query, values);
    return { id: result.rows[0].id, generatedAt: result.rows[0].generated_at };
  }

  /** Récupérer l'historique des rapports (derniers N rapports) */
  async findRecent(limit = 10) {
    const query = `
      SELECT id, generated_at, period_days, total_employees, anomaly_count,
             employee_results, ai_report, created_by, status
      FROM anomaly_reports
      ORDER BY generated_at DESC
      LIMIT $1
    `;
    const result = await this.pool.query(query, [limit]);
    return result.rows.map(row => ({
      id: row.id,
      generatedAt: row.generated_at,
      periodDays: row.period_days,
      totalEmployees: row.total_employees,
      anomalyCount: row.anomaly_count,
      employeeResults: row.employee_results,
      aiReport: row.ai_report,
      createdBy: row.created_by,
      status: row.status,
    }));
  }

  /** Récupérer un rapport par ID */
  async findById(id) {
    const query = 'SELECT * FROM anomaly_reports WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      generatedAt: row.generated_at,
      periodDays: row.period_days,
      totalEmployees: row.total_employees,
      anomalyCount: row.anomaly_count,
      rawAnomalies: row.raw_anomalies,
      aiReport: row.ai_report,
      employeeResults: row.employee_results,
      createdBy: row.created_by,
      status: row.status,
    };
  }
}

module.exports = PostgresAnomalyRepository;
