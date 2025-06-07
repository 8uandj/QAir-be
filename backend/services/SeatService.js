const pool = require('../config/db');

class SeatService {
  // Lấy bản đồ ghế của chuyến bay
  static async getSeatMap(flightId) {
    const client = await pool.connect();
    try {
      // Lấy aircraft_id từ flights
      const flightResult = await client.query(
        'SELECT aircraft_id FROM flights WHERE id = $1',
        [flightId]
      );
      if (flightResult.rows.length === 0) {
        throw new Error('Không tìm thấy chuyến bay');
      }
      const { aircraft_id } = flightResult.rows[0];

      // Lấy seat_layout từ aircrafts
      const aircraftResult = await client.query(
        'SELECT seat_layout FROM aircrafts WHERE id = $1',
        [aircraft_id]
      );
      if (aircraftResult.rows.length === 0) {
        throw new Error('Không tìm thấy máy bay');
      }
      const seatLayout = aircraftResult.rows[0].seat_layout;

      // Lấy danh sách ghế đã đặt từ tickets
      const bookedSeatsResult = await client.query(
        'SELECT seat_number FROM tickets WHERE flight_id = $1 AND ticket_status != $2',
        [flightId, 'Cancelled']
      );
      const bookedSeats = bookedSeatsResult.rows.map(row => row.seat_number);

      // Tạo seat map với trạng thái ghế
      const seatMap = JSON.parse(JSON.stringify(seatLayout));
      ['first_class', 'business_class', 'economy_class'].forEach(classType => {
        if (seatMap[classType]) {
          seatMap[classType] = seatMap[classType].map(cabin => ({
            ...cabin,
            seats: cabin.seats.map(seat => ({
              seat_number: typeof seat === 'string' ? seat : seat.seat_number,
              is_booked: bookedSeats.includes(typeof seat === 'string' ? seat : seat.seat_number)
            }))
          }));
        }
      });

      console.log('📊 Seat map generated for flight:', flightId, seatMap);
      return seatMap;
    } catch (error) {
      console.error('Lỗi khi lấy bản đồ ghế:', error.message, error.stack);
      throw new Error(`Lỗi khi lấy bản đồ ghế: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Xác thực ghế được chọn
  static async validateSeat({ flight_id, seat_number, ticket_class_id }) {
    const client = await pool.connect();
    try {
      // Lấy aircraft_id từ flights
      const flightResult = await client.query(
        'SELECT aircraft_id FROM flights WHERE id = $1',
        [flight_id]
      );
      if (flightResult.rows.length === 0) {
        throw new Error('Không tìm thấy chuyến bay');
      }
      const { aircraft_id } = flightResult.rows[0];

      // Lấy seat_layout từ aircrafts
      const aircraftResult = await client.query(
        'SELECT seat_layout FROM aircrafts WHERE id = $1',
        [aircraft_id]
      );
      if (aircraftResult.rows.length === 0) {
        throw new Error('Không tìm thấy máy bay');
      }
      const { seat_layout } = aircraftResult.rows[0];

      // Lấy class_name từ ticket_classes
      const ticketClassResult = await client.query(
        'SELECT class_name FROM ticket_classes WHERE id = $1',
        [ticket_class_id]
      );
      if (ticketClassResult.rows.length === 0) {
        throw new Error('Không tìm thấy hạng vé');
      }
      const { class_name } = ticketClassResult.rows[0];
      const classKey = class_name.toLowerCase().replace(/\s+/g, '_');

      // Kiểm tra ghế có thuộc hạng vé không
      let isValidSeat = false;
      if (seat_layout[classKey]) {
        for (const cabin of seat_layout[classKey]) {
          const seats = cabin.seats.map(seat => typeof seat === 'string' ? seat : seat.seat_number);
          if (seats.includes(seat_number)) {
            isValidSeat = true;
            break;
          }
        }
      }
      if (!isValidSeat) {
        throw new Error('Ghế không thuộc hạng vé đã chọn');
      }

      // Kiểm tra ghế đã được đặt chưa
      const bookedSeatResult = await client.query(
        'SELECT 1 FROM tickets WHERE flight_id = $1 AND seat_number = $2 AND ticket_status != $3',
        [flight_id, seat_number, 'Cancelled']
      );
      if (bookedSeatResult.rows.length > 0) {
        throw new Error('Ghế đã được đặt');
      }

      console.log('📊 Validated seat:', { flight_id, seat_number, ticket_class_id });
      return { message: 'Ghế sẵn có' };
    } catch (error) {
      console.error('Lỗi khi xác thực ghế:', error.message, error.stack);
      throw new Error(`Lỗi khi xác thực ghế: ${error.message}`);
    } finally {
      client.release();
    }
  }
}

module.exports = SeatService;