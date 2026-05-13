# firm-test-utils

Generated on: 2026-05-13T02:25:38.699Z
Total files: 4

**Description:** Shared test utilities and mock factories for the firm platform

**Version:** 1.0.0

## Table of Contents

- [factories.ts](#factories-ts)
- [generators.ts](#generators-ts)
- [index.ts](#index-ts)
- [tsup.config.ts](#tsup-config-ts)

## File Contents

### factories.ts

**Path:** `src\factories.ts`

**Language:** TypeScript

```typescript
/**
 * Mock factories for common domain objects
 */

import { randomUuid, randomEmail, randomPhone, randomDatetime, randomNumber } from './generators';

/**
 * Mock session context factory
 */
export interface MockSessionOptions {
  userId?: string;
  tenantId?: string;
  role?: 'super_admin' | 'tenant_admin' | 'manager' | 'agent' | 'user' | 'read_only';
  permissions?: string[];
  isAuthenticated?: boolean;
}

export function mockSession(options: MockSessionOptions = {}) {
  return {
    userId: options.userId ?? randomUuid(),
    tenantId: options.tenantId ?? randomUuid(),
    role: options.role ?? 'user',
    permissions: options.permissions ?? [],
    isAuthenticated: options.isAuthenticated ?? true,
  };
}

/**
 * Mock booking factory
 */
export interface MockBookingOptions {
  id?: string;
  serviceId?: string;
  customerId?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  duration?: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  notes?: string;
}

export function mockBooking(options: MockBookingOptions = {}) {
  const startTime = options.startTime ?? randomDatetime(7);
  const duration = options.duration ?? 60;
  const startDate = new Date(startTime);
  const endTime = options.endTime ?? new Date(startDate.getTime() + duration * 60000).toISOString();

  return {
    id: options.id ?? randomUuid(),
    serviceId: options.serviceId ?? randomUuid(),
    customerId: options.customerId ?? randomUuid(),
    startTime,
    endTime,
    timezone: options.timezone ?? 'America/New_York',
    duration,
    status: options.status ?? 'pending',
    notes: options.notes ?? null,
  };
}

/**
 * Mock lead factory
 */
export interface MockLeadOptions {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: 'form' | 'import' | 'manual' | 'api' | 'webhook';
  status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  score?: number;
}

export function mockLead(options: MockLeadOptions = {}) {
  return {
    id: options.id ?? randomUuid(),
    firstName: options.firstName ?? 'John',
    lastName: options.lastName ?? 'Doe',
    email: options.email ?? randomEmail(),
    phone: options.phone ?? randomPhone(),
    company: options.company ?? 'Acme Corp',
    source: options.source ?? 'form',
    status: options.status ?? 'new',
    score: options.score ?? randomNumber(0, 100),
  };
}

/**
 * Mock customer factory
 */
export interface MockCustomerOptions {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export function mockCustomer(options: MockCustomerOptions = {}) {
  return {
    id: options.id ?? randomUuid(),
    name: options.name ?? 'John Doe',
    email: options.email ?? randomEmail(),
    phone: options.phone ?? randomPhone(),
  };
}

/**
 * Mock service factory
 */
export interface MockServiceOptions {
  id?: string;
  name?: string;
  price?: number;
  category?: string;
  duration?: number;
}

export function mockService(options: MockServiceOptions = {}) {
  return {
    id: options.id ?? randomUuid(),
    name: options.name ?? 'Consultation',
    price: options.price ?? randomNumber(50, 500),
    category: options.category ?? 'Consulting',
    duration: options.duration ?? 60,
  };
}

/**
 * Mock user factory
 */
export interface MockUserOptions {
  id?: string;
  email?: string;
  name?: string;
  role?: 'super_admin' | 'tenant_admin' | 'manager' | 'agent' | 'user' | 'read_only';
  tenantId?: string;
}

export function mockUser(options: MockUserOptions = {}) {
  return {
    id: options.id ?? randomUuid(),
    email: options.email ?? randomEmail(),
    name: options.name ?? 'John Doe',
    role: options.role ?? 'user',
    tenantId: options.tenantId ?? randomUuid(),
  };
}

/**
 * Mock email factory
 */
export interface MockEmailOptions {
  id?: string;
  to?: string[];
  subject?: string;
  from?: string;
  provider?: 'resend' | 'smtp' | 'sendgrid' | 'ses';
  category?: 'transactional' | 'marketing' | 'notification';
}

export function mockEmail(options: MockEmailOptions = {}) {
  return {
    id: options.id ?? randomUuid(),
    to: options.to ?? [randomEmail()],
    subject: options.subject ?? 'Test Email',
    from: options.from ?? 'noreply@example.com',
    provider: options.provider ?? 'resend',
    category: options.category ?? 'transactional',
  };
}

```

---

### generators.ts

**Path:** `src\generators.ts`

**Language:** TypeScript

```typescript
/**
 * Random data generators for testing
 */

/**
 * Generates a random UUID v4
 */
export function randomUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates a random email address
 */
export function randomEmail(): string {
  const domains = ['example.com', 'test.com', 'demo.org', 'fake.net'];
  const names = ['user', 'test', 'demo', 'admin', 'customer'];
  const name = names[Math.floor(Math.random() * names.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${name}${num}@${domain}`;
}

/**
 * Generates a random string ID
 */
export function randomId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generates a random phone number
 */
export function randomPhone(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `+1 (${areaCode}) ${exchange}-${number}`;
}

/**
 * Generates a random date within a range
 */
export function randomDate(daysAgo = 30): Date {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

/**
 * Generates a random ISO datetime string
 */
export function randomDatetime(daysAgo = 30): string {
  return randomDate(daysAgo).toISOString();
}

/**
 * Generates a random number within a range
 */
export function randomNumber(min = 0, max = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random string of specified length
 */
export function randomString(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
/**
 * @firm/test-utils
 * 
 * Shared test utilities and mock factories for the Firm Platform.
 * 
 * This package provides:
 * - Mock factories for common domain objects
 * - Test helpers for authentication and permissions
 * - Random data generators for testing
 * 
 * @example
 * import { mockBooking, mockSession } from '@firm/test-utils';
 * 
 * const booking = mockBooking();
 * const session = mockSession({ role: 'agent' });
 */

// Re-export everything from factories
export * from './factories';

// Re-export common test utilities
export { randomId, randomEmail, randomUuid } from './generators';

```

---

### tsup.config.ts

**Path:** `tsup.config.ts`

**Language:** TypeScript

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/factories.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['zod'],
})

```

---

