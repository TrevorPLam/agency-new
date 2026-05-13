# @firm/utils

Pure utility functions for the firm platform. Provides a collection of reusable, type-safe utility functions with no external dependencies.

## Features

- **Pure Functions**: All utilities are pure and side-effect free
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Zero Dependencies**: No external runtime dependencies
- **Tree Shakeable**: Import only what you need
- **Well Tested**: Comprehensive test coverage

## Installation

```bash
pnpm add @firm/utils
```

## Quick Start

```typescript
import { 
  generateId, 
  formatDate, 
  deepMerge, 
  retry 
} from '@firm/utils'

// Generate a secure ID
const id = generateId()

// Format dates with timezone support
const formatted = formatDate(new Date(), 'YYYY-MM-DD')

// Deep merge objects
const merged = deepMerge(obj1, obj2)

// Retry async operations
const result = await retry(async () => {
  return fetch('/api/data')
}, { attempts: 3 })
```

## Core Utilities

### ID Generation

```typescript
import { generateId, generateSlug } from '@firm/utils'

// Cryptographically secure IDs
const userId = generateId()           // "x7k9m2n4p6q8"
const eventId = generateId(32)       // 32-character ID

// URL-friendly slugs
const slug = generateSlug('Hello World!') // "hello-world"
```

### Date Utilities

```typescript
import { 
  formatDate, 
  addDays, 
  isExpired, 
  parseDate 
} from '@firm/utils'

// Format dates
const formatted = formatDate(new Date(), 'YYYY-MM-DD HH:mm')
const iso = formatDate(new Date(), 'iso')

// Date arithmetic
const nextWeek = addDays(new Date(), 7)

// Date validation
const expired = isExpired(token, { hours: 24 })

// Parse dates safely
const parsed = parseDate('2024-01-01')
```

### Object Utilities

```typescript
import { 
  deepMerge, 
  omit, 
  pick, 
  isEmpty 
} from '@firm/utils'

// Deep merge objects
const merged = deepMerge(
  { user: { name: 'John' } },
  { user: { email: 'john@example.com' } }
)

// Select properties
const selected = pick(user, ['name', 'email'])

// Remove properties
const cleaned = omit(user, ['password', 'secret'])

// Check emptiness
const empty = isEmpty({}) // true
```

### Async Utilities

```typescript
import { 
  retry, 
  timeout, 
  debounce, 
  throttle 
} from '@firm/utils'

// Retry with backoff
const result = await retry(
  async () => fetch('/api/data'),
  { attempts: 3, delay: 1000 }
)

// Timeout promises
const withTimeout = timeout(
  fetch('/api/slow'),
  { ms: 5000 }
)

// Debounce functions
const debouncedSearch = debounce(
  (query: string) => searchAPI(query),
  { delay: 300 }
)

// Throttle functions
const throttledSave = throttle(
  (data: any) => saveAPI(data),
  { interval: 1000 }
)
```

### Validation Utilities

```typescript
import { 
  isEmail, 
  isUUID, 
  isURL, 
  sanitize 
} from '@firm/utils'

// Validate common formats
if (isEmail(user.email)) {
  // Valid email
}

if (isUUID(eventId)) {
  // Valid UUID
}

// Sanitize strings
const clean = sanitize(userInput, { 
  stripHtml: true, 
  maxLength: 100 
})
```

## Performance Considerations

- **Memoization**: Expensive functions are memoized automatically
- **Lazy Evaluation**: Some utilities defer computation until needed
- **Optimized Algorithms**: All functions use optimal time/space complexity

## Error Handling

```typescript
import { safeParse, safeExec } from '@firm/utils'

// Safe JSON parsing
const parsed = safeParse(jsonString, {})

// Safe function execution
const [error, result] = await safeExec(
  async () => riskyOperation()
)

if (error) {
  console.error('Operation failed:', error)
} else {
  console.log('Result:', result)
}
```

## Browser Compatibility

All utilities work in:
- Node.js 18+
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Edge 90+

## License

Internal use only - restricted access
