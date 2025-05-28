const AuthService = require('../services/AuthService');
const authService = new AuthService();

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  if (!result) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  res.json({ success: true, token: result.token, employee: result.employee });
};
