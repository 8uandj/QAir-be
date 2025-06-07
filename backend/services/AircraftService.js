const Aircraft = require('../models/Aircraft');
const db = require('../config/db');
const bcrypt = require('bcrypt');
bcrypt.hash('123456', 10).then(console.log);

class AircraftService {
  async create({ airline_id, aircraft_code, aircraft_type, total_first_class_seats, total_business_class_seats, total_economy_class_seats, status, manufacturer, seat_layout }) {
  try {
    const query = `
      INSERT INTO aircrafts (
        airline_id, aircraft_code, aircraft_type, total_first_class_seats, 
        total_business_class_seats, total_economy_class_seats, status, manufacturer, seat_layout
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [
      airline_id,
      aircraft_code,
      aircraft_type,
      parseInt(total_first_class_seats, 10),
      parseInt(total_business_class_seats, 10),
      parseInt(total_economy_class_seats, 10),
      status,
      manufacturer,
      seat_layout
    ];
    const result = await db.query(query, values);
    return new Aircraft(result.rows[0]);
  } catch (error) {
    console.log('❌ Lỗi khi tạo aircraft:', error.message);
    throw new Error(`Lỗi khi tạo aircraft: ${error.message}`);
  }
}

  async updateAircraft(id, data, user) {
  if (!user || user.role !== 'admin') throw new Error('Only admins can update aircrafts');
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const query = `
      UPDATE aircrafts
      SET airline_id = $1, aircraft_type = $2, total_first_class_seats = $3,
          total_business_class_seats = $4, total_economy_class_seats = $5,
          status = $6, aircraft_code = $7, manufacturer = $8, seat_layout = $9
      WHERE id = $10
      RETURNING *;
    `;
    const values = [
      data.airline_id,
      data.aircraft_type,
      parseInt(data.total_first_class_seats, 10),
      parseInt(data.total_business_class_seats, 10),
      parseInt(data.total_economy_class_seats, 10),
      data.status,
      data.aircraft_code,
      data.manufacturer,
      data.seat_layout,
      id
    ];
    const result = await client.query(query, values);
    if (result.rows.length === 0) throw new Error('Aircraft not found');
    await client.query('COMMIT');
    return new Aircraft(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

  async getAllAircrafts() {
    const result = await db.query('SELECT * FROM aircrafts');
    return result.rows; 
  }

  async getAircraftById(id) {
    const result = await db.query('SELECT * FROM aircrafts WHERE id = $1', [id]);
    return result.rows.length > 0 ? new Aircraft(result.rows[0]) : null;
  }

   /**
 * Xoá máy bay.
 * – Nếu máy bay đã gán cho chuyến bay, từ chối xoá.
 * @param {number} id
 * @returns {Promise<{deleted: true}>}
 */

  async deleteAircraft(id) {
  const ref = await db.query(
    'SELECT 1 FROM flights WHERE aircraft_id = $1 LIMIT 1',
    [id]
  );
  if (ref.rows.length) {
    throw new Error('Cannot delete: aircraft still assigned to flights');
  }
  await db.query('DELETE FROM aircrafts WHERE id = $1', [id]);
  return { deleted: true };
}
}

module.exports = new AircraftService();