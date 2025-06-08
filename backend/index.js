// backend/index.js
require('dotenv').config();          //Load .env trước mọi thứ

const express   = require('express');
const cors      = require('cors');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const helmet    = require('helmet');
const router    = require('./routes/routes');

const app = express();

// Thiết lập kết nối PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432
});

// Kiểm tra kết nối database và thêm log
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Lỗi kết nối PostgreSQL:', err.stack);
    process.exit(1); // Thoát ứng dụng nếu kết nối thất bại
  }
  console.log('✅ Đã kết nối thành công với cơ sở dữ liệu PostgreSQL!');
  release();
});

/* ----------  Middleware toàn cục ---------- */
app.use(helmet());                   // Thêm bảo mật HTTP header
const corsOptions = {
  origin: 'http://localhost:3001', // Cho phép origin từ frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Các phương thức được phép
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires', 'x-user-id'], // Cho phép các header
  credentials: true // Nếu cần gửi cookie hoặc thông tin xác thực
};
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json());
app.use(rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 300, // 300 request mỗi phút
  message: { 
    success: false, 
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút',
    error: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true, // Trả về RateLimit-* headers
  legacyHeaders: false, // Không trả về X-RateLimit-* headers
}));

/* ----------  Router ---------- */
app.use('/api', router);

/* ----------  404 Not Found ---------- */
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Endpoint không tồn tại' });
});

/* ----------  Error Handler ---------- */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ'
  });
});

/* ----------  Khởi động server ---------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy trên cổng ${PORT}`));
