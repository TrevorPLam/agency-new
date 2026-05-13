import { 
  ConsentCategory, 
  CONSENT_CATEGORIES, 
  DEFAULT_CONSENT, 
  GPC_FORCED_CONSENT 
} from './categories';
import { IConsentAuditLogger, ConsoleAuditLogger } from './audit';
import { isGpcEnabled } from './gpc';
import { signConsentCookie } from './server';

export interface ConsentRecord {
  choices: Record<ConsentCategory, boolean>;
  updatedAt: number;
  expiresAt: number;
  gpcApplied: boolean;
}

export interface ConsentManagerOptions {
  auditLogger?: IConsentAuditLogger;
  defaultExpirationMonths?: number;
  headers?: Record<string, string | string[] | undefined>;
}

export class ConsentManager {
  private choices: Record<ConsentCategory, boolean>;
  private updatedAt: number;
  private expiresAt: number;
  private gpcApplied: boolean;
  private auditLogger: IConsentAuditLogger;
  private defaultExpirationMonths: number;

  constructor(options: ConsentManagerOptions = {}) {
    this.auditLogger = options.auditLogger || new ConsoleAuditLogger();
    this.defaultExpirationMonths = options.defaultExpirationMonths || 12;
    
    // Initial state
    const gpcActive = isGpcEnabled(options.headers);
    this.gpcApplied = gpcActive;
    this.updatedAt = Date.now();
    this.expiresAt = this.calculateExpiration();

    // Apply defaults and GPC overrides
    this.choices = { ...DEFAULT_CONSENT };
    if (gpcActive) {
      this.choices = { ...this.choices, ...GPC_FORCED_CONSENT };
    }
  }

  /**
   * Updates consent for specific categories.
   */
  async updateConsent(
    updates: Partial<Record<ConsentCategory, boolean>>,
    source: 'user' | 'system' = 'user'
  ): Promise<void> {
    const oldChoices = { ...this.choices };
    
    // Merge updates, ensuring NECESSARY is always true
    const newChoices = { 
      ...this.choices, 
      ...updates,
      [CONSENT_CATEGORIES.NECESSARY]: true 
    };

    // If GPC is active, enforce overrides
    if (this.gpcApplied) {
      Object.assign(newChoices, GPC_FORCED_CONSENT);
    }

    this.choices = newChoices;
    this.updatedAt = Date.now();
    this.expiresAt = this.calculateExpiration();

    // Audit log the changes
    const changedCategories = (Object.keys(newChoices) as ConsentCategory[]).filter(
      cat => newChoices[cat] !== oldChoices[cat]
    );

    if (changedCategories.length > 0) {
      await this.auditLogger.log({
        timestamp: this.updatedAt,
        action: updates.analytics === false || updates.marketing === false ? 'withdraw' : 'grant',
        categories: changedCategories,
        source,
        metadata: { gpcApplied: this.gpcApplied }
      });
    }
  }

  /**
   * Checks if consent is granted for a specific category.
   */
  hasConsent(category: ConsentCategory): boolean {
    if (this.isExpired()) {
      return category === CONSENT_CATEGORIES.NECESSARY;
    }
    return this.choices[category] || false;
  }

  /**
   * Checks if the current consent record has expired.
   */
  isExpired(): boolean {
    return Date.now() > this.expiresAt;
  }

  /**
   * Gets the full consent record for storage.
   */
  getRecord(): ConsentRecord {
    return {
      choices: this.choices,
      updatedAt: this.updatedAt,
      expiresAt: this.expiresAt,
      gpcApplied: this.gpcApplied,
    };
  }

  /**
   * Creates a signed consent cookie for secure HTTP storage.
   * 
   * @param secretKey - Server-side secret for HMAC signing (from CONSENT_COOKIE_SECRET)
   * @returns Signed cookie value in format: <URL-encoded JSON>.<hmac hex>
   */
  createSignedCookie(secretKey: string): string {
    const record = this.getRecord();
    return signConsentCookie(record, secretKey);
  }

  /**
   * Loads a consent record (e.g. from a cookie or database).
   */
  async loadRecord(record: ConsentRecord): Promise<void> {
    this.choices = { ...record.choices, [CONSENT_CATEGORIES.NECESSARY]: true };
    this.updatedAt = record.updatedAt;
    this.expiresAt = record.expiresAt;
    this.gpcApplied = record.gpcApplied;

    // Re-check GPC if it was not applied before
    if (!this.gpcApplied && isGpcEnabled()) {
      await this.updateConsent(GPC_FORCED_CONSENT, 'system');
      this.gpcApplied = true;
    }
  }

  private calculateExpiration(): number {
    const date = new Date();
    date.setMonth(date.getMonth() + this.defaultExpirationMonths);
    return date.getTime();
  }
}
