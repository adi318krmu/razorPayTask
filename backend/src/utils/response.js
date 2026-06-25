/**
 * Response Utility Helpers to enforce API Response Convention.
 */

/**
 * Send a success response.
 * @param {import('express').Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Response description message
 * @param {Object|Array} [data={}] - Response payload data
 */
const sendSuccess = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send an error response.
 * @param {import('express').Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - General error description message
 * @param {Array<any>} [error=[]] - Detailed array of error messages or schemas
 */
const sendError = (res, statusCode, message, error = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(error && error.length > 0 ? { error } : { error: [] })
  });
};

module.exports = {
  sendSuccess,
  sendError
};
