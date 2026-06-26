const { verifyToken } = require('../utils/token');
const { sendError } = require('../utils/response');

/**
 * Middleware: authenticate
 * Reads the JWT from the HttpOnly cookie named "auth", verifies it,
 * and attaches the decoded payload to req.user.
 */
const authenticate = (req, res, next) => {
  const token = req.cookies?.auth;

  if (!token) {
    return sendError(res, 401, 'Authentication required. Please log in.');
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return sendError(res, 401, 'Authentication failed. Session expired or invalid token.');
  }

  // Attach user payload to request
  req.user = {
    id:   decoded.id,
    role: decoded.role
  };

  next();
};

/**
 * Middleware factory: authorize(...roles)
 * Allows access only if req.user.role is one of the supplied roles.
 * Must be used after `authenticate`.
 *
 * @param {...string} roles - Allowed role strings (e.g. 'CFO', 'RM')
 * @returns {import('express').RequestHandler}
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required. Please log in.');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Required role(s): ${roles.join(', ')}.`
      );
    }

    next();
  };
};

// ── Backwards-compatibility aliases (used by existing auth.routes.js) ─────────
const isAuthenticated = authenticate;
const hasRole = (rolesArray = []) => authorize(...rolesArray);

module.exports = {
  authenticate,
  authorize,
  isAuthenticated,
  hasRole
};

