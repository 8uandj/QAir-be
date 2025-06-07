const CustomerService = require('../services/CustomerService');
const pool = require('../config/db');

exports.createCustomer = async (req, res) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    // Loại bỏ password_hash trong response để bảo mật
    const { password_hash, ...safeCustomer } = customer;
    res.status(201).json({ success: true, data: safeCustomer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    // Loại bỏ password_hash trong response để bảo mật
    const { password_hash, ...safeCustomer } = customer;
    res.json({ success: true, data: safeCustomer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const result = await customerService.deleteCustomer(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getCustomerByEmail = async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, username FROM customers WHERE email = $1',
      [email]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error fetching customer by email:', err);
    return res.status(500).json({ success: false, error: `Internal server error: ${err.message}` });
  }
};