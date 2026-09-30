const { Pool } = require('pg');
const Poll = require('../../domain/entities/Poll');
const Vote = require('../../domain/entities/Vote');

class PostgresPollRepository {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'poll-db',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'poll_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
  }

  // ── Polls ──────────────────────────────────────────────────────────────────

  async create(poll) {
    const query = `
      INSERT INTO polls (title, description, options, deadline, status, is_anonymous, created_by, created_by_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      poll.title, poll.description, JSON.stringify(poll.options),
      poll.deadline, poll.status, poll.isAnonymous, poll.createdBy, poll.createdById,
    ];
    const result = await this.pool.query(query, values);
    return this.mapPoll(result.rows[0]);
  }

  async findById(id) {
    const result = await this.pool.query('SELECT * FROM polls WHERE id = $1', [id]);
    return result.rows.length ? this.mapPoll(result.rows[0]) : null;
  }

  async findAll() {
    const result = await this.pool.query('SELECT * FROM polls ORDER BY created_at DESC');
    return result.rows.map(r => this.mapPoll(r));
  }

  async findActive() {
    const result = await this.pool.query(
      "SELECT * FROM polls WHERE status = 'active' AND deadline > NOW() ORDER BY deadline ASC"
    );
    return result.rows.map(r => this.mapPoll(r));
  }

  async updateStatus(id, status) {
    const result = await this.pool.query(
      'UPDATE polls SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows.length ? this.mapPoll(result.rows[0]) : null;
  }

  async delete(id) {
    await this.pool.query('DELETE FROM polls WHERE id = $1', [id]);
  }

  // ── Votes ──────────────────────────────────────────────────────────────────

  async createVote({ pollId, employeeId, employeeUsername, optionId }) {
    const query = `
      INSERT INTO votes (poll_id, employee_id, employee_username, option_id)
      VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const result = await this.pool.query(query, [pollId, employeeId, employeeUsername, optionId]);
    return this.mapVote(result.rows[0]);
  }

  async findVotesByPollId(pollId) {
    const result = await this.pool.query('SELECT * FROM votes WHERE poll_id = $1 ORDER BY voted_at ASC', [pollId]);
    return result.rows.map(r => this.mapVote(r));
  }

  async findVoteByEmployeeAndPoll(employeeId, pollId) {
    const result = await this.pool.query(
      'SELECT * FROM votes WHERE employee_id = $1 AND poll_id = $2 LIMIT 1',
      [employeeId, pollId]
    );
    return result.rows.length ? this.mapVote(result.rows[0]) : null;
  }

  async countVotesByPollId(pollId) {
    const result = await this.pool.query('SELECT COUNT(*) as count FROM votes WHERE poll_id = $1', [pollId]);
    return parseInt(result.rows[0].count, 10);
  }

  // ── Mappers ───────────────────────────────────────────────────────────────

  mapPoll(row) {
    return new Poll({
      id: row.id,
      title: row.title,
      description: row.description,
      options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
      deadline: row.deadline,
      status: row.status,
      isAnonymous: row.is_anonymous,
      createdBy: row.created_by,
      createdById: row.created_by_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  mapVote(row) {
    return new Vote({
      id: row.id,
      pollId: row.poll_id,
      employeeId: row.employee_id,
      employeeUsername: row.employee_username,
      optionId: row.option_id,
      votedAt: row.voted_at,
    });
  }
}

module.exports = PostgresPollRepository;
