const { eq } = require('drizzle-orm');
const { db } = require('../../config/db');
const { users, employeeManager } = require('../auth/auth.schema');

/**
 * Repository layer for employee-manager relationship data access.
 * Single Responsibility: raw DB operations only — no business logic.
 */

/**
 * Find a user by UUID, returning id, name, email, and role.
 * Used to verify existence and check role before assignment.
 *
 * @param {string} id - User UUID
 * @returns {Promise<{id: string, name: string, email: string, role: string}|null>}
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
 * Find an existing assignment for a given employee.
 * Since employee_id is the PRIMARY KEY, at most one row is returned.
 *
 * @param {string} employeeId - Employee UUID
 * @returns {Promise<{employeeId: string, managerId: string}|null>}
 */
const findAssignment = async (employeeId) => {
  const result = await db
    .select({
      employeeId: employeeManager.employeeId,
      managerId:  employeeManager.managerId
    })
    .from(employeeManager)
    .where(eq(employeeManager.employeeId, employeeId));

  return result[0] || null;
};

/**
 * Insert a new employee-manager assignment row.
 *
 * @param {string} employeeId - UUID of the employee (role: EMP)
 * @param {string} managerId  - UUID of the manager  (role: RM)
 * @returns {Promise<{employeeId: string, managerId: string}>}
 */
const createAssignment = async (employeeId, managerId) => {
  const result = await db
    .insert(employeeManager)
    .values({ employeeId, managerId })
    .returning({
      employeeId: employeeManager.employeeId,
      managerId:  employeeManager.managerId
    });

  return result[0];
};

/**
 * Delete the assignment row for an employee.
 *
 * @param {string} employeeId - UUID of the employee whose assignment is removed
 * @returns {Promise<{employeeId: string, managerId: string}|null>}
 */
const deleteAssignment = async (employeeId) => {
  const result = await db
    .delete(employeeManager)
    .where(eq(employeeManager.employeeId, employeeId))
    .returning({
      employeeId: employeeManager.employeeId,
      managerId:  employeeManager.managerId
    });

  return result[0] || null;
};

module.exports = {
  findUserById,
  findAssignment,
  createAssignment,
  deleteAssignment
};
