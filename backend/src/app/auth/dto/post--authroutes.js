const { validateBody } = require('../../../middlewares/validate');
const { registerSchema, loginSchema } = require('../auth.schema');

/**
 * DTO validators for auth module POST requests.
 * Maps schemas to the generic validation middleware.
 */
module.exports = {
  validateRegister: validateBody(registerSchema),
  validateLogin: validateBody(loginSchema)
};
