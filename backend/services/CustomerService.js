const Customer = require('../models/Customer');
const db = require('../config/db');

class CustomerService {
  async createCustomer(data) {
    const query = `
      INSERT INTO customers (first_name, last_name, birth_date, gender, identity_number, phone_number, email, address, country, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING *;
    `;
    const values = [
      data.first_name,
      data.last_name,
      data.birth_date,
      data.gender,
      data.identity_number,
      data.phone_number,
      data.email,
      data.address,
      data.country
    ];
    const result = await db.query(query, values);
    return new Customer(result.rows[0]);
  }
}
module.exports = CustomerService;
