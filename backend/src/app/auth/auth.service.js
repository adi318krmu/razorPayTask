const { eq } = require('drizzle-orm');
const { db } = require('../../config/db');
const { users } = require('./auth.schema');
const bcrypt = require('bcryptjs');

/**
 * Service functions for Authentication business logic.
 * Switched from raw PG client to Drizzle ORM.
 */

/**
 * Find user by email in database.
 * @param {string} email
 * @returns {Promise<Object|null>} user details
 */
const findUserByEmail = async (email) => {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      password_hash: users.passwordHash,
      role: users.role
    })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()));

  return result[0] || null;
};

/**
 * Find user by ID in database.
 * @param {string} id - User uuid
 * @returns {Promise<Object|null>} user details (sans password_hash)
 */
const findUserById = async (id) => {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role
    })
    .from(users)
    .where(eq(users.id, id));

  return result[0] || null;
};

/**
 * Create a new user in the database.
 * @param {Object} userData
 * @param {string} userData.name
 * @param {string} userData.email
 * @param {string} userData.password
 * @param {string} userData.role
 * @returns {Promise<Object>} new user details (sans password_hash)
 */
const createUser = async ({ name, email, password, role }) => {
  const salt = await bcrypt.genSalt(10);
  const passwordHashValue = await bcrypt.hash(password, salt);

  const result = await db
    .insert(users)
    .values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: passwordHashValue,
      role: role
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role
    });

  return result[0];
};

/**
 * Compare plain text password with hashed password.
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>} match status
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  comparePassword
};
