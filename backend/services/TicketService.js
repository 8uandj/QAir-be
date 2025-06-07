const Ticket = require('../models/Ticket');
const CustomerService = require('./CustomerService');
const db = require('../config/db');
const {
  hasAvailableSeats,
  seatColumnByClass,
  basePriceFieldByClass
} = require('../utils/serviceUtils');
const crypto = require('crypto');

function generateTicketCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'TICKET-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code; //
}

class TicketService {
  /**
   * Lấy vé theo ID.
   * @param {number} ticketId
   * @returns {Promise<Object|null>}
   */
  async getTicketById(ticketId) {
    const result = await db.query(
      'SELECT * FROM tickets WHERE id = $1',
      [ticketId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Book 1 vé đơn lẻ (hàm nội bộ, khoá chuyến bay & trừ ghế).
   * @param {Object} data
   * @param {number} quantity - Số ghế (mặc định 1).
   * @returns {Promise<Ticket>}
   */
  async bookTicket(data) {
  const { flight_id, customer_id, ticket_class_id, cancellation_deadline, seat_number, price } = data;

  console.log('📊 bookTicket payload:', data);

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const flightRes = await client.query(
      'SELECT f.*, a.seat_layout FROM flights f JOIN aircrafts a ON f.aircraft_id = a.id WHERE f.id = $1 FOR UPDATE',
      [flight_id]
    );
    if (flightRes.rows.length === 0) throw new Error('Không tìm thấy chuyến bay');
    const flight = flightRes.rows[0];
    const seatLayout = flight.seat_layout;

    const classRes = await client.query(
      'SELECT * FROM ticket_classes WHERE id = $1',
      [ticket_class_id]
    );
    if (classRes.rows.length === 0) throw new Error('Không tìm thấy hạng vé');
    const ticketClass = classRes.rows[0];
    const className = ticketClass.class_name;
    const classKey = className.toLowerCase().replace(/\s+/g, '_');

    const seatColumn = `available_${classKey}_seats`;
    const availableSeats = flight[seatColumn];
    if (availableSeats === undefined) {
      throw new Error(`Cột ${seatColumn} không tồn tại trong bảng flights`);
    }
    if (availableSeats < 1) {
      throw new Error('Không đủ ghế trống');
    }

    if (!seat_number) {
      throw new Error('Thiếu số ghế');
    }
    let isValidSeat = false;
    if (seatLayout[classKey]) {
      for (const cabin of seatLayout[classKey]) {
        if (cabin.seats.includes(seat_number)) {
          isValidSeat = true;
          break;
        }
      }
    }
    if (!isValidSeat) {
      throw new Error(`Ghế ${seat_number} không hợp lệ cho hạng vé ${className}`);
    }

    const seatCheck = await client.query(
      'SELECT 1 FROM tickets WHERE flight_id = $1 AND seat_number = $2 AND ticket_status != $3',
      [flight_id, seat_number, 'Cancelled']
    );
    if (seatCheck.rows.length > 0) throw new Error(`Ghế ${seat_number} đã được đặt`);

    const basePriceField = basePriceFieldByClass(className);
    const ticketPrice = price || (flight[basePriceField] * ticketClass.coefficient);

    let standardizedCode;
    let codeExists = true;
    while (codeExists) {
      standardizedCode = generateTicketCode();
      const checkRes = await client.query(
        'SELECT 1 FROM ticket_codes WHERE standardized_code = $1',
        [standardizedCode]
      );
      codeExists = checkRes.rows.length > 0;
    }

    const uuidTicketCode = crypto.randomUUID();

    await client.query(
      `UPDATE flights SET ${seatColumn} = ${seatColumn} - 1 WHERE id = $1`,
      [flight_id]
    );

    const ticketRes = await client.query(
      `INSERT INTO tickets (
        flight_id, customer_id, ticket_class_id,
        seat_number, price, booking_date,
        ticket_status, ticket_code, cancellation_deadline
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), 'Confirmed', $6, $7)
      RETURNING *`,
      [flight_id, customer_id, ticket_class_id, seat_number, ticketPrice, uuidTicketCode, cancellation_deadline]
    );

    await client.query(
      `INSERT INTO ticket_codes (standardized_code, ticket_code)
       VALUES ($1, $2)`,
      [standardizedCode, uuidTicketCode]
    );

    await client.query('COMMIT');
    const ticket = new Ticket(ticketRes.rows[0]);
    ticket.standardized_code = standardizedCode;
    return ticket;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('📊 bookTicket error:', err.message, err.stack);
    throw err;
  } finally {
    client.release();
  }
}

async bookMultipleTickets(data, user) {
  const { tickets, quantity } = data;

  console.log('📊 bookMultipleTickets payload:', data);
  console.log('📊 User:', user);

  if (!Array.isArray(tickets) || tickets.length !== quantity) {
    throw new Error('Số lượng vé không khớp với số vé yêu cầu');
  }

  const { flight_id, ticket_class_id, cancellation_deadline } = tickets[0];
  const seat_ids = tickets.map(ticket => ticket.seat_number);
  const customer_ids = tickets.map(ticket => ticket.customer_id);
  const prices = tickets.map(ticket => ticket.price || null);

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const flightRes = await client.query(
      'SELECT f.*, a.seat_layout FROM flights f JOIN aircrafts a ON f.aircraft_id = a.id WHERE f.id = $1 FOR UPDATE',
      [flight_id]
    );
    if (flightRes.rows.length === 0) throw new Error('Không tìm thấy chuyến bay');
    const flight = flightRes.rows[0];
    const seatLayout = flight.seat_layout;

    const classRes = await client.query(
      'SELECT * FROM ticket_classes WHERE id = $1',
      [ticket_class_id]
    );
    if (classRes.rows.length === 0) throw new Error('Không tìm thấy hạng vé');
    const ticketClass = classRes.rows[0];
    const className = ticketClass.class_name;
    const classKey = className.toLowerCase().replace(/\s+/g, '_');

    const seatColumn = `available_${classKey}_seats`;
    const availableSeats = flight[seatColumn];
    if (availableSeats === undefined) {
      throw new Error(`Cột ${seatColumn} không tồn tại trong bảng flights`);
    }
    if (availableSeats < quantity) {
      throw new Error(`Không đủ ghế trống: chỉ còn ${availableSeats} ghế`);
    }

    for (const seat_number of seat_ids) {
      let isValidSeat = false;
      if (seatLayout[classKey]) {
        for (const cabin of seatLayout[classKey]) {
          if (cabin.seats.includes(seat_number)) {
            isValidSeat = true;
            break;
          }
        }
      }
      if (!isValidSeat) {
        throw new Error(`Ghế ${seat_number} không hợp lệ cho hạng vé ${className}`);
      }

      const seatCheck = await client.query(
        'SELECT 1 FROM tickets WHERE flight_id = $1 AND seat_number = $2 AND ticket_status != $3',
        [flight_id, seat_number, 'Cancelled']
      );
      if (seatCheck.rows.length > 0) throw new Error(`Ghế ${seat_number} đã được đặt`);
    }

    for (const customer_id of customer_ids) {
      const customerCheck = await client.query(
        'SELECT 1 FROM customers WHERE id = $1',
        [customer_id]
      );
      if (customerCheck.rows.length === 0) throw new Error(`ID khách hàng ${customer_id} không tồn tại`);
    }

    if (user && !customer_ids.includes(user.id)) {
      throw new Error('Người dùng không có quyền đặt vé cho khách hàng khác');
    }

    const basePriceField = basePriceFieldByClass(className);
    const defaultTicketPrice = flight[basePriceField] * ticketClass.coefficient;

    await client.query(
      `UPDATE flights SET ${seatColumn} = ${seatColumn} - $1 WHERE id = $2`,
      [quantity, flight_id]
    );

    const ticketsCreated = [];
    let groupTicketCode;
    let codeExists = true;
    while (codeExists) {
      groupTicketCode = generateTicketCode();
      const checkRes = await client.query(
        'SELECT 1 FROM ticket_codes WHERE standardized_code = $1',
        [groupTicketCode]
      );
      codeExists = checkRes.rows.length > 0;
    }

    for (let i = 0; i < tickets.length; i++) {
      const seat_number = seat_ids[i];
      const customer_id = customer_ids[i];
      const ticketPrice = prices[i] || defaultTicketPrice;
      const uuidTicketCode = crypto.randomUUID();

      const ticketRes = await client.query(
        `INSERT INTO tickets (
          flight_id, customer_id, ticket_class_id,
          seat_number, price, booking_date,
          ticket_status, ticket_code, cancellation_deadline
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), 'Confirmed', $6, $7)
        RETURNING *`,
        [flight_id, customer_id, ticket_class_id, seat_number, ticketPrice, uuidTicketCode, cancellation_deadline]
      );

      await client.query(
        `INSERT INTO ticket_codes (standardized_code, ticket_code)
         VALUES ($1, $2)`,
        [`${groupTicketCode}-${i + 1}`, uuidTicketCode]
      );

      const ticket = new Ticket(ticketRes.rows[0]);
      ticket.standardized_code = `${groupTicketCode}-${i + 1}`;
      ticketsCreated.push(ticket);
    }

    await client.query('COMMIT');
    return {
      standardized_code: groupTicketCode, // Thay ticket_code bằng standardized_code
      tickets: ticketsCreated
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('🚨 bookMultipleTickets lỗi:', err.message, err.stack);
    throw new Error(`Lỗi đặt nhiều vé: ${err.message} (flight_id: ${flight_id}, ticket_class: ${className}, seats: ${seat_ids.join(', ')}, customers: ${customer_ids.join(', ')})`);
  } finally {
    client.release();
  }
}

  async bookTicketWithCustomer(data, user = null) {
    const { passengers, flight_id, ticket_class_id, cancellation_deadline } = data;
    if (!passengers?.length) throw new Error('Danh sách hành khách là bắt buộc');

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Lấy thông tin hạng vé
      const classRes = await client.query(
        'SELECT * FROM ticket_classes WHERE id = $1',
        [ticket_class_id]
      );
      if (classRes.rows.length === 0) throw new Error('Không tìm thấy hạng vé');
      const ticketClass = classRes.rows[0];
      const className = ticketClass.class_name;

      // Lock chuyến bay và kiểm tra số ghế
      const flightRes = await client.query(
        'SELECT * FROM flights WHERE id = $1 FOR UPDATE',
        [flight_id]
      );
      if (flightRes.rows.length === 0) throw new Error('Không tìm thấy chuyến bay');
      if (!hasAvailableSeats(flightRes.rows[0], className, passengers.length)) {
        throw new Error('Không đủ ghế trống cho tất cả hành khách');
      }

      const tickets = [];
      for (const passenger of passengers) {
        const { email, first_name, last_name, phone_number, identity_number, seat_number, price } = passenger;
        if (!email || !first_name || !last_name || !phone_number) {
          throw new Error('Thông tin hành khách không đầy đủ');
        }

        // Tìm hoặc tạo khách hàng
        let customer;
        if (user?.columns?.includes('email') && user.email === email) {
          customer = await CustomerService.updateCustomer(user.id, {
            first_name, last_name, phone_number, identity_number, email
          });
        } else {
          const exist = await client.query(
            'SELECT id FROM customers WHERE email = $1 FOR UPDATE',
            [email]
          );
          if (exist.rows.length) {
            customer = await CustomerService.updateCustomer(exist.rows[0].id, {
              first_name, last_name, phone_number, identity_number, email
            });
          } else {
            customer = await CustomerService.createCustomer({
              email, first_name, last_name, phone_number, identity_number
            });
          }
        }

        // Đặt vé cho từng hành khách
        const ticket = await this.bookTicket({
          flight_id,
          customer_id: customer.id,
          ticket_class_id,
          seat_number,
          price,
          cancellation_deadline
        }, 1);

        tickets.push({ ticket, customer: { id: customer.id, email, first_name, last_name } });
      }

      await client.query('COMMIT');
      return tickets;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async cancelTicket(ticket_id, email = null) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Lock vé và lấy thông tin
      const ticketRes = await client.query(
        `SELECT t.*, c.email
         FROM tickets t
         JOIN customers c ON t.customer_id = c.id
         WHERE t.id = $1
         FOR UPDATE`,
        [ticket_id]
      );
      if (!ticketRes.rows.length) throw new Error('Không tìm thấy vé');
      const ticket = ticketRes.rows[0];
      if (email && ticket.email !== email) throw new Error('Email không khớp với chủ sở hữu vé');
      if (ticket.ticket_status === 'Cancelled') throw new Error('Vé đã được hủy');
      if (new Date() >= new Date(ticket.cancellation_deadline)) throw new Error('Đã quá hạn hủy vé');

      // Lấy tên hạng vé và cột ghế
      const classRes = await client.query(
        'SELECT class_name FROM ticket_classes WHERE id = $1',
        [ticket.ticket_class_id]
      );
      const className = classRes.rows[0].class_name;
      const seatColumn = seatColumnByClass(className);

      // Hủy vé và trả ghế
      const cancelRes = await client.query(
        `UPDATE tickets SET ticket_status = 'Cancelled' WHERE id = $1 RETURNING *`,
        [ticket_id]
      );
      await client.query(
        `UPDATE flights SET ${seatColumn} = ${seatColumn} + 1 WHERE id = $1`,
        [ticket.flight_id]
      );

      await client.query('COMMIT');
      return new Ticket(cancelRes.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /** Xác nhận vé từ PendingPayment → Confirmed. */
  async confirmTicket(ticket_id) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `UPDATE tickets SET ticket_status = 'Confirmed' WHERE id = $1 AND ticket_status = 'PendingPayment' RETURNING *`,
        [ticket_id]
      );
      if (!result.rows.length) throw new Error('Ticket not found or not in PendingPayment status');
      await client.query('COMMIT');
      return new Ticket(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /** Tìm vé theo ticket_code (UUID). */
  async getTicketByCode(code) {
  console.log('TicketService received code:', code);

  try {
    // Tìm ticket_code UUID từ bảng ticket_codes
    const codeRes = await db.query(
      'SELECT ticket_code FROM ticket_codes WHERE standardized_code = $1',
      [code]
    );
    if (codeRes.rows.length === 0) {
      return null; // Không tìm thấy mã vé
    }
    const ticketCode = codeRes.rows[0].ticket_code;

    // Tìm vé bằng ticket_code UUID
    const query = `
      SELECT 
        t.id,
        t.flight_id,
        t.ticket_status,
        t.ticket_code,
        t.price,
        t.seat_number,
        t.cancellation_deadline,
        f.flight_number,
        f.departure_time,
        f.arrival_time,
        d.name AS departure_airport_name,
        a.name AS arrival_airport_name,
        c.first_name,
        c.last_name,
        c.email,
        c.phone_number,
        c.identity_number,
        c.birth_date
      FROM tickets t
      JOIN flights f ON t.flight_id = f.id
      JOIN routes r ON f.route_id = r.id
      JOIN airports d ON r.departure_airport_id = d.id
      JOIN airports a ON r.arrival_airport_id = a.id
      JOIN customers c ON t.customer_id = c.id
      WHERE t.ticket_code = $1
    `;
    const result = await db.query(query, [ticketCode]);
    if (result.rows.length === 0) {
      return null;
    }

    // Thêm standardized_code vào phản hồi
    const ticket = result.rows[0];
    ticket.standardized_code = code;
    return ticket;
  } catch (err) {
    console.error('Error querying ticket:', err);
    throw new Error('Lỗi khi tra cứu vé: ' + err.message);
  }
}

  /** Lấy toàn bộ vé của 1 email khách hàng, kèm thông tin chuyến bay và khách hàng. */
  async getTicketsByEmail(email) {
    const result = await db.query(
      `
      SELECT 
        t.*,
        f.flight_number,
        f.departure_time,
        f.arrival_time,
        a.name AS airline_name,
        r.departure_airport_id,
        r.arrival_airport_id,
        d.name AS departure_airport,
        a2.name AS arrival_airport,
        c.first_name,
        c.last_name,
        c.email,
        c.phone_number,
        c.identity_number,
        c.birth_date
      FROM tickets t
      JOIN customers c ON t.customer_id = c.id
      JOIN flights f ON t.flight_id = f.id
      JOIN airlines a ON f.airline_id = a.id
      JOIN routes r ON f.route_id = r.id
      JOIN airports d ON r.departure_airport_id = d.id
      JOIN airports a2 ON r.arrival_airport_id = a2.id
      WHERE c.email = $1
      ORDER BY t.booking_date DESC
      `,
      [email]
    );
    return result.rows.map(row => ({
      ticket: new Ticket(row),
      flight_info: {
        flight_number: row.flight_number,
        departure_time: row.departure_time,
        arrival_time: row.arrival_time,
        airline_name: row.airline_name,
        departure_airport: row.departure_airport,
        arrival_airport: row.arrival_airport
      },
      customer: {
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        phone_number: row.phone_number,
        identity_number: row.identity_number
      }
    }));
  }

  /**
   * Thống kê vé theo điều kiện.
   * @param {Object} filters - flight_id, start_date, end_date, ticket_status.
   * @returns {Promise<Object>} Số vé & doanh thu.
   */
  async getTicketStats({ flight_id, start_date, end_date, ticket_status }) {
    let query = `
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN ticket_status = 'Confirmed' THEN 1 ELSE 0 END) as confirmed_tickets,
        SUM(CASE WHEN ticket_status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_tickets,
        SUM(CASE WHEN ticket_status = 'PendingPayment' THEN 1 ELSE 0 END) as pending_tickets,
        SUM(price) as total_revenue
      FROM tickets
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (flight_id) {
      query += ` AND flight_id = $${paramIndex++}`;
      values.push(flight_id);
    }
    if (start_date) {
      query += ` AND booking_date >= $${paramIndex++}`;
      values.push(start_date);
    }
    if (end_date) {
      query += ` AND booking_date <= $${paramIndex++}`;
      values.push(end_date);
    }
    if (ticket_status) {
      query += ` AND ticket_status = $${paramIndex++}`;
      values.push(ticket_status);
    }

    const result = await db.query(query, values);
    return result.rows[0];
  }
}

module.exports = new TicketService();