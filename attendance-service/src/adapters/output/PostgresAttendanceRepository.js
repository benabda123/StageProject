const { Pool } = require('pg');
const AttendanceRecord = require('../../domain/entities/AttendanceRecord');

class PostgresAttendanceRepository {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'attendance-db',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'attendance_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
  }

  /** Créer un check-in */
  async create({ employeeId, employeeUsername, checkInTime, checkInLat, checkInLng, distanceMeters, workDate, status }) {
    const query = `
      INSERT INTO attendance_records
        (employee_id, employee_username, check_in_time, check_in_lat, check_in_lng, distance_meters, work_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [employeeId, employeeUsername, checkInTime, checkInLat, checkInLng, distanceMeters, workDate, status];
    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  /** Mettre à jour le check-out */
  async updateCheckOut(id, { checkOutTime, checkOutLat, checkOutLng, durationMinutes, status }) {
    const query = `
      UPDATE attendance_records
      SET check_out_time   = $1,
          check_out_lat    = $2,
          check_out_lng    = $3,
          duration_minutes = $4,
          status           = $5
      WHERE id = $6
      RETURNING *
    `;
    const values = [checkOutTime, checkOutLat, checkOutLng, durationMinutes, status, id];
    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  /** Trouver le pointage d'un employee pour une date précise */
  async findByEmployeeAndDate(employeeId, date) {
    const query = `
      SELECT * FROM attendance_records
      WHERE employee_id = $1 AND work_date = $2
      LIMIT 1
    `;
    const result = await this.pool.query(query, [employeeId, date]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  /** Historique d'un employee (N derniers jours) */
  async findByEmployeeId(employeeId, days = 30) {
    const query = `
      SELECT * FROM attendance_records
      WHERE employee_id = $1
        AND work_date >= CURRENT_DATE - INTERVAL '${parseInt(days, 10)} days'
      ORDER BY work_date DESC
    `;
    const result = await this.pool.query(query, [employeeId]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  /** Tous les pointages pour une date donnée (vue admin) */
  async findByDate(date) {
    const query = `
      SELECT * FROM attendance_records
      WHERE work_date = $1
      ORDER BY check_in_time ASC
    `;
    const result = await this.pool.query(query, [date]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  /** Historique équipe sur N jours (admin) */
  async findByDateRange(startDate, endDate) {
    const query = `
      SELECT * FROM attendance_records
      WHERE work_date BETWEEN $1 AND $2
      ORDER BY work_date DESC, check_in_time ASC
    `;
    const result = await this.pool.query(query, [startDate, endDate]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  mapToEntity(row) {
    return new AttendanceRecord({
      id: row.id,
      employeeId: row.employee_id,
      employeeUsername: row.employee_username,
      checkInTime: row.check_in_time,
      checkOutTime: row.check_out_time,
      checkInLat: parseFloat(row.check_in_lat),
      checkInLng: parseFloat(row.check_in_lng),
      checkOutLat: row.check_out_lat ? parseFloat(row.check_out_lat) : null,
      checkOutLng: row.check_out_lng ? parseFloat(row.check_out_lng) : null,
      distanceMeters: parseFloat(row.distance_meters),
      workDate: row.work_date,
      durationMinutes: row.duration_minutes,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

module.exports = PostgresAttendanceRepository;
