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
