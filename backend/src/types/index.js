/**
 * @typedef {Object} User
 * @property {string} id - UUID format
 * @property {string} name - User's full name
 * @property {string} email - Unique email
 * @property {string} password_hash - Hashed password
 * @property {('employee'|'manager'|'admin')} role - User role
 * @property {string} [created_at] - ISO string timestamp
 */

/**
 * @typedef {Object} APIResponse
 * @property {boolean} success - Operation status
 * @property {string} message - User-friendly message
 * @property {Object} [data] - Return payload (for success)
 * @property {Array<any>} [error] - Error details list (for error)
 */

module.exports = {};
