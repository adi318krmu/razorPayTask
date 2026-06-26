const { validateBody } = require('../../../middlewares/validate');
const { createReimbursementSchema } = require('../reimbursements.schema');

/**
 * DTO validators for the reimbursements module POST requests.
 */
module.exports = {
  validateCreateReimbursement: validateBody(createReimbursementSchema)
};
