const tenantService = require('../services/tenant.service');
const { successResponse, errorResponse } = require('../utils/response');

class TenantController {
  async createTenant(req, res) {
    try {
      const result = await tenantService.createTenant(req.body);
      successResponse(res, result, 'Tenant created successfully', 201);
    } catch (error) {
      console.error('Create tenant error:', error);
      const statusCode = error.message.includes('required') ? 400 : 500;
      errorResponse(res, error.message, statusCode);
    }
  }

  async getTenantById(req, res) {
    try {
      const { tenantId } = req.params;
      const tenant = await tenantService.getTenantById(tenantId);
      successResponse(res, tenant, 'Tenant retrieved successfully');
    } catch (error) {
      console.error('Get tenant error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      errorResponse(res, error.message, statusCode);
    }
  }

  async getAllTenants(req, res) {
    try {
      const tenants = await tenantService.getAllTenants();
      successResponse(res, tenants, 'Tenants retrieved successfully');
    } catch (error) {
      console.error('Get all tenants error:', error);
      errorResponse(res, error.message, 500);
    }
  }

  async updateTenantInfo(req, res) {
    try {
      const { tenantId } = req.params;
      const result = await tenantService.updateTenantInfo(tenantId, req.body);
      successResponse(res, result, 'Tenant info updated successfully');
    } catch (error) {
      console.error('Update tenant error:', error);
      const statusCode = error.message.includes('No fields') ? 400 : 500;
      errorResponse(res, error.message, statusCode);
    }
  }

  async updateLicenseCounts(req, res) {
    try {
      const { tenantId } = req.params;
      const { enabledUsersCount, disabledUsersCount } = req.body;
      const result = await tenantService.updateLicenseCounts(tenantId, enabledUsersCount, disabledUsersCount);
      successResponse(res, result, 'License counts updated successfully');
    } catch (error) {
      console.error('Update license counts error:', error);
      errorResponse(res, error.message, 500);
    }
  }

  async updateLicenseExpiry(req, res) {
    try {
      const { tenantId } = req.params;
      const { licenseExpiry } = req.body;
      const result = await tenantService.updateLicenseExpiry(tenantId, licenseExpiry);
      successResponse(res, result, 'License expiry updated successfully');
    } catch (error) {
      console.error('Update license expiry error:', error);
      errorResponse(res, error.message, 500);
    }
  }

  async deleteTenant(req, res) {
    try {
      const { tenantId } = req.params;
      const result = await tenantService.deleteTenant(tenantId);
      successResponse(res, result, 'Tenant deleted successfully');
    } catch (error) {
      console.error('Delete tenant error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      errorResponse(res, error.message, statusCode);
    }
  }

  async deleteMultipleTenants(req, res) {
    try {
      const { tenantIds } = req.body;
      const result = await tenantService.deleteMultipleTenants(tenantIds);
      successResponse(res, result, 'Tenants deleted successfully');
    } catch (error) {
      console.error('Delete multiple tenants error:', error);
      const statusCode = error.message.includes('should be an array') ? 400 : 500;
      errorResponse(res, error.message, statusCode);
    }
  }

  async getTenantStats(req, res) {
    try {
      const { tenantId } = req.params;
      const stats = await tenantService.getTenantStats(tenantId);
      successResponse(res, stats, 'Tenant statistics retrieved successfully');
    } catch (error) {
      console.error('Get tenant stats error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      errorResponse(res, error.message, statusCode);
    }
  }
  async validateUser(req, res) {
    try {
      const tenantId = req.body.TenantID;
      const tenant = await tenantService.validateUser(tenantId);
      successResponse(res, tenant, 'Tenant info retrieved successfully');
    } catch (error) {
      console.error('Get tenant error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      errorResponse(res, error.message, statusCode);
    }
  }
}

module.exports = new TenantController();
