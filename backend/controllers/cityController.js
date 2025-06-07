const CityService = require('../services/CityService');

class CityController {
  async create(req, res, next) {
    try {
      const city = await CityService.createCity(req.body);
      res.status(201).json({ success: true, data: city });
    } catch (error) {
      throw error;
    }
  }

  async getAll(req, res, next) {
    try {
      const cities = await CityService.getCities(req.query);
      res.json({ success: true, data: cities });
    } catch (error) {
      throw error;
    }
  }

  async getById(req, res, next) {
    try {
      const city = await CityService.getCityById(req.params.id);
      if (!city) {
        return res.status(404).json({ success: false, message: 'City not found' });
      }
      res.json({ success: true, data: city });
    } catch (error) {
      throw error;
    }
  }

  async update(req, res, next) {
    try {
      const city = await CityService.updateCity(req.params.id, req.body);
      res.json({ success: true, data: city }); // Assuming service returns updated city data
    } catch (error) {
      throw error;
    }
  }

  async delete(req, res, next) {
    try {
      const result = await CityService.deleteCity(req.params.id);
      res.json({ success: true, data: result }); // Assuming service returns success indicator/deleted id
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CityController();