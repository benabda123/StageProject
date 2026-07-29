// src/adapters/output/PostgresEmployeeRepository.js
const db = require('../../config/db');
const Employee = require('../../domain/models/Employee');

class PostgresEmployeeRepository {
  async save(employee) {
    const query = `
      INSERT INTO employees (user_id, department_id, first_name, last_name, position, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id AS "userId", department_id AS "departmentId", first_name AS "firstName", last_name AS "lastName", position, phone;
    `;
    const values = [
      employee.userId,
      employee.departmentId,
      employee.firstName,
      employee.lastName,
      employee.position,
      employee.phone
    ];

    const result = await db.query(query, values);
    const row = result.rows[0];
    return new Employee(row);
  }

  async findAll() {
    const query = `
      SELECT id, user_id AS "userId", department_id AS "departmentId", first_name AS "firstName", last_name AS "lastName", position, phone
      FROM employees;
    `;
    const result = await db.query(query);
    return result.rows.map(row => new Employee(row));
  }
}

module.exports = PostgresEmployeeRepository;