const { z } = require('zod');
const { ROLE_VALUES } = require('../../constants/roles');

// ==========================================
// ZOD REQUEST VALIDATION SCHEMAS
// ==========================================

/**
 * Schema for POST /rest/roles/assign request body.
 * Validates that userId is a valid UUID and role is one of the allowed values.
 */
const assignRoleSchema = z.object({
  userId: z
    .string({ required_error: 'userId is required' })
    .uuid({ message: 'userId must be a valid UUID' }),
  role: z.enum(ROLE_VALUES, {
    errorMap: () => ({ message: `role must be one of: ${ROLE_VALUES.join(', ')}` })
  })
});

module.exports = { assignRoleSchema };
