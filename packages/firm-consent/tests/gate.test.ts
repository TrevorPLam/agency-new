import { describe, it, expect, vi } from 'vitest';
import { ConsentManager } from '../src/consent-manager';
import { CONSENT_CATEGORIES } from '../src/categories';
import { consentGate, withConsent } from '../src/gate';

describe('consentGate', () => {
  it('should execute onGrant when consent is present', () => {
    const manager = new ConsentManager();
    // Necessary is always granted
    const result = consentGate(
      CONSENT_CATEGORIES.NECESSARY,
      manager,
      () => 'granted',
      () => 'denied'
    );
    expect(result).toBe('granted');
  });

  it('should execute onDeny when consent is missing', () => {
    const manager = new ConsentManager();
    // Analytics is false by default
    const result = consentGate(
      CONSENT_CATEGORIES.ANALYTICS,
      manager,
      () => 'granted',
      () => 'denied'
    );
    expect(result).toBe('denied');
  });

  it('should work with withConsent HOC', () => {
    const manager = new ConsentManager();
    const sensitiveOp = vi.fn(() => 'ok');
    
    const gatedOp = withConsent(CONSENT_CATEGORIES.ANALYTICS, manager, sensitiveOp);
    
    const result = gatedOp();
    expect(result).toBeUndefined();
    expect(sensitiveOp).not.toHaveBeenCalled();
  });
});
