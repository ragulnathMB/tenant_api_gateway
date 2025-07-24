const { getTenantDBPool, sql } = require('../config/database');
const axios = require('axios');

class ApiService {
  async getTenantApis(tenantId) {
    const pool = getTenantDBPool();
    const result = await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query('SELECT APIList FROM dbo.Tenants WHERE TenantID = @tenantId');
    
    if (result.recordset.length === 0) {
      throw new Error('Tenant not found');
    }
    
    const apiListJson = result.recordset[0].APIList;
    return JSON.parse(apiListJson || '{}');
  }

  async updateApi(tenantId, section, apiName, updateData) {
    const { url, method, newName } = updateData;
    const pool = getTenantDBPool();
    const result = await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query('SELECT APIList FROM dbo.Tenants WHERE TenantID = @tenantId');
    
    if (result.recordset.length === 0) {
      throw new Error('Tenant not found');
    }
    
    const apiList = JSON.parse(result.recordset[0].APIList || '{}');
    if (!apiList[section] || !apiList[section][apiName]) {
      throw new Error('API not found');
    }
    
    if (url) apiList[section][apiName].url = url;
    if (method) apiList[section][apiName].method = method;
    if (newName && newName !== apiName) {
      apiList[section][newName] = apiList[section][apiName];
      delete apiList[section][apiName];
    }
    
    await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .input('apiList', sql.NVarChar(sql.MAX), JSON.stringify(apiList))
      .query('UPDATE dbo.Tenants SET APIList = @apiList WHERE TenantID = @tenantId');
    
    return { message: 'API updated successfully' };
  }

  async addApi(tenantId, section, apiData) {
    const { apiName, url, method } = apiData;
    
    if (!apiName || !url || !method) {
      throw new Error('apiName, url, and method are required');
    }
    
    const pool = getTenantDBPool();
    const result = await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query('SELECT APIList FROM dbo.Tenants WHERE TenantID = @tenantId');
    
    if (result.recordset.length === 0) {
      throw new Error('Tenant not found');
    }
    
    const apiList = JSON.parse(result.recordset[0].APIList || '{}');
    if (!apiList[section]) {
      apiList[section] = {};
    }
    
    if (apiList[section][apiName]) {
      throw new Error('API already exists');
    }
    
    apiList[section][apiName] = { url, method };
    
    await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .input('apiList', sql.NVarChar(sql.MAX), JSON.stringify(apiList))
      .query('UPDATE dbo.Tenants SET APIList = @apiList WHERE TenantID = @tenantId');
    
    return { message: 'API added successfully' };
  }

  async deleteApi(tenantId, section, apiName) {
    const pool = getTenantDBPool();
    const result = await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query('SELECT APIList FROM dbo.Tenants WHERE TenantID = @tenantId');
    
    if (result.recordset.length === 0) {
      throw new Error('Tenant not found');
    }
    
    const apiList = JSON.parse(result.recordset[0].APIList || '{}');
    if (!apiList[section] || !apiList[section][apiName]) {
      throw new Error('API not found');
    }
    
    delete apiList[section][apiName];
    if (Object.keys(apiList[section]).length === 0) {
      delete apiList[section];
    }
    
    await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .input('apiList', sql.NVarChar(sql.MAX), JSON.stringify(apiList))
      .query('UPDATE dbo.Tenants SET APIList = @apiList WHERE TenantID = @tenantId');
    
    return { message: 'API deleted successfully' };
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
        headers: response.headers
      };
    } catch (err) {
      return {
        working: false,
        statusCode: err.response?.status || null,
        statusText: err.response?.statusText || null,
        message: err.message,
        error: err.response?.data || null
      };
    }
  }
}

module.exports = new ApiService();
