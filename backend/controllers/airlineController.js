const AirlineService = require('../services/AirlineService');

class AirlineController {
  async getAll(req, res) {
    try {
      const airlines = await AirlineService.getAll();
      res.set('Cache-Control', 'no-store');
      res.json({ success: true, data: airlines });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async create(req, res) {
    try {
      const airline = await AirlineService.create(req.body);
      res.status(201).json({ success: true, data: airline });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AirlineController();