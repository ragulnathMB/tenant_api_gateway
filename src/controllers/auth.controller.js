const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');

class AuthController {
  async authenticateAdmin(req, res) {
    try {
      const { empId, password } = req.body;
      
      if (!empId || !password) {
        return errorResponse(res, 'Employee ID and password are required', 400);
      }

      const result = await authService.authenticateAdmin(empId, password);
      successResponse(res, result, 'Authentication successful');
    } catch (error) {
      console.error('Admin authentication error:', error);
      
      let statusCode = 500;
      if (error.message.includes('Invalid credentials')) statusCode = 401;
      if (error.message.includes('disabled')) statusCode = 401;
      if (error.message.includes('not authorized')) statusCode = 403;
      
      errorResponse(res, error.message, statusCode);
    }
  }

  async authenticateTenantAdmin(req, res) {
    try {
      const { employee_ID, password } = req.body;
      
      if (!employee_ID || !password) {
        return errorResponse(res, 'EmployeeID and password are required', 400);
      }

      const result = await authService.authenticateTenantAdmin(employee_ID, password);
      successResponse(res, result, 'Tenant admin authentication successful');
    } catch (error) {
      console.error('Tenant admin authentication error:', error);
      
      let statusCode = 500;
      if (error.message.includes('Invalid credentials')) statusCode = 401;
      
      errorResponse(res, error.message, statusCode);
    }
  }
  
}

module.exports = new AuthController();
