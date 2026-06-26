const rolesRepository = require('./roles.repository');

/**
 * Service layer for role assignment business logic.
 * Depends on rolesRepository (injected via require — simple DI for JS).
 */

/**
 * Assign a new role to a user.
 *
 * Business rules:
 *  1. The target user must exist.
 *  2. The role value must be valid (already guaranteed by Zod DTO upstream,
 *     but the service enforces it as a second line of defence).
 *
 * @param {string} userId - UUID of the user whose role is being updated
 * @param {string} role   - New role to assign
 * @returns {Promise<Object>} Updated user { id, name, email, role }
 * @throws {Error} with statusCode 404 if user not found
 */
const assignRole = async (userId, role) => {
  // 1. Verify user exists
  const existingUser = await rolesRepository.findUserById(userId);
  if (!existingUser) {
    const err = new Error(`User with id "${userId}" not found.`);
    err.statusCode = 404;
    throw err;
  }

  // 2. Persist role update
  const updatedUser = await rolesRepository.updateUserRole(userId, role);

  return updatedUser;
};

module.exports = { assignRole };
