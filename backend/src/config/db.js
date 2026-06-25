const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const logger = require('../loggers/logger');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.warn('DATABASE_URL is not defined in environment variables. Falling back to default local connection.');
}

const isSupabase = connectionString && (
  connectionString.includes('supabase.co') || 
  connectionString.includes('supabase.com') ||
  connectionString.includes('pooler.supabase')
);

const pool = new Pool({
  connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/reimbursement_db',
  // Supabase connections require SSL
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle database client', err);
});

// Initialize Drizzle ORM
const db = drizzle(pool);

module.exports = {
  db,
  pool
};
