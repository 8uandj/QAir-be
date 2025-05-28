const Employee = require('../models/Employee');
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthService {
  async login(email, password) {
    const result = await db.query('SELECT * FROM employees WHERE email = $1', [email]);
    if (result.rows.length === 0) return null;

    const employee = result.rows[0];
    const match = await bcrypt.compare(password, employee.password_hash);
    if (!match) return null;

    const token = jwt.sign({ id: employee.id, role: employee.role }, process.env.JWT_SECRET, { 
      expiresIn: '1d' 
    });
    return { token, employee: new Employee(employee) };
  }
}
module.exports = AuthService;