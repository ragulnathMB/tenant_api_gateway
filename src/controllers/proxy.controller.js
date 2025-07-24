const proxyService = require('../services/proxyService');

class ProxyController {
  async handleProxy(req, res) {
    try {
      const { method, tenantId, section, apiName } = req.params;
      const wildcardPath = req.params[0] || '';
      const paramValues = wildcardPath.split('/').filter(Boolean);
      
      await proxyService.handleProxyRequest(
        req,
        res,
        method,
        tenantId,
        section,
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
