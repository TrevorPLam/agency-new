# @firm/cache

Tenant-scoped Redis wrapper for Firm platform. Provides secure, multi-tenant caching with automatic isolation and comprehensive features.

## Features

- **Multi-Tenant Isolation**: Automatic tenant-based cache key prefixing
- **Type Safety**: Full TypeScript support with generic types
- **Connection Pooling**: Efficient Redis connection management
- **Serialization**: Built-in JSON serialization with error handling
- **TTL Management**: Flexible TTL (time-to-live) configuration
- **Health Monitoring**: Redis connection health checks
- **Graceful Fallback**: Degraded mode when Redis is unavailable

## Installation

```bash
pnpm add @firm/cache
```

## Quick Start

```typescript
import { Cache } from '@firm/cache'

// Initialize cache with Redis connection
const cache = new Cache({
  redis: {
    host: 'localhost',
    port: 6379,
    password: process.env.REDIS_PASSWORD
  }
})

// Use with tenant context
await cache.set('user-123', { name: 'John', email: 'john@example.com' }, {
  tenantId: 'tenant-456',
  ttl: 3600 // 1 hour
})

const user = await cache.get('user-123', { tenantId: 'tenant-456' })
```

## Configuration

### Basic Configuration

```typescript
import { Cache } from '@firm/cache'

const cache = new Cache({
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0')
  },
  defaultTtl: 3600, // 1 hour default
  keyPrefix: 'firm:', // Global key prefix
  enableMetrics: true // Enable performance metrics
})
```

### Advanced Configuration

```typescript
const cache = new Cache({
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'redis-password',
    connectTimeout: 10000,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100
  },
  defaultTtl: 3600,
  keyPrefix: 'firm:',
  enableMetrics: true,
  serialization: {
    // Custom serialization options
    reviver: (key, value) => {
      // Custom date revival
      if (key.endsWith('At')) return new Date(value)
      return value
    }
  },
  healthCheck: {
    interval: 30000, // 30 seconds
    timeout: 5000   // 5 seconds
  }
})
```

## API Reference

### Basic Operations

```typescript
// Set value with options
await cache.set('user:123', userData, {
  tenantId: 'tenant-456',
  ttl: 7200,        // 2 hours
  nx: true         // Only set if not exists
})

// Get value
const user = await cache.get('user:123', {
  tenantId: 'tenant-456'
})

// Delete value
await cache.del('user:123', { tenantId: 'tenant-456' })

// Check if key exists
const exists = await cache.exists('user:123', { tenantId: 'tenant-456' })
```

### Batch Operations

```typescript
// Set multiple values
await cache.mset([
  { key: 'user:123', value: userData, tenantId: 'tenant-456' },
  { key: 'user:456', value: otherUserData, tenantId: 'tenant-456' }
])

// Get multiple values
const users = await cache.mget(['user:123', 'user:456'], {
  tenantId: 'tenant-456'
})

// Delete multiple keys
await cache.del(['user:123', 'user:456'], { tenantId: 'tenant-456' })
```

### Advanced Operations

```typescript
// Increment counter
const newCount = await cache.incr('counter:views', {
  tenantId: 'tenant-456',
  ttl: 86400 // Reset daily
})

// Atomic operations
const result = await cache.eval(
  'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end',
  { keys: ['lock:resource'], arguments: ['expected-value'] },
  { tenantId: 'tenant-456' }
)

// Scan keys with pattern
const keys = await cache.scan('user:*', {
  tenantId: 'tenant-456',
  count: 100,  // Batch size
  cursor: '0'  // Start cursor
})
```

## Tenant Isolation

All cache operations automatically include tenant context for isolation:

```typescript
// These are equivalent - tenant ID is automatically prefixed
await cache.set('user:123', data, { tenantId: 'tenant-456' })
// Internally stores as: firm:tenant-456:user:123

// Tenant isolation prevents cross-tenant data access
await cache.get('user:123', { tenantId: 'tenant-456' }) // ✅ Correct tenant
await cache.get('user:123', { tenantId: 'tenant-789' }) // ✅ Different tenant
```

## Error Handling

```typescript
import { CacheError, CacheConnectionError } from '@firm/cache'

try {
  await cache.set('key', 'value', { tenantId: 'tenant-123' })
} catch (error) {
  if (error instanceof CacheConnectionError) {
    console.error('Redis connection failed:', error.message)
    // Implement fallback logic
  } else if (error instanceof CacheError) {
    console.error('Cache operation failed:', error.message)
  }
}
```

## Health Monitoring

```typescript
// Check cache health
const health = await cache.healthCheck()
console.log('Cache status:', health.status) // 'healthy' | 'degraded' | 'unhealthy'
console.log('Redis info:', health.redis)

// Listen to health events
cache.on('health:degraded', (error) => {
  console.warn('Cache degraded:', error)
})

cache.on('health:restored', () => {
  console.info('Cache restored')
})
```

## Performance Metrics

```typescript
// Enable metrics in configuration
const cache = new Cache({
  redis: { /* ... */ },
  enableMetrics: true
})

// Get performance metrics
const metrics = cache.getMetrics()
console.log('Operations:', metrics.operations)
console.log('Hit rate:', metrics.hitRate)
console.log('Average latency:', metrics.averageLatency)
```

## Best Practices

### 1. Tenant Context

Always provide tenant context for multi-tenant applications:

```typescript
// ✅ Good - explicit tenant context
await cache.set('user:123', data, { tenantId: getCurrentTenantId() })

// ❌ Bad - no tenant context
await cache.set('user:123', data)
```

### 2. TTL Management

Set appropriate TTL values to prevent memory bloat:

```typescript
// Short-lived data
await cache.set('session:123', sessionData, {
  tenantId: 'tenant-456',
  ttl: 1800 // 30 minutes
})

// Long-lived reference data
await cache.set('config:app', appConfig, {
  tenantId: 'tenant-456',
  ttl: 86400 // 24 hours
})
```

### 3. Error Handling

Implement proper error handling for cache failures:

```typescript
async function getUserWithCache(userId: string, tenantId: string) {
  try {
    // Try cache first
    const cached = await cache.get(`user:${userId}`, { tenantId })
    if (cached) return cached
  } catch (error) {
    console.warn('Cache miss:', error)
  }
  
  // Fallback to database
  const user = await db.user.findById(userId)
  if (user) {
    try {
      await cache.set(`user:${userId}`, user, { tenantId, ttl: 3600 })
    } catch (error) {
      console.warn('Cache set failed:', error)
    }
  }
  
  return user
}
```

## Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Cache Configuration
CACHE_DEFAULT_TTL=3600
CACHE_KEY_PREFIX=firm:
CACHE_ENABLE_METRICS=true
```

## License

Internal use only - restricted access
