const apiService = require('../services/api.service');
const { successResponse, errorResponse } = require('../utils/response');

class ApiController {
  async getTenantApis(req, res) {
    const { tenantId } = req.params;
    try {
      const apis = await apiService.getTenantApis(tenantId);
      return successResponse(res, apis, 'APIs retrieved successfully');
    } catch (error) {
      console.error('Get tenant APIs error:', error);
      return errorResponse(res, error.message, error.message.includes('not found') ? 404 : 500);
    }
  }

  async updateApi(req, res) {
    const { tenantId, apiName } = req.params;
    try {
      const updateData = req.body; // { url }
      const result = await apiService.updateApi(tenantId, apiName, updateData);
      return successResponse(res, result, 'API updated successfully');
    } catch (error) {
      console.error('Update API error:', error);
      return errorResponse(res, error.message, error.message.includes('not found') ? 404 : 500);
    }
  }

  async addApi(req, res) {
    const { tenantId } = req.params;
    try {
      const apiData = req.body; // { apiName, url }
      const result = await apiService.addApi(tenantId, apiData);
      return successResponse(res, result, 'API added successfully');
    } catch (error) {
      console.error('Add API error:', error);
      let statusCode = 500;
      if (error.message.includes('required')) statusCode = 400;
      if (error.message.includes('already exists')) statusCode = 409;
      return errorResponse(res, error.message, statusCode);
    }
  }

  async deleteApi(req, res) {
    const { tenantId, apiName } = req.params;
    try {
      const result = await apiService.deleteApi(tenantId, apiName);
      return successResponse(res, result, 'API deleted successfully');
    } catch (error) {
      console.error('Delete API error:', error);
      return errorResponse(res, error.message, error.message.includes('not found') ? 404 : 500);
    }
  }

  async testApi(req, res) {
    try {
      const { url } = req.body;
      const result = await apiService.testApi(url);
      return successResponse(res, result, 'API test completed');
    } catch (error) {
      console.error('Test API error:', error);
      const statusCode = error.message.includes('Missing') ? 400 : 500;
      return errorResponse(res, error.message, statusCode);
    }
  }
}

module.exports = new ApiController();
