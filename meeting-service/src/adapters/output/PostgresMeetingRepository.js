const { Pool } = require('pg');
const Meeting = require('../../domain/entities/Meeting');

class PostgresMeetingRepository {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'meeting-db',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'meeting_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });
  }

  async create(meeting) {
    const query = `
      INSERT INTO meetings (title, description, date, start_time, end_time, type, room_id, meeting_link, meeting_platform, google_event_id, participants, created_by_id, created_by_username, status, change_request_data, cancellation_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    const values = [
      meeting.title,
      meeting.description,
      meeting.date,
      meeting.start_time,
      meeting.end_time,
      meeting.type,
      meeting.room_id,
      meeting.meeting_link,
      meeting.meeting_platform,
      meeting.google_event_id,
      meeting.participants,
      meeting.created_by_id,
      meeting.created_by_username,
      meeting.status,
      meeting.change_request_data,
      meeting.cancellation_reason
    ];
    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async findById(id) {
    const query = 'SELECT * FROM meetings WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async findByCreatorId(userId) {
    const query = `
      SELECT m.*, r.name as room_name
      FROM meetings m
      LEFT JOIN meeting_rooms r ON m.room_id = r.id
      WHERE m.created_by_id = $1
      ORDER BY m.date ASC, m.start_time ASC
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows
      .map(row => {
        try {
          return this.mapToEntity(row);
        } catch (err) {
          console.error(`Réunion invalide ignorée (id=${row.id}):`, err.message);
          return null;
        }
      })
      .filter(m => m !== null);
  }

  async findAll(filters = {}) {
    let query = 'SELECT * FROM meetings WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.date) {
      query += ` AND date = $${paramIndex}`;
      values.push(filters.date);
      paramIndex++;
    }

    query += ' ORDER BY date ASC, start_time ASC';

    const result = await this.pool.query(query, values);
    return result.rows
      .map(row => {
        try {
          return this.mapToEntity(row);
        } catch (err) {
          console.error(`Réunion invalide ignorée (id=${row.id}):`, err.message);
          return null;
        }
      })
      .filter(m => m !== null);
  }

  async findConflictingMeetings(roomId, date, startTime, endTime, excludeMeetingId = null) {
    let query = `
      SELECT * FROM meetings
      WHERE room_id = $1
      AND date = $2
      AND status IN ('CONFIRMED', 'PENDING')
      AND (
        (start_time < $3 AND end_time > $4)
      )
    `;
    const values = [roomId, date, endTime, startTime];

    if (excludeMeetingId) {
      query += ` AND id != $5`;
      values.push(excludeMeetingId);
    }

    const result = await this.pool.query(query, values);
    return result.rows
      .map(row => {
        try {
          return this.mapToEntity(row);
        } catch (err) {
          console.error(`Réunion invalide ignorée (id=${row.id}):`, err.message);
          return null;
        }
      })
      .filter(m => m !== null);
  }

  async update(meeting) {
    const query = `
      UPDATE meetings
      SET title = $1, description = $2, date = $3, start_time = $4, end_time = $5,
          type = $6, room_id = $7, meeting_link = $8, meeting_platform = $9, google_event_id = $10,
          participants = $11, status = $12, change_request_data = $13, cancellation_reason = $14
      WHERE id = $15
      RETURNING *
    `;
    const values = [
      meeting.title,
      meeting.description,
      meeting.date,
      meeting.start_time,
      meeting.end_time,
      meeting.type,
      meeting.room_id,
      meeting.meeting_link,
      meeting.meeting_platform,
      meeting.google_event_id,
      meeting.participants,
      meeting.status,
      meeting.change_request_data,
      meeting.cancellation_reason,
      meeting.id
    ];
    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async delete(id) {
    const query = 'DELETE FROM meetings WHERE id = $1';
    await this.pool.query(query, [id]);
  }

  mapToEntity(row) {
    return new Meeting({
      id: row.id,
      title: row.title,
      description: row.description,
      date: row.date,
      start_time: row.start_time,
      end_time: row.end_time,
      type: row.type,
      room_id: row.room_id,
      room_name: row.room_name,
      meeting_link: row.meeting_link,
      meeting_platform: row.meeting_platform,
      google_event_id: row.google_event_id,
      participants: row.participants,
      created_by_id: row.created_by_id,
      created_by_username: row.created_by_username,
      status: row.status,
      change_request_data: row.change_request_data,
      cancellation_reason: row.cancellation_reason,
      created_at: row.created_at,
      updated_at: row.updated_at
    });
  }
}

module.exports = PostgresMeetingRepository;
