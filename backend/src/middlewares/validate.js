const { sendError } = require('../utils/response');

/**
 * Middleware to validate request body using a Zod schema.
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req.body);
      
      if (!parsed.success) {
        // Format validation errors nicely
        const formattedErrors = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message
        }));
        
        return sendError(res, 400, 'Validation failed', formattedErrors);
      }
      
      // Override body with successfully parsed and sanitised data
      req.body = parsed.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  validateBody
};
