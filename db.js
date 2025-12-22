// /root/gcz/db.js
const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const isSSL = process.env.DATABASE_SSL === 'true';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST || undefined,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  user: process.env.DB_USER || undefined,
  password: process.env.DB_PASS || undefined,
  database: process.env.DB_NAME || undefined,
  ssl: isSSL ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Optional test connection
(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL:', res.rows[0].now);
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
  }
})();

const db = {
  async query(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows;
  },

  async queryOne(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  },

  async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`);
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`;
    const result = await pool.query(sql, values);
    return result.rows[0]?.id || null;
  },

  async update(table, id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const sql = `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1}`;
    const result = await pool.query(sql, [...values, id]);
    return result.rowCount;
  },

  async delete(table, id) {
    const sql = `DELETE FROM ${table} WHERE id = $1`;
    const result = await pool.query(sql, [id]);
    return result.rowCount;
  },

  async getById(table, id) {
    return await this.queryOne(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  },

  async getAll(table, where = '', params = []) {
    const sql = `SELECT * FROM ${table}${where ? ' WHERE ' + where : ''}`;
    return await this.query(sql, params);
  },

  async transaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async close() {
    await pool.end();
  }
};

module.exports = db;
