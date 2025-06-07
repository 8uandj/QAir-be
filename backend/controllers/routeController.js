// controllers/RouteController.js
const RouteService = require('../services/RouteService');
console.log('📊 RouteService trong RouteController:', RouteService);

class RouteController {
  async getAll(req, res) {
    try {
      const routes = await RouteService.getAll();
      res.set('Cache-Control', 'no-store');
      res.json({ success: true, data: routes });
    } catch (error) {
      console.log('❌ Lỗi trong RouteController.getAll:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async create(req, res) {
    try {
      const route = await RouteService.create(req.body);
      res.status(201).json({ success: true, data: route });
    } catch (error) {
      console.log('❌ Lỗi trong RouteController.create:', error.message);
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = new RouteController();