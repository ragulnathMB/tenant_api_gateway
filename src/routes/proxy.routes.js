const express = require('express');
const proxyController = require('../controllers/proxyController');

const router = express.Router();

// Universal proxy
router.all('/api/proxy/:method/:tenantId/:section/:apiName/*', proxyController.handleProxy);

module.exports = router;
