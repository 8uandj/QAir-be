const express = require('express');
const router = express.Router();
const ticketClassController = require('../controllers/ticketClassController');

router.get('/', ticketClassController.getAll);

module.exports = router;