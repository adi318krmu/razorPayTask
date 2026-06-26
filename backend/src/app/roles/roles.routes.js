const express = require('express');
const rolesController = require('./roles.controller');
const { validateAssignRole } = require('./dto/post--rolesroutes');
const { authenticate, authorize } = require('../../middlewares/auth');

const router = express.Router();

/**
 * POST /rest/roles/assign
 *
 * Middleware chain (order matters):
 *  1. authenticate  — verify JWT from HttpOnly cookie "auth", populate req.user
 *  2. authorize     — allow CFO only; return 403 for any other role
 *  3. validateAssignRole — Zod validation of { userId, role }; return 400 on failure
 *  4. rolesController.assignRole — business logic + DB update
 */
router.post(
  '/assign',
  authenticate,
  authorize('CFO'),
  validateAssignRole,
  rolesController.assignRole
);

module.exports = router;
