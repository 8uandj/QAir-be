const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

router.post('/', ticketController.bookTicket);
router.put('/:id/cancel', ticketController.cancelTicket);
router.get('/track/:code', ticketController.getTicketByCode);

module.exports = router;