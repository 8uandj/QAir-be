const Customer = require('../models/Customer');
const db = require('../config/db');
const bcrypt = require('bcrypt');

class CustomerService {
  async createCustomer(data) {
    const {
      first_name,
      last_name,
      email,
      username,
      password, // Nếu có mật khẩu, mã hóa
      birth_date,
      gender,
      identity_number,
      phone_number,
      address,
      country
    } = data;

    // Mã hóa mật khẩu nếu được cung cấp
    const password_hash = password ? await bcrypt.hash(password, 10) : null;

    const query = `
      INSERT INTO customers (
        first_name, last_name, email, username, password_hash,
        birth_date, gender, identity_number, phone_number, address, country, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *;
    `;
    const values = [
      first_name || null,
      last_name || null,
      email,
      username || null,
      password_hash,
      birth_date || null,
      gender || "Other",
      identity_number || null,
      phone_number || null,
      address || null,
      country || null
    ];
    const result = await db.query(query, values);
    return new Customer(result.rows[0]);
  }

  /**
   * Cập nhật khách hàng (chỉ các trường được truyền).
   * @param {number} id
   * @param {Object} data – {first_name?, last_name?, phone_number?, …}
   * @returns {Promise<Customer>}
   */
  async updateCustomer(id, data) {
    const keys = Object.keys(data);
    if (!keys.length) throw new Error('No update fields provided');

    // Xây câu UPDATE động: SET field1 = $2, field2 = $3, ...
    const setSQL = keys
      .map((k, idx) => `${k} = $${idx + 2}`)
      .join(', ');

    const values = [id, ...keys.map(k => data[k])];
    const res = await db.query(
      `UPDATE customers SET ${setSQL} WHERE id = $1 RETURNING *`,
      values
    );
    if (res.rows.length === 0) throw new Error('Customer not found');
    return new Customer(res.rows[0]);
  }

  /**
   * Xoá cứng khách hàng – từ chối nếu đã đặt vé.
   * @param {number} id
   * @returns {Promise<{deleted: true}>}
   */
  async deleteCustomer(id) {
    const ref = await db.query(
      'SELECT 1 FROM tickets WHERE customer_id = $1 LIMIT 1',
      [id]
    );
    if (ref.rows.length) {
      throw new Error('Cannot delete: customer owns tickets');
    }
    await db.query('DELETE FROM customers WHERE id = $1', [id]);
    return { deleted: true };
  }

  async getCustomerByEmail(email) {
    const result = await db.query(
      'SELECT * FROM customers WHERE email = $1',
      [email]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async getCustomerById(id) {
    const result = await db.query(
      'SELECT * FROM customers WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }
}

module.exports = new CustomerService();