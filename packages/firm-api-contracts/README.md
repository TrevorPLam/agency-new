# @firm/api-contracts

API contracts, event registry, and OpenAPI definitions for the Firm platform. Provides type-safe API schemas and event definitions with validation.

## Features

- **Type-Safe API Contracts**: Zod-based schema validation
- **Event Registry**: Centralized event type management
- **OpenAPI Generation**: Automatic OpenAPI specification generation
- **Event Validation**: Runtime event schema validation
- **Type Inference**: Full TypeScript type safety

## Installation

```bash
pnpm add @firm/api-contracts
```

## Quick Start

### API Contracts

```typescript
import { z } from 'zod'
import { defineApiContract } from '@firm/api-contracts'

// Define an API contract
export const createUserContract = defineApiContract({
  path: '/users',
  method: 'POST',
  schema: {
    body: z.object({
      name: z.string(),
      email: z.string().email()
    }),
    response: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string()
    })
  }
})
```

### Event Registry

```typescript
import { defineEvent, createTypedEvent } from '@firm/api-contracts'

// Define an event type
export const UserCreatedEvent = defineEvent(
  'user.created',
  z.object({
    userId: z.string(),
    email: z.string(),
    timestamp: z.date()
  })
)

// Create a typed event
const event = createTypedEvent(UserCreatedEvent, {
  source: 'user-service',
  tenantId: 'tenant-123',
  data: {
    userId: 'user-456',
    email: 'user@example.com',
    timestamp: new Date()
  }
})
```

## Core Concepts

### Event Registry
All events must be registered in the global `EVENT_REGISTRY` for type safety and validation:

```typescript
import { EVENT_REGISTRY, getRegisteredEventTypes } from '@firm/api-contracts'

// List all registered event types
const types = getRegisteredEventTypes()
console.log(types) // ['user.created', 'order.placed', ...]
```

### Schema Validation
All schemas use Zod for runtime validation and TypeScript type inference:

```typescript
import { validateEvent } from '@firm/api-contracts'

try {
  const validatedEvent = validateEvent(event)
  // Event is guaranteed to match schema
} catch (error) {
  // Handle validation errors
}
```

## Security

- **Cryptographic UUIDs**: Events use `crypto.randomUUID()` for secure ID generation
- **Schema Validation**: All events validated against registered schemas
- **Type Safety**: Compile-time and runtime type checking

## License

Internal use only - restricted access
