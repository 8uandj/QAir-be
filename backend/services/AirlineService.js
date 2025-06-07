const Airline = require('../models/Airline');
const db = require('../config/db');

class AirlineService {
  async getAll() {
    const query = 'SELECT * FROM airlines';
    const result = await db.query(query);
    return result.rows;
  }

  async create({ name }) {
    const query = `
      INSERT INTO airlines (name)
      VALUES ($1)
      RETURNING *;
    `;
    const values = [name];
    const result = await db.query(query, values);
    return result.rows[0];
  }
}

module.exports = new AirlineService();