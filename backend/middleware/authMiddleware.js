const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'rhino_field_ops_ultra_secure_secret_2026';

const authMiddleware = {
  verifyToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(403).json({ success: false, error: 'Access denied. Token missing.' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Authentication rejected. Token invalid.' });
    }
  },

  requireRole: (allowedRoles) => {
    return (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false, 
          error: `Access Denied. Required privileges: [${allowedRoles.join(', ')}]` 
        });
      }
      next();
    };
  }
};

module.exports = authMiddleware;
