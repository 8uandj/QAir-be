const CustomerService = require('../services/CustomerService');
const customerService = new CustomerService();

exports.createCustomer = async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  res.status(201).json({ success: true, data: customer });
};
