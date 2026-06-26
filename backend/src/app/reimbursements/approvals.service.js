const reimbursementsRepository = require('./reimbursements.repository');
const approvalsRepository = require('./approvals.repository');
const {
  REIMBURSEMENT_STATUS,
  DECISION,
  APPROVAL_ORDER
} = require('./reimbursements.schema');

/**
 * Service: approval workflow for reimbursements.
 *
 * Sequential approval chain:  RM → APE → CFO
 *
 * Status transitions:
 *   Any role REJECTs  → reimbursement status = REJECTED  (workflow terminates)
 *   RM APPROVEs       → reimbursement status stays PENDING (awaiting APE)
 *   APE APPROVEs      → reimbursement status stays PENDING (awaiting CFO)
 *   CFO APPROVEs      → reimbursement status = APPROVED   (workflow complete)
 */

/**
 * Process an approval or rejection decision.
 *
 * @param {Object} params
 * @param {string} params.reimbursementId - UUID of the reimbursement
 * @param {string} params.approverId      - UUID from req.user.id
 * @param {string} params.approverRole    - Role from req.user.role ('RM' | 'APE' | 'CFO')
 * @param {string} params.decision        - 'APPROVED' | 'REJECTED'
 * @param {string} [params.remarks]
 * @returns {Promise<Object>} { approval, reimbursement }
 * @throws {Error} with statusCode 404 | 409 | 422
 */
const processApproval = async ({ reimbursementId, approverId, approverRole, decision, remarks }) => {

  // ── 1. Reimbursement must exist ──────────────────────────────────────────
  const reimbursement = await reimbursementsRepository.findReimbursementById(reimbursementId);
  if (!reimbursement) {
    const err = new Error(`Reimbursement with id "${reimbursementId}" not found.`);
    err.statusCode = 404;
    throw err;
  }

  // ── 2. Reimbursement must still be PENDING (not already finalised) ────────
  if (reimbursement.status !== REIMBURSEMENT_STATUS.PENDING) {
    const err = new Error(
      `Reimbursement is already ${reimbursement.status}. No further approvals are accepted.`
    );
    err.statusCode = 409;
    throw err;
  }

  // ── 3. Duplicate approval guard — same role cannot act twice ─────────────
  const existingApproval = await approvalsRepository.findApprovalByRole(reimbursementId, approverRole);
  if (existingApproval) {
    const err = new Error(
      `Role "${approverRole}" has already ${existingApproval.decision.toLowerCase()} this reimbursement.`
    );
    err.statusCode = 409;
    throw err;
  }

  // ── 4. Sequential order enforcement ─────────────────────────────────────
  //    Check that the required predecessor role has already APPROVED.
  const prerequisiteRole = APPROVAL_ORDER[approverRole];

  if (prerequisiteRole !== null) {
    const prerequisiteApproval = await approvalsRepository.findApprovalByRole(
      reimbursementId,
      prerequisiteRole
    );

    if (!prerequisiteApproval) {
      const err = new Error(
        `"${approverRole}" cannot act yet. Waiting for "${prerequisiteRole}" to review first.`
      );
      err.statusCode = 422;
      throw err;
    }

    if (prerequisiteApproval.decision !== DECISION.APPROVED) {
      const err = new Error(
        `"${approverRole}" cannot act. "${prerequisiteRole}" has already rejected this reimbursement.`
      );
      err.statusCode = 422;
      throw err;
    }
  }

  // ── 5. Persist the approval record ──────────────────────────────────────
  const approval = await approvalsRepository.createApproval({
    reimbursementId,
    approverId,
    approverRole,
    decision,
    remarks
  });

  // ── 6. Update reimbursement status ───────────────────────────────────────
  //    REJECTED  → immediately mark as REJECTED (any role)
  //    APPROVED by CFO → mark as APPROVED (final stage)
  //    APPROVED by RM or APE → stay PENDING (more approvals needed)
  let newStatus = null;

  if (decision === DECISION.REJECTED) {
    newStatus = REIMBURSEMENT_STATUS.REJECTED;
  } else if (decision === DECISION.APPROVED && approverRole === 'CFO') {
    newStatus = REIMBURSEMENT_STATUS.APPROVED;
  }

  let updatedReimbursement = reimbursement;
  if (newStatus) {
    updatedReimbursement = await reimbursementsRepository.updateReimbursementStatus(
      reimbursementId,
      newStatus
    );
  }

  return { approval, reimbursement: updatedReimbursement };
};

module.exports = { processApproval };
