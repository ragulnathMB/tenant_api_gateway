const express = require('express');
const apiController = require('../controllers/api.controller');

const router = express.Router();

// API Management
router.get('/tenant/:tenantId/apis', apiController.getTenantApis);
router.patch('/tenant/:tenantId/apis/:apiName', apiController.updateApi);
router.post('/tenant/:tenantId/apis', apiController.addApi);  // Here add with apiName + url + method in body
router.delete('/tenant/:tenantId/apis/:apiName', apiController.deleteApi);

// API Testing
router.post('/check-tenant-api', apiController.testApi);

module.exports = router;
