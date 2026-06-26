const { and, eq } = require('drizzle-orm');
const { db } = require('../../config/db');
const { reimbursements, reimbursementApprovals, REIMBURSEMENT_STATUS } = require('./reimbursements.schema');
const { employeeManager } = require('../auth/auth.schema');

/**
 * Repository layer for reimbursements.
 * Single Responsibility: raw Drizzle DB operations only.
 */

// ─── Shared reimbursement column projection ───────────────────────────────────
const REIMB_COLS = {
  id:          reimbursements.id,
  employeeId:  reimbursements.employeeId,
  title:       reimbursements.title,
  description: reimbursements.description,
  amount:      reimbursements.amount,
  status:      reimbursements.status,
  createdAt:   reimbursements.createdAt,
  updatedAt:   reimbursements.updatedAt
};

/**
 * Insert a new reimbursement record with status PENDING.
 */
const createReimbursement = async ({ employeeId, title, description, amount }) => {
  const result = await db
    .insert(reimbursements)
    .values({
      employeeId,
      title,
      description: description ?? null,
      amount:      String(amount),
      status:      REIMBURSEMENT_STATUS.PENDING
    })
    .returning(REIMB_COLS);

  return result[0];
};

/**
 * Find a reimbursement by its UUID.
 */
const findReimbursementById = async (id) => {
  const result = await db
    .select(REIMB_COLS)
    .from(reimbursements)
    .where(eq(reimbursements.id, id));

  return result[0] || null;
};

/**
 * Update the status of a reimbursement and refresh updated_at.
 */
const updateReimbursementStatus = async (id, status) => {
  const result = await db
    .update(reimbursements)
    .set({ status, updatedAt: new Date() })
    .where(eq(reimbursements.id, id))
    .returning({
      id:        reimbursements.id,
      status:    reimbursements.status,
      updatedAt: reimbursements.updatedAt
    });

  return result[0];
};

// ─── GET query methods ────────────────────────────────────────────────────────

/**
 * GET /rest/reimbursements — EMP view.
 * All reimbursements submitted by this employee.
 *
 * @param {string} employeeId
 * @returns {Promise<Array>}
 */
const findByEmployee = async (employeeId) => {
  return db
    .select(REIMB_COLS)
    .from(reimbursements)
    .where(eq(reimbursements.employeeId, employeeId));
};

/**
 * GET /rest/reimbursements — RM view.
 * PENDING reimbursements belonging to employees who report to this RM.
 * JOIN: reimbursements → employee_manager (filter by managerId + PENDING status).
 *
 * @param {string} managerId - UUID of the authenticated RM
 * @returns {Promise<Array>}
 */
const findPendingByManager = async (managerId) => {
  return db
    .select(REIMB_COLS)
    .from(reimbursements)
    .innerJoin(
      employeeManager,
      eq(reimbursements.employeeId, employeeManager.employeeId)
    )
    .where(
      and(
        eq(employeeManager.managerId, managerId),
        eq(reimbursements.status, REIMBURSEMENT_STATUS.PENDING)
      )
    );
};

/**
 * GET /rest/reimbursements — APE view.
 * PENDING reimbursements that RM has already APPROVED (awaiting APE action).
 * JOIN: reimbursements → reimbursement_approvals (RM, APPROVED).
 *
 * @returns {Promise<Array>}
 */
const findRmApproved = async () => {
  return db
    .select(REIMB_COLS)
    .from(reimbursements)
    .innerJoin(
      reimbursementApprovals,
      and(
        eq(reimbursementApprovals.reimbursementId, reimbursements.id),
        eq(reimbursementApprovals.approverRole, 'RM'),
        eq(reimbursementApprovals.decision, 'APPROVED')
      )
    )
    .where(eq(reimbursements.status, REIMBURSEMENT_STATUS.PENDING));
};

/**
 * GET /rest/reimbursements — CFO view.
 * PENDING reimbursements that APE has already APPROVED (awaiting CFO action).
 * JOIN: reimbursements → reimbursement_approvals (APE, APPROVED).
 *
 * @returns {Promise<Array>}
 */
const findApeApproved = async () => {
  return db
    .select(REIMB_COLS)
    .from(reimbursements)
    .innerJoin(
      reimbursementApprovals,
      and(
        eq(reimbursementApprovals.reimbursementId, reimbursements.id),
        eq(reimbursementApprovals.approverRole, 'APE'),
        eq(reimbursementApprovals.decision, 'APPROVED')
      )
    )
    .where(eq(reimbursements.status, REIMBURSEMENT_STATUS.PENDING));
};

/**
 * GET /rest/reimbursements/:userId — RM view (specific employee).
 * All reimbursements for a given employee, used after the RM gate check.
 *
 * @param {string} employeeId - The target employee's UUID
 * @returns {Promise<Array>}
 */
const findByEmployeeId = async (employeeId) => {
  return db
    .select(REIMB_COLS)
    .from(reimbursements)
    .where(eq(reimbursements.employeeId, employeeId));
};

module.exports = {
  createReimbursement,
  findReimbursementById,
  updateReimbursementStatus,
  findByEmployee,
  findPendingByManager,
  findRmApproved,
  findApeApproved,
  findByEmployeeId
};
