# RBAC & Admin Dashboard - Setup & Migration Guide

## Prerequisites

- Node.js v18+
- MongoDB (Atlas or local)
- Angular 17+
- NestJS 10+

## Setup Instructions

### 1. Backend Configuration

#### 1.1 Environment Setup
Update `.env` file in `webiu-server/`:

```env
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/webiu?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=5050

# CORS
FRONTEND_BASE_URL=http://localhost:4200
```

#### 1.2 Install Dependencies
```bash
cd webiu-server
npm install
```

#### 1.3 MongoDB Setup

**Create collections:**
```javascript
// Connect to MongoDB and run:
db.createCollection("users")
db.createCollection("sessions")

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ role: 1 })
db.sessions.createIndex({ userId: 1 })
```

**Create initial admin user** (after connecting database):
```javascript
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  password: "<bcrypt-hashed-password>",
  role: "admin",
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

#### 1.4 Start Backend Server
```bash
cd webiu-server
npm run start:dev
```

Server runs on http://localhost:5050

### 2. Frontend Configuration

#### 2.1 Environment Setup
Update `webiu-ui/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  serverUrl: 'http://localhost:5050',
  apiUrl: 'http://localhost:5050/api',
};
```

For production (`environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  serverUrl: 'https://api.yourdomain.com',
  apiUrl: 'https://api.yourdomain.com/api',
};
```

#### 2.2 Install Dependencies
```bash
cd webiu-ui
npm install
```

#### 2.3 Update Material Theme (if needed)
Ensure Material is properly configured in `angular.json`:

```json
"styles": [
  "@angular/material/prebuilt-themes/indigo-pink.css",
  "src/styles.scss"
]
```

#### 2.4 Start Frontend Server
```bash
cd webiu-ui
npm start
```

Frontend runs on http://localhost:4200

### 3. Testing the RBAC System

#### 3.1 Test Login Flow

1. Navigate to http://localhost:4200/login
2. Use admin credentials:
   - Email: admin@example.com
   - Password: (as set in database)
3. Should redirect to /admin/dashboard

#### 3.2 Test Route Guards

- Try accessing /admin/dashboard without login
  - Should be redirected to /login

- Create a non-admin user and try accessing /admin
  - Should be redirected to /unauthorized

#### 3.3 Test Token Attachment

Use browser DevTools Network tab:
- All requests to /api/* should include `Authorization: Bearer <token>` header

### 4. Database Migrations

#### 4.1 Add Role to Existing Users

If you have existing users without the role field:

```javascript
// Update all users without role field
db.users.updateMany(
  { role: { $exists: false } },
  { $set: { role: "user" } }
)

// Verify update
db.users.find({"role": { $exists: false }}).count() // Should return 0
```

#### 4.2 Create Admin Accounts

```javascript
// Create new admin user
db.users.insertOne({
  name: "New Admin",
  email: "newadmin@example.com",
  password: "<bcrypt-hash>", // Use bcrypt to hash
  role: "admin",
  githubId: null,
  isVerified: true,
  verificationToken: null,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 5. API Endpoints (Ready for Implementation)

#### Auth Endpoints
```
POST /api/auth/login
  Body: { email: string, password: string }
  Response: { access_token: string, user: User }

POST /api/auth/register
  Body: { email: string, password: string, name: string }
  Response: { access_token: string, user: User }

POST /api/auth/logout
  Headers: Authorization: Bearer <token>
  Response: { message: string }

POST /api/auth/verify-email
  Body: { token: string }
```

#### Admin Endpoints
```
GET /api/admin/users
  Headers: Authorization: Bearer <token>, Role: admin
  Response: User[]

GET /api/admin/stats
  Headers: Authorization: Bearer <token>, Role: admin
  Response: { totalUsers, activeSessions, contentItems, pageViews }

PUT /api/admin/users/:id/role
  Headers: Authorization: Bearer <token>, Role: admin
  Body: { role: 'admin' | 'user' }
```

## Troubleshooting

### Issue: "MongoDB connection failed"
**Solution:**
- Verify MONGODB_URI is correct
- Check MongoDB server is running
- Ensure IP whitelist includes your IP (if using MongoDB Atlas)

### Issue: "Token is not valid"
**Solution:**
- Verify JWT_SECRET is same in frontend and backend
- Check token hasn't expired (default: 1 hour)
- Ensure token is being sent in Authorization header

### Issue: "Cannot GET /api/auth/login"
**Solution:**
- Ensure backend server is running on port 5050
- Verify API_URL in environment matches backend server
- Check CORS headers in backend

### Issue: "Unauthorized - You do not have permission"
**Solution:**
- Ensure user role is set to 'admin' in database
- Verify role is included in JWT payload
- Check RoleGuard is properly configured

### Issue: "AuthInterceptor not attaching token"
**Solution:**
- Verify AuthInterceptor is provided in app.config.ts
- Check token is being stored in localStorage
- Verify AuthService.getToken() returns token value

## Performance Optimization

### Frontend
- Lazy load admin module
- Implement change detection strategy
- Cache user data in service

### Backend
- Index role field for faster queries
- Implement token caching
- Use connection pooling for MongoDB

## Security Best Practices

### In Development
✅ Use development secrets  
✅ Allow CORS from localhost  
✅ Enable debug logging  

### In Production
✅ Use strong JWT_SECRET (32+ chars)  
✅ Restrict CORS to domain only  
✅ Disable debug logging  
✅ Use HTTPS only  
✅ Implement rate limiting  
✅ Use security headers  
✅ Monitor failed login attempts  
✅ Implement token rotation  
✅ Regular security audits  

## Next Steps

1. **Implement Login Endpoint** (`POST /api/auth/login`)
   - Connect to database
   - Hash and verify passwords
   - Generate and return JWT

2. **Implement User Management**
   - Create admin endpoints
   - List all users
   - Assign/revoke admin role

3. **Add Audit Logging**
   - Log admin actions
   - Track user activity

4. **Implement Email Verification**
   - Email-based authentication
   - Account recovery

5. **Add 2FA Support**
   - TOTP/Authenticator app
   - SMS verification

## Quick Reference

### Start Development Servers

```bash
# Terminal 1 - Backend
cd webiu-server
npm run start:dev

# Terminal 2 - Frontend
cd webiu-ui
npm start
```

### Access Points

- Frontend: http://localhost:4200
- Backend API: http://localhost:5050/api
- Login Page: http://localhost:4200/login
- Admin Dashboard: http://localhost:4200/admin/dashboard
- MongoDB: MongoDB connection string in .env

### Default Test Credentials

```
Email: admin@example.com
Password: (set during user creation)
```

---

**Last Updated:** March 2026  
**Version:** 1.0
