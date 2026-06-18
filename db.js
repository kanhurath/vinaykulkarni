const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'ecomee7u_ecomee7u-vkcms',
  password: process.env.DB_PASS || '0u+JmkrZRZ}M',
  database: process.env.DB_NAME || 'ecomee7u_vknodecms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
