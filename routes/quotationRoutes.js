const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');

router.post('/create', quotationController.createQuotation);
router.post('/get-all', quotationController.getAllQuotations);
router.post('/get-one', quotationController.getOneQuotation);
router.put('/update', quotationController.updateQuotation);
router.delete('/delete', quotationController.deleteQuotation);

module.exports = router;
