# @firm/types

Core types and interfaces for the Firm platform. Provides foundational type definitions used across all packages.

## Features

- **Core Platform Types**: Base interfaces for platform entities
- **Permission Types**: Type definitions for RBAC system
- **Event Types**: Base event and context interfaces
- **Tenant Types**: Multi-tenant isolation types
- **Utility Types**: Common type utilities and helpers

## Installation

```bash
pnpm add @firm/types
```

## Core Types

### Base Entities

```typescript
import type { User, Tenant, Lead } from '@firm/types'

// User entity
interface User {
  id: string
  email: string
  name: string
  role: Role
  tenantId: string
  createdAt: Date
  updatedAt: Date
}

// Tenant entity
interface Tenant {
  id: string
  name: string
  domain: string
  settings: TenantSettings
  createdAt: Date
}
```

### Permission System

```typescript
import type { Role, Permission, PermissionCategory } from '@firm/types'

// Role hierarchy
type Role = 
  | 'super_admin'
  | 'tenant_admin' 
  | 'manager'
  | 'agent'
  | 'user'
  | 'read_only'

// Permission format
type Permission = `${PermissionCategory}:${PermissionAction}`

type PermissionCategory = 
  | 'tenant'
  | 'user'
  | 'lead'
  | 'campaign'
  | 'booking'
  | 'invoice'
  | 'analytics'
  | 'settings'
  | 'admin'
```

### Event System

```typescript
import type { BaseEvent, EventContext } from '@firm/types'

interface BaseEvent {
  id: string
  type: string
  source: string
  tenantId: string
  timestamp: Date
  correlationId?: string
  causationId?: string
  version: string
  data: unknown
}

interface EventContext {
  tenantId: string
  userId?: string
  requestId?: string
  correlationId?: string
}
```

## Utility Types

### Common Patterns

```typescript
import type { 
  Entity, 
  Timestamped, 
  SoftDeletable, 
  TenantScoped 
} from '@firm/types'

// Base entity with ID
interface Entity {
  id: string
}

// Timestamped entity
interface Timestamped {
  createdAt: Date
  updatedAt: Date
}

// Soft deletable entity
interface SoftDeletable {
  deletedAt?: Date
  isDeleted: boolean
}

// Tenant-scoped entity
interface TenantScoped {
  tenantId: string
}
```

## Type Guards

```typescript
import { isRole, isValidPermission } from '@firm/types'

// Type validation
if (isRole('admin')) {
  // TypeScript knows this is a valid Role
}

if (isValidPermission('user:read')) {
  // TypeScript knows this is a valid Permission
}
```

## Usage Patterns

### Combining Base Types

```typescript
import type { Entity, Timestamped, TenantScoped } from '@firm/types'

interface User extends Entity, Timestamped, TenantScoped {
  name: string
  email: string
  role: Role
}

// Resulting type includes:
// - id (from Entity)
// - createdAt, updatedAt (from Timestamped)  
// - tenantId (from TenantScoped)
// - name, email, role (from User)
```

## License

Internal use only - restricted access
