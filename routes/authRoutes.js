const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/super-admin/login', authController.loginSuperAdmin);
router.post('/super-admin/setup', authController.setSuperAdminAuth);

module.exports = router;
