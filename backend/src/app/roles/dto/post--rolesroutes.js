const { validateBody } = require('../../../middlewares/validate');
const { assignRoleSchema } = require('../roles.schema');

/**
 * DTO validators for the roles module POST requests.
 * Maps schemas to the generic validation middleware.
 */
module.exports = {
  validateAssignRole: validateBody(assignRoleSchema)
};
