const proxyService = require('../services/proxy.service');

class ProxyController {
  async handleProxy(req, res) {
    try {
      const { apiName } = req.params;
      const wildcardPath = req.params[0] || '';
      const paramValues = wildcardPath.split('/').filter(Boolean);

      // Extract tenantId and method from headers or body (as you prefer)
      // Example: tenantId in 'x-tenant-id' header, method in 'x-method' header
      const tenantId = req.headers['x-tenant-id'] || req.body.tenantId;
      const method = req.headers['x-method'] || req.method;

      if (!tenantId) {
        return res.status(400).json({ error: 'Missing tenantId in headers or body' });
      }

      await proxyService.handleProxyRequest(
        req,
        res,
        method,
        tenantId,
        apiName,
        paramValues,
        req.query,
        req.body
      );
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ error: 'Proxy request failed', details: error.message });
    }
  }
}

module.exports = new ProxyController();
