const { and, eq, inArray } = require('drizzle-orm');
const { db } = require('../../config/db');
const { users, employeeManager } = require('../auth/auth.schema');

/**
 * Repository layer for employee-manager relationship data access.
 * Single Responsibility: raw DB operations only — no business logic.
 */

// ─── Shared column projection (reused across queries) ────────────────────────
const USER_COLS = {
  id:    users.id,
  name:  users.name,
  email: users.email,
  role:  users.role
};

/**
 * Find a user by UUID, returning id, name, email, and role.
 */
const findUserById = async (id) => {
  const result = await db
    .select(USER_COLS)
    .from(users)
    .where(eq(users.id, id));

  return result[0] || null;
};

/**
 * Find an existing assignment for a given employee.
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

// ─── GET query methods ────────────────────────────────────────────────────────

/**
 * GET /rest/employees — RM view.
 * Returns all employees (role=EMP) whose employee_id is linked to this RM.
 * Single JOIN: employee_manager ⟶ users
 *
 * @param {string} managerId - UUID of the authenticated RM
 * @returns {Promise<Array>}
 */
const findEmployeesUnderManager = async (managerId) => {
  return db
    .select({
      id:        users.id,
      name:      users.name,
      email:     users.email,
      role:      users.role,
      managerId: employeeManager.managerId
    })
    .from(employeeManager)
    .innerJoin(users, eq(employeeManager.employeeId, users.id))
    .where(eq(employeeManager.managerId, managerId));
};

/**
 * GET /rest/employees — APE view.
 * Returns all users with role EMP or RM.
 *
 * @returns {Promise<Array>}
 */
const findAllEmployeesAndManagers = async () => {
  return db
    .select(USER_COLS)
    .from(users)
    .where(inArray(users.role, ['EMP', 'RM']));
};

/**
 * GET /rest/employees — CFO view.
 * Returns every user (including APE and CFO) with their manager assignment if any.
 * LEFT JOIN so users without an assignment are still included.
 *
 * @returns {Promise<Array>}
 */
const findAllUsers = async () => {
  return db
    .select({
      id:        users.id,
      name:      users.name,
      email:     users.email,
      role:      users.role,
      managerId: employeeManager.managerId   // null when no assignment
    })
    .from(users)
    .leftJoin(employeeManager, eq(users.id, employeeManager.employeeId));
};

/**
 * Verify that a specific employee reports to a specific manager.
 * Used by GET /rest/reimbursements/:userId (RM gate).
 *
 * @param {string} employeeId
 * @param {string} managerId
 * @returns {Promise<boolean>}
 */
const isEmployeeUnderManager = async (employeeId, managerId) => {
  const result = await db
    .select({ employeeId: employeeManager.employeeId })
    .from(employeeManager)
    .where(
      and(
        eq(employeeManager.employeeId, employeeId),
        eq(employeeManager.managerId,  managerId)
      )
    );

  return result.length > 0;
};

module.exports = {
  findUserById,
  findAssignment,
  createAssignment,
  deleteAssignment,
  findEmployeesUnderManager,
  findAllEmployeesAndManagers,
  findAllUsers,
  isEmployeeUnderManager
};
