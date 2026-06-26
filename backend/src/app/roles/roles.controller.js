const rolesService = require('./roles.service');
const { sendSuccess } = require('../../utils/response');

/**
 * Controller for the roles module.
 * Responsibility: HTTP in/out only — delegates all business logic to rolesService.
 */

/**
 * POST /rest/roles/assign
 * Assign a role to a user. Accessible by CFO only (enforced via middleware).
 *
 * @type {import('express').RequestHandler}
 */
const assignRole = async (req, res, next) => {
  try {
    const { userId, role } = req.body; // already validated by Zod DTO middleware

    const updatedUser = await rolesService.assignRole(userId, role);

    return sendSuccess(res, 200, 'Role assigned successfully', {
      user: updatedUser
    });
  } catch (error) {
    next(error); // forwarded to global error handler
  }
};

module.exports = { assignRole };
