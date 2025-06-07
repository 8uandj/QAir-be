const { validationResult } = require('express-validator');
const SeatService = require('../services/SeatService');

class SeatController {
  // Lấy bản đồ ghế của chuyến bay
  static async getSeatMap(req, res) {
    try {
      // Kiểm tra lỗi validate
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
      }

      const { flight_id } = req.params;
      const seatMap = await SeatService.getSeatMap(flight_id);
      res.status(200).json({ success: true, data: seatMap });
    } catch (error) {
      console.error('Error in getSeatMap controller:', error.message);
      const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }

  // Xác thực ghế được chọn
  static async validateSeat(req, res) {
    try {
      // Kiểm tra lỗi validate
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
      }

      const { flight_id, seat_number, ticket_class_id } = req.body;
      const result = await SeatService.validateSeat({ flight_id, seat_number, ticket_class_id });
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      console.error('Error in validateSeat controller:', error.message);
      const statusCode = error.message.includes('Không tìm thấy') || error.message.includes('Ghế đã được đặt') ? 400 : 500;
      res.status(statusCode).json({ success: false, message: error.message });
    }
  }
}

module.exports = SeatController;