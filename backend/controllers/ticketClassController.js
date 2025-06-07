const TicketClassService = require('../services/TicketClassService');
const ticketClassService = new TicketClassService();

exports.getAll = async (req, res) => {
  try {
    const classes = await ticketClassService.getAll();
    res.json({ success: true, data: classes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPerks = async (req, res) => {
  try {
    const perks = await ticketClassService.getPerksForTicketClass(req.params.id);
    res.json({ success: true, data: perks });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const ticketClass = await ticketClassService.create(req.body);
    res.status(201).json({ success: true, data: ticketClass });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const ticketClass = await ticketClassService.update(req.params.id, req.body);
    res.json({ success: true, data: ticketClass });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const result = await ticketClassService.deleteTicketClass(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};