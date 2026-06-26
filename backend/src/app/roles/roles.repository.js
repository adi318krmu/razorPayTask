const { eq } = require('drizzle-orm');
const { db } = require('../../config/db');
const { users } = require('../auth/auth.schema');

/**
 * Repository layer for role-related database operations.
 * Single Responsibility: only data access — no business logic here.
 */

/**
 * Find a user by their UUID.
 * @param {string} id - User UUID
 * @returns {Promise<Object|null>} user object or null
 */
const findUserById = async (id) => {
  const result = await db
    .select({
      id:    users.id,
      name:  users.name,
      email: users.email,
      role:  users.role
    })
    .from(users)
    .where(eq(users.id, id));

  return result[0] || null;
};

/**
 * Update the role of a user identified by their UUID.
 * @param {string} userId - User UUID
 * @param {string} role   - New role value (must be a valid ROLE constant)
 * @returns {Promise<Object>} Updated user row { id, name, email, role }
 */
const updateUserRole = async (userId, role) => {
  const result = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId))
    .returning({
      id:    users.id,
      name:  users.name,
      email: users.email,
      role:  users.role
    });

  return result[0];
};

module.exports = {
  findUserById,
  updateUserRole
};
