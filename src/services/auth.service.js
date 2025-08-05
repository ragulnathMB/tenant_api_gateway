const { getUserDBPool, getTenantDBPool, sql } = require('../config/database');

class AuthService {
  async authenticateAdmin(empId, password) {
    const userPool = getUserDBPool();
    const userResult = await userPool.request()
      .input('EmpID', sql.VarChar(50), empId)
      .input('Password', sql.VarChar(50), password)
      .query('SELECT UserID, TenantID, Name, Status FROM Users WHERE EmpID = @EmpID AND Password = @Password');
    
    if (userResult.recordset.length === 0) {
      throw new Error('Invalid credentials');
    }
    
    const user = userResult.recordset[0];
    if (user.Status !== 'Enabled') {
      throw new Error('User account is disabled');
    }
    
    const tenantPool = getTenantDBPool();
    const tenantResult = await tenantPool.request()
      .input('Admin', sql.VarChar(50), empId)
      .query('SELECT TenantID, Name FROM Tenants WHERE Admin_ID = @Admin');
    
    if (tenantResult.recordset.length === 0) {
      throw new Error('You are not authorized as an admin for any tenant');
    }
    
    const adminTenants = tenantResult.recordset;
    
    return {
      success: true,
      user: {
        empId: empId,
        userId: user.UserID,
        name: user.Name,
        tenantId: user.TenantID
      },
      adminTenants: adminTenants,
      primaryTenant: adminTenants[0]
    };
  }

  async authenticateTenantAdmin(employee_ID, password) {
    const pool = getTenantDBPool();
    const result = await pool.request()
      .input('employee_ID', sql.VarChar, employee_ID)
      .input('password', sql.VarChar, password)
      .query('SELECT TenantID, Admin_ID, Password FROM TenantInfo WHERE Admin_ID = @employee_ID AND Password = @password');
    
    if (result.recordset.length === 0) {
      throw new Error('Invalid credentials or not an admin');
    }
    
    const { TenantID } = result.recordset[0];
    return { employee_ID, tenantID: TenantID };
  }
}

module.exports = new AuthService();
