import jwt from 'jsonwebtoken';

const getJwtSecret = () => process.env.JWT_SECRET || 'gramsetu_super_secret_jwt_key_2026';

/**
 * Middleware to verify JWT token from Authorization header
 */
export const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token missing or invalid. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Your session has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token.',
    });
  }
};

/**
 * Middleware ensuring user is a registered citizen
 */
export const requireCitizen = (req, res, next) => {
  if (!req.user || req.user.role !== 'citizen') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Citizen authorization required.',
    });
  }
  next();
};

/**
 * Middleware ensuring user is an authorized admin
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrative privileges required.',
    });
  }
  next();
};
