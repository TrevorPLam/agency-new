import { describe, it, expect, vi } from 'vitest';
import { ConsentManager } from '../src/consent-manager';
import { CONSENT_CATEGORIES, GPC_FORCED_CONSENT } from '../src/categories';

describe('ConsentManager', () => {
  it('should grant necessary consent by default', () => {
    const manager = new ConsentManager();
    expect(manager.hasConsent(CONSENT_CATEGORIES.NECESSARY)).toBe(true);
    expect(manager.hasConsent(CONSENT_CATEGORIES.ANALYTICS)).toBe(false);
  });

  it('should apply GPC overrides if enabled', () => {
    // Simulate GPC enabled via headers
    const manager = new ConsentManager({
      headers: { 'sec-gpc': '1' }
    });
    
    expect(manager.getRecord().gpcApplied).toBe(true);
    expect(manager.hasConsent(CONSENT_CATEGORIES.ANALYTICS)).toBe(false);
    expect(manager.hasConsent(CONSENT_CATEGORIES.MARKETING)).toBe(false);
  });

  it('should prevent opting in to analytics when GPC is active', async () => {
    const manager = new ConsentManager({
      headers: { 'sec-gpc': '1' }
    });

    await manager.updateConsent({ [CONSENT_CATEGORIES.ANALYTICS]: true });
    
    // Should still be false because of GPC
    expect(manager.hasConsent(CONSENT_CATEGORIES.ANALYTICS)).toBe(false);
  });

  it('should audit log consent changes', async () => {
    const mockLogger = { log: vi.fn().mockResolvedValue(undefined) };
    const manager = new ConsentManager({ auditLogger: mockLogger });

    await manager.updateConsent({ [CONSENT_CATEGORIES.ANALYTICS]: true });

    expect(mockLogger.log).toHaveBeenCalledWith(expect.objectContaining({
      action: 'grant',
      categories: [CONSENT_CATEGORIES.ANALYTICS],
    }));
  });

  it('should expire consent after the specified duration', () => {
    vi.useFakeTimers();
    const manager = new ConsentManager({ defaultExpirationMonths: 1 });
    
    const oneMonthPlusOneDay = 1000 * 60 * 60 * 24 * 32;
    vi.advanceTimersByTime(oneMonthPlusOneDay);
    
    // Only necessary should remain true if everything else was false anyway, 
    // but hasConsent should return false for others if expired.
    expect(manager.isExpired()).toBe(true);
    expect(manager.hasConsent(CONSENT_CATEGORIES.NECESSARY)).toBe(true);
    
    vi.useRealTimers();
  });
});
