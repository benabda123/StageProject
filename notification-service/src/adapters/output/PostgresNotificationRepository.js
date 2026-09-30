const { Pool } = require('pg');
const Notification = require('../../domain/entities/Notification');

class PostgresNotificationRepository {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'notification-db',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'notification_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });
  }

  async create(notification) {
    const query = `
      INSERT INTO notifications (user_id, title, message, type, status, read_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      notification.user_id,
      notification.title,
      notification.message,
      notification.type,
      notification.status,
      notification.read_at
    ];
    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async findById(id) {
    const query = 'SELECT * FROM notifications WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async findByUserId(userId) {
    const query = 'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [userId]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async findAll(filters = {}) {
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (filters.user_id) {
      query += ` AND user_id = $${paramIndex}`;
      values.push(filters.user_id);
      paramIndex++;
    }

    if (filters.type) {
      query += ` AND type = $${paramIndex}`;
      values.push(filters.type);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async update(notification) {
    const query = `
      UPDATE notifications
      SET user_id = $1, title = $2, message = $3, type = $4, status = $5, read_at = $6
      WHERE id = $7
      RETURNING *
    `;
    const values = [
      notification.user_id,
      notification.title,
      notification.message,
      notification.type,
      notification.status,
      notification.read_at,
      notification.id
    ];
    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async delete(id) {
    const query = 'DELETE FROM notifications WHERE id = $1';
    await this.pool.query(query, [id]);
  }

  async markAsRead(id) {
    const query = `
      UPDATE notifications
      SET status = 'READ', read_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async markAllAsRead(userId) {
    const query = `
      UPDATE notifications
      SET status = 'READ', read_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND status = 'UNREAD'
      RETURNING *
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  mapToEntity(row) {
    return new Notification({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type,
      status: row.status,
      created_at: row.created_at,
      read_at: row.read_at
    });
  }
}

module.exports = PostgresNotificationRepository;
