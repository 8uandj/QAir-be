// backend/index.js
require('dotenv').config();          //Load .env trước mọi thứ

const express   = require('express');
const cors      = require('cors');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet    = require('helmet');
const router    = require('./routes/routes');
const pool = require('./config/db'); // Import Pool từ db.js
const app = express();


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
const cors = require('cors');

const corsOptions = {
  origin: (origin, callback) => {
    // Cho phép các request không có origin (như từ Postman hoặc các client không phải browser)
    if (!origin) {
      return callback(null, true);
    }

    // Cho phép localhost cho môi trường phát triển
    if (origin.includes('localhost')) {
      return callback(null, true);
    }

    // Kiểm tra nếu origin kết thúc bằng .netlify.app
    if (origin.endsWith('.netlify.app')) {
      return callback(null, true);
    }

    // Từ chối các origin không khớp
    return callback(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires', 'x-user-id'],
  credentials: true
};

// Áp dụng CORS middleware
app.use(cors(corsOptions));
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau' }
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

// index.js
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

