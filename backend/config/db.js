// config/db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',      // Thay bằng user của bạn
  host: 'localhost',
  database: 'qairline',   // Thay bằng tên database của bạn
  password: 'postgres', // Thay bằng mật khẩu
  port: 5432,
});

pool.on('connect', () => {
  console.log('✅ Đã kết nối thành công với cơ sở dữ liệu PostgreSQL!');
});

pool.on('error', (err) => {
  console.error('❌ Lỗi kết nối cơ sở dữ liệu:', err.stack);
});
console.log('📊 Module db được export:', module.exports);
module.exports = pool;