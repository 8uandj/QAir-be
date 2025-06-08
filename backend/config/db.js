require('dotenv').config(); // Load biến môi trường từ .env

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
  console.log('✅ Đã kết nối thành công với cơ sở dữ liệu PostgreSQL!');
});

pool.on('error', (err) => {
  console.error('❌ Lỗi kết nối cơ sở dữ liệu:', err.stack);
});

module.exports = pool;