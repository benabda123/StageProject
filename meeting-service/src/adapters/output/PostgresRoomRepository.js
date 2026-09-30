const { Pool } = require('pg');
const MeetingRoom = require('../../domain/entities/MeetingRoom');

class PostgresRoomRepository {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'meeting-db',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'meeting_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });
  }

  async create(room) {
    const query = `
      INSERT INTO meeting_rooms (name, capacity, equipment)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [room.name, room.capacity, room.equipment];
    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async findById(id) {
    const query = 'SELECT * FROM meeting_rooms WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.mapToEntity(result.rows[0]);
  }

  async findAll() {
    const query = 'SELECT * FROM meeting_rooms ORDER BY name ASC';
    const result = await this.pool.query(query);
    return result.rows.map(row => this.mapToEntity(row));
  }

  async update(room) {
    const query = `
      UPDATE meeting_rooms
      SET name = $1, capacity = $2, equipment = $3
      WHERE id = $4
      RETURNING *
    `;
    const values = [room.name, room.capacity, room.equipment, room.id];
    const result = await this.pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  async delete(id) {
    const query = 'DELETE FROM meeting_rooms WHERE id = $1';
    await this.pool.query(query, [id]);
  }

  mapToEntity(row) {
    return new MeetingRoom({
      id: row.id,
      name: row.name,
      capacity: row.capacity,
      equipment: row.equipment,
      created_at: row.created_at,
      updated_at: row.updated_at
    });
  }
}

module.exports = PostgresRoomRepository;
