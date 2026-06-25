-- SQL Schema script for Reimbursement Tool Backend
-- Execute this script in your Supabase SQL Editor to create the necessary tables.

-- Ensure UUID extension is available (Supabase has this by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Aligned with your provided database diagram)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('employee', 'manager', 'admin'))
);

-- Index on email for fast lookups during login
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Employee-Manager Relationship Table (Aligned with your provided database diagram)
CREATE TABLE IF NOT EXISTS employee_manager (
    employee_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES users(id) ON DELETE CASCADE,
    -- Prevent an employee from being their own manager
    CONSTRAINT chk_different_user CHECK (employee_id <> manager_id)
);

-- Index on manager_id to find all employees managed by a specific manager
CREATE INDEX IF NOT EXISTS idx_employee_manager_manager_id ON employee_manager(manager_id);

-- 3. Reimbursements Table
CREATE TABLE IF NOT EXISTS reimbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on employee_id to retrieve an employee's requests quickly
CREATE INDEX IF NOT EXISTS idx_reimbursements_employee_id ON reimbursements(employee_id);
-- Index on status for filtering pending requests
CREATE INDEX IF NOT EXISTS idx_reimbursements_status ON reimbursements(status);

-- 4. Reimbursement Approvals/History Table
CREATE TABLE IF NOT EXISTS reimbursement_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reimbursement_id UUID NOT NULL REFERENCES reimbursements(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approver_role VARCHAR(50) NOT NULL CHECK (approver_role IN ('manager', 'admin')),
    decision VARCHAR(50) NOT NULL CHECK (decision IN ('approved', 'rejected')),
    remarks TEXT,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on reimbursement_id to get approval history for a reimbursement
CREATE INDEX IF NOT EXISTS idx_approvals_reimbursement_id ON reimbursement_approvals(reimbursement_id);
