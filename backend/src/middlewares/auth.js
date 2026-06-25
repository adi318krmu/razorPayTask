const { verifyToken } = require('../utils/token');
const { sendError } = require('../utils/response');

/**
 * Middleware to check if user is authenticated via JWT.
 * Strictly cookie-based authentication.
 */
const isAuthenticated = (req, res, next) => {
  let token = null;

  // Read cookie token
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return sendError(res, 401, 'Authentication failed. Please log in.');
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return sendError(res, 401, 'Authentication failed. Session expired or invalid token.');
  }

  // Attach user payload to request
  req.user = {
    id: decoded.id,
    role: decoded.role
  };

  next();
};

/**
 * Middleware to check if user role matches authorized roles.
 * @param {Array<string>} roles - List of allowed roles
 */
const hasRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Access denied. User not authenticated.');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'Access denied. You do not have the required permissions.');
    }

    next();
  };
};

module.exports = {
  isAuthenticated,
  hasRole
};
