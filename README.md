# Secure Task Management System

A full-stack task management application with role-based access control (RBAC), built using NX monorepo architecture with NestJS backend and Angular frontend.

## Table of Contents

- [Overview](#overview)
- [Setup Instructions](#setup-instructions)
- [Architecture Overview](#architecture-overview)
- [Data Model](#data-model)
- [Access Control Implementation](#access-control-implementation)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Bonus Features](#bonus-features)
  - [Task Completion Visualization](#task-completion-visualization)
  - [Dark/Light Mode Toggle](#darklight-mode-toggle)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
- [Future Considerations](#future-considerations)

## Overview

This application provides a secure task management system featuring:

### Core Features
- **JWT-based Authentication** - Real authentication with secure token handling
- **Role-Based Access Control (RBAC)** - Three-tier role system (Owner, Admin, Viewer)
- **Organization Hierarchy** - 2-level organizational structure
- **Task Management** - Full CRUD with drag-and-drop, filtering, and categorization
- **Audit Logging** - Comprehensive logging of all actions
- **Responsive UI** - Modern Angular dashboard with TailwindCSS

### Bonus Features
- **Task Completion Visualization** - Progress bar and donut chart showing task distribution by status
- **Dark/Light Mode Toggle** - Theme switcher with system preference detection and localStorage persistence
- **Keyboard Shortcuts** - Quick actions for power users (see [Keyboard Shortcuts](#keyboard-shortcuts))

## Setup Instructions

### Prerequisites

- Node.js 18+ (tested with v22)
- npm 8+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd arao-5db7e763-d567-4c90-b836-3ebf57b9cc25

# Install dependencies
npm install

# Create data directory for SQLite
mkdir -p data
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Database (SQLite by default)
DATABASE_PATH=data/task-management.db

# Server
PORT=3000
NODE_ENV=development
```

### Running the Application

```bash
# Start the backend API (runs on http://localhost:3000)
npx nx serve api

# In a new terminal, start the frontend (runs on http://localhost:4200)
npx nx serve dashboard
```

### Building for Production

```bash
# Build both applications
npx nx build api
npx nx build dashboard
```

## Architecture Overview

### NX Monorepo Structure

```
├── apps/
│   ├── api/                    # NestJS Backend
│   │   └── src/
│   │       ├── app/            # App module configuration
│   │       ├── entities/       # TypeORM entities
│   │       └── modules/
│   │           ├── auth/       # Authentication (JWT)
│   │           ├── task/       # Task CRUD operations
│   │           ├── audit/      # Audit logging
│   │           └── organization/ # Organization management
│   │
│   └── dashboard/              # Angular Frontend
│       └── src/app/
│           ├── components/     # UI components
│           │   ├── auth/       # Login/Register
│           │   └── tasks/      # Task dashboard
│           ├── services/       # Angular services
│           ├── guards/         # Route guards
│           └── interceptors/   # HTTP interceptors
│
└── libs/
    ├── data/                   # Shared TypeScript interfaces & DTOs
    │   └── src/lib/
    │       ├── enums/          # Role, Permission, TaskStatus enums
    │       └── interfaces/     # User, Task, Organization interfaces
    │
    └── auth/                   # Reusable RBAC logic
        └── src/lib/
            ├── decorators/     # @Roles, @RequirePermissions
            └── guards/         # RolesGuard, PermissionsGuard
```

### Rationale

- **Monorepo Benefits**: Shared code between frontend and backend, atomic changes, unified tooling
- **Shared Libraries**: `libs/data` contains interfaces used by both apps, ensuring type safety
- **RBAC Library**: `libs/auth` contains reusable guards and decorators for access control
- **Module-based Architecture**: Each feature is encapsulated in its own module for maintainability

## Data Model

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│  Organization   │       │      User       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──┐   │ id (PK)         │
│ name            │   │   │ email           │
│ description     │   │   │ password (hash) │
│ parentId (FK)   │───┘   │ firstName       │
│ createdAt       │       │ lastName        │
│ updatedAt       │       │ role            │
└────────┬────────┘       │ organizationId  │──►┐
         │                │ isActive        │   │
         │                │ createdAt       │   │
         │                │ updatedAt       │   │
         │                └────────┬────────┘   │
         │                         │            │
         ▼                         ▼            │
┌─────────────────┐       ┌─────────────────┐   │
│  Organization   │       │      Task       │   │
│   (children)    │       ├─────────────────┤   │
└─────────────────┘       │ id (PK)         │   │
                          │ title           │   │
                          │ description     │   │
                          │ status          │   │
                          │ category        │   │
                          │ priority        │   │
                          │ order           │   │
                          │ dueDate         │   │
                          │ createdById     │───┘
                          │ assigneeId      │───┘
                          │ organizationId  │───┘
                          │ createdAt       │
                          │ updatedAt       │
                          └─────────────────┘

┌─────────────────┐
│    AuditLog     │
├─────────────────┤
│ id (PK)         │
│ userId (FK)     │
│ userEmail       │
│ action          │
│ resource        │
│ resourceId      │
│ details (JSON)  │
│ ipAddress       │
│ userAgent       │
│ organizationId  │
│ createdAt       │
└─────────────────┘
```

### Schema Details

**Users**
- Stores user credentials with bcrypt-hashed passwords
- Role field determines access level (owner, admin, viewer)
- Linked to one organization

**Organizations**
- Supports 2-level hierarchy via self-referencing `parentId`
- Parent organizations can have child organizations
- Users can access resources in their org and child orgs (if owner/admin)

**Tasks**
- Core resource with status tracking (todo, in_progress, done)
- Categories: work, personal, urgent, other
- Priorities: low, medium, high
- Order field for drag-and-drop positioning
- Scoped to organization for access control

**Audit Logs**
- Records all significant actions (create, read, update, delete)
- Includes actor, action, resource, and metadata
- Accessible only by Owner and Admin roles

## Access Control Implementation

### Role Hierarchy

```
Owner (3) > Admin (2) > Viewer (1)
```

| Role   | Permissions |
|--------|-------------|
| Owner  | Full access: CRUD on all resources, manage users, view audit logs |
| Admin  | CRUD on tasks, read users/org, view audit logs |
| Viewer | Read-only access to tasks and org info |

### Permission Matrix

| Permission | Owner | Admin | Viewer |
|------------|-------|-------|--------|
| task:create | ✓ | ✓ | ✗ |
| task:read | ✓ | ✓ | ✓ |
| task:update | ✓ | ✓ | ✗ |
| task:delete | ✓ | ✓ | ✗ |
| audit:read | ✓ | ✓ | ✗ |
| user:manage | ✓ | ✗ | ✗ |
| org:manage | ✓ | ✗ | ✗ |

### JWT Integration

1. **Authentication Flow**:
   - User submits credentials to `/api/auth/login`
   - Server validates credentials and returns JWT
   - JWT contains: `sub` (userId), `email`, `role`, `organizationId`
   - Frontend stores token and includes in `Authorization: Bearer <token>` header

2. **Authorization Flow**:
   - `JwtAuthGuard` validates token on all protected routes
   - `RolesGuard` checks if user's role meets minimum requirement
   - `PermissionsGuard` checks specific permissions based on role
   - Organization-scoped queries filter data by user's organization

### Implementation Details

```typescript
// Using role decorator
@Roles(Role.OWNER, Role.ADMIN)
@Get('audit-log')
async getAuditLogs() { ... }

// Using permission decorator
@RequirePermissions(Permission.TASK_CREATE)
@Post('tasks')
async createTask() { ... }

// Role inheritance check
hasHigherOrEqualRole(userRole, requiredRole) // Owner can access Admin resources
```

## API Documentation

### Authentication

#### POST /api/auth/register

Register a new user and organization.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "My Company"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "owner",
    "organizationId": "uuid"
  }
}
```

#### POST /api/auth/login

Authenticate user and get JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### GET /api/auth/me

Get current authenticated user info.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "owner",
  "organizationId": "uuid"
}
```

### Tasks

All task endpoints require authentication.

#### POST /api/tasks

Create a new task.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive README",
  "status": "todo",
  "category": "work",
  "priority": "high",
  "dueDate": "2024-01-15"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "title": "Complete project documentation",
  "description": "Write comprehensive README",
  "status": "todo",
  "category": "work",
  "priority": "high",
  "order": 1,
  "dueDate": "2024-01-15T00:00:00.000Z",
  "createdById": "uuid",
  "organizationId": "uuid",
  "createdAt": "2024-01-10T10:00:00.000Z",
  "updatedAt": "2024-01-10T10:00:00.000Z"
}
```

#### GET /api/tasks

List all accessible tasks with optional filters.

**Query Parameters:**
- `status` - Filter by status (todo, in_progress, done)
- `category` - Filter by category (work, personal, urgent, other)
- `priority` - Filter by priority (low, medium, high)
- `search` - Search in title and description
- `assigneeId` - Filter by assignee

**Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "Task 1",
    "status": "todo",
    "category": "work",
    "priority": "high",
    "createdBy": { "id": "...", "firstName": "John", "lastName": "Doe" },
    "assignee": null,
    ...
  }
]
```

#### PUT /api/tasks/:id

Update an existing task.

**Request:**
```json
{
  "title": "Updated title",
  "status": "in_progress"
}
```

#### DELETE /api/tasks/:id

Delete a task (Owner/Admin only).

**Response (204):** No content

#### PUT /api/tasks/:id/reorder

Reorder a task (for drag-and-drop).

**Request:**
```json
{
  "order": 3,
  "status": "in_progress"
}
```

### Audit Logs

#### GET /api/audit-log

View audit logs (Owner/Admin only).

**Query Parameters:**
- `userId` - Filter by user
- `action` - Filter by action type
- `resource` - Filter by resource type
- `startDate` - Filter from date
- `endDate` - Filter to date
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userEmail": "user@example.com",
      "action": "create",
      "resource": "task",
      "resourceId": "uuid",
      "details": { "title": "New task" },
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "total": 100
}
```

## Testing

### Running Tests

```bash
# Run all tests
npx nx run-many --target=test --all

# Run specific library tests
npx nx test data
npx nx test auth
npx nx test api

# Run with coverage
npx nx test auth --coverage
```

### Test Coverage

- **RBAC Logic**: Comprehensive tests for RolesGuard and PermissionsGuard
- **Role Hierarchy**: Tests for role inheritance and permission checks
- **Permission Matrix**: Tests for all role/permission combinations

## Bonus Features

### Task Completion Visualization

The dashboard displays task completion statistics with:

1. **Progress Bar** - Shows percentage of tasks in each status (Todo, In Progress, Done)
2. **Donut Chart** - SVG-based visualization of task distribution
3. **Task Counter** - Displays total count and breakdown by status

The visualization automatically updates when tasks are created, updated, or deleted.

### Dark/Light Mode Toggle

Theme support with:

- **Toggle Button** - Sun/Moon icon in the header and on auth pages
- **System Preference Detection** - Automatically detects OS preference on first visit
- **Persistence** - Theme choice saved to localStorage
- **Smooth Transitions** - CSS transitions for seamless theme switching

Implementation uses TailwindCSS dark mode with class strategy (`darkMode: 'class'`).

### Keyboard Shortcuts

Available shortcuts in the dashboard:

| Key | Action | Description |
|-----|--------|-------------|
| `N` | New Task | Opens the create task modal |
| `/` | Focus Search | Focuses the search input field |
| `T` | Toggle Theme | Switches between dark and light mode |
| `Escape` | Close/Clear | Closes modals or clears search |
| `R` | Refresh | Reloads the task list |
| `?` | Show Help | Opens the keyboard shortcuts modal |

**Note:** Shortcuts are disabled when typing in input fields or when modals are open.

## Future Considerations

### Security Enhancements

1. **JWT Refresh Tokens**
   - Implement refresh token rotation
   - Store refresh tokens securely (httpOnly cookies)
   - Automatic token refresh on expiration

2. **CSRF Protection**
   - Add CSRF tokens for state-changing operations
   - Implement double-submit cookie pattern

3. **Rate Limiting**
   - Implement rate limiting on auth endpoints
   - Add throttling for API requests

4. **Input Sanitization**
   - Enhanced XSS prevention
   - SQL injection protection (handled by TypeORM)

### Role Delegation

1. **Advanced Role Delegation**
   - Allow owners to delegate admin privileges
   - Time-limited role elevation
   - Role delegation audit trail

2. **Custom Roles**
   - Allow organizations to define custom roles
   - Granular permission assignment
   - Role templates

### Performance Optimizations

1. **Efficient Permission Checks**
   - Cache user permissions in Redis
   - Batch permission queries
   - Permission memoization

2. **Database Optimization**
   - Add indexes for frequently queried fields
   - Implement query result caching
   - Connection pooling

### Additional Features

1. **Real-time Updates**
   - WebSocket integration for live task updates
   - Collaborative editing indicators

2. **Task Attachments**
   - File upload support
   - Image previews

3. **Notifications**
   - Email notifications for task assignments
   - In-app notification system

4. **Advanced Filtering**
   - Saved filter presets
   - Advanced search with operators

---

## Tech Stack

- **Backend**: NestJS, TypeORM, SQLite, Passport.js, JWT
- **Frontend**: Angular 20, TailwindCSS, Angular Signals
- **Monorepo**: NX Workspace
- **Testing**: Jest

## License

This project was created for the TurboVets Full Stack Engineering assessment.
