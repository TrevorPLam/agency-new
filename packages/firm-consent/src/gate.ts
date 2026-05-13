import { ConsentCategory, CONSENT_CATEGORIES } from './categories';
import { ConsentManager } from './consent-manager';

/**
 * Server-side consent gate.
 * Wraps a function or value and only returns/executes it if consent is granted.
 */
export function consentGate<T>(
  category: ConsentCategory,
  manager: ConsentManager,
  onGrant: () => T,
  onDeny?: () => T
): T | undefined {
  if (manager.hasConsent(category)) {
    return onGrant();
  }
  return onDeny ? onDeny() : undefined;
}

/**
 * Higher-order function version of the gate.
 */
export function withConsent<Args extends any[], R>(
  category: ConsentCategory,
  manager: ConsentManager,
  fn: (...args: Args) => R
): (...args: Args) => R | undefined {
  return (...args: Args) => {
    if (manager.hasConsent(category)) {
      return fn(...args);
    }
    return undefined;
  };
}
