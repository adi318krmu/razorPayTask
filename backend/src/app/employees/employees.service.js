const employeesRepository = require('./employees.repository');
const { ROLES } = require('../../constants/roles');

/**
 * Service layer — all business rules for employee-manager assignments live here.
 */

/**
 * Assign an employee to a manager.
 *
 * Business rules enforced:
 *  1. Employee must exist.
 *  2. Employee must have role EMP.
 *  3. Manager must exist.
 *  4. Manager must have role RM.
 *  5. Employee must not already be assigned (one-to-one constraint).
 *
 * @param {string} employeeId
 * @param {string} managerId
 * @returns {Promise<{employeeId: string, managerId: string}>} Created assignment
 * @throws {Error} with statusCode 404 | 422 | 409
 */
const assignEmployee = async (employeeId, managerId) => {
  // ── 1. Verify employee exists ─────────────────────────────────────────────
  const employee = await employeesRepository.findUserById(employeeId);
  if (!employee) {
    const err = new Error(`Employee with id "${employeeId}" not found.`);
    err.statusCode = 404;
    throw err;
  }

  // ── 2. Verify employee role is EMP ────────────────────────────────────────
  if (employee.role !== ROLES.EMP) {
    const err = new Error(
      `User "${employeeId}" has role "${employee.role}". Only users with role EMP can be assigned as employees.`
    );
    err.statusCode = 422;
    throw err;
  }

  // ── 3. Verify manager exists ──────────────────────────────────────────────
  const manager = await employeesRepository.findUserById(managerId);
  if (!manager) {
    const err = new Error(`Manager with id "${managerId}" not found.`);
    err.statusCode = 404;
    throw err;
  }

  // ── 4. Verify manager role is RM ──────────────────────────────────────────
  if (manager.role !== ROLES.RM) {
    const err = new Error(
      `User "${managerId}" has role "${manager.role}". Only users with role RM can be assigned as managers.`
    );
    err.statusCode = 422;
    throw err;
  }

  // ── 5. Prevent duplicate assignment ──────────────────────────────────────
  const existing = await employeesRepository.findAssignment(employeeId);
  if (existing) {
    const err = new Error(
      `Employee "${employeeId}" is already assigned to manager "${existing.managerId}". Remove the existing assignment first.`
    );
    err.statusCode = 409;
    throw err;
  }

  // ── 6. Persist ────────────────────────────────────────────────────────────
  const assignment = await employeesRepository.createAssignment(employeeId, managerId);

  return {
    assignment,
    employee: { id: employee.id, name: employee.name, email: employee.email, role: employee.role },
    manager:  { id: manager.id,  name: manager.name,  email: manager.email,  role: manager.role  }
  };
};

/**
 * Remove an employee's manager assignment.
 *
 * Business rules enforced:
 *  1. Employee must exist.
 *  2. An assignment must currently exist for that employee.
 *
 * @param {string} employeeId
 * @returns {Promise<{employeeId: string, managerId: string}>} Deleted assignment row
 * @throws {Error} with statusCode 404
 */
const removeAssignment = async (employeeId) => {
  // ── 1. Verify employee exists ─────────────────────────────────────────────
  const employee = await employeesRepository.findUserById(employeeId);
  if (!employee) {
    const err = new Error(`Employee with id "${employeeId}" not found.`);
    err.statusCode = 404;
    throw err;
  }

  // ── 2. Verify assignment exists ───────────────────────────────────────────
  const existing = await employeesRepository.findAssignment(employeeId);
  if (!existing) {
    const err = new Error(`No assignment found for employee "${employeeId}".`);
    err.statusCode = 404;
    throw err;
  }

  // ── 3. Delete ─────────────────────────────────────────────────────────────
  const deleted = await employeesRepository.deleteAssignment(employeeId);

  return { deleted };
};

/**
 * Get employees list — visibility depends on caller's role.
 *
 *   RM  → employees reporting to them (via employee_manager join)
 *   APE → all users with role EMP or RM
 *   CFO → every user with their manager assignment (LEFT JOIN)
 *   EMP → forbidden (also blocked in router)
 *
 * @param {Object} caller - { id, role } from req.user
 * @returns {Promise<Array>}
 */
const getEmployees = async (caller) => {
  const { id: callerId, role: callerRole } = caller;

  switch (callerRole) {
    case ROLES.RM:
      return employeesRepository.findEmployeesUnderManager(callerId);

    case ROLES.APE:
      return employeesRepository.findAllEmployeesAndManagers();

    case ROLES.CFO:
      return employeesRepository.findAllUsers();

    default: {
      // Defence-in-depth: EMP should never reach here (blocked by authorize middleware)
      const err = new Error('Access denied. EMP cannot view the employees list.');
      err.statusCode = 403;
      throw err;
    }
  }
};

module.exports = { assignEmployee, removeAssignment, getEmployees };

