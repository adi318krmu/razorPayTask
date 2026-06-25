// Self-contained integration test script to verify Express routes, validation, and error handling.
// Starts server on a random port and makes HTTP requests using fetch.
// Execute this using: npm run test

const { pool } = require('./src/config/db');
const app = require('./src/app');

// Mock Database Storage (In-memory)
const mockUsers = [];

// Helper to format rows as array if required by Drizzle's rowMode: "array"
const formatRowsForDrizzle = (rowObjects, queryText, rowMode) => {
  if (rowMode !== 'array') {
    return rowObjects;
  }
  
  let selectFields = [];
  if (queryText.toLowerCase().includes('returning')) {
    const retMatch = queryText.match(/returning\s+(.+)$/i);
    if (retMatch) {
      selectFields = retMatch[1].split(',').map(f => f.replace(/["`\s]/g, ''));
    }
  } else if (queryText.toLowerCase().includes('select')) {
    const selMatch = queryText.match(/select\s+(.+?)\s+from/i);
    if (selMatch) {
      selectFields = selMatch[1].split(',').map(f => {
        let field = f.trim();
        if (field.includes('.')) {
          field = field.split('.').pop();
        }
        return field.replace(/["`\s]/g, '');
      });
    }
  }

  if (selectFields.length === 0) {
    return rowObjects.map(r => Object.values(r));
  }

  return rowObjects.map(rowObj => {
    return selectFields.map(field => {
      if (field === 'password_hash') {
        return rowObj.password_hash || rowObj.passwordHash;
      }
      return rowObj[field];
    });
  });
};

// Override pool database query helper for mock testing Drizzle ORM operations
pool.query = async (queryConfig, params) => {
  let queryText = '';
  let queryParams = [];
  let rowMode = '';

  if (typeof queryConfig === 'string') {
    queryText = queryConfig;
    queryParams = params || [];
  } else if (queryConfig && typeof queryConfig === 'object') {
    queryText = queryConfig.text || '';
    queryParams = params || queryConfig.values || [];
    rowMode = queryConfig.rowMode || '';
  }

  const normalizedQuery = queryText.toLowerCase();
  
  // 1. Mock Insert User (Drizzle: insert into "users" ... returning ...)
  if (normalizedQuery.includes('insert into') && normalizedQuery.includes('users')) {
    const colMatch = queryText.match(/insert\s+into\s+["`]?users["`]?\s*\(([^)]+)\)/i);
    let columns = ['name', 'email', 'password_hash', 'role'];
    if (colMatch) {
      columns = colMatch[1].split(',').map(c => c.replace(/["`\s]/g, ''));
    }

    const insertCols = columns.filter(c => c !== 'id');

    const data = {};
    insertCols.forEach((col, idx) => {
      data[col] = queryParams[idx];
    });

    const newUser = {
      id: 'mock-uuid-12345',
      name: data.name,
      email: data.email,
      password_hash: data.password_hash || data.passwordHash,
      role: data.role
    };

    mockUsers.push(newUser);

    const rows = formatRowsForDrizzle([newUser], queryText, rowMode);
    return { rows };
  }
  
  // Extract where clause to isolate filtering fields from selected fields list
  const whereIndex = normalizedQuery.indexOf('where');
  const whereClause = whereIndex !== -1 ? normalizedQuery.substring(whereIndex) : '';

  // 2. Mock Select User by Email
  if (normalizedQuery.includes('select') && normalizedQuery.includes('users') && whereClause.includes('email')) {
    const [email] = queryParams;
    const found = mockUsers.find(u => u.email === email);
    if (found) {
      const rows = formatRowsForDrizzle([found], queryText, rowMode);
      return { rows };
    }
    return { rows: [] };
  }

  // 3. Mock Select User by ID
  if (normalizedQuery.includes('select') && normalizedQuery.includes('users') && whereClause.includes('id')) {
    const [id] = queryParams;
    const found = mockUsers.find(u => u.id === id);
    if (found) {
      const rows = formatRowsForDrizzle([found], queryText, rowMode);
      return { rows };
    }
    return { rows: [] };
  }

  // Fallback for startup check or other queries
  return { rows: [{ now: new Date() }] };
};

// Start server on an ephemeral port
const startTestServer = () => {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
};

const runTests = async () => {
  console.log('=========================================');
  console.log(' RUNNING BACKEND DRIZZLE & COOKIE TESTS');
  console.log('=========================================');

  const { server, port } = await startTestServer();
  const baseUrl = `http://localhost:${port}`;
  let passed = 0;
  let failed = 0;
  let cookieHeader = '';

  const assert = (condition, message) => {
    if (condition) {
      console.log(`[PASS] - ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] - ${message}`);
      failed++;
    }
  };

  try {
    // 1. GET /health
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health check should return status 200');
    assert(healthData.success === true, 'Health check success flag must be true');
    assert(healthData.data.status === 'UP', 'Health check data status must be UP');

    // 2. POST /rest/onboarding/register (Invalid Input)
    const badRegRes = await fetch(`${baseUrl}/rest/onboarding/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aditya',
        email: 'bademail' // Invalid email, missing password & role
      })
    });
    const badRegData = await badRegRes.json();
    assert(badRegRes.status === 400, 'Invalid registration input should return status 400');
    assert(badRegData.success === false, 'Invalid registration success flag must be false');
    assert(badRegData.error.length > 0, 'Invalid registration must provide a list of validation errors');
    assert(badRegData.error.some(e => e.field === 'email'), 'Should indicate email is invalid');
    assert(badRegData.error.some(e => e.field === 'password'), 'Should indicate password is required');

    // 3. POST /rest/onboarding/register (Success)
    const goodRegRes = await fetch(`${baseUrl}/rest/onboarding/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aditya Manager',
        email: 'aditya@reimburse.com',
        password: 'password123',
        role: 'manager'
      })
    });
    const goodRegData = await goodRegRes.json();
    assert(goodRegRes.status === 201, 'Successful registration should return status 201');
    assert(goodRegData.success === true, 'Registration success flag must be true');
    assert(goodRegData.data.user.email === 'aditya@reimburse.com', 'Registered user email must match input');
    assert(goodRegData.data.user.role === 'manager', 'Registered user role must match input');
    assert(goodRegData.data.user.created_at === undefined, 'Schema alignment: user response must NOT contain "created_at"');

    // 4. POST /rest/onboarding/register (Duplicate Email)
    const dupRegRes = await fetch(`${baseUrl}/rest/onboarding/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Aditya',
        email: 'aditya@reimburse.com',
        password: 'password999',
        role: 'employee'
      })
    });
    const dupRegData = await dupRegRes.json();
    assert(dupRegRes.status === 400, 'Duplicate registration email should return status 400');
    assert(dupRegData.success === false, 'Duplicate registration success flag must be false');
    assert(dupRegData.message.includes('already exists'), 'Duplicate registration message must notify user existence');

    // 5. POST /rest/onboarding/login (Success)
    const loginRes = await fetch(`${baseUrl}/rest/onboarding/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'aditya@reimburse.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Successful login should return status 200');
    assert(loginData.success === true, 'Login success flag must be true');
    assert(loginData.data.token !== undefined, 'Login response must contain a token');
    assert(loginData.data.user.created_at === undefined, 'Schema alignment: login response user must NOT contain "created_at"');
    
    // Capture the cookie from response headers
    const setCookieHeaders = loginRes.headers.get('set-cookie');
    if (setCookieHeaders) {
      cookieHeader = setCookieHeaders.split(';')[0];
    }
    assert(cookieHeader.includes('token='), 'Login response must set "token" cookie');

    // 6. GET /rest/onboarding/me (Authenticated request via strict cookie verification)
    const meRes = await fetch(`${baseUrl}/rest/onboarding/me`, {
      headers: {
        'Cookie': cookieHeader
      }
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'Accessing /me with valid token cookie should return status 200');
    assert(meData.success === true, 'Profile fetch success flag must be true');
    assert(meData.data.user.email === 'aditya@reimburse.com', 'Profile details must match user email');
    assert(meData.data.user.created_at === undefined, 'Schema alignment: profile response user must NOT contain "created_at"');

    // 7. GET /rest/onboarding/me (Request using Authorization header fallback should fail under strict cookie auth)
    const authHeaderMeRes = await fetch(`${baseUrl}/rest/onboarding/me`, {
      headers: {
        'Authorization': `Bearer ${loginData.data.token}`
      }
    });
    assert(authHeaderMeRes.status === 401, 'Accessing /me with Authorization header must fail under strict cookie mode');

    // 8. GET /rest/onboarding/me (Unauthenticated request fails)
    const badMeRes = await fetch(`${baseUrl}/rest/onboarding/me`);
    const badMeData = await badMeRes.json();
    assert(badMeRes.status === 401, 'Accessing /me without authentication cookie must fail with 401');
    assert(badMeData.success === false, 'Unauthenticated check success flag must be false');

    // 9. POST /rest/onboarding/logout
    const logoutRes = await fetch(`${baseUrl}/rest/onboarding/logout`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader
      }
    });
    const logoutData = await logoutRes.json();
    assert(logoutRes.status === 200, 'Logout should return status 200');
    
    const logoutCookie = logoutRes.headers.get('set-cookie');
    assert(logoutCookie && logoutCookie.includes('token=;'), 'Logout must clear "token" cookie');

  } catch (error) {
    console.error('Test runner threw unexpected error:', error);
    failed++;
  } finally {
    server.close();
  }

  console.log('=========================================');
  console.log(` VERIFICATION COMPLETE: Passed ${passed}, Failed ${failed}`);
  console.log('=========================================');
  process.exit(failed > 0 ? 1 : 0);
};

runTests();
