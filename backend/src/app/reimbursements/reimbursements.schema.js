const { pgTable, uuid, varchar, text, numeric, timestamp } = require('drizzle-orm/pg-core');
const { z } = require('zod');
const { users } = require('../auth/auth.schema');

// ==========================================
// 1. STATUS & DECISION CONSTANTS
// ==========================================

const REIMBURSEMENT_STATUS = {
  PENDING:  'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

const STATUS_VALUES = Object.values(REIMBURSEMENT_STATUS);

const DECISION = {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

const DECISION_VALUES = Object.values(DECISION);

/**
 * Sequential approval order: role → the role that must have approved before it.
 * RM  has no prerequisite (first in chain).
 * APE requires RM  to have APPROVED.
 * CFO requires APE to have APPROVED.
 */
const APPROVAL_ORDER = {
  RM:  null,   // first — no prerequisite
  APE: 'RM',   // requires prior RM approval
  CFO: 'APE'   // requires prior APE approval
};

// ==========================================
// 2. DRIZZLE ORM TABLE DEFINITIONS
// ==========================================

/**
 * Reimbursements table.
 * employee_id references users.id with cascade-delete.
 * status defaults to PENDING.
 */
const reimbursements = pgTable('reimbursements', {
  id:          uuid('id').primaryKey().defaultRandom(),
  employeeId:  uuid('employee_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title:       varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  amount:      numeric('amount', { precision: 12, scale: 2 }).notNull(),
  status:      varchar('status', { length: 50 })
    .notNull()
    .default(REIMBURSEMENT_STATUS.PENDING),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow()
});

/**
 * Reimbursement approvals table.
 * Stores one row per (reimbursement_id, approver_role) — duplicate prevention is enforced
 * in the service layer before INSERT so errors are readable instead of DB constraint errors.
 */
const reimbursementApprovals = pgTable('reimbursement_approvals', {
  id:              uuid('id').primaryKey().defaultRandom(),
  reimbursementId: uuid('reimbursement_id')
    .notNull()
    .references(() => reimbursements.id, { onDelete: 'cascade' }),
  approverId:      uuid('approver_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  approverRole:    varchar('approver_role', { length: 50 }).notNull(),
  decision:        varchar('decision', { length: 50 }).notNull(),
  remarks:         text('remarks'),
  approvedAt:      timestamp('approved_at', { withTimezone: true }).defaultNow()
});

// ==========================================
// 3. ZOD REQUEST VALIDATION SCHEMAS
// ==========================================

/**
 * Schema for POST /rest/reimbursements — create a reimbursement.
 * employee_id and status are injected server-side, not accepted from the body.
 */
const createReimbursementSchema = z.object({
  title: z
    .string({ required_error: 'title is required' })
    .min(3,   { message: 'title must be at least 3 characters' })
    .max(255, { message: 'title must not exceed 255 characters' })
    .trim(),
  description: z
    .string()
    .max(2000, { message: 'description must not exceed 2000 characters' })
    .trim()
    .optional(),
  amount: z
    .number({ required_error: 'amount is required', invalid_type_error: 'amount must be a number' })
    .positive({ message: 'amount must be greater than 0' })
    .finite({ message: 'amount must be a finite number' })
});

/**
 * Schema for PATCH /rest/reimbursements — approve or reject a reimbursement.
 * approver_id and approver_role are injected from req.user server-side.
 */
const approveReimbursementSchema = z.object({
  reimbursementId: z
    .string({ required_error: 'reimbursementId is required' })
    .uuid({ message: 'reimbursementId must be a valid UUID' }),
  decision: z.enum(DECISION_VALUES, {
    errorMap: () => ({ message: `decision must be one of: ${DECISION_VALUES.join(', ')}` })
  }),
  remarks: z
    .string()
    .max(1000, { message: 'remarks must not exceed 1000 characters' })
    .trim()
    .optional()
});

module.exports = {
  reimbursements,
  reimbursementApprovals,
  REIMBURSEMENT_STATUS,
  STATUS_VALUES,
  DECISION,
  DECISION_VALUES,
  APPROVAL_ORDER,
  createReimbursementSchema,
  approveReimbursementSchema
};
