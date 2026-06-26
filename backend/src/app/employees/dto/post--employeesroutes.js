const { validateBody } = require('../../../middlewares/validate');
const { assignEmployeeSchema, removeAssignmentSchema } = require('../employees.schema');

/**
 * DTO validators for the employees module.
 * Maps Zod schemas to the generic validateBody middleware.
 */
module.exports = {
  validateAssignEmployee:    validateBody(assignEmployeeSchema),
  validateRemoveAssignment:  validateBody(removeAssignmentSchema)
};
