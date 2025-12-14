const { verifyAccessToken } = require('../utils/auth');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Authorization header missing or invalid',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      role: payload.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      status: 401,
      code: 'TOKEN_EXPIRED',
      message: 'Access token is invalid or expired',
    });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        status: 403,
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
};

