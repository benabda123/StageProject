const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'task-db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'task_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

class PostgresTaskRepository {
  async create(task) {
    const query = `
      INSERT INTO tasks (title, description, employee_id, employee_username, created_by, status, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      task.title,
      task.description,
      task.employeeId,
      task.employeeUsername,
      task.createdBy,
      task.status,
      task.priority,
      task.dueDate
    ];
    const result = await pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async findById(id) {
    const query = 'SELECT * FROM tasks WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async findByEmployeeId(employeeId) {
    const query = 'SELECT * FROM tasks WHERE employee_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [employeeId]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findAll(filters = {}) {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.employeeId) {
      query += ` AND employee_id = $${paramIndex}`;
      values.push(filters.employeeId);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async update(id, task) {
    const query = `
      UPDATE tasks
      SET title = $1, description = $2, employee_id = $3, employee_username = $4,
          status = $5, priority = $6, due_date = $7
      WHERE id = $8
      RETURNING *
    `;
    const values = [
      task.title,
      task.description,
      task.employeeId,
      task.employeeUsername,
      task.status,
      task.priority,
      task.dueDate,
      id
    ];
    const result = await pool.query(query, values);
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async delete(id) {
    const query = 'DELETE FROM tasks WHERE id = $1';
    await pool.query(query, [id]);
  }

  mapToEntity(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      employeeId: row.employee_id,
      employeeUsername: row.employee_username,
      createdBy: row.created_by,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = PostgresTaskRepository;
