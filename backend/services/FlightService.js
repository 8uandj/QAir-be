const Flight = require('../models/Flight');
const db = require('../config/db'); // PostgreSQL pool connection

class FlightService {
  async getAllFlights() {
    const result = await db.query('SELECT * FROM flights ORDER BY departure_time ASC');
    return result.rows.map(row => new Flight(row));
  }

  async getFlightById(id) {
    const result = await db.query('SELECT * FROM flights WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return new Flight(result.rows[0]);
  }

  async searchFlights({ from_airport_id, to_airport_id, date }) {
    const query = `
      SELECT f.* FROM flights f
      JOIN routes r ON f.route_id = r.route_id
      WHERE r.departure_airport_id = $1 AND r.arrival_airport_id = $2
        AND DATE(f.departure_time) = $3
        AND f.flight_status != 'Cancelled'
      ORDER BY f.departure_time ASC;
    `;
    const result = await db.query(query, [from_airport_id, to_airport_id, date]);
    return result.rows.map(row => new Flight(row));
  }

  async delayFlight(flightId, newDeparture, newArrival) {
    const updateQuery = `
      UPDATE flights
      SET departure_time = $1,
          arrival_time = $2,
          flight_status = 'Delayed'
      WHERE id = $3
      RETURNING *;
    `;
    const result = await db.query(updateQuery, [newDeparture, newArrival, flightId]);
    if (result.rows.length === 0) return null;
    return new Flight(result.rows[0]);
  }
}

module.exports = FlightService;