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
