const express = require('express');
const apiController = require('../controllers/apiController');

const router = express.Router();

// API Management
router.get('/tenant/:tenantId/apis', apiController.getTenantApis);
router.patch('/tenant/:tenantId/apis/:section/:apiName', apiController.updateApi);
router.post('/tenant/:tenantId/apis/:section', apiController.addApi);
router.delete('/tenant/:tenantId/apis/:section/:apiName', apiController.deleteApi);

// API Testing
router.post('/check-tenant-api', apiController.testApi);

module.exports = router;
