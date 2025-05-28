const Ticket = require('../models/Ticket');
const db = require('../config/db');

class TicketService {
  async bookTicket(data) {
    const query = `
      INSERT INTO tickets (flight_id, customer_id, ticket_class_id, seat_number, price, booking_date, ticket_status, ticket_code, cancellation_deadline)
      VALUES ($1, $2, $3, $4, $5, NOW(), 'PendingPayment', gen_random_uuid(), $6)
      RETURNING *;
    `;
    const values = [
      data.flight_id,
      data.customer_id,
      data.ticket_class_id,
      data.seat_number,
      data.price,
      data.cancellation_deadline
    ];
    const result = await db.query(query, values);
    return new Ticket(result.rows[0]);
  }

  async cancelTicket(ticket_id) {
    const query = `
      UPDATE tickets
      SET ticket_status = 'Cancelled'
      WHERE id = $1
      RETURNING *;
    `;
    const result = await db.query(query, [ticket_id]);
    return result.rows.length > 0 ? new Ticket(result.rows[0]) : null;
  }

  async getTicketByCode(ticket_code) {
    const result = await db.query('SELECT * FROM tickets WHERE ticket_code = $1', [ticket_code]);
    return result.rows.length > 0 ? new Ticket(result.rows[0]) : null;
  }
}
module.exports = TicketService;