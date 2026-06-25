const { defineConfig } = require('drizzle-kit');
require('dotenv').config();

module.exports = defineConfig({
  schema: './src/app/**/*.schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/reimbursement_db',
  },
  verbose: true,
  strict: true
});
