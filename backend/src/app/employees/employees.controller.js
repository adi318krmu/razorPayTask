const employeesService = require('./employees.service');
const { sendSuccess } = require('../../utils/response');

/**
 * Controller for the employees module.
 * Responsibility: HTTP in/out only — all business logic lives in employeesService.
 */

/**
 * POST /rest/employees/assign
 * Assign an EMP-role user to an RM-role user. CFO access only.
 *
 * @type {import('express').RequestHandler}
 */
const assign = async (req, res, next) => {
  try {
    const { employeeId, managerId } = req.body; // pre-validated by Zod DTO

    const result = await employeesService.assignEmployee(employeeId, managerId);

    return sendSuccess(res, 201, 'Employee assigned to manager successfully', {
      assignment: result.assignment,
      employee:   result.employee,
      manager:    result.manager
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /rest/employees/assign
 * Remove an employee's manager assignment. CFO access only.
 *
 * @type {import('express').RequestHandler}
 */
const removeAssignment = async (req, res, next) => {
  try {
    const { employeeId } = req.body; // pre-validated by Zod DTO

    const result = await employeesService.removeAssignment(employeeId);

    return sendSuccess(res, 200, 'Employee assignment removed successfully', {
      removed: result.deleted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /rest/employees
 * List employees with role-based visibility (RM / APE / CFO).
 * EMP is blocked at the route level via authorize middleware.
 *
 * @type {import('express').RequestHandler}
 */
const listEmployees = async (req, res, next) => {
  try {
    const employees = await employeesService.getEmployees(req.user);

    return sendSuccess(res, 200, 'Employees retrieved successfully', {
      count: employees.length,
      employees
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { assign, removeAssignment, listEmployees };

