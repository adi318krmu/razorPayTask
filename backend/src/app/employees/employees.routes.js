const express = require('express');
const employeesController = require('./employees.controller');
const { validateAssignEmployee, validateRemoveAssignment } = require('./dto/post--employeesroutes');
const { authenticate, authorize } = require('../../middlewares/auth');

const router = express.Router();

/**
 * GET /rest/employees
 *
 * Role-based employee list. EMP is forbidden.
 *   RM  → employees assigned to them (JOIN employee_manager)
 *   APE → all users with role EMP or RM
 *   CFO → all users with manager assignment (LEFT JOIN)
 *
 * Middleware chain:
 *  1. authenticate              — verify JWT from HttpOnly cookie "auth"
 *  2. authorize('RM','APE','CFO') — block EMP; 403 for EMP role
 *  3. listEmployees             — role-dispatch in service → repository
 */
router.get(
  '/',
  authenticate,
  authorize('RM', 'APE', 'CFO'),
  employeesController.listEmployees
);

/**
 * POST /rest/employees/assign
 *
 * Assign an employee (role: EMP) to a manager (role: RM).
 * Only CFO can perform this action.
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
 * Remove an employee's manager assignment. CFO only.
 */
router.delete(
  '/assign',
  authenticate,
  authorize('CFO'),
  validateRemoveAssignment,
  employeesController.removeAssignment
);

module.exports = router;

