const express = require('express');
const tenantController = require('../controllers/tenant.controller');
const { validateTenantCreation, validateTenantUpdate } = require('../middleware/validation');

const router = express.Router();

// Tenant CRUD
router.post('/tenant', validateTenantCreation, tenantController.createTenant);
router.get('/tenant/:tenantId', tenantController.getTenantById);
router.get('/tenants', tenantController.getAllTenants);
router.put('/tenant/:tenantId/info', validateTenantUpdate, tenantController.updateTenantInfo);
router.put('/tenant/:tenantId/license-counts', tenantController.updateLicenseCounts);
router.put('/tenant/:tenantId/license-expiry', tenantController.updateLicenseExpiry);
router.delete('/tenant/:tenantId', tenantController.deleteTenant);
router.delete('/tenants', tenantController.deleteMultipleTenants);

// Tenant statistics
router.get('/tenant/:tenantId/stats', tenantController.getTenantStats);

// user validation
router.post('/login/userValidation',tenantController.validateUser);

module.exports = router;
