const forwardRequest = require('../utils/RequestForwarder');

class ProxyService {
  async handleProxyRequest(req, res, method, tenantId, section, apiName, paramValues, query, body) {
    return forwardRequest(
      req,
      res,
      method.toUpperCase(),
      tenantId,
      section,
      apiName,
      paramValues,
      query,
      body
    );
  }
}

module.exports = new ProxyService();
