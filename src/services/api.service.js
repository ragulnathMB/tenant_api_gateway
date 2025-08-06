const { getTenantDBPool, sql } = require('../config/database');
const axios = require('axios');

class ApiService {
  // Retrieve all APIs and their URLs for a tenant by selecting dynamic columns in TenantInfo table
  async getTenantApis(tenantId) {
    const pool = getTenantDBPool();

    // Get API names and methods from api_details
    const apisResult = await pool.request().query('SELECT api_name, method FROM api_details');
    const apiDetails = apisResult.recordset; // [{ api_name, method }, ...]

    if (apiDetails.length === 0) {
      throw new Error('No APIs defined in api_details');
    }

    // Extract only api_names for dynamic SQL
    const apiColumns = apiDetails.map(r => r.api_name);

    // Build dynamic SQL to get URLs for all APIs in TenantInfo for the tenant
    const colsSelect = apiColumns.map(col => `[${col}]`).join(', ');

    const query = `
      SELECT TenantID, Name, ${colsSelect} 
      FROM TenantInfo 
      WHERE TenantID = @tenantId
    `;

    const result = await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query(query);

    if (result.recordset.length === 0) {
      throw new Error('Tenant not found');
    }

    const tenantRow = result.recordset[0];

    // Combine api name, url (from TenantInfo), and method (from api_details)
    const apisArray = apiDetails.map(api => ({
      apiName: api.api_name,
      url: tenantRow[api.api_name] || null,
      method: api.method
    }));

    return {
      tenantId: tenantRow.TenantID,
      name: tenantRow.Name,
      apis: apisArray
    };
  }

  // Update URL of a specific API column in TenantInfo for a tenant
  async updateApi(tenantId, apiName, updateData) {
    const { url } = updateData;

    if (!url) {
      throw new Error('url is required for update');
    }

    // Validate apiName exists in api_details
    const pool = getTenantDBPool();

    const apiExistsResult = await pool.request()
      .input('apiName', sql.NVarChar, apiName)
      .query('SELECT 1 FROM api_details WHERE api_name = @apiName');

    if (apiExistsResult.recordset.length === 0) {
      throw new Error('API not found');
    }

    // Update TenantInfo table column corresponding to apiName with new url value
    // SQL Server: dynamic column update requires dynamic SQL, so use sp_executesql

    const updateQuery = `
      DECLARE @sql NVARCHAR(MAX);
      SET @sql = N'UPDATE TenantInfo SET [' + @apiName + '] = @url WHERE TenantID = @tenantId';
      EXEC sp_executesql @sql, N'@url NVARCHAR(500), @tenantId VARCHAR(100)', @url = @url, @tenantId = @tenantId;
    `;

    await pool.request()
      .input('apiName', sql.NVarChar, apiName)
      .input('url', sql.NVarChar(500), url)
      .input('tenantId', sql.VarChar, tenantId)
      .query(updateQuery);

    return { message: `API '${apiName}' updated successfully` };
  }

  // Add new API URL for tenant into TenantInfo, similarly update column value
  async addApi(tenantId, apiData) {
    const { apiName, url } = apiData;

    if (!apiName || !url) {
      throw new Error('apiName and url are required');
    }

    const pool = getTenantDBPool();

    // Check apiName exists in api_details
    const apiExists = await pool.request()
      .input('apiName', sql.NVarChar, apiName)
      .query('SELECT 1 FROM api_details WHERE api_name = @apiName');

    if (apiExists.recordset.length === 0) {
      throw new Error('API not found');
    }

    // Check if tenant exists
    const tenantResult = await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query('SELECT 1 FROM TenantInfo WHERE TenantID = @tenantId');

    if (tenantResult.recordset.length === 0) {
      throw new Error('Tenant not found');
    }

    // Check if URL already exists for this API for tenant (column has value)
    const existingUrlResult = await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query(`SELECT [${apiName}] FROM TenantInfo WHERE TenantID = @tenantId`);

    if (existingUrlResult.recordset.length > 0 && existingUrlResult.recordset[0][apiName]) {
      throw new Error('API URL already exists for this tenant');
    }

    // Set the URL in TenantInfo column for tenant
    const updateQuery = `
      DECLARE @sql NVARCHAR(MAX);
      SET @sql = N'UPDATE TenantInfo SET [' + @apiName + '] = @url WHERE TenantID = @tenantId';
      EXEC sp_executesql @sql, N'@url NVARCHAR(500), @tenantId VARCHAR(100)', @url = @url, @tenantId = @tenantId;
    `;

    await pool.request()
      .input('apiName', sql.NVarChar, apiName)
      .input('url', sql.NVarChar(500), url)
      .input('tenantId', sql.VarChar, tenantId)
      .query(updateQuery);

    return { message: `API URL added successfully for '${apiName}'` };
  }

  async deleteApi(tenantId, apiName) {
    const pool = getTenantDBPool();

    // Validate API exists
    const apiExists = await pool.request()
      .input('apiName', sql.NVarChar, apiName)
      .query('SELECT 1 FROM api_details WHERE api_name = @apiName');

    if (apiExists.recordset.length === 0) {
      throw new Error('API not found');
    }

    // Validate tenant exists
    const tenantExists = await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query('SELECT 1 FROM TenantInfo WHERE TenantID = @tenantId');

    if (tenantExists.recordset.length === 0) {
      throw new Error('Tenant not found');
    }

    // Delete API: update column to NULL in TenantInfo
    const deleteQuery = `
      DECLARE @sql NVARCHAR(MAX);
      SET @sql = N'UPDATE TenantInfo SET [' + @apiName + '] = NULL WHERE TenantID = @tenantId';
      EXEC sp_executesql @sql, N'@tenantId VARCHAR(100)', @tenantId = @tenantId;
    `;

    await pool.request()
      .input('apiName', sql.NVarChar, apiName)
      .input('tenantId', sql.VarChar, tenantId)
      .query(deleteQuery);

    return { message: `API URL deleted successfully for '${apiName}'` };
  }

  async testApi(url) {
    if (!url) {
      throw new Error('Missing `url` in request body');
    }

    try {
      const response = await axios.head(url, { timeout: 5000 });

      return {
        working: true,
        statusCode: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (err) {
      return {
        working: false,
        statusCode: err.response?.status || null,
        statusText: err.response?.statusText || null,
        message: err.message,
        error: err.response?.data || null,
      };
    }
  }
}

module.exports = new ApiService();
