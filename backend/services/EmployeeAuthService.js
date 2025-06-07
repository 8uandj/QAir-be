const Employee = require('../models/Employee');
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthService {
  async login(email, password) {
    console.log('📡 Đăng nhập nhân viên với email:', email);
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const result = await db.query('SELECT * FROM employees WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      throw new Error('Email not found');
    }

    const employee = result.rows[0];
    console.log('📊 Dữ liệu nhân viên từ database:', employee);
    const match = await bcrypt.compare(password, employee.password_hash);
    if (!match) {
      throw new Error('Incorrect password');
    }

    const token = jwt.sign(
      { id: employee.id, role: employee.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    const employeeInstance = new Employee({
      id: employee.id,
      email: employee.email,
      role: employee.role,
      first_name: employee.first_name,
      last_name: employee.last_name
    });
    console.log('📊 Dữ liệu nhân viên sau khi ánh xạ:', employeeInstance);

    // Chuyển đổi instance Employee thành plain object và loại bỏ dữ liệu nhạy cảm
    const employeeData = {
      id: employeeInstance.id,
      email: employeeInstance.email,
      role: employeeInstance.role,
      first_name: employeeInstance.first_name,
      last_name: employeeInstance.last_name
    };
    console.log('📊 Dữ liệu nhân viên sau khi chuyển đổi:', employeeData);

    return {
      token,
      employee: employeeData
    };
  }
}

module.exports = new AuthService();