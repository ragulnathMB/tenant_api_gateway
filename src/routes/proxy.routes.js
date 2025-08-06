const express = require('express');
const proxyController = require('../controllers/proxy.controller');

const router = express.Router();

// Single param apiName, all other info in headers/body
router.all('/api/', proxyController.handleProxy);

module.exports = router;
