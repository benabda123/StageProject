const { Pool } = require('pg');

class PostgresLeaveRepository {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'leave-db',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'leave_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
  }

  async create(leave) {
    const query = `
      INSERT INTO leaves (employee_id, employee_username, type, start_date, end_date, reason, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      leave.employeeId,
      leave.employeeUsername,
      leave.type,
      leave.startDate,
      leave.endDate,
      leave.reason || null,
      leave.status
    ];
    
    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async findByEmployeeId(employeeId) {
    const query = `
      SELECT * FROM leaves 
      WHERE employee_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [employeeId]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findAll(filters = {}) {
    let query = 'SELECT * FROM leaves';
    const values = [];
    const conditions = [];

    if (filters.status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(filters.status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findById(id) {
    const query = 'SELECT * FROM leaves WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapToEntity(result.rows[0]);
  }

  async updateStatus(id, status) {
    const query = `
      UPDATE leaves 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [status, id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapToEntity(result.rows[0]);
  }

  mapToEntity(row) {
    return {
      id: row.id,
      employeeId: row.employee_id,
      employeeUsername: row.employee_username,
      type: row.type,
      startDate: row.start_date,
      endDate: row.end_date,
      reason: row.reason,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = PostgresLeaveRepository;
