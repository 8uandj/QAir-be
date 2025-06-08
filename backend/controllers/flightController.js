const FlightService = require('../services/FlightService');
const flightService = new FlightService();

exports.getAllFlights = async (req, res) => {
  const flights = await flightService.getAllFlights();
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, data: flights });
};

exports.getFlightById = async (req, res) => {
  const flight = await flightService.getFlightById(req.params.id);
  res.set('Cache-Control', 'no-store');
  if (!flight) return res.status(404).json({ success: false, message: 'Flight not found' });
  res.json({ success: true, data: flight });
};

exports.searchFlights = async (req, res) => {
  const { legs, flight_id, flight_number } = req.body;

  try {
    console.log('📊 Controller received body:', req.body);
    const results = await flightService.searchFlights({ legs, flight_id, flight_number });
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('🚨 Controller error:', error.message, error.stack);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.delayFlight = async (req, res) => {
  const updated = await flightService.delayFlight(req.params.id, req.body.newDeparture, req.body.newArrival);
  if (!updated) return res.status(404).json({ success: false, message: 'Flight not found' });
  res.json({ success: true, data: updated });
};

exports.createFlight = async (req, res) => {
  const flight = await flightService.createFlight(req.body);
  res.status(201).json({ success: true, data: flight });
};

exports.cancelFlight = async (req, res) => {
  try {
    const flight = await flightService.cancelFlight(req.params.id, {
      reason: req.body.reason || '',
      employeeId: req.user?.id || null
    });
    res.json({ success: true, data: flight });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteFlight = async (req, res) => {
  try {
    const result = await flightService.deleteFlight(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};