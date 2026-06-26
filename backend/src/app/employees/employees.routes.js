const express = require('express');
const employeesController = require('./employees.controller');
const { validateAssignEmployee, validateRemoveAssignment } = require('./dto/post--employeesroutes');
const { authenticate, authorize } = require('../../middlewares/auth');

const router = express.Router();

/**
 * POST /rest/employees/assign
 *
 * Assign an employee (role: EMP) to a manager (role: RM).
 * Only CFO can perform this action.
 *
 * Middleware chain:
 *  1. authenticate         — verify JWT from HttpOnly cookie "auth"
 *  2. authorize('CFO')     — restrict to CFO role; 403 otherwise
 *  3. validateAssignEmployee — Zod: { employeeId (UUID), managerId (UUID) }; 400 on failure
 *  4. assign               — business logic + DB insert
 */
router.post(
  '/assign',
  authenticate,
  authorize('CFO'),
  validateAssignEmployee,
  employeesController.assign
);

/**
 * DELETE /rest/employees/assign
 *
 * Remove an employee's manager assignment.
 * Only CFO can perform this action.
 *
 * Middleware chain:
 *  1. authenticate           — verify JWT from HttpOnly cookie "auth"
 *  2. authorize('CFO')       — restrict to CFO role; 403 otherwise
 *  3. validateRemoveAssignment — Zod: { employeeId (UUID) }; 400 on failure
 *  4. removeAssignment       — business logic + DB delete
 *
 * Note: Body is used (not URL params) to be consistent with the POST endpoint
 * and to keep IDs out of the URL for this internal admin operation.
 */
router.delete(
  '/assign',
  authenticate,
  authorize('CFO'),
  validateRemoveAssignment,
  employeesController.removeAssignment
);

module.exports = router;
