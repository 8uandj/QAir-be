// services/RouteService.js
const db = require('../config/db');
console.log('📊 db trong RouteService:', db);

class RouteService {
  async getAll() {
    try {
      const query = `
        SELECT 
          r.id, 
          r.departure_airport_id, 
          r.arrival_airport_id, 
          d.name AS departure_airport_name, 
          d.code AS departure_airport_code,
          a.name AS arrival_airport_name,
          a.code AS arrival_airport_code,
          r.distance,
          r.base_price
        FROM routes r
        JOIN airports d ON r.departure_airport_id = d.id
        JOIN airports a ON r.arrival_airport_id = a.id
      `;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.log('❌ Lỗi khi lấy danh sách tuyến bay:', error.message);
      throw new Error('Không thể lấy danh sách tuyến bay: ' + error.message);
    }
  }

  async create(data) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const query = `
        INSERT INTO routes (
          id,
          departure_airport_id,
          arrival_airport_id,
          distance,
          base_price
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const values = [
        data.id || crypto.randomUUID(), // Nếu không có id, tự tạo UUID
        data.departure_airport_id,
        data.arrival_airport_id,
        data.distance,
        data.base_price
      ];
      const result = await client.query(query, values);
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.log('❌ Lỗi khi tạo tuyến bay:', error.message);
      throw new Error('Lỗi khi tạo tuyến bay: ' + error.message);
    } finally {
      client.release();
    }
  }
}

module.exports = new RouteService();