const { Pool } = require('pg');

class GoogleOAuthRepository {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'meeting-db',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'meeting_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
  }

  async getTokens(userId) {
    const query = 'SELECT * FROM google_oauth_tokens WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      expiry_date: new Date(row.expiry_date).getTime(),
    };
  }

  async upsertTokens(userId, tokens) {
    const query = `
      INSERT INTO google_oauth_tokens (user_id, access_token, refresh_token, expiry_date)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expiry_date = EXCLUDED.expiry_date,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const expiryDate = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);
    const values = [userId, tokens.access_token, tokens.refresh_token, expiryDate];
    await this.pool.query(query, values);
  }

  async updateTokens(userId, tokens) {
    const query = `
      UPDATE google_oauth_tokens
      SET access_token = $2,
          refresh_token = COALESCE($3, refresh_token),
          expiry_date = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `;
    const expiryDate = tokens.expiry_date
      ? new Date(typeof tokens.expiry_date === 'number' ? tokens.expiry_date : tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000);
    await this.pool.query(query, [userId, tokens.access_token, tokens.refresh_token, expiryDate]);
  }

  async isConnected(userId) {
    const tokens = await this.getTokens(userId);
    return tokens !== null;
  }

  async deleteTokens(userId) {
    await this.pool.query('DELETE FROM google_oauth_tokens WHERE user_id = $1', [userId]);
  }
}

module.exports = GoogleOAuthRepository;
