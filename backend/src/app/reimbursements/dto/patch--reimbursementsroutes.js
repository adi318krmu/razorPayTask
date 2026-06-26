const { validateBody } = require('../../../middlewares/validate');
const { approveReimbursementSchema } = require('../reimbursements.schema');

/**
 * DTO validators for the reimbursements module PATCH requests.
 */
module.exports = {
  validateApproveReimbursement: validateBody(approveReimbursementSchema)
};
