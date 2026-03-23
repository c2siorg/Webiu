# Role-Based Access Control (RBAC) & Admin Dashboard Implementation

## Overview
This document outlines the implementation of Role-Based Access Control (RBAC) and a secure admin dashboard for the Webiu C2SI website (GSOC-2026).

## Project Structure

### Backend (NestJS)

#### User Schema Enhancement
**File:** `webiu-server/src/user/schemas/user.schema.ts`

Added role field to User schema with enum values:
```typescript
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Prop({ enum: UserRole, default: UserRole.USER })
role: UserRole;
```

#### Role Guard
**File:** `webiu-server/src/auth/guards/role.guard.ts`

Implements CanActivate interface to protect routes based on user roles:
- Checks if user has required role(s)
- Throws ForbiddenException if unauthorized
- Uses Reflector to read role metadata from route decorators

#### JWT Authentication Service
**File:** `webiu-server/src/auth/auth.service.ts`

Enhanced with role support:
- `generateToken()` - Creates JWT with user role
- `validateToken()` - Verifies JWT and extracts user info
- JWT payload includes: `id`, `email`, `role`

#### JWT Auth Guard Enhancement
**File:** `webiu-server/src/auth/guards/jwt-auth.guard.ts`

Updated to extract and attach role to request:
- Verifies JWT token
- Extracts user ID, email, and role
- Attaches user info to request object

### Frontend (Angular)

#### Authentication Service
**File:** `webiu-ui/src/app/services/auth.service.ts`

Provides auth state management:
- `login()` - Authenticates user and stores token
- `logout()` - Clears auth state
- `isLoggedIn()` - Checks authentication status
- `isAdmin()` - Checks if user has admin role
- `hasRole()` - Flexible role checking
- `getCurrentUser()` - Retrieves current user info

Observable streams for reactive updates:
- `user$` - Current user observable
- `isAuthenticated$` - Authentication status observable

Local Storage Management:
- Stores JWT token in `auth_token`
- Stores user data in `auth_user`

#### HTTP Interceptor
**File:** `webiu-ui/src/app/services/auth.interceptor.ts`

Handles HTTP communication:
- Attaches JWT token to all requests
- Handles 401 (Unauthorized) responses
- Handles 403 (Forbidden) responses
- Redirects to login on auth failure

#### Route Guards

**Auth Guard** (`webiu-ui/src/app/guards/auth.guard.ts`)
- Verifies user is logged in
- Redirects to login page if not authenticated
- Preserves return URL for post-login redirect

**Role Guard** (`webiu-ui/src/app/guards/role.guard.ts`)
- Checks if user has required role(s)
- Reads roles from route data configuration
- Redirects to unauthorized page if insufficient permissions

#### Login Component
**File:** `webiu-ui/src/app/page/login/login.component.ts`

Features:
- Email and password input fields
- Form validation (email format, password length)
- Password visibility toggle
- Error handling with snackbar messages
- Redirect to dashboard on successful login
- Responsive Material Design UI

Styles:
- Gradient background
- Centered card layout
- Mobile-friendly
- Material Design components

#### Admin Dashboard
**File:** `webiu-ui/src/app/page/admin/admin-dashboard/admin-dashboard.component.ts`

Main admin interface with:
- Responsive sidenav navigation
- User profile menu
- Stats dashboard (users, sessions, content, views)
- Quick links section
- Mobile-responsive design
- Auto-close sidenav on mobile

Navigation Menu Items:
- Overview
- Users Management
- Content Management
- Settings
- Analytics
- View Website (external link)
- Logout

#### Admin Sub-Components

**Admin Overview** - Dashboard overview page
**Admin Users** - User management interface
**Admin Content** - Content management interface
**Admin Settings** - Application settings
**Admin Analytics** - Analytics and reporting

#### Unauthorized Component
**File:** `webiu-ui/src/app/page/unauthorized/unauthorized.component.ts`

Displayed when users lack required permissions:
- Clear error message
- Navigation buttons (go home, go back)
- Professional design

#### App Routes
**File:** `webiu-ui/src/app/app.routes.ts`

New routes added:
```
/login - Login page (public)
/unauthorized - Unauthorized access page (public)
/admin - Admin dashboard (protected with AuthGuard + RoleGuard)
  ├── /admin/dashboard - Main dashboard
  ├── /admin/overview - Overview page
  ├── /admin/users - Users management
  ├── /admin/content - Content management
  ├── /admin/settings - Settings page
  └── /admin/analytics - Analytics page
```

Route guards configured with role requirements.

#### Environment Configuration
**File:** `webiu-ui/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  serverUrl: 'http://localhost:5050',
  apiUrl: 'http://localhost:5050/api',
};
```

#### App Configuration
**File:** `webiu-ui/src/app/app.config.ts`

Added HTTP interceptor provider:
```typescript
{
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptor,
  multi: true,
}
```

## Security Features

### Frontend Security
- ✅ JWT tokens stored in localStorage
- ✅ Tokens automatically attached to requests
- ✅ Automatic logout on 401 responses
- ✅ Route guards prevent unauthorized access
- ✅ Role-based component visibility
- ✅ Environment-based API URL configuration

### Password Security
- ✅ Password visibility toggle
- ✅ HTTPS-ready (use in production)
- ✅ Password validation rules
- ✅ Secure token transmission

### Data Protection
- ✅ No hardcoded credentials
- ✅ Environment variables for configuration
- ✅ HTTP interceptor for token management
- ✅ Automatic token refresh support (ready for implementation)

## Usage

### For End Users

1. **Login to Admin Dashboard**
   ```
   Navigate to /login
   Enter email and password
   Click Login
   ```

2. **Access Admin Features**
   ```
   Dashboard is only accessible to users with ADMIN role
   Non-admin users are redirected to unauthorized page
   ```

3. **Logout**
   ```
   Click user menu in top-right corner
   Select Logout
   Redirects to login page
   ```

### For Developers

**Using AuthService:**
```typescript
// Inject AuthService
constructor(private authService: AuthService) {}

// Check if logged in
if (this.authService.isLoggedIn()) {
  // User is authenticated
}

// Check if admin
if (this.authService.isAdmin()) {
  // User has admin role
}

// Get current user
const user = this.authService.getCurrentUser();
console.log(user.role);

// Logout
this.authService.logout();
```

**Creating Protected Routes:**
```typescript
{
  path: 'admin/special',
  component: SpecialAdminComponent,
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: [UserRole.ADMIN] }
}
```

## Database Migration

When MongoDB is connected, run migration to add role field to existing users:

```typescript
// Set default role for existing users
db.users.updateMany(
  { role: { $exists: false } },
  { $set: { role: 'user' } }
)

// Create index for role-based queries
db.users.createIndex({ role: 1 })
```

## Future Enhancements

1. **Token Refresh**
   - Implement refresh token mechanism
   - Auto-refresh expiring tokens

2. **Additional Roles**
   - Add MODERATOR, EDITOR roles
   - Implement granular permissions

3. **Two-Factor Authentication**
   - Email/SMS verification
   - Authenticator app support

4. **Audit Logging**
   - Track admin actions
   - User activity logs

5. **Role Assignment UI**
   - Admin panel to assign roles
   - User role management interface

6. **Permission System**
   - Fine-grained permissions per role
   - Resource-level access control

## Testing

### Backend Guard Testing
```typescript
// Test RoleGuard blocks unauthorized roles
// Test JwtAuthGuard validates tokens
// Test AuthService token generation
```

### Frontend Testing
```typescript
// Test AuthService login/logout
// Test Route Guards
// Test component visibility based on role
// Test HTTP Interceptor attaches tokens
```

## Deployment Checklist

- [ ] Set production environment variables
- [ ] Configure MongoDB connection
- [ ] Update API URL in environment.prod.ts
- [ ] Test login flow in production
- [ ] Verify SSL/HTTPS is enabled
- [ ] Set secure JWT secret
- [ ] Configure CORS for API
- [ ] Test admin access controls
- [ ] Backup database before deployment
- [ ] Monitor authentication logs

## Support & Documentation

For questions or issues:
1. Check existing documentation
2. Review code comments
3. Refer to Angular Material docs
4. Check NestJS documentation
5. Contact project maintainers

## License

This implementation is part of the Webiu C2SI project and follows the project's license.

---

**Implementation Date:** March 2026  
**GSOC Initiative:** GSoC-2026  
**Version:** 1.0
