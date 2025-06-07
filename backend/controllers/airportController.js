// controllers/AirportController.js
const AirportService = require('../services/AirportService');
console.log('📊 AirportService trong AirportController:', AirportService);

class AirportController {
  async getAll(req, res) {
    try {
      const airports = await AirportService.getAll();
      res.set('Cache-Control', 'no-store');
      res.json({ success: true, data: airports });
    } catch (error) {
      console.log('❌ Lỗi trong AirportController.getAll:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AirportController();