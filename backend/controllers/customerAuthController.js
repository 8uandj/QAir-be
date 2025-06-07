const CustomerAuthService = require('../services/CustomerAuthService');

exports.register = async (req, res) => {
  try {
    const user = await CustomerAuthService.register(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const result = await CustomerAuthService.login(req.body.email, req.body.password);
    res.json(result);
  } catch (err) {
    const status = err.message === 'Email not found' || err.message === 'Incorrect password' ? 401 : 400;
    res.status(status).json({ error: err.message });
  }
};

exports.linkAccount = async (req, res) => {
  try {
    const result = await CustomerAuthService.linkAccount(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};