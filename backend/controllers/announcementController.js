const AnnouncementService = require('../services/AnnouncementService');
const announcementService = new AnnouncementService();

exports.getAll = async (req, res) => {
  const announcements = await announcementService.getAll();
  res.json({ success: true, data: announcements });
};

exports.create = async (req, res) => {
  const announcement = await announcementService.create(req.body);
  res.status(201).json({ success: true, data: announcement });
};
