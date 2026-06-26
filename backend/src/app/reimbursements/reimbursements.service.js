const reimbursementsRepository = require('./reimbursements.repository');
const employeesRepository = require('../employees/employees.repository');

/**
 * Service layer for reimbursement business logic.
 */

/**
 * Create a new reimbursement request on behalf of an authenticated employee.
 */
const createReimbursement = async ({ employeeId, title, description, amount }) => {
  return reimbursementsRepository.createReimbursement({
    employeeId,
    title,
    description,
    amount
  });
};

/**
 * GET /rest/reimbursements — role-based visibility.
 *
 *   EMP → own reimbursements
 *   RM  → PENDING reimbursements of employees who report to them
 *   APE → PENDING reimbursements that RM has approved (awaiting APE)
 *   CFO → PENDING reimbursements that APE has approved (awaiting CFO)
 *
 * @param {Object} caller - { id, role } from req.user
 * @returns {Promise<Array>}
 */
const getReimbursements = async (caller) => {
  const { id: callerId, role: callerRole } = caller;

  switch (callerRole) {
    case 'EMP':
      return reimbursementsRepository.findByEmployee(callerId);

    case 'RM':
      return reimbursementsRepository.findPendingByManager(callerId);

    case 'APE':
      return reimbursementsRepository.findRmApproved();

    case 'CFO':
      return reimbursementsRepository.findApeApproved();

    default: {
      const err = new Error('Access denied. Your role cannot access reimbursements.');
      err.statusCode = 403;
      throw err;
    }
  }
};

/**
 * GET /rest/reimbursements/:userId — RM only.
 * Returns all reimbursements for a specific employee, but only if that
 * employee directly reports to the requesting RM.
 *
 * @param {string} rmId      - UUID of the authenticated RM
 * @param {string} userId    - UUID of the target employee (from URL param)
 * @returns {Promise<Array>}
 * @throws {Error} with statusCode 404 | 403
 */
const getReimbursementsForEmployee = async (rmId, userId) => {
  // 1. Verify target user exists
  const employee = await employeesRepository.findUserById(userId);
  if (!employee) {
    const err = new Error(`User with id "${userId}" not found.`);
    err.statusCode = 404;
    throw err;
  }

  // 2. Verify employee reports to this RM
  const isUnderRm = await employeesRepository.isEmployeeUnderManager(userId, rmId);
  if (!isUnderRm) {
    const err = new Error(
      `Access denied. Employee "${userId}" does not report to you.`
    );
    err.statusCode = 403;
    throw err;
  }

  // 3. Return all reimbursements for that employee
  return reimbursementsRepository.findByEmployeeId(userId);
};

module.exports = {
  createReimbursement,
  getReimbursements,
  getReimbursementsForEmployee
};
