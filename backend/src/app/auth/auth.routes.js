const express = require('express');
const authController = require('./auth.controller');
const { validateRegister, validateLogin } = require('./dto/post--authroutes');
const { isAuthenticated } = require('../../middlewares/auth');

const router = express.Router();

// Public routes
// POST /api/v1/auth/register (validated via post--authroutes DTO)
router.post('/register', validateRegister, authController.register);

// POST /api/v1/auth/login (validated via post--authroutes DTO)
router.post('/login', validateLogin, authController.login);

// Protected routes
// POST /api/v1/auth/logout
router.post('/logout', isAuthenticated, authController.logout);

// GET /api/v1/auth/me (Returns logged-in user profile)
router.get('/me', isAuthenticated, authController.getMe);

module.exports = router;
