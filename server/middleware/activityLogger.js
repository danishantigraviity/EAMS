const ActivityLog = require('../models/ActivityLog');

const activityLogger = async (req, res, next) => {
  const logMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

  if (!logMethods.includes(req.method)) return next();

  const originalJson = res.json.bind(res);

  res.json = async (body) => {
    if (body && body.success !== false) {
      try {
        const resource = req.baseUrl.replace('/api/', '') + (req.path !== '/' ? req.path : '');
        await ActivityLog.create({
          userId: req.user ? req.user._id : null,
          action: `${req.method} ${req.baseUrl}${req.path}`,
          resource: req.baseUrl.replace('/api/', '').split('/')[0],
          resourceId: req.params.id || (body.data && body.data._id) || null,
          details: { method: req.method, path: req.path, body: req.method !== 'GET' ? req.body : undefined },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          timestamp: new Date(),
        });
      } catch (err) {
        // Do not block request if logging fails
        console.error('Activity log error:', err.message);
      }
    }
    return originalJson(body);
  };

  next();
};

module.exports = activityLogger;
