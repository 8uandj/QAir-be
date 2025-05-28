const FlightService = require('../services/FlightService');
const flightService = new FlightService();

exports.getAllFlights = async (req, res) => {
  const flights = await flightService.getAllFlights();
  res.json({ success: true, data: flights });
};

exports.getFlightById = async (req, res) => {
  const flight = await flightService.getFlightById(req.params.id);
  if (!flight) return res.status(404).json({ success: false, message: 'Flight not found' });
  res.json({ success: true, data: flight });
};

exports.searchFlights = async (req, res) => {
  const flights = await flightService.searchFlights(req.query);
  res.json({ success: true, data: flights });
};

exports.delayFlight = async (req, res) => {
  const updated = await flightService.delayFlight(req.params.id, req.body.newDeparture, req.body.newArrival);
  if (!updated) return res.status(404).json({ success: false, message: 'Flight not found' });
  res.json({ success: true, data: updated });
};