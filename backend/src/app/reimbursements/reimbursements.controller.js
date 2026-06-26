const reimbursementsService = require('./reimbursements.service');
const { sendSuccess } = require('../../utils/response');

/**
 * Controller for the reimbursements module.
 * Responsibility: HTTP in/out only.
 */

/**
 * POST /rest/reimbursements
 * Create a new reimbursement request.
 * Only authenticated EMP-role users can reach this handler.
 *
 * @type {import('express').RequestHandler}
 */
const create = async (req, res, next) => {
  try {
    const { title, description, amount } = req.body;   // pre-validated by Zod DTO
    const employeeId = req.user.id;                     // injected by authenticate middleware

    const reimbursement = await reimbursementsService.createReimbursement({
      employeeId,
      title,
      description,
      amount
    });

    return sendSuccess(res, 201, 'Reimbursement request created successfully', {
      reimbursement
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /rest/reimbursements
 * Role-based reimbursement list.
 * Visibility rules enforced in reimbursementsService.getReimbursements.
 *
 * @type {import('express').RequestHandler}
 */
const list = async (req, res, next) => {
  try {
    const items = await reimbursementsService.getReimbursements(req.user);

    return sendSuccess(res, 200, 'Reimbursements retrieved successfully', {
      count: items.length,
      reimbursements: items
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /rest/reimbursements/:userId
 * RM-only: returns all reimbursements for a specific employee,
 * gated by the reporting-relationship check in the service.
 *
 * @type {import('express').RequestHandler}
 */
const listForEmployee = async (req, res, next) => {
  try {
    const rmId   = req.user.id;
    const userId = req.params.userId;

    const items = await reimbursementsService.getReimbursementsForEmployee(rmId, userId);

    return sendSuccess(res, 200, 'Employee reimbursements retrieved successfully', {
      count: items.length,
      reimbursements: items
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, list, listForEmployee };

