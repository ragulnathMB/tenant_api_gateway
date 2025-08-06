const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/auth/admin', authController.authenticateAdmin);
router.post('/tenantAdmin/login', authController.authenticateTenantAdmin);

module.exports = router;
