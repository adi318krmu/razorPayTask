const { pgTable, uuid, varchar, text } = require('drizzle-orm/pg-core');
const { z } = require('zod');
const { ROLE_VALUES } = require('../../constants/roles');

// ==========================================
// 1. DRIZZLE ORM DATABASE SCHEMAS
// ==========================================

// Users Table (strictly matching the provided ERD diagram)
const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull()
});

// Employee Manager Table (strictly matching the provided ERD diagram)
const employeeManager = pgTable('employee_manager', {
  employeeId: uuid('employee_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  managerId: uuid('manager_id')
    .references(() => users.id, { onDelete: 'cascade' })
});

// ==========================================
// 2. ZOD REQUEST VALIDATION SCHEMAS
// ==========================================

const registerSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name must not exceed 100 characters' })
    .trim(),
  email: z.string()
    .email({ message: 'Must be a valid email address' })
    .max(150, { message: 'Email must not exceed 150 characters' })
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(6, { message: 'Password must be at least 6 characters long' })
    .max(100, { message: 'Password must not exceed 100 characters' }),
  role: z.enum(ROLE_VALUES, {
    errorMap: () => ({ message: `Role must be one of: ${ROLE_VALUES.join(', ')}` })
  })
});

const loginSchema = z.object({
  email: z.string()
    .email({ message: 'Must be a valid email address' })
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, { message: 'Password is required' })
});

module.exports = {
  users,
  employeeManager,
  registerSchema,
  loginSchema
};

