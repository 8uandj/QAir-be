const CountryService = require('../services/CountryService');

class CountryController {
  async create(req, res, next) {
    try {
      const country = await CountryService.createCountry(req.body);
      res.status(201).json({ success: true, data: country });
    } catch (error) {
      throw error;
    }
  }

  async getAll(req, res, next) {
    try {
      const countries = await CountryService.getCountries(req.query);
      res.status(200).json({ success: true, data: countries });
    } catch (error) {
      throw error;
    }
  }

  async getById(req, res, next) {
    try {
      const country = await CountryService.getCountryById(req.params.id);
      if (!country) {
        return res.status(404).json({ success: false, message: 'Country not found' });
      }
      res.status(200).json({ success: true, data: country });
    } catch (error) {
      throw error;
    }
  }

  async update(req, res, next) {
    try {
      const country = await CountryService.updateCountry(req.params.id, req.body);
      res.status(200).json({ success: true, data: country });
    } catch (error) {
      throw error;
    }
  }

  async delete(req, res, next) {
    try {
      const result = await CountryService.deleteCountry(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CountryController();