const AnnouncementService = require('../services/AnnouncementService');

class AnnouncementController {
  async getAll(req, res) {
    try {
      const announcements = await AnnouncementService.getAnnouncements(req.query);
      res.json({ success: true, data: announcements });
    } catch (err) {
      throw err;
    }
  }

  async create(req, res) {
    try {
      const announcement = await AnnouncementService.create(req.body);
      res.status(201).json({ success: true, data: announcement });
    } catch (err) {
      throw err;
    }
  }

  async update(req, res) {
    try {
      const announcement = await AnnouncementService.update(req.params.id, req.body);
      res.json({ success: true, data: announcement });
    } catch (err) {
      throw err;
    }
  }

  async delete(req, res) {
    try {
      const announcement = await AnnouncementService.delete(req.params.id);
      res.json({ success: true, data: announcement });
    } catch (err) {
      throw err;
    }
  }

  async getAnnouncementById(req, res) {
    try {
      const announcement = await AnnouncementService.getById(req.params.id);
      if (!announcement) {
        return res.status(404).json({ success: false, message: 'Announcement not found' });
      }
      res.json({ success: true, data: announcement });
    } catch (err) {
      throw err;
    }
  }

  async getAnnouncementsByType(req, res) {
    try {
      const { type } = req.query;
      console.log('Received request for type:', type);
      
      if (!type) {
        return res.status(400).json({ 
          success: false, 
          message: 'Type parameter is required' 
        });
      }

      const result = await AnnouncementService.getAnnouncements({ type });
      console.log('Found announcements:', result);
      
      res.json({ 
        success: true, 
        data: result.data 
      });
    } catch (err) {
      console.error('❌ Error in getAnnouncementsByType:', err);
      res.status(500).json({ 
        success: false, 
        message: err.message || 'Internal server error' 
      });
    }
  }
}

module.exports = new AnnouncementController();