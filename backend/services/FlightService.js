const Flight = require('../models/Flight');
const Ticket = require('../models/Ticket');
const Announcement = require('../models/Announcement');
const db = require('../config/db'); // PostgreSQL pool connection
const { hasAvailableSeats } = require('../utils/serviceUtils');

class FlightService {
   /** Lấy toàn bộ chuyến bay, sắp xếp theo giờ khởi hành tăng dần. */
  async getAllFlights() {
  try {
    const query = `
      SELECT 
        f.id,
        f.airline_id,
        f.flight_number,
        f.route_id,
        f.aircraft_id,
        f.departure_time,
        f.arrival_time,
        f.flight_status,
        f.base_economy_class_price,
        f.base_business_class_price,
        f.base_first_class_price,
        f.available_economy_class_seats,
        f.available_business_class_seats,
        f.available_first_class_seats,
        a.name AS airline_name,
        ac.aircraft_code,
        ac.aircraft_type,
        r.departure_airport_id,
        r.arrival_airport_id,
        d.name AS departure_airport_name,
        d.code AS departure_airport_code,
        ar.name AS arrival_airport_name,
        ar.code AS arrival_airport_code,
        cd.name AS departure_city_name,
        ca.name AS arrival_city_name
      FROM flights f
      JOIN airlines a ON f.airline_id = a.id
      JOIN aircrafts ac ON f.aircraft_id = ac.id
      JOIN routes r ON f.route_id = r.id
      JOIN airports d ON r.departure_airport_id = d.id
      JOIN airports ar ON r.arrival_airport_id = ar.id
      LEFT JOIN cities cd ON d.city_id = cd.id
      LEFT JOIN cities ca ON ar.city_id = ca.id
      WHERE f.flight_status != 'Cancelled'
      ORDER BY f.departure_time ASC;
    `;
    const flights = await db.query(query);
    console.log('📊 Tổng số chuyến bay trước khi lọc:', flights.rows.length);
    console.log('📊 Danh sách chuyến bay trước khi lọc:', flights.rows.map(f => ({
      id: f.id,
      flight_number: f.flight_number,
      status: f.flight_status,
      available_seats: {
        economy: f.available_economy_class_seats,
        business: f.available_business_class_seats,
        first: f.available_first_class_seats
      }
    })));

    const result = flights.rows.filter(flight => 
      flight.available_economy_class_seats > 0 || 
      flight.available_business_class_seats > 0 || 
      flight.available_first_class_seats > 0
    ).map(flight => ({
      ...flight,
      available_seats: {
        economy: flight.available_economy_class_seats,
        business: flight.available_business_class_seats,
        first: flight.available_first_class_seats
      }
    }));

    console.log('📊 Số chuyến bay sau khi lọc:', result.length);
    return result;
  } catch (error) {
    console.error('❌ Error fetching flights:', error.message);
    throw new Error(`Không thể lấy danh sách chuyến bay: ${error.message}`);
  }
}

  /**
   * Lấy chi tiết chuyến bay.
   * @param {number} id - ID chuyến bay.
   * @returns {Promise<Flight|null>}
   */
  async getFlightById(id) {
    const query = `
        SELECT 
            f.id,
            f.airline_id,
            f.flight_number,
            f.route_id,
            f.aircraft_id,
            f.departure_time,
            f.arrival_time,
            f.flight_status,
            f.base_economy_class_price,
            a.name AS airline_name,
            ac.aircraft_type,
            r.departure_airport_id,
            r.arrival_airport_id,
            d.name AS departure_airport_name,
            d.code AS departure_airport_code,
            ar.name AS arrival_airport_name,
            ar.code AS arrival_airport_code
        FROM flights f
        JOIN airlines a ON f.airline_id = a.id
        JOIN aircrafts ac ON f.aircraft_id = ac.id
        JOIN routes r ON f.route_id = r.id
        JOIN airports d ON r.departure_airport_id = d.id
        JOIN airports ar ON r.arrival_airport_id = ar.id
        WHERE f.id = $1;
    `;
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) return null;
    return result.rows[0]; 
}


    /**
   * Tìm chuyến bay theo chặng và ngày.
   * @param {Object} param0 - from_airport_id, to_airport_id, date (YYYY-MM-DD).
   * @returns {Promise<Array>} Danh sách chuyến bay khớp.
   */
  async searchFlights({ from_airport_id, to_airport_id, date }) {
  try {
    const query = `
      SELECT
        f.id,
        f.flight_number,
        a.name AS airline_name,
        ac.aircraft_type,
        f.departure_time,
        f.arrival_time,
        f.available_economy_class_seats,
        f.available_business_class_seats,
        f.available_first_class_seats,
        f.base_economy_class_price,
        f.base_business_class_price,
        f.base_first_class_price,
        cd.name AS departure_city_name,
        ca.name AS arrival_city_name
      FROM flights f
      JOIN routes r ON f.route_id = r.id
      JOIN airlines a ON f.airline_id = a.id
      JOIN aircrafts ac ON f.aircraft_id = ac.id
      JOIN airports d ON r.departure_airport_id = d.id
      JOIN airports ar ON r.arrival_airport_id = ar.id
      LEFT JOIN cities cd ON d.city_id = cd.id
      LEFT JOIN cities ca ON ar.city_id = ca.id
      WHERE r.departure_airport_id = $1
        AND r.arrival_airport_id = $2
        AND DATE(f.departure_time) = $3
        AND f.flight_status != 'Cancelled'
      ORDER BY f.departure_time ASC;
    `;
    
    const result = await db.query(query, [from_airport_id, to_airport_id, date]);
    
    return result.rows.map(row => ({
      id: row.id,
      flight_number: row.flight_number,
      airline_name: row.airline_name,
      aircraft_type: row.aircraft_type,
      departure_time: row.departure_time,
      arrival_time: row.arrival_time,
      available_economy_class_seats: row.available_economy_class_seats,
      available_business_class_seats: row.available_business_class_seats,
      available_first_class_seats: row.available_first_class_seats,
      base_economy_class_price: row.base_economy_class_price,
      base_business_class_price: row.base_business_class_price,
      base_first_class_price: row.base_first_class_price,
      departure_city_name: row.departure_city_name,
      arrival_city_name: row.arrival_city_name
    }));
  } catch (error) {
    console.error('❌ Error searching flights:', error.message);
    throw new Error(`Không thể tìm kiếm chuyến bay: ${error.message}`);
  }
}


   /**
   * Trì hoãn chuyến bay, đồng thời:
   * 1. Cập nhật bảng flights.
   * 2. Cập nhật deadline huỷ vé.
   * 3. Tạo thông báo Delay.
   * @param {number} flightId
   * @param {Date} newDeparture
   * @param {Date} newArrival
   * @param {number} createdBy - ID nhân viên thực hiện.
   */
  async delayFlight(flightId, newDeparture, newArrival, createdBy) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Cập nhật bảng flights
      const updateFlightQuery = `
        UPDATE flights
        SET departure_time = $1,
            arrival_time = $2,
            flight_status = 'Delayed'
        WHERE id = $3
        RETURNING *;
      `;
      const flightResult = await client.query(updateFlightQuery, [newDeparture, newArrival, flightId]);
      if (flightResult.rows.length === 0) {
        throw new Error('Flight not found');
      }
      const updatedFlight = new Flight(flightResult.rows[0]);

      // Cập nhật cancellation_deadline trong bảng tickets
      const updateTicketsQuery = `
        UPDATE tickets
        SET cancellation_deadline = $1
        WHERE flight_id = $2
        RETURNING *;
      `;
      const newCancellationDeadline = new Date(newDeparture.getTime() + 60 * 60 * 1000); // +1 giờ
      const ticketsResult = await client.query(updateTicketsQuery, [newCancellationDeadline, flightId]);
      const updatedTickets = ticketsResult.rows.map(row => new Ticket(row));

      // Tạo thông báo mới trong bảng announcements
      const announcementQuery = `
        INSERT INTO announcements (title, content, type, published_date, expiry_date, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const announcementTitle = `Flight ${updatedFlight.flight_number} Delayed`;
      const announcementContent = `Flight ${updatedFlight.flight_number} has been delayed. New departure: ${newDeparture.toISOString()}, New arrival: ${newArrival.toISOString()}.`;
      const announcementType = 'Delay';
      const publishedDate = new Date();
      const expiryDate = new Date(publishedDate.getTime() + 24 * 60 * 60 * 1000); // Hết hạn sau 24 giờ
      const announcementResult = await client.query(announcementQuery, [
        announcementTitle,
        announcementContent,
        announcementType,
        publishedDate,
        expiryDate,
        createdBy
      ]);
      const newAnnouncement = new Announcement(announcementResult.rows[0]);

      await client.query('COMMIT');

      return {
        updatedFlight,
        updatedTickets,
        newAnnouncement
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }


   /**
   * Tạo chuyến bay mới.
   * @param {Object} data - Thông tin chuyến bay.
   * @returns {Promise<Flight>}
   */
  // services/FlightService.js
async createFlight(data) {
  const client = await db.connect();
  try {
    console.log('📊 Dữ liệu tạo chuyến bay:', data);
    await client.query('BEGIN');

    const flight = new Flight(data);
    const query = `
      INSERT INTO flights (
        airline_id, route_id, aircraft_id, flight_number,
        departure_time, arrival_time, flight_status,
        base_economy_class_price, base_business_class_price, base_first_class_price
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      flight.airline_id,
      flight.route_id,
      flight.aircraft_id,
      flight.flight_number,
      flight.departure_time,
      flight.arrival_time,
      flight.flight_status,
      flight.base_economy_class_price,
      flight.base_business_class_price || 0,
      flight.base_first_class_price || 0
    ];
    console.log('📊 Giá trị gửi vào truy vấn:', values);
    const result = await client.query(query, values);

    await client.query('COMMIT');
    return new Flight(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.log('❌ Lỗi khi tạo chuyến bay:', error.message);
    throw new Error(`Lỗi khi tạo chuyến bay: ${error.message}`);
  } finally {
    client.release();
  }
}
  /**
 * Hủy chuyến bay: đổi flight_status → 'Cancelled' + hủy vé còn hiệu lực
 * + Tuỳ chọn ghi announcement cho hành khách.
 * @param {number} flightId
 * @param {Object} [opts]
 * @param {string} [opts.reason]      – Nội dung thông báo (có thể rỗng)
 * @param {number} [opts.employeeId]  – ID nhân viên tạo announcement (nullable)
 * @returns {Promise<Flight>}
 */
async cancelFlight(flightId, opts = {}) {
  const { reason = '', employeeId = null } = opts;
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Đổi trạng thái chuyến bay
    const flightRes = await client.query(
      `UPDATE flights
         SET flight_status = 'Cancelled'
       WHERE id = $1
       RETURNING *`,
      [flightId]
    );
    if (flightRes.rows.length === 0) throw new Error('Flight not found');

    // 2. Hủy toàn bộ vé chưa bị huỷ
    await client.query(
      `UPDATE tickets
         SET ticket_status = 'Cancelled'
       WHERE flight_id = $1
         AND ticket_status <> 'Cancelled'`,
      [flightId]
    );

    // 3. Ghi announcement (không bắt buộc)
    if (employeeId) {
      await client.query(
        `INSERT INTO announcements
           (title, content, type, published_date, created_by)
         VALUES ($1, $2, 'Cancel', NOW(), $3)`,
        [`Chuyến bay ${flightRes.rows[0].flight_number} bị huỷ`, reason, employeeId]
      );
    }

    await client.query('COMMIT');
    return new Flight(flightRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Xoá cứng chuyến bay – CHỈ khi chưa có vé.
 * @param {number} id
 * @returns {Promise<{deleted: true}>}
 */
async deleteFlight(id) {
  const ref = await db.query(
    'SELECT 1 FROM tickets WHERE flight_id = $1 LIMIT 1',
    [id]
  );
  if (ref.rows.length) {
    throw new Error('Cannot delete: flight already has tickets');
  }
  await db.query('DELETE FROM flights WHERE id = $1', [id]);
  return { deleted: true };
}
}
module.exports = FlightService;