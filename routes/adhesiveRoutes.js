const express = require('express');
const router = express.Router();
const adhesiveController = require('../controllers/adhesiveController');

// Create
router.post('/create', adhesiveController.createAdhesive);

// Read all
router.post('/get-all', adhesiveController.getAllAdhesives);

// Update
router.put('/update', adhesiveController.updateAdhesive);

// Delete
router.delete('/delete', adhesiveController.deleteAdhesive);

module.exports = router;
