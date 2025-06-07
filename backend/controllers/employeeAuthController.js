const EmployeeAuthService = require('../services/EmployeeAuthService');

class EmployeeAuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await EmployeeAuthService.login(email, password);
      if (!result || !result.employee || !result.employee.id) {
        throw new Error('Dữ liệu nhân viên không hợp lệ');
      }
      return res.status(200).json(result);
    } catch (error) {
      console.log('❌ Lỗi đăng nhập nhân viên:', error.message);
      return res.status(401).json({ success: false, error: error.message });
    }
  }

  async logout(req, res) {
    return res.json({ success: true, message: 'Đăng xuất thành công' });
  }
}

module.exports = new EmployeeAuthController();