const axios = require('axios');
const sql = require('mssql');

// MSSQL DB Config – replace with your credentials
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    },
};


// Get API URL from TenantInfo table column matching apiName for given tenantId
// Get HTTP method from api_details table
async function getApiUrlAndMethod(tenantId, apiName) {
  try {
    const pool = await sql.connect(dbConfig);

    // Check tenant exists in TenantInfo
    const tenantCheck = await pool.request()
      .input('TenantID', sql.VarChar, tenantId)
      .query('SELECT TenantID FROM TenantInfo WHERE TenantID = @TenantID');

    if (tenantCheck.recordset.length === 0) {
      throw new Error(`Tenant ID '${tenantId}' not found`);
    }

    // Validate apiName in api_details table and get method
    const apiDetailResult = await pool.request()
      .input('apiName', sql.NVarChar, apiName)
      .query('SELECT api_name, method FROM api_details WHERE api_name = @apiName');

    if (apiDetailResult.recordset.length === 0) {
      throw new Error(`API name '${apiName}' not found in api_details`);
    }

    const httpMethod = apiDetailResult.recordset[0].method.toUpperCase();

    // Get URL from TenantInfo column for apiName (dynamic column)
    // Use sp_executesql to safely query single column dynamically
    const query = `
      DECLARE @url NVARCHAR(500);
      EXEC sp_executesql
        N'SELECT @url = [' + @apiName + '] FROM TenantInfo WHERE TenantID = @tenantId',
        N'@apiName NVARCHAR(100), @tenantId VARCHAR(100), @url NVARCHAR(500) OUTPUT',
        @apiName = @apiName, @tenantId = @tenantId, @url = @url OUTPUT;
      SELECT @url AS url;
    `;

    // Note: MSSQL package doesn't support output params easily,
    // Use a workaround with dynamic SQL inside a string and separate query:

    // Instead use simpler approach:
    const urlResult = await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query(`SELECT [${apiName}] AS url FROM TenantInfo WHERE TenantID = @tenantId`);

    if (urlResult.recordset.length === 0) {
      throw new Error(`Tenant '${tenantId}' not found`);
    }

    const url = urlResult.recordset[0].url;
    if (!url) {
      throw new Error(`No URL configured for API '${apiName}' and Tenant '${tenantId}'`);
    }

    return { url, method: httpMethod };
  } catch (error) {
    console.error('DB/API Lookup Error:', error.message);
    throw error;
  }
}

// Replace :param placeholders in URL path with paramValues array entries
// e.g., /api/user/:userId -> replace with value at paramValues[0]
function replaceUrlParams(urlTemplate, paramValues) {
  const urlObj = new URL(urlTemplate, 'http://dummy');
  const path = urlObj.pathname;

  const paramRegex = /:([a-zA-Z0-9_]+)/g;
  let index = 0;

  const newPath = path.replace(paramRegex, (match, paramName) => {
    if (index >= paramValues.length) {
      throw new Error(`Missing value for parameter: ${paramName}`);
    }
    return encodeURIComponent(paramValues[index++]);
  });

  if (index < paramValues.length) {
    console.warn(`Extra parameter values provided but not used: ${paramValues.slice(index).join(', ')}`);
  }

  urlObj.pathname = newPath;
  return urlObj.href.replace('http://dummy', '');
}

async function forwardRequest(req, res, method, tenantId, apiName, paramValues = [], query = {}, body = {}) {
  try {
    console.log('Proxy request:', { method, tenantId, apiName, paramValues, query });

    const { url: urlTemplate, method: expectedMethod } = await getApiUrlAndMethod(tenantId, apiName);

    // Use method passed or method from api_details? Prefer api_details method
    if (method.toUpperCase() !== expectedMethod.toUpperCase()) {
      // Log a warning; override method with expected
      console.warn(`Warning: request method '${method}' overridden by API method '${expectedMethod}'`);
      method = expectedMethod;
    }

    const resolvedUrl = replaceUrlParams(urlTemplate, paramValues);

    console.log(`Forwarding to: ${resolvedUrl} with method ${method}`);

    const response = await axios({
      method: method.toLowerCase(),
      url: resolvedUrl,
      params: query,
      data: body,
      // If needed, forward headers / auth tokens etc. here
      headers: {
        // Add any headers here if necessary, e.g. auth from original request
        // ...req.headers,
      },
      timeout: 10000,
    });

    res.status(response.status).json(response.data);
  } catch (err) {
    console.error('Forwarding Error:', err.message);
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.message, details: err.response?.data || null });
  }
}

module.exports = forwardRequest;
