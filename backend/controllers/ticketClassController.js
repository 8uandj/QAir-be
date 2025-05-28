const TicketClassService = require('../services/TicketClassService');
const ticketClassService = new TicketClassService();

exports.getAll = async (req, res) => {
  const classes = await ticketClassService.getAll();
  res.json({ success: true, data: classes });
};