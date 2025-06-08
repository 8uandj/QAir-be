// config/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('✅ Đã kết nối thành công với cơ sở dữ liệu PostgreSQL!');
});

pool.on('error', (err) => {
  console.error('❌ Lỗi kết nối cơ sở dữ liệu:', err.stack);
});
console.log('📊 Module db được export:', module.exports);
module.exports = pool;