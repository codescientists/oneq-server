const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Dynamic route by productType
router.post('/get-all', productController.getAllProducts);
router.post('/:productType/create', productController.createProduct);
router.put('/:productType/update', productController.updateProduct);
router.delete('/:productType/delete', productController.deleteProduct);

module.exports = router;
