const { Pool } = require('pg');
const ChatMessageRepositoryPort = require('../../ports/ChatMessageRepositoryPort');
const ChatMessage = require('../../domain/entities/ChatMessage');

class PostgresChatMessageRepository extends ChatMessageRepositoryPort {
  constructor() {
    super();
    this.pool = new Pool({
      host: process.env.DB_HOST || 'messages-db',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'messages_db',
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
    return this.mapToEntity(result.rows[0]);
  }

  async getMessagesByEmployeeId(employeeId) {
    const query = `
      SELECT * FROM chat_messages
      WHERE employee_id = $1
      ORDER BY created_at ASC
    `;
    const result = await this.pool.query(query, [employeeId]);
    return result.rows.map(row => this.mapToEntity(row));
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
    return result.rows.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
  }

  async markAsRead(employeeId, senderRole) {
    const query = `
      UPDATE chat_messages
      SET is_read = TRUE
      WHERE employee_id = $1 AND sender_role = $2 AND is_read = FALSE
    `;
    await this.pool.query(query, [employeeId, senderRole]);
  }

  mapToEntity(row) {
    return new ChatMessage({
      id: row.id,
      sender_id: row.sender_id,
      sender_name: row.sender_name,
      sender_role: row.sender_role,
      recipient_id: row.recipient_id,
      employee_id: row.employee_id,
      message: row.message,
      is_read: row.is_read,
      created_at: row.created_at
    });
  }
}

module.exports = PostgresChatMessageRepository;
