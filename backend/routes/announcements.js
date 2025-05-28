const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');

router.get('/', announcementController.getAll);
router.post('/', announcementController.create);

module.exports = router;