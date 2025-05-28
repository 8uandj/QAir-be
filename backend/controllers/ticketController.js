const TicketService = require('../services/TicketService');
const ticketService = new TicketService();

exports.bookTicket = async (req, res) => {
  const ticket = await ticketService.bookTicket(req.body);
  res.status(201).json({ success: true, data: ticket });
};

exports.cancelTicket = async (req, res) => {
  const cancelled = await ticketService.cancelTicket(req.params.id);
  if (!cancelled) return res.status(404).json({ success: false, message: 'Ticket not found' });
  res.json({ success: true, data: cancelled });
};

exports.getTicketByCode = async (req, res) => {
  const ticket = await ticketService.getTicketByCode(req.params.code);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  res.json({ success: true, data: ticket });
};
