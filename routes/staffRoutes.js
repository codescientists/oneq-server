const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');

router.post('/create', staffController.createStaff);
router.post('/get-all', staffController.getAllStaff);
router.put('/update', staffController.updateStaff);
router.post('/delete', staffController.deleteStaff);

module.exports = router;
