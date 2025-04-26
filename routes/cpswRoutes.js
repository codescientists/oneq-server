const express = require('express');
const router = express.Router();
const cpswController = require('../controllers/cpswController');

// Create
router.post('/create', cpswController.createCpsw);

// Read all
router.post('/get-all', cpswController.getAllCpsw);

// Update
router.put('/update', cpswController.updateCpsw);

// Delete
router.delete('/delete', cpswController.deleteCpsw);

module.exports = router;
