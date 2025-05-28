const TicketClass = require('../models/TicketClass');
const db = require('../config/db');

class TicketClassService {
  async getAll() {
    const result = await db.query('SELECT * FROM ticket_classes');
    return result.rows.map(row => new TicketClass(row));
  }
}
module.exports = TicketClassService;
