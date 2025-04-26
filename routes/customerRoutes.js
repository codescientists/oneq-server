const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.post('/create', customerController.createCustomer);
router.post('/get-all', customerController.getAllCustomers);
router.put('/update', customerController.updateCustomer);
router.post('/delete', customerController.deleteCustomer);

module.exports = router;
