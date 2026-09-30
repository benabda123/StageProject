const { Pool } = require('pg');

class PostgresChatRepository {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'notification-db',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'notification_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });
  }

  async createMessage({ sender_id, sender_name, sender_role, recipient_id, employee_id, message }) {
    const query = `
      INSERT INTO chat_messages (sender_id, sender_name, sender_role, recipient_id, employee_id, message)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      sender_id,
      sender_name,
      sender_role || 'employee',
      recipient_id || 'admin',
      employee_id,
      message
    ];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getMessagesByEmployeeId(employee_id) {
    const query = `
      SELECT * FROM chat_messages
      WHERE employee_id = $1
      ORDER BY created_at ASC
    `;
    const result = await this.pool.query(query, [employee_id]);
    return result.rows;
  }

  async getAllConversations() {
    const query = `
      SELECT DISTINCT ON (employee_id)
        employee_id,
        sender_name,
        message AS last_message,
        created_at AS last_message_at,
        (
          SELECT COUNT(*)::int
          FROM chat_messages c2
          WHERE c2.employee_id = chat_messages.employee_id
            AND c2.sender_role = 'employee'
            AND c2.is_read = FALSE
        ) AS unread_count
      FROM chat_messages
      ORDER BY employee_id, created_at DESC
    `;
    const result = await this.pool.query(query);
    // Sort conversations by most recent message
    return result.rows.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
  }

  async markAsRead(employee_id, target_role) {
    const query = `
      UPDATE chat_messages
      SET is_read = TRUE
      WHERE employee_id = $1 AND sender_role = $2 AND is_read = FALSE
    `;
    await this.pool.query(query, [employee_id, target_role]);
  }
}

module.exports = PostgresChatRepository;
