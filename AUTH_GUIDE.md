# Authentication System Guide

## Overview

This guide explains how to use the built-in authentication system for the TOUR application. The system includes user registration, login, JWT-based token authentication, and admin user management.

## Default Admin Credentials

When you initialize the database, an admin user is automatically created:

```
Username: admin
Password: admin@1234
Email: admin@tour.local
Role: admin
```

⚠️ **Change these credentials in production!**

## Database Setup

### Initialize Database with Admin User

```bash
# Run the initialization script to create tables and seed admin user
npx tsx server/init-db.ts
```

This creates:
- **users** - User accounts with credentials
- **sessions** - Active login sessions
- Other tables - bookings, transactions, api_logs

## API Endpoints

### 1. Login
**POST** `/api/auth/login`

Request body:
```json
{
  "username": "admin",
  "password": "admin@1234"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### 2. Register
**POST** `/api/auth/register`

Request body:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepass123",
  "name": "John Doe"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "username": "john_doe",
    "role": "user"
  }
}
```

### 3. Get Current User
**GET** `/api/auth/me`

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@tour.local",
    "name": "Administrator",
    "role": "admin",
    "is_active": true,
    "last_login": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Verify Token
**GET** `/api/auth/verify`

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### 5. Logout
**POST** `/api/auth/logout`

Response:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Using Authentication in Frontend

### 1. Login Example

```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin@1234' })
});

const data = await response.json();
if (data.success) {
  // Store token in localStorage
  localStorage.setItem('auth_token', data.token);
  // Redirect to dashboard
}
```

### 2. Using Token in API Calls

```typescript
const token = localStorage.getItem('auth_token');
const response = await fetch('/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 3. Logout Example

```typescript
localStorage.removeItem('auth_token');
// Redirect to login page
```

## User Roles

The system supports three roles:

| Role | Permissions | Description |
|------|------------|-------------|
| **admin** | Full access | Can manage users and system settings |
| **moderator** | Limited admin | Can moderate content and users |
| **user** | Read/write own data | Regular user account |

## Security Considerations

### Password Requirements
- Minimum 6 characters (enforced in registration)
- Hashed using bcrypt with salt rounds: 10
- Never stored in plain text

### Token Security
- JWT tokens expire after 7 days
- Secret key: Set `JWT_SECRET` environment variable
- Default in dev: `your-secret-key-change-in-prod`

### Change JWT Secret (Production)

Add to `.env`:
```
JWT_SECRET=your-very-secure-secret-key-here
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

### Sessions Table

```sql
CREATE TABLE sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Managing Users

### Create a New Admin User (SQL)

```sql
INSERT INTO users 
  (username, email, password_hash, name, role, is_active) 
VALUES 
  ('newadmin', 'newadmin@tour.local', SHA2('admin@1234', 256), 'New Admin', 'admin', 1);
```

Note: Use proper bcrypt hashing, not SHA2 in production.

### Disable User Account

```sql
UPDATE users SET is_active = FALSE WHERE username = 'john_doe';
```

### Reset User Password

```bash
# Run this script or use:
npm run reset-password -- --username john_doe --password newpass123
```

### Change User Role

```sql
UPDATE users SET role = 'admin' WHERE username = 'john_doe';
```

## Troubleshooting

### "Invalid username or password" on Login

1. Check username is correct (case-sensitive)
2. Verify password is accurate
3. Ensure user is not disabled: `SELECT is_active FROM users WHERE username = ?`

### "Invalid or expired token"

- Token has expired (7 days from creation)
- Secret key changed (JWT_SECRET environment variable)
- Token was corrupted during transmission

### Registration Fails with "Username or email already exists"

- User with that username/email already exists in database
- Verify with: `SELECT * FROM users WHERE username = ? OR email = ?`

## Advanced: Custom Auth Middleware

Create middleware to protect routes:

```typescript
// server/middleware/authMiddleware.ts
import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware: RequestHandler = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-prod');
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

Use in routes:
```typescript
router.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Protected data' });
});
```

## Docker & Environment Variables

For Docker deployment, set environment variables:

```bash
docker run -e JWT_SECRET=your-secret-key \
           -e DB_HOST=mysql \
           tour-app:latest
```

Or in `docker-compose.yml`:
```yaml
environment:
  JWT_SECRET: your-secret-key
  DB_HOST: mysql
```

---

**Last Updated**: 2024
**Admin Contact**: admin@tour.local
