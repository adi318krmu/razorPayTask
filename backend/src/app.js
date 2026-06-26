const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

// Load environment variables
require('dotenv').config();

const { sendSuccess, sendError } = require('./utils/response');
const errorHandler = require('./middlewares/error');
const authRouter = require('./app/auth/auth.routes');
const rolesRouter = require('./app/roles/roles.routes');

const app = express();

// 1. Setup Standard Middlewares
app.use(helmet());
app.use(cors({
  origin: true, // Allow requests from any origin or configure specifically if needed
  credentials: true
}));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || 'fallback_cookie_secret_999'));

// Use Morgan logger (basic combined/dev formats)
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// 2. Health check endpoint (Requirement 7)
app.get('/health', (req, res) => {
  return sendSuccess(res, 200, 'Server is running and healthy', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'UP'
  });
});

// 3. Register Module Routes
app.use('/rest/onboarding', authRouter);
app.use('/rest/roles', rolesRouter);

// 4. Catch-all undefined routes (404)
app.use((req, res, next) => {
  return sendError(res, 404, `Route ${req.originalUrl} not found`);
});

// 5. Global Error Handling Middleware
app.use(errorHandler);

module.exports = app;
