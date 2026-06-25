const authService = require('./auth.service');
const { generateToken } = require('../../utils/token');
const { sendSuccess } = require('../../utils/response');

/**
 * Controller functions for Auth endpoints.
 * Simple functional approach instead of classes.
 */

/**
 * Register a new user.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Check if user already exists
    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      const error = new Error('A user with this email address already exists.');
      error.statusCode = 400;
      return next(error);
    }

    // 2. Create the user
    const newUser = await authService.createUser({ name, email, password, role });

    return sendSuccess(res, 201, 'User registered successfully', {
      user: newUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate user and sign JWT token.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await authService.findUserByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      return next(error);
    }

    // 2. Verify password
    const isMatch = await authService.comparePassword(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      return next(error);
    }

    // 3. Generate token
    const token = generateToken({ id: user.id, role: user.role });

    // 4. Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in ms
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };

    // Set JWT in HTTP-only cookie
    res.cookie('token', token, cookieOptions);

    // Remove password hash from response user object (omits created_at since it is not in users table)
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    return sendSuccess(res, 200, 'Login successful', {
      user: userResponse,
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear user token cookie and log out.
 */
const logout = async (req, res, next) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    return sendSuccess(res, 200, 'Logout successful', {});
  } catch (error) {
    next(error);
  }
};

/**
 * Get profile of current logged-in user.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.findUserById(req.user.id);
    if (!user) {
      const error = new Error('User profile not found.');
      error.statusCode = 404;
      return next(error);
    }

    return sendSuccess(res, 200, 'Profile retrieved successfully', {
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe
};
