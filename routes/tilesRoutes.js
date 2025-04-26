const express = require('express');
const router = express.Router();
const tilesController = require('../controllers/tilesController');

router.post('/create', tilesController.createTile);
router.post('/get-all', tilesController.getAllTiles);
router.put('/update', tilesController.updateTile);
router.delete('/delete', tilesController.deleteTile);

module.exports = router;
