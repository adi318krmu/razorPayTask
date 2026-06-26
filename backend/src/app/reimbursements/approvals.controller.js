const approvalsService = require('./approvals.service');
const { sendSuccess } = require('../../utils/response');

/**
 * Controller for the reimbursement approval workflow.
 * Responsibility: HTTP in/out — extracts identity from req.user, delegates to service.
 */

/**
 * PATCH /rest/reimbursements
 * Approve or reject a reimbursement.
 * Accessible by RM, APE, CFO only (enforced via middleware).
 *
 * @type {import('express').RequestHandler}
 */
const approve = async (req, res, next) => {
  try {
    const { reimbursementId, decision, remarks } = req.body; // pre-validated by Zod DTO
    const approverId   = req.user.id;
    const approverRole = req.user.role;

    const result = await approvalsService.processApproval({
      reimbursementId,
      approverId,
      approverRole,
      decision,
      remarks
    });

    const message = decision === 'APPROVED'
      ? `Reimbursement ${decision.toLowerCase()} by ${approverRole}`
      : `Reimbursement rejected by ${approverRole}`;

    return sendSuccess(res, 200, message, {
      approval:        result.approval,
      reimbursement:   result.reimbursement
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { approve };
