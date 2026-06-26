const express = require('express');
const reimbursementsController = require('./reimbursements.controller');
const approvalsController = require('./approvals.controller');
const { validateCreateReimbursement } = require('./dto/post--reimbursementsroutes');
const { validateApproveReimbursement } = require('./dto/patch--reimbursementsroutes');
const { authenticate, authorize } = require('../../middlewares/auth');

const router = express.Router();

/**
 * POST /rest/reimbursements
 *
 * Create a new reimbursement request. Restricted to EMP role.
 *
 * Middleware chain:
 *  1. authenticate              — verify JWT from HttpOnly cookie "auth"; populate req.user
 *  2. authorize('EMP')          — EMP only; 403 for any other role
 *  3. validateCreateReimbursement — Zod: { title, description?, amount (> 0) }; 400 on fail
 *  4. create                    — inject employeeId from req.user, persist, return 201
 */
router.post(
  '/',
  authenticate,
  authorize('EMP'),
  validateCreateReimbursement,
  reimbursementsController.create
);

/**
 * PATCH /rest/reimbursements
 *
 * Approve or reject a reimbursement. Accessible by RM, APE, CFO.
 * EMP is explicitly excluded (cannot approve their own or others' requests).
 *
 * Middleware chain:
 *  1. authenticate               — verify JWT; populate req.user
 *  2. authorize('RM','APE','CFO') — block EMP; 403 for EMP role
 *  3. validateApproveReimbursement — Zod: { reimbursementId (UUID), decision, remarks? }
 *  4. approve                    — inject approverId + approverRole from req.user;
 *                                  enforce sequential order; update status; persist history
 */
router.patch(
  '/',
  authenticate,
  authorize('RM', 'APE', 'CFO'),
  validateApproveReimbursement,
  approvalsController.approve
);

module.exports = router;

