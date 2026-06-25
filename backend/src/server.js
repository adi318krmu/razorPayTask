const app = require('./app');
const { pool } = require('./config/db');
const logger = require('./loggers/logger');

const PORT = process.env.PORT || 5000;

// Test Database Connection before starting the server
const startServer = async () => {
  try {
    logger.info('Connecting to the database...');
    const result = await pool.query('SELECT NOW()');
    logger.info(`Database connected successfully. Server Time from DB: ${result.rows[0].now}`);
    
    const server = app.listen(PORT, () => {
      logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      logger.info('Shutting down server gracefully...');
      server.close(async () => {
        logger.info('Express server closed.');
        try {
          await pool.end();
          logger.info('Database pool closed.');
          process.exit(0);
        } catch (err) {
          logger.error('Error closing database pool during shutdown', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Database connection failed. Exiting server...', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
console.log("DATABASE_URL:", process.env.DATABASE_URL);
startServer();
