const EmployeeRepositoryPort = require('../../ports/EmployeeRepositoryPort');
const db = require('../../config/db');

class PostgresEmployeeRepository extends EmployeeRepositoryPort {
  async findAll() {
    const res = await db.query('SELECT id, user_id AS "userId", department_id AS "departmentId", first_name AS "firstName", last_name AS "lastName", position, phone FROM employees ORDER BY id ASC');
    return res.rows;
  }

  async findById(id) {
    const res = await db.query('SELECT id, user_id AS "userId", department_id AS "departmentId", first_name AS "firstName", last_name AS "lastName", position, phone FROM employees WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async save(emp) {
    const res = await db.query(
      `INSERT INTO employees (user_id, department_id, first_name, last_name, position, phone) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, user_id AS "userId", department_id AS "departmentId", first_name AS "firstName", last_name AS "lastName", position, phone`,
      [emp.userId, emp.departmentId, emp.firstName, emp.lastName, emp.position, emp.phone]
    );
    return res.rows[0];
  }

  async update(id, emp) {
    const res = await db.query(
      `UPDATE employees 
       SET user_id = $1, department_id = $2, first_name = $3, last_name = $4, position = $5, phone = $6
       WHERE id = $7 
       RETURNING id, user_id AS "userId", department_id AS "departmentId", first_name AS "firstName", last_name AS "lastName", position, phone`,
      [emp.userId, emp.departmentId, emp.firstName, emp.lastName, emp.position, emp.phone, id]
    );
    return res.rows[0] || null;
  }

  async delete(id) {
    const res = await db.query('DELETE FROM employees WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  }
}

module.exports = PostgresEmployeeRepository;