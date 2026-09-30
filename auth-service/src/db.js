const { Pool } = require('pg');

// Base dédiée aux codes de réinitialisation de mot de passe (auth-db)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5441,
  database: process.env.DB_NAME || 'auth_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  connectionTimeoutMillis: 10000,
});

module.exports = pool;
