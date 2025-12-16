const mysql = require('pg/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4'
});

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('✅ Database connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

// Helper functions
const db = {
  // Execute query
  async query(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  // Get single row
  async queryOne(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  },

  // Insert and return ID
  async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values);
    return result.insertId;
  },

  // Update by ID
  async update(table, id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    const [result] = await pool.execute(sql, [...values, id]);
    return result.affectedRows;
  },

  // Delete by ID
  async delete(table, id) {
    const sql = `DELETE FROM ${table} WHERE id = ?`;
    const [result] = await pool.execute(sql, [id]);
    return result.affectedRows;
  },

  // Get by ID
  async getById(table, id) {
    const sql = `SELECT * FROM ${table} WHERE id = ?`;
    return await this.queryOne(sql, [id]);
  },

  // Get all with optional conditions
  async getAll(table, where = '', params = []) {
    const sql = `SELECT * FROM ${table}${where ? ' WHERE ' + where : ''}`;
    return await this.query(sql, params);
  },

  // Transaction helper
  async transaction(callback) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Close pool
  async close() {
    await pool.end();
  }
};

module.exports = db;
