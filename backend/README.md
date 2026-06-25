# Reimbursement Tool Backend

A robust Express.js backend for a Reimbursement Tool, configured with Supabase (PostgreSQL) and structured with a modular, functional (class-free) architecture.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: Version 18 or higher.
- **Supabase Account**: A PostgreSQL database instance on Supabase.

### 2. Database Schema Setup
Execute the queries in [schema.sql](file:///c:/Users/adity/OneDrive/loqOnedrive/OneDrive/Desktop/Bootcamp/razorPayTask/backend/schema.sql) in your **Supabase SQL Editor** to create the following relational tables:
- `users`: Standard user profiles with roles (`employee`, `manager`, `admin`).
- `employee_manager`: Maps employees to their supervisors.
- `reimbursements`: Stores expense claims.
- `reimbursement_approvals`: History of claims approvals/rejections.

### 3. Environment Configuration
Create a `.env` file in the root directory (based on [.env.example](file:///c:/Users/adity/OneDrive/loqOnedrive/OneDrive/Desktop/Bootcamp/razorPayTask/backend/.env.example)):

```env
PORT=5000
NODE_ENV=development

# Paste your Supabase URI (Use port 6543 connection pooler for serverless)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?sslmode=require

JWT_SECRET=your_jwt_secret_passphrase
JWT_EXPIRES_IN=24h
COOKIE_SECRET=your_cookie_secret_passphrase
```

### 4. Running Locally
Install dependencies and run:

```bash
# Install dependencies
npm install

# Start in Development Mode (Nodemon auto-reload)
npm run dev

# Start in Production Mode
npm start
```

---

## 📂 Project Architecture

```
backend/
├── src/
│   ├── app/
│   │   └── auth/                          # Auth Module
│   │       ├── dto/
│   │       │   └── post--authroutes.js    # DTO schema validator hooks
│   │       ├── auth.controller.js         # Request & response controller functions
│   │       ├── auth.routes.js             # Route endpoints definitions
│   │       ├── auth.schema.js             # Zod input validation schemas
│   │       └── auth.service.js            # Database operations & business logic
│   ├── config/
│   │   └── db.js                          # Supabase PostgreSQL PG Pool setup
│   ├── constants/
│   │   └── roles.js                       # Roles enums
│   ├── loggers/
│   │   └── logger.js                      # Custom simple server logger
│   ├── middlewares/
│   │   ├── auth.js                        # JWT & Role validation
│   │   ├── error.js                       # Centralized global error handling
│   │   └── validate.js                    # Generic schema validation execution
│   ├── types/
│   │   └── index.js                       # Typings / JSDocs definitions
│   ├── utils/
│   │   └── response.js                    # Standard success/error responses
│   ├── app.js                             # Express application initialization
│   └── server.js                          # Port listener and db pinger
├── .env.example
├── prompt-logs.txt                        # Model & execution specs
├── schema.sql                             # Database table definitions
└── package.json
```

---

## 🛡️ Core APIs & Response Formats

### API Response Conventions

#### **Success Responses** (HTTP 200/201)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "270f2f3f-42e1-45d4-a1ee-2bf23e59048a",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "employee"
    }
  }
}
```

#### **Error Responses** (HTTP 400/401/403/404/500)
```json
{
  "success": false,
  "message": "Validation failed",
  "error": [
    {
      "field": "email",
      "message": "Must be a valid email address"
    }
  ]
}
```

---

### Endpoints Details

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| **GET** | `/health` | Server Health Status | No |
| **POST** | `/api/v1/auth/register` | Register a new user | No |
| **POST** | `/api/v1/auth/login` | Login user & set cookie | No |
| **POST** | `/api/v1/auth/logout` | Clear cookie / logout | Yes |
| **GET** | `/api/v1/auth/me` | Fetch logged-in user profile | Yes |

---

## 🧪 Testing Endpoints
A helper test script is available in the root. You can run:
```bash
npm run test
```
To run tests, make sure you configure your `.env` database parameters or set up a test connection pool.
