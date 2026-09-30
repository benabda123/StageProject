const DepartmentRepository = require('../../ports/DepartmentRepository');
const Department = require('../../domain/models/Department');
const pool = require('../../config/db');

class PostgresDepartmentRepository extends DepartmentRepository {
  async getAll() {
    const result = await pool.query('SELECT * FROM departments ORDER BY id ASC');
    return result.rows.map(row => new Department(row));
  }

  async getById(id) {
    const result = await pool.query('SELECT * FROM departments WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return new Department(result.rows[0]);
  }

  async create({ name, description }) {
    const result = await pool.query(
      'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    return new Department(result.rows[0]);
  }

  async update(id, { name, description }) {
    const result = await pool.query(
      'UPDATE departments SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    if (result.rows.length === 0) return null;
    return new Department(result.rows[0]);
  }

  async delete(id) {
    const result = await pool.query('DELETE FROM departments WHERE id = $1 RETURNING *', [id]);
    return result.rowCount > 0;
  }
}

module.exports = PostgresDepartmentRepository;