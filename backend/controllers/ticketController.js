const ticketService = require('../services/TicketService');
const CustomerService = require('../services/CustomerService');
const bcrypt = require('bcrypt');

exports.bookTicket = async (req, res) => {
  try {
    const { flight_id, customer_id, ticket_class_id, cancellation_deadline, seat_number, price } = req.body;
    if (!flight_id || !customer_id || !ticket_class_id || !seat_number || !cancellation_deadline) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    const ticket = await ticketService.bookTicket({
      flight_id,
      customer_id,
      ticket_class_id,
      cancellation_deadline,
      seat_number,
      price
    }, req.user);

    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    console.error('🚨 Lỗi đặt vé:', err.message, err.stack);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.bookMultipleTickets = async (req, res) => {
  try {
    const { tickets, quantity } = req.body;

    console.log('📊 Controller bookMultipleTickets payload:', req.body);

    // Kiểm tra payload
    if (!Array.isArray(tickets) || tickets.length === 0 || tickets.length !== quantity) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách vé phải là mảng không rỗng và khớp với số lượng'
      });
    }

    // Kiểm tra các trường bắt buộc trong mỗi ticket
    const requiredFields = ['flight_id', 'customer_id', 'ticket_class_id', 'seat_number', 'price', 'cancellation_deadline'];
    for (const ticket of tickets) {
      for (const field of requiredFields) {
        if (!ticket[field]) {
          return res.status(400).json({
            success: false,
            message: `Thiếu trường ${field} trong vé`
          });
        }
      }
    }

    // Kiểm tra tính đồng nhất của flight_id, ticket_class_id, cancellation_deadline
    const { flight_id, ticket_class_id, cancellation_deadline } = tickets[0];
    const isConsistent = tickets.every(ticket =>
      ticket.flight_id === flight_id &&
      ticket.ticket_class_id === ticket_class_id &&
      (typeof ticket.cancellation_deadline === 'string'
        ? ticket.cancellation_deadline === cancellation_deadline
        : ticket.cancellation_deadline.toISOString() === (typeof cancellation_deadline === 'string'
            ? cancellation_deadline
            : cancellation_deadline.toISOString()))
    );
    if (!isConsistent) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu vé không đồng nhất (flight_id, ticket_class_id, hoặc cancellation_deadline khác nhau)'
      });
    }

    const result = await ticketService.bookMultipleTickets({
      tickets,
      quantity
    }, req.user);

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error('🚨 Lỗi đặt nhiều vé:', err.message, err.stack, { payload: req.body });
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.bookTicketWithCustomer = async (req, res) => {
  try {
    const { passengers, flight_id, ticket_class_id, cancellation_deadline } = req.body;
    if (!passengers?.length || !flight_id || !ticket_class_id) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    const tickets = await ticketService.bookTicketWithCustomer({
      passengers,
      flight_id,
      ticket_class_id,
      cancellation_deadline
    }, req.user);
    res.status(201).json({ success: true, tickets });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.cancelTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { password } = req.body;

    // Nếu không có user đăng nhập, yêu cầu mật khẩu
    if (!req.user && password) {
      const ticket = await ticketService.getTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy vé' });
      }
      const customer = await CustomerService.getCustomerById(ticket.customer_id);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
      }

      const isPasswordValid = await bcrypt.compare(password, customer.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Mật khẩu không đúng' });
      }

      const cancelled = await ticketService.cancelTicket(ticketId, customer.email);
      return res.json({ success: true, data: cancelled });
    }

    // Nếu có user đăng nhập, kiểm tra email
    const cancelled = await ticketService.cancelTicket(ticketId, req.user?.email);
    res.json({ success: true, data: cancelled });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.confirmTicket = async (req, res) => {
  try {
    const ticket = await ticketService.confirmTicket(req.params.id);
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getTicketByCode = async (req, res) => {
  console.log('Received code:', req.params.code);
  try {
    const ticket = await ticketService.getTicketByCode(req.params.code);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy vé' });
    }
    res.json({ success: true, ticket });
  } catch (err) {
    console.error('Error in getTicketByCode:', err);
    res.status(422).json({ success: false, errors: [{ msg: err.message }] });
  }
};

exports.getTicketsByEmail = async (req, res) => {
  try {
    const tickets = await ticketService.getTicketsByEmail(req.params.email);
    res.json({ success: true, data: tickets });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getTicketStats = async (req, res) => {
  try {
    const stats = await ticketService.getTicketStats(req.query);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};