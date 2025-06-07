const express = require('express');
const router = express.Router();
const pool = require('../config/db');

const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { handleValidationErrors } = require('../middlewares/validateUtils');
const { validateCreateFlight, validateSearchFlights, validateDelayFlight } = require('../middlewares/validateFlight');
const { validateCreateCustomer, validateRegister } = require('../middlewares/validateCustomer');
const { validateLogin } = require('../middlewares/validateLogin');
const { body, validationResult } = require('express-validator');
const {
  validateBookTicket,
  validateBookMultipleTickets,
  validateTicketParams,
  validateTicketCode,
  validateGetTicketsByEmail,
  validateTicketStats
} = require('../middlewares/validateTicket');
const { validateCreateAnnouncement, validateUpdateAnnouncement, validateDeleteAnnouncement, validateGetAnnouncementById } = require('../middlewares/validateAnnouncement'); // Assuming GetById exists or will be created
const { validateCreateAircraft, validateUpdateAircraft, validateGetAircraftById } = require('../middlewares/validateAircraft');
const { validateCreateTicketClass, validateUpdateTicketClass, validateGetPerks } = require('../middlewares/validateTicketClass');
const { validateGetSeatMap, validateSeatSelection } = require('../middlewares/validateSeat');
const { validateCreateCity, validateUpdateCity, validateGetCityById, validateDeleteCity, validateGetAllCities } = require('../middlewares/validateCity'); // Assuming GetAll exists or will be created
const { validateCreateCountry, validateUpdateCountry, validateGetCountryById, validateDeleteCountry, validateGetAllCountries } = require('../middlewares/validateCountry'); // Assuming GetAll exists or will be created
const { validateCreateRoute } = require('../middlewares/validateRoute');

//ControllerController
const EmployeeAuthController = require('../controllers/employeeAuthController');
const CustomerController = require('../controllers/customerController');
const FlightController = require('../controllers/flightController');
const TicketController = require('../controllers/ticketController');
const CustomerAuthController = require('../controllers/customerAuthController');
const TicketClassController = require('../controllers/ticketClassController');
const AnnouncementController = require('../controllers/announcementController');
const AircraftController = require('../controllers/aircraftController');
const AirlineController = require('../controllers/airlineController');
const RouteController = require('../controllers/RouteController');
const AirportController = require('../controllers/AirportController');
const StatisticController = require('../controllers/statisticController');
const SeatController = require('../controllers/seatController');
const CityController = require('../controllers/cityController');
const CountryController = require('../controllers/countryController');


// Middleware tùy chỉnh để kiểm tra body có password hay không
const checkCancelTicketAuth = (req, res, next) => {
  if (req.body.password) {
    // Nếu có password, bỏ qua authenticate và authorize
    return next();
  }
  // Nếu không có password, yêu cầu authenticate và authorize
  return authenticate(req, res, () => authorize(['customer'])(req, res, next));
};

//Auth
router.post('/employee/login', validateLogin, handleValidationErrors, EmployeeAuthController.login);
router.post('/customer/login', validateLogin, handleValidationErrors, CustomerAuthController.login);
router.post('/customer/register', validateRegister, handleValidationErrors, CustomerAuthController.register);
router.get('/customer/register', (req, res) => {
  res.status(405).json({ success: false, error: 'Method not allowed. Use POST to register.' });
});
router.post('/customer', validateCreateCustomer, handleValidationErrors, CustomerController.createCustomer);
router.get('/check-email', async (req, res) => {
  const { email } = req.query;

  // Kiểm tra xem email có được cung cấp hay không
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT 1 FROM customers WHERE email = $1', [email]);
    client.release();

    // Trả về kết quả dựa trên sự tồn tại của email
    if (result.rowCount > 0) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (err) {
    console.error('Error checking email:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
//route
router.get('/routes', RouteController.getAll);
router.post('/routes',  authenticate, authorize(['admin']), validateCreateRoute, handleValidationErrors, RouteController.create);

//airlines
router.post('/airlines', authenticate, authorize(['admin']), AirlineController.create);
router.get('/airlines', AirlineController.getAll);

//airport
router.get('/airports', AirportController.getAll);

// Flights & lookup data
router  
  .post('/flights/search', validateSearchFlights, handleValidationErrors, FlightController.searchFlights)
  .get('/ticket-classes', TicketClassController.getAll)
  .get('/aircrafts', AircraftController.getAllAircrafts)
  .get('/aircrafts/:id', validateGetAircraftById, handleValidationErrors, AircraftController.getAircraftById)
  .get('/flights/:id', FlightController.getFlightById)
  .get('/flights', FlightController.getAllFlights)  
  .get('/customer/by-email/:email', CustomerController.getCustomerByEmail);

// Seat Routes
router
  .get('/seats/:flight_id', validateGetSeatMap, handleValidationErrors, SeatController.getSeatMap)
  .post('/seats/validate', validateSeatSelection, handleValidationErrors, SeatController.validateSeat);

// -----------------------------------------------------------------------------
// CUSTOMER ROUTES
// -----------------------------------------------------------------------------
router
  .post('/customer', validateCreateCustomer, handleValidationErrors, CustomerController.createCustomer)

  // Ticket booking & management
  .post('/tickets/book', validateBookTicket, handleValidationErrors, TicketController.bookTicket)
  .post('/tickets/book-multiple', validateBookMultipleTickets, TicketController.bookMultipleTickets)
  .post('/tickets/:id/cancel', checkCancelTicketAuth, validateTicketParams, handleValidationErrors, TicketController.cancelTicket)
  .post('/tickets/:id/confirm', authenticate, authorize(['customer']), validateTicketParams, handleValidationErrors, TicketController.confirmTicket)
  .get('/tickets/code/:code', validateTicketCode, handleValidationErrors, TicketController.getTicketByCode)
  .get('/tickets/email/:email', authenticate, authorize(['customer']), validateGetTicketsByEmail, handleValidationErrors, TicketController.getTicketsByEmail)
  .post('/tickets/book-with-customer', validateBookMultipleTickets, handleValidationErrors, TicketController.bookTicketWithCustomer);
// -----------------------------------------------------------------------------
// ADMIN ROUTES
// -----------------------------------------------------------------------------
// Flights
router
  .post('/flights', authenticate, authorize(['admin']), validateCreateFlight, handleValidationErrors, FlightController.createFlight)
  .put('/flights/:id/delay', authenticate, authorize(['admin']), validateDelayFlight, handleValidationErrors, FlightController.delayFlight)
  .put('/flights/:id/cancel', authenticate, authorize(['admin']), FlightController.cancelFlight)
  .delete('/flights/:id', authenticate, authorize(['admin']), FlightController.deleteFlight);

// Aircrafts
router
  .post('/aircrafts', authenticate, authorize(['admin']), validateCreateAircraft, handleValidationErrors, AircraftController.createAircraft)
  .put('/aircrafts/:id', authenticate, authorize(['admin']), validateUpdateAircraft, handleValidationErrors, AircraftController.updateAircraft)
  .delete('/aircrafts/:id', authenticate, authorize(['admin']), AircraftController.deleteAircraft);

// City Routes (Admin only for create/update/delete, Public for getAll)
router.get('/cities', CityController.getAll);
router.get('/cities/:id', authenticate, authorize(['admin']), validateGetCityById, handleValidationErrors, CityController.getById); // Assuming validateGetCityById exists
router.post('/cities', authenticate, authorize(['admin']), validateCreateCity, handleValidationErrors, CityController.create); // Assuming validateCreateCity exists
router.put('/cities/:id', authenticate, authorize(['admin']), validateUpdateCity, handleValidationErrors, CityController.update); // Assuming validateUpdateCity exists
router.delete('/cities/:id', authenticate, authorize(['admin']), validateGetCityById, handleValidationErrors, CityController.delete); // Using GetById validation for delete

// Country Routes (Admin only for create/update/delete, Public for getAll)
router.get('/countries', CountryController.getAll);
router.get('/countries/:id', authenticate, authorize(['admin']), validateGetCountryById, handleValidationErrors, CountryController.getById); // Assuming validateGetCountryById exists
router.post('/countries', authenticate, authorize(['admin']), validateCreateCountry, handleValidationErrors, CountryController.create); // Assuming validateCreateCountry exists
router.put('/countries/:id', authenticate, authorize(['admin']), validateUpdateCountry, handleValidationErrors, CountryController.update); // Assuming validateUpdateCountry exists
router.delete('/countries/:id', authenticate, authorize(['admin']), validateGetCountryById, handleValidationErrors, CountryController.delete); // Using GetById validation for delete

  // Ticket Classes
router
  .post('/ticket-classes', authenticate, authorize(['admin']), validateCreateTicketClass, handleValidationErrors, TicketClassController.create)
  .put('/ticket-classes/:id', authenticate, authorize(['admin']), validateUpdateTicketClass, handleValidationErrors, TicketClassController.update)
  .delete('/ticket-classes/:id', authenticate, authorize(['admin']), TicketClassController.delete)
  .get('/ticket-classes/:id/perks', validateGetPerks, handleValidationErrors, TicketClassController.getPerks);

// Announcements
router.get('/announcements', AnnouncementController.getAll);
router.get('/announcements/:id', validateGetAnnouncementById, handleValidationErrors, AnnouncementController.getAnnouncementById); // Assuming validateGetAnnouncementById exists
router.post('/announcements', authenticate, authorize(['admin']), validateCreateAnnouncement, handleValidationErrors, AnnouncementController.create);
router.put('/announcements/:id', authenticate, authorize(['admin']), validateUpdateAnnouncement, handleValidationErrors, AnnouncementController.update);
router.delete('/announcements/:id', authenticate, authorize(['admin']), validateDeleteAnnouncement, handleValidationErrors, AnnouncementController.delete);

// Statistics
router
  .get('/stats', authenticate, authorize(['admin']), StatisticController.getStats)
  .get('/recent-bookings', authenticate, authorize(['admin']), StatisticController.getRecentBookings)
  .get('/upcoming-flights', authenticate, authorize(['admin']), StatisticController.getUpcomingFlights)
  .get('/booking-trends', authenticate, authorize(['admin']), StatisticController.getBookingTrends)
  .get('/tickets/stats', authenticate, authorize(['admin']), validateTicketStats, handleValidationErrors, TicketController.getTicketStats);

// Customer management (admin)
router
  .put('/customer/:id', authenticate, authorize(['admin']), CustomerController.updateCustomer)
  .delete('/customer/:id', authenticate, authorize(['admin']), CustomerController.deleteCustomer);

// -----------------------------------------------------------------------------
// LOGOUT ROUTES
// ----------------------------------------------------------------------------- 
router
  .post('/employee/logout', authenticate, EmployeeAuthController.logout)
  .post('/customer/logout', authenticate, CustomerAuthController.logout);

module.exports = router;