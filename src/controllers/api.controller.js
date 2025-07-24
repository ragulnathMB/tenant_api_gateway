const apiService = require('../services/apiService');
const { successResponse, errorResponse } = require('../utils/response');

class ApiController {
  async getTenantApis(req, res) {
    try {
      const { tenantId } = req.params;
      const apis = await apiService.getTenantApis(tenantId);
      successResponse(res, apis, 'APIs retrieved successfully');
    } catch (error) {
      console.error('Get tenant APIs error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      errorResponse(res, error.message, statusCode);
    }
  }

  async updateApi(req, res) {
    try {
      const { tenantId, section, apiName } = req.params;
      const result = await apiService.updateApi(tenantId, section, apiName, req.body);
      successResponse(res, result, 'API updated successfully');
    } catch (error) {
      console.error('Update API error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      errorResponse(res, error.message, statusCode);
    }
  }

  async addApi(req, res) {
    try {
      const { tenantId, section } = req.params;
      const result = await apiService.addApi(tenantId, section, req.body);
      successResponse(res, result, 'API added successfully');
    } catch (error) {
      console.error('Add API error:', error);
      let statusCode = 500;
      if (error.message.includes('required')) statusCode = 400;
      if (error.message.includes('not found')) statusCode = 404;
      if (error.message.includes('already exists')) statusCode = 409;
      errorResponse(res, error.message, statusCode);
    }
  }

  async deleteApi(req, res) {
    try {
      const { tenantId, section, apiName } = req.params;
      const result = await apiService.deleteApi(tenantId, section, apiName);
      successResponse(res, result, 'API deleted successfully');
    } catch (error) {
      console.error('Delete API error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      errorResponse(res, error.message, statusCode);
    }
  }

  async testApi(req, res) {
    try {
      const { url } = req.body;
      const result = await apiService.testApi(url);
      successResponse(res, result, 'API test completed');
    } catch (error) {
      console.error('Test API error:', error);
      const statusCode = error.message.includes('Missing') ? 400 : 500;
      errorResponse(res, error.message, statusCode);
    }
  }
}

module.exports = new ApiController();
