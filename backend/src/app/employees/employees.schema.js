const { z } = require('zod');

// ==========================================
// ZOD REQUEST VALIDATION SCHEMAS
// ==========================================

/**
 * Schema for POST /rest/employees/assign
 * Both IDs must be valid UUIDs — role verification is done in the service layer.
 */
const assignEmployeeSchema = z.object({
  employeeId: z
    .string({ required_error: 'employeeId is required' })
    .uuid({ message: 'employeeId must be a valid UUID' }),
  managerId: z
    .string({ required_error: 'managerId is required' })
    .uuid({ message: 'managerId must be a valid UUID' })
}).refine(
  (data) => data.employeeId !== data.managerId,
  { message: 'employeeId and managerId must be different', path: ['employeeId'] }
);

/**
 * Schema for DELETE /rest/employees/assign
 * Only the employee's ID is needed to remove their assignment.
 */
const removeAssignmentSchema = z.object({
  employeeId: z
    .string({ required_error: 'employeeId is required' })
    .uuid({ message: 'employeeId must be a valid UUID' })
});

module.exports = { assignEmployeeSchema, removeAssignmentSchema };
