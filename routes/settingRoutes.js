const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.post('/get', settingsController.getSettings);
router.post('/update', settingsController.updateSettings);

module.exports = router;
