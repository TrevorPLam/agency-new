# @firm/auth

Authentication and authorization package for Firm Platform with role-based access control (RBAC), API key management, and secure session handling.

## Features

- **Role-Based Access Control (RBAC)**: Comprehensive permission matrix with hierarchical roles
- **API Key Management**: Secure API key generation and validation with scoped permissions
- **Session Management**: Secure session handling with tenant isolation
- **Multi-Tenant Support**: Built-in tenant context and isolation
- **Security Best Practices**: Argon2 password hashing, TOTP 2FA support

## Installation

```bash
pnpm add @firm/auth
```

## Quick Start

```typescript
import { auth } from '@firm/auth'
import type { Role } from '@firm/auth'

// Initialize auth configuration
const authConfig = {
  providers: [...],
  database: {...},
  session: {...}
}

export const { auth, handler } = auth(authConfig)
```

## Roles & Permissions

### Role Hierarchy
- `super_admin` - Platform-wide administrator
- `tenant_admin` - Tenant-level administrator  
- `manager` - Business manager with team oversight
- `agent` - Customer service agent
- `user` - Regular user
- `read_only` - Read-only access

### Permission Format
Permissions follow the pattern: `category:action`

Examples:
- `user:create` - Create users
- `lead:read` - Read leads
- `campaign:manage` - Full campaign management

## API Keys

Generate scoped API keys with specific permissions:

```typescript
import { generateApiKey } from '@firm/auth'

const apiKey = await generateApiKey({
  name: 'Integration Key',
  permissions: ['lead:read', 'campaign:read'],
  expiresIn: '30d'
})
```

## Security Features

- **Argon2** password hashing with configurable parameters
- **TOTP** 2FA support for enhanced security
- **Session** management with secure cookies
- **API Key** validation with permission scoping
- **Tenant** isolation for multi-tenant deployments

## License

Internal use only - restricted access
