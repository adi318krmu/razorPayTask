const { sendError } = require('../utils/response');
const logger = require('../loggers/logger');

/**
 * Express error-handling middleware.
 * Formats errors into the standardized JSON API response format.
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message}`, err.stack);

  const status = err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';
  const errors = err.errors || [];

  return sendError(res, status, message, errors);
};

module.exports = errorHandler;
