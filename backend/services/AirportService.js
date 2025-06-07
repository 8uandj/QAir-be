// services/AirportService.js
const db = require('../config/db');
console.log('📊 db trong AirportService:', db);

class AirportService {
  async getAll() {
    try {
      const result = await db.query('SELECT * FROM airports');
      return result.rows;
    } catch (error) {
      console.log('❌ Lỗi khi lấy danh sách sân bay:', error.message);
      throw new Error('Không thể lấy danh sách sân bay: ' + error.message);
    }
  }
}

module.exports = new AirportService();