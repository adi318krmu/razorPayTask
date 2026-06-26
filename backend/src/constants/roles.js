// Business roles for the reimbursement tool
const ROLES = {
  EMP: 'EMP',   // Employee
  RM:  'RM',    // Relationship Manager
  APE: 'APE',   // Approving Entity
  CFO: 'CFO'    // Chief Financial Officer
};

/** Convenience array for Zod enums and DB CHECK constraints */
const ROLE_VALUES = Object.values(ROLES); // ['EMP', 'RM', 'APE', 'CFO']

module.exports = { ROLES, ROLE_VALUES };
