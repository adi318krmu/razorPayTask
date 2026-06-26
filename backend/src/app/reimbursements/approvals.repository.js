const { and, eq } = require('drizzle-orm');
const { db } = require('../../config/db');
const { reimbursementApprovals } = require('./reimbursements.schema');

/**
 * Repository layer for reimbursement_approvals table.
 * Single Responsibility: raw DB operations for approval records only.
 */

/**
 * Fetch all approval records for a given reimbursement, ordered by approvedAt ASC.
 * Used by the service to inspect the current approval chain state.
 *
 * @param {string} reimbursementId
 * @returns {Promise<Array<{approverRole: string, decision: string, approverId: string, approvedAt: Date}>>}
 */
const findApprovalsByReimbursement = async (reimbursementId) => {
  return db
    .select({
      id:              reimbursementApprovals.id,
      approverId:      reimbursementApprovals.approverId,
      approverRole:    reimbursementApprovals.approverRole,
      decision:        reimbursementApprovals.decision,
      remarks:         reimbursementApprovals.remarks,
      approvedAt:      reimbursementApprovals.approvedAt
    })
    .from(reimbursementApprovals)
    .where(eq(reimbursementApprovals.reimbursementId, reimbursementId));
};

/**
 * Find whether a specific role has already acted on a reimbursement.
 * Returns the record if found, null otherwise.
 *
 * @param {string} reimbursementId
 * @param {string} approverRole - e.g. 'RM', 'APE', 'CFO'
 * @returns {Promise<Object|null>}
 */
const findApprovalByRole = async (reimbursementId, approverRole) => {
  const result = await db
    .select({
      id:           reimbursementApprovals.id,
      approverRole: reimbursementApprovals.approverRole,
      decision:     reimbursementApprovals.decision,
      approvedAt:   reimbursementApprovals.approvedAt
    })
    .from(reimbursementApprovals)
    .where(
      and(
        eq(reimbursementApprovals.reimbursementId, reimbursementId),
        eq(reimbursementApprovals.approverRole, approverRole)
      )
    );

  return result[0] || null;
};

/**
 * Insert a new approval record.
 *
 * @param {Object} data
 * @param {string} data.reimbursementId
 * @param {string} data.approverId
 * @param {string} data.approverRole
 * @param {string} data.decision
 * @param {string} [data.remarks]
 * @returns {Promise<Object>} Inserted approval row
 */
const createApproval = async ({ reimbursementId, approverId, approverRole, decision, remarks }) => {
  const result = await db
    .insert(reimbursementApprovals)
    .values({
      reimbursementId,
      approverId,
      approverRole,
      decision,
      remarks: remarks ?? null
    })
    .returning({
      id:              reimbursementApprovals.id,
      reimbursementId: reimbursementApprovals.reimbursementId,
      approverId:      reimbursementApprovals.approverId,
      approverRole:    reimbursementApprovals.approverRole,
      decision:        reimbursementApprovals.decision,
      remarks:         reimbursementApprovals.remarks,
      approvedAt:      reimbursementApprovals.approvedAt
    });

  return result[0];
};

module.exports = {
  findApprovalsByReimbursement,
  findApprovalByRole,
  createApproval
};
