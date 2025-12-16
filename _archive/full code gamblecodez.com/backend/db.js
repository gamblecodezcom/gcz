const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'gcadmin',
  password: process.env.DB_PASSWORD || 'yourpassword',
  database: process.env.DB_NAME || 'gamblecodez',
  connectionLimit: 10
});

module.exports = pool;