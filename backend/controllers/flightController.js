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
  const { legs } = req.body;

  if (!Array.isArray(legs) || legs.length === 0)
    return res.status(400).json({ success: false, message: 'legs must be a non-empty array' });

  const results = await flightService.searchFlights(legs);
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, data: results });
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