// ============================================================
// Output Adapter — PostgresFavoriteRepository
// Implémentation PostgreSQL du repository de favoris
// ============================================================

const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'learning-db',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'learning_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

class PostgresFavoriteRepository {
  /**
   * Crée un favori en base de données
   * @param {{ employeeId, videoId, title, thumbnail, url }} data
   * @returns {Promise<object>} Favori créé
   */
  async create({ employeeId, videoId, title, thumbnail, url }) {
    const query = `
      INSERT INTO favorite_trainings (employee_id, video_id, title, thumbnail, url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [employeeId, videoId, title, thumbnail, url];
    const result = await pool.query(query, values);
    return this.mapToEntity(result.rows[0]);
  }

  /**
   * Trouve un favori par son ID
   * @param {number|string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const query = 'SELECT * FROM favorite_trainings WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  /**
   * Retourne tous les favoris d'un utilisateur, triés par date décroissante
   * @param {string} employeeId - sub Keycloak
   * @returns {Promise<Array>}
   */
  async findByEmployeeId(employeeId) {
    const query = `
      SELECT * FROM favorite_trainings
      WHERE employee_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [employeeId]);
    return result.rows.map(row => this.mapToEntity(row));
  }

  /**
   * Supprime un favori par son ID
   * @param {number|string} id
   */
  async delete(id) {
    const query = 'DELETE FROM favorite_trainings WHERE id = $1';
    await pool.query(query, [id]);
  }

  /**
   * Mappe une ligne Postgres vers l'entité domaine (camelCase)
   */
  mapToEntity(row) {
    return {
      id:         row.id,
      employeeId: row.employee_id,
      videoId:    row.video_id,
      title:      row.title,
      thumbnail:  row.thumbnail,
      url:        row.url,
      createdAt:  row.created_at,
    };
  }
}

module.exports = PostgresFavoriteRepository;
