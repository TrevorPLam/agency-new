# @firm/test-utils

Shared test utilities and mock factories for the Firm Platform.

## Installation

```bash
pnpm add @firm/test-utils
```

## Usage

### Mock Factories

Generate mock data for common domain objects:

```typescript
import { 
  mockBooking, 
  mockLead, 
  mockCustomer, 
  mockSession,
  mockUser 
} from '@firm/test-utils';

// Create a mock booking
const booking = mockBooking({
  status: 'confirmed',
  duration: 90
});

// Create a mock session with specific role
const session = mockSession({
  role: 'agent',
  permissions: ['lead:read', 'lead:update']
});

// Create a mock lead
const lead = mockLead({
  source: 'form',
  status: 'new'
});
```

### Random Data Generators

Generate random data for testing:

```typescript
import { 
  randomUuid, 
  randomEmail, 
  randomPhone, 
  randomDatetime,
  randomNumber 
} from '@firm/test-utils';

const id = randomUuid();
const email = randomEmail();
const phone = randomPhone();
const date = randomDatetime(30); // within last 30 days
const num = randomNumber(1, 100);
```

## Available Factories

- `mockSession(options)` - Mock authentication session
- `mockBooking(options)` - Mock booking object
- `mockLead(options)` - Mock lead object
- `mockCustomer(options)` - Mock customer object
- `mockService(options)` - Mock service object
- `mockUser(options)` - Mock user object
- `mockEmail(options)` - Mock email object

## Available Generators

- `randomUuid()` - Random UUID v4
- `randomEmail()` - Random email address
- `randomId(prefix)` - Random string ID with prefix
- `randomPhone()` - Random phone number
- `randomDate(daysAgo)` - Random date within range
- `randomDatetime(daysAgo)` - Random ISO datetime string
- `randomNumber(min, max)` - Random number in range
- `randomString(length)` - Random alphanumeric string

## License

MIT
