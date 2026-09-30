const { Pool } = require('pg');

class PostgresTicketRepository {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'ticket-db',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'ticket_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
  }

  async create(ticket) {
    const query = `
      INSERT INTO tickets (title, description, category, priority, status, employee_id, employee_username, attachment_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      ticket.title,
      ticket.description,
      ticket.category || null,
      ticket.priority,
      ticket.status,
      ticket.employeeId,
      ticket.employeeUsername,
      ticket.attachmentUrl
    ];
    const result = await this.pool.query(query, values);
    return this.mapTicketToEntity(result.rows[0]);
  }

  async findByEmployeeId(employeeId) {
    const query = `
      SELECT * FROM tickets
      WHERE employee_id = $1
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [employeeId]);
    return result.rows.map(row => this.mapTicketToEntity(row));
  }

  async findAll(filters = {}) {
    let query = 'SELECT * FROM tickets';
    const values = [];
    const conditions = [];

    if (filters.status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(filters.status);
    }
    if (filters.category) {
      conditions.push(`category = $${values.length + 1}`);
      values.push(filters.category);
    }
    if (filters.priority) {
      conditions.push(`priority = $${values.length + 1}`);
      values.push(filters.priority);
    }
    if (filters.assignedToId) {
      conditions.push(`assigned_to_id = $${values.length + 1}`);
      values.push(filters.assignedToId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, values);
    return result.rows.map(row => this.mapTicketToEntity(row));
  }

  async findById(id) {
    const query = 'SELECT * FROM tickets WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.mapTicketToEntity(result.rows[0]);
  }

  async assign(ticketId, assignedToId, assignedToUsername) {
    const query = `
      UPDATE tickets
      SET assigned_to_id = $1, assigned_to_username = $2, status = 'ASSIGNED', updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await this.pool.query(query, [assignedToId, assignedToUsername, ticketId]);
    if (result.rows.length === 0) return null;
    return this.mapTicketToEntity(result.rows[0]);
  }

  async updateStatus(ticketId, status) {
    const query = `
      UPDATE tickets
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [status, ticketId]);
    if (result.rows.length === 0) return null;
    return this.mapTicketToEntity(result.rows[0]);
  }

  async addComment(comment) {
    const query = `
      INSERT INTO ticket_comments (ticket_id, author_id, author_username, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [
      comment.ticketId,
      comment.authorId,
      comment.authorUsername,
      comment.message
    ];
    const result = await this.pool.query(query, values);
    return this.mapCommentToEntity(result.rows[0]);
  }

  async findCommentsByTicketId(ticketId) {
    const query = `
      SELECT * FROM ticket_comments
      WHERE ticket_id = $1
      ORDER BY created_at ASC
    `;
    const result = await this.pool.query(query, [ticketId]);
    return result.rows.map(row => this.mapCommentToEntity(row));
  }

  mapTicketToEntity(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      priority: row.priority,
      status: row.status,
      employeeId: row.employee_id,
      employeeUsername: row.employee_username,
      assignedToId: row.assigned_to_id,
      assignedToUsername: row.assigned_to_username,
      attachmentUrl: row.attachment_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  mapCommentToEntity(row) {
    return {
      id: row.id,
      ticketId: row.ticket_id,
      authorId: row.author_id,
      authorUsername: row.author_username,
      message: row.message,
      createdAt: row.created_at
    };
  }
}

module.exports = PostgresTicketRepository;
