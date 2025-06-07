const StatisticService = require('../services/StatisticService');

exports.getStats = async (req, res, next) => {
  try {
    const stats = await StatisticService.getStats();
    res.json(stats);
  } catch (err) { next(err); }
};

exports.getRecentBookings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const bookings = await StatisticService.getRecentBookings(limit);
    res.json(bookings);
  } catch (err) { next(err); }
};

exports.getUpcomingFlights = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const flights = await StatisticService.getUpcomingFlights(limit);
    res.json(flights);
  } catch (err) { next(err); }
};

exports.getBookingTrends = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const trends = await StatisticService.getBookingTrends(days);
    res.json(trends);
  } catch (err) { next(err); }
};