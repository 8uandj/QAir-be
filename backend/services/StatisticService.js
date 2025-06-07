
const db = require('../config/db');

class StatisticService {
  /**
   * getStats()
   * ----------------------------------------------------------------
   * - Tổng số chuyến bay
   * - Tổng số vé
   * - Tổng doanh thu vé đã "Confirmed"
   * - Tổng số thông báo (announcements)
   * - Tổng số khách hàng
   */
  async getStats() {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM flights)                                  AS total_flights,
        (SELECT COUNT(*) FROM tickets)                                  AS total_tickets,
        (SELECT COALESCE(SUM(price),0) FROM tickets WHERE ticket_status = 'Confirmed') AS total_revenue,
        (SELECT COUNT(*) FROM announcements)                            AS total_announcements,
        (SELECT COUNT(*) FROM customers)                                AS total_customers
    `;
    const { rows } = await db.query(query);
    return rows[0];
  }

  /**
   * getRecentBookings(limit = 10)
   * ----------------------------------------------------------------
   * Trả về `limit` vé đặt gần nhất cùng thông tin khách & chuyến bay.
   */
  async getRecentBookings(limit = 10) {
    const query = `
      SELECT 
        t.id               AS ticket_id,
        c.first_name,
        c.last_name,
        f.flight_number,
        t.seat_number,
        t.price,
        t.booking_date,
        t.ticket_status
      FROM tickets t
      JOIN customers c ON t.customer_id = c.id
      JOIN flights   f ON t.flight_id   = f.id
      ORDER BY t.booking_date DESC
      LIMIT $1;`;
    const { rows } = await db.query(query, [limit]);
    return rows;
  }

  /**
   * getUpcomingFlights(limit = 10)
   * ----------------------------------------------------------------
   * Trả về `limit` chuyến bay sắp khởi hành (departure_time > NOW())
   */
  async getUpcomingFlights(limit = 10) {
    const query = `
      SELECT *
      FROM flights
      WHERE departure_time > NOW()
      ORDER BY departure_time ASC
      LIMIT $1;`;
    const { rows } = await db.query(query, [limit]);
    return rows;
  }

  /**
   * getBookingTrends(days = 30)
   * ----------------------------------------------------------------
   * Đếm số vé đặt theo từng ngày trong `days` ngày gần nhất.
   * Trả về mảng [{ date: 'YYYY-MM-DD', bookings: <number> }]
   */
  async getBookingTrends(days = 30) {
    const query = `
      SELECT 
        DATE(booking_date) AS date,
        COUNT(*)           AS bookings
      FROM tickets
      WHERE booking_date >= NOW() - INTERVAL '$1 days'
      GROUP BY DATE(booking_date)
      ORDER BY DATE(booking_date);`;
    const { rows } = await db.query(query, [days]);
    return rows;
  }
}

module.exports = new StatisticService();