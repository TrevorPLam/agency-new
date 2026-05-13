# firm-consent

Generated on: 2026-05-13T02:25:38.329Z
Total files: 14

**Description:** Consent lifecycle and enforcement for Firm Platform

**Version:** 0.0.0

## Table of Contents

- [server-usage.ts](#server-usage-ts)
- [audit.ts](#audit-ts)
- [categories.ts](#categories-ts)
- [consent-manager.ts](#consent-manager-ts)
- [context.tsx](#context-tsx)
- [gate.ts](#gate-ts)
- [gpc.ts](#gpc-ts)
- [index.ts](#index-ts)
- [server.ts](#server-ts)
- [ui-contract.ts](#ui-contract-ts)
- [consent-manager.test.ts](#consent-manager-test-ts)
- [gate.test.ts](#gate-test-ts)
- [server.test.ts](#server-test-ts)
- [tsup.config.ts](#tsup-config-ts)

## File Contents

### server-usage.ts

**Path:** `examples\server-usage.ts`

**Language:** TypeScript

```typescript
/**
 * Example usage of server-side consent resolution for GDPR compliance.
 * This demonstrates how to use the new server-side functions to make
 * consent decisions before rendering pages in SSR scenarios.
 */

import {
  getConsentFromHeaders,
  hasConsentFromHeaders,
  getConsentChoicesFromHeaders,
  isGpcEnabledFromHeaders,
  applyGpcOverrides,
  buildConsentCookieHeader,
  DEFAULT_CONSENT_COOKIE_NAME,
  ConsentHeaders
} from '../src/server';
import { ConsentManager } from '../src/consent-manager';
import { CONSENT_CATEGORIES } from '../src/categories';

/**
 * Example: Next.js middleware or server-side page logic
 */
export function shouldIncludeAnalytics(headers: ConsentHeaders): boolean {
  // Check if user has granted analytics consent
  const hasAnalyticsConsent = hasConsentFromHeaders(headers, CONSENT_CATEGORIES.ANALYTICS);
  
  // Apply GPC overrides if enabled
  if (isGpcEnabledFromHeaders(headers)) {
    return false; // GPC forces analytics to be disabled
  }
  
  return hasAnalyticsConsent;
}

/**
 * Example: Get all consent choices for conditional script loading
 */
export function getConsentForScriptLoading(headers: ConsentHeaders) {
  const choices = getConsentChoicesFromHeaders(headers);
  
  // Apply GPC overrides if enabled
  const finalChoices = applyGpcOverrides(choices, headers);
  
  return {
    canLoadAnalytics: finalChoices[CONSENT_CATEGORIES.ANALYTICS],
    canLoadMarketing: finalChoices[CONSENT_CATEGORIES.MARKETING],
    canLoadFunctional: finalChoices[CONSENT_CATEGORIES.FUNCTIONAL],
    canLoadNecessary: finalChoices[CONSENT_CATEGORIES.NECESSARY], // Always true
  };
}

/**
 * Example: Express.js middleware for consent checking
 */
export function consentMiddleware(req: any, res: any, next: any) {
  const headers: ConsentHeaders = {
    cookie: req.headers.cookie,
    'user-agent': req.headers['user-agent'],
    dnt: req.headers.dnt,
    'sec-gpc': req.headers['sec-gpc'],
  };

  // Store consent information in request object for later use
  req.consent = {
    record: getConsentFromHeaders(headers),
    choices: getConsentChoicesFromHeaders(headers),
    gpcEnabled: isGpcEnabledFromHeaders(headers),
  };

  next();
}

/**
 * Example: Generate HTML with conditional script inclusion
 */
export function generateHtmlWithScripts(headers: ConsentHeaders): string {
  const consent = getConsentForScriptLoading(headers);
  
  let scripts = '';
  
  // Always include necessary scripts
  scripts += '<script src="/js/necessary.js"></script>\n';
  
  // Conditionally include analytics scripts
  if (consent.canLoadAnalytics) {
    scripts += '<script src="/js/analytics.js"></script>\n';
    scripts += '<script>gtag("config", "GA_MEASUREMENT_ID");</script>\n';
  }
  
  // Conditionally include marketing scripts
  if (consent.canLoadMarketing) {
    scripts += '<script src="/js/marketing.js"></script>\n';
    scripts += '<script>fbq("init", "FACEBOOK_PIXEL_ID");</script>\n';
  }
  
  // Conditionally include functional scripts
  if (consent.canLoadFunctional) {
    scripts += '<script src="/js/functional.js"></script>\n';
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <title>GDPR Compliant Page</title>
</head>
<body>
  <h1>Welcome to our site</h1>
  <p>Your consent preferences have been respected.</p>
  
  ${scripts}
</body>
</html>`;
}

/**
 * Example: API endpoint to check consent status
 */
export function checkConsentEndpoint(headers: ConsentHeaders) {
  const consentRecord = getConsentFromHeaders(headers);
  const gpcEnabled = isGpcEnabledFromHeaders(headers);
  
  return {
    hasConsentRecord: !!consentRecord,
    consentRecord,
    gpcEnabled,
    lastUpdated: consentRecord?.updatedAt,
    expiresAt: consentRecord?.expiresAt,
    isExpired: consentRecord ? Date.now() > consentRecord.expiresAt : true,
  };
}

/**
 * Example: Custom cookie name usage
 */
export function checkConsentWithCustomCookie(headers: ConsentHeaders) {
  // Use a custom cookie name for multi-tenant scenarios
  const options = {
    cookieName: 'tenant_123_consent',
  };
  
  return getConsentFromHeaders(headers, options);
}

/**
 * Example: Comprehensive consent validation for SSR
 */
export function validateConsentForSSR(headers: ConsentHeaders) {
  const consentRecord = getConsentFromHeaders(headers);
  const gpcEnabled = isGpcEnabledFromHeaders(headers);
  
  // If no consent record exists, return default state
  if (!consentRecord) {
    return {
      valid: true,
      choices: {
        [CONSENT_CATEGORIES.NECESSARY]: true,
        [CONSENT_CATEGORIES.ANALYTICS]: false,
        [CONSENT_CATEGORIES.MARKETING]: false,
        [CONSENT_CATEGORIES.FUNCTIONAL]: false,
      },
      gpcApplied: gpcEnabled,
      source: 'default',
    };
  }
  
  // Apply GPC overrides if enabled
  const finalChoices = applyGpcOverrides(consentRecord.choices, headers);
  
  return {
    valid: true,
    choices: finalChoices,
    gpcApplied: gpcEnabled || consentRecord.gpcApplied,
    source: 'cookie',
    lastUpdated: consentRecord.updatedAt,
    expiresAt: consentRecord.expiresAt,
  };
}

/**
 * Example: Setting secure consent cookies in API routes
 */
export async function setConsentCookieExample(userChoices: { analytics: boolean; marketing: boolean; functional: boolean }) {
  // Create consent manager and update user choices
  const consentManager = new ConsentManager();
  await consentManager.updateConsent(userChoices, 'user');
  
  // Create signed cookie payload
  const secretKey = process.env.CONSENT_COOKIE_SECRET || 'your-secret-key';
  const signedPayload = consentManager.createSignedCookie(secretKey);
  
  // Build secure Set-Cookie header
  const cookieHeader = buildConsentCookieHeader(signedPayload, {
    maxAge: 365 * 24 * 60 * 60, // 1 year in seconds
    domain: '.example.com', // Optional: for subdomains
  });
  
  return cookieHeader;
}

/**
 * Example: Express.js route for consent management
 */
export function consentUpdateRoute(req: any, res: any) {
  const userChoices = req.body; // { analytics: true, marketing: false, functional: true }
  
  // Create consent manager
  const consentManager = new ConsentManager({
    headers: {
      'user-agent': req.headers['user-agent'],
      dnt: req.headers.dnt,
      'sec-gpc': req.headers['sec-gpc'],
    }
  });
  
  // Update consent choices
  consentManager.updateConsent(userChoices, 'user').then(() => {
    // Create signed cookie
    const secretKey = process.env.CONSENT_COOKIE_SECRET;
    if (!secretKey) {
      throw new Error('CONSENT_COOKIE_SECRET environment variable is required');
    }
    const signedPayload = consentManager.createSignedCookie(secretKey);
    
    // Build secure cookie header
    const cookieHeader = buildConsentCookieHeader(signedPayload);
    
    // Set the cookie
    res.setHeader('Set-Cookie', cookieHeader);
    res.json({ success: true, message: 'Consent preferences updated' });
  }).catch(error => {
    res.status(500).json({ success: false, error: 'Failed to update consent' });
  });
}

/**
 * Example: Generic API route for consent management
 */
export async function handleConsentUpdate(request: Request) {
  try {
    const userChoices = await request.json();
    
    // Create consent manager with request headers
    const consentManager = new ConsentManager({
      headers: {
        'user-agent': request.headers.get('user-agent') || undefined,
        dnt: request.headers.get('dnt') || undefined,
        'sec-gpc': request.headers.get('sec-gpc') || undefined,
      }
    });
    
    // Update consent choices
    await consentManager.updateConsent(userChoices, 'user');
    
    // Create signed cookie
    const secretKey = process.env.CONSENT_COOKIE_SECRET;
    if (!secretKey) {
      throw new Error('CONSENT_COOKIE_SECRET environment variable is required');
    }
    const signedPayload = consentManager.createSignedCookie(secretKey);
    
    // Build secure cookie header
    const cookieHeader = buildConsentCookieHeader(signedPayload, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });
    
    // Create response with secure cookie
    const response = Response.json({ 
      success: true, 
      message: 'Consent preferences updated',
      choices: consentManager.getRecord().choices
    });
    
    response.headers.set('Set-Cookie', cookieHeader);
    return response;
    
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to update consent' },
      { status: 500 }
    );
  }
}

```

---

### audit.ts

**Path:** `src\audit.ts`

**Language:** TypeScript

```typescript
import { ConsentCategory } from './categories';

export interface ConsentAuditLog {
  timestamp: number;
  action: 'grant' | 'deny' | 'withdraw' | 'expire' | 'gpc_applied';
  categories: ConsentCategory[];
  source: 'user' | 'system' | 'gpc';
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for immutable audit logging.
 * Implementation will typically write to a database.
 */
export interface IConsentAuditLogger {
  log(entry: ConsentAuditLog): Promise<void>;
}

/**
 * Simple console logger for audit trails (default).
 */
export class ConsoleAuditLogger implements IConsentAuditLogger {
  async log(entry: ConsentAuditLog): Promise<void> {
    console.log('[CONSENT AUDIT]', JSON.stringify(entry));
  }
}

```

---

### categories.ts

**Path:** `src\categories.ts`

**Language:** TypeScript

```typescript
/**
 * Consent categories defined for the Agency Platform.
 */
export const CONSENT_CATEGORIES = {
  /**
   * Essential cookies/data required for the site to function.
   * Always granted.
   */
  NECESSARY: 'necessary',

  /**
   * Analytics and performance monitoring.
   */
  ANALYTICS: 'analytics',

  /**
   * Marketing and advertisement personalization.
   */
  MARKETING: 'marketing',

  /**
   * Functional preferences (e.g. language, theme).
   */
  FUNCTIONAL: 'functional',
} as const;

export type ConsentCategory = (typeof CONSENT_CATEGORIES)[keyof typeof CONSENT_CATEGORIES];

/**
 * Purposes for each category.
 */
export const CONSENT_PURPOSES: Record<ConsentCategory, string> = {
  [CONSENT_CATEGORIES.NECESSARY]: 'Essential for security and basic functionality.',
  [CONSENT_CATEGORIES.ANALYTICS]: 'Used to understand how visitors interact with the website.',
  [CONSENT_CATEGORIES.MARKETING]: 'Used to deliver relevant advertisements and track campaign performance.',
  [CONSENT_CATEGORIES.FUNCTIONAL]: 'Used to remember user preferences and provide enhanced features.',
};

/**
 * Default consent state.
 * Necessary is always granted.
 */
export const DEFAULT_CONSENT: Record<ConsentCategory, boolean> = {
  [CONSENT_CATEGORIES.NECESSARY]: true,
  [CONSENT_CATEGORIES.ANALYTICS]: false,
  [CONSENT_CATEGORIES.MARKETING]: false,
  [CONSENT_CATEGORIES.FUNCTIONAL]: false,
};

/**
 * Consent forced by Global Privacy Control (GPC).
 * GPC forces analytics and marketing denial.
 */
export const GPC_FORCED_CONSENT: Partial<Record<ConsentCategory, boolean>> = {
  [CONSENT_CATEGORIES.ANALYTICS]: false,
  [CONSENT_CATEGORIES.MARKETING]: false,
};

```

---

### consent-manager.ts

**Path:** `src\consent-manager.ts`

**Language:** TypeScript

```typescript
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

```

---

### context.tsx

**Path:** `src\context.tsx`

**Language:** TypeScript React

```typescript
'use client';

import React, { 
  createContext, 
  useContext, 
  useState, 
  useMemo, 
  useCallback, 
  useEffect 
} from 'react';
import { 
  ConsentCategory, 
  CONSENT_CATEGORIES, 
  CONSENT_PURPOSES 
} from './categories';
import { ConsentManager, ConsentRecord } from './consent-manager';
import { IConsentUiState } from './ui-contract';

interface ConsentContextValue {
  manager: ConsentManager;
  record: ConsentRecord;
  ui: IConsentUiState;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export interface ConsentProviderProps {
  children: React.ReactNode;
  initialRecord?: ConsentRecord;
  onRecordChange?: (record: ConsentRecord) => void;
}

export const ConsentProvider: React.FC<ConsentProviderProps> = ({ 
  children, 
  initialRecord,
  onRecordChange 
}) => {
  const [manager] = useState(() => new ConsentManager());
  const [record, setRecord] = useState<ConsentRecord>(() => {
    if (initialRecord) {
      // Synchronously load if provided
      // manager.loadRecord is async but we can't await here easily without effect
      return initialRecord;
    }
    return manager.getRecord();
  });
  const [isUiVisible, setIsUiVisible] = useState(!initialRecord);

  // Load initial record into manager if provided
  useEffect(() => {
    if (initialRecord) {
      manager.loadRecord(initialRecord).then(() => {
        setRecord(manager.getRecord());
      });
    }
  }, [initialRecord, manager]);

  const updateConsent = useCallback(async (updates: Partial<Record<ConsentCategory, boolean>>) => {
    await manager.updateConsent(updates);
    const newRecord = manager.getRecord();
    setRecord(newRecord);
    onRecordChange?.(newRecord);
  }, [manager, onRecordChange]);

  const ui: IConsentUiState = useMemo(() => ({
    isVisible: isUiVisible,
    record,
    purposes: CONSENT_PURPOSES,
    grant: async (categories) => {
      const updates = categories.reduce((acc, cat) => ({ ...acc, [cat]: true }), {});
      await updateConsent(updates);
    },
    deny: async (categories) => {
      const updates = categories.reduce((acc, cat) => ({ ...acc, [cat]: false }), {});
      await updateConsent(updates);
    },
    grantAll: async () => {
      const updates = (Object.values(CONSENT_CATEGORIES) as ConsentCategory[]).reduce(
        (acc, cat) => ({ ...acc, [cat]: true }), 
        {}
      );
      await updateConsent(updates);
      setIsUiVisible(false);
    },
    denyAll: async () => {
      const updates = (Object.values(CONSENT_CATEGORIES) as ConsentCategory[]).reduce(
        (acc, cat) => ({ ...acc, [cat]: false }), 
        {}
      );
      await updateConsent(updates);
      setIsUiVisible(false);
    },
    close: () => setIsUiVisible(false),
  }), [isUiVisible, record, updateConsent]);

  const value = useMemo(() => ({
    manager,
    record,
    ui
  }), [manager, record, ui]);

  return (
    <ConsentContext.Provider value={value}>
      {children}
    </ConsentContext.Provider>
  );
};

/**
 * Hook to access the consent manager.
 */
export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
}

/**
 * Hook for structural render gating.
 */
export function useConsentGate(category: ConsentCategory) {
  const { manager } = useConsent();
  return manager.hasConsent(category);
}

/**
 * Hook for the consent UI banner.
 */
export function useConsentUi() {
  const { ui } = useConsent();
  return ui;
}

```

---

### gate.ts

**Path:** `src\gate.ts`

**Language:** TypeScript

```typescript
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

```

---

### gpc.ts

**Path:** `src\gpc.ts`

**Language:** TypeScript

```typescript
/**
 * Detects if Global Privacy Control (GPC) is enabled.
 * Works in both browser and server (defaults to false on server if no header provided).
 */
export function isGpcEnabled(headers?: Record<string, string | string[] | undefined>): boolean {
  // Browser-side detection
  if (typeof window !== 'undefined' && (window as any).navigator?.globalPrivacyControl === true) {
    return true;
  }

  // Server-side detection via 'Sec-GPC' header
  if (headers) {
    const gpcHeader = headers['sec-gpc'] || headers['Sec-GPC'];
    return gpcHeader === '1';
  }

  return false;
}

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
export * from './categories';
export * from './consent-manager';
export * from './gpc';
export * from './gate';
export * from './audit';
export * from './ui-contract';
export * from './context';
export * from './server';

```

---

### server.ts

**Path:** `src\server.ts`

**Language:** TypeScript

```typescript
import { ConsentRecord } from './consent-manager';
import { ConsentCategory, CONSENT_CATEGORIES } from './categories';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Server-side headers interface for consent resolution.
 */
export interface ConsentHeaders {
  cookie?: string;
  'user-agent'?: string;
  dnt?: string;
  'sec-gpc'?: string;
}

/**
 * Cookie parsing options.
 */
export interface ConsentCookieOptions {
  cookieName?: string;
  requireSignature?: boolean;
  secretKey?: string;
}

/**
 * Default cookie name for consent storage.
 */
export const DEFAULT_CONSENT_COOKIE_NAME = 'firm_consent';

/**
 * Parses cookies from a cookie header string.
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  if (!cookieHeader) {
    return cookies;
  }

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = rest.join('=');
    }
  });

  return cookies;
}

/**
 * Signs a consent cookie using HMAC-SHA256.
 * Format: <URL-encoded JSON>.<hmac hex>
 */
export function signConsentCookie(
  record: ConsentRecord,
  secretKey: string
): string {
  const jsonString = JSON.stringify(record);
  const encodedJson = encodeURIComponent(jsonString);
  
  const hmac = createHmac('sha256', secretKey);
  hmac.update(encodedJson);
  const signature = hmac.digest('hex');
  
  return `${encodedJson}.${signature}`;
}

/**
 * Parses and validates a signed consent cookie.
 * Returns null if signature is invalid or malformed.
 */
export function parseSignedCookie(
  signedCookie: string,
  secretKey: string
): ConsentRecord | null {
  try {
    const lastDotIndex = signedCookie.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return null; // Invalid format
    }

    const encodedJson = signedCookie.substring(0, lastDotIndex);
    const providedSignature = signedCookie.substring(lastDotIndex + 1);

    // Recompute HMAC
    const hmac = createHmac('sha256', secretKey);
    hmac.update(encodedJson);
    const expectedSignature = hmac.digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const providedBuffer = Buffer.from(providedSignature, 'hex');
    
    if (expectedBuffer.length !== providedBuffer.length) {
      return null;
    }

    if (!timingSafeEqual(expectedBuffer, providedBuffer)) {
      return null; // Invalid signature
    }

    // Parse and validate the JSON
    const jsonString = decodeURIComponent(encodedJson);
    const record = JSON.parse(jsonString);

    // Validate structure
    if (!validateConsentStructure(record)) {
      return null;
    }

    return record;
  } catch (error) {
    return null; // Malformed cookie
  }
}

/**
 * Validates the basic structure of a consent record.
 */
function validateConsentStructure(record: any): boolean {
  if (!record || typeof record !== 'object') {
    return false;
  }

  // Validate required fields
  if (
    !record.choices || 
    typeof record.choices !== 'object' ||
    typeof record.updatedAt !== 'number' ||
    typeof record.expiresAt !== 'number' ||
    typeof record.gpcApplied !== 'boolean'
  ) {
    return false;
  }

  // Validate consent categories
  const validCategories = Object.values(CONSENT_CATEGORIES);
  for (const category of validCategories) {
    if (typeof record.choices[category] !== 'boolean') {
      return false;
    }
  }

  return true;
}

/**
 * Reads and parses consent cookie from HTTP headers.
 * 
 * @param headers - HTTP headers containing cookie information
 * @param options - Cookie parsing options
 * @returns Parsed consent record or null if invalid/not found
 */
export function getConsentFromHeaders(
  headers: ConsentHeaders,
  options: ConsentCookieOptions = {}
): ConsentRecord | null {
  const {
    cookieName = DEFAULT_CONSENT_COOKIE_NAME,
    requireSignature = false,
    secretKey
  } = options;

  // Extract cookie header
  const cookieHeader = headers.cookie || '';
  if (!cookieHeader) {
    return null;
  }

  // Parse cookies
  const cookies = parseCookies(cookieHeader);
  const consentCookie = cookies[cookieName];
  
  if (!consentCookie) {
    return null;
  }

  try {
    let consentData: ConsentRecord | null = null;

    if (requireSignature && secretKey) {
      // Parse signed cookie
      consentData = parseSignedCookie(consentCookie, secretKey);
    } else {
      // Legacy support: parse unsigned JSON cookie
      consentData = JSON.parse(decodeURIComponent(consentCookie));
      
      // Validate structure
      if (!validateConsentStructure(consentData)) {
        return null;
      }
    }

    if (!consentData) {
      return null;
    }

    // Check if consent has expired
    if (Date.now() > consentData.expiresAt) {
      return null;
    }

    // Ensure necessary category is always true
    consentData.choices[CONSENT_CATEGORIES.NECESSARY] = true;

    return consentData;
  } catch (error) {
    // Invalid JSON or malformed cookie
    return null;
  }
}

/**
 * Checks if consent is granted for a specific category from headers.
 * 
 * @param headers - HTTP headers containing cookie information
 * @param category - Consent category to check
 * @param options - Cookie parsing options
 * @returns True if consent is granted, false otherwise
 */
export function hasConsentFromHeaders(
  headers: ConsentHeaders,
  category: ConsentCategory,
  options: ConsentCookieOptions = {}
): boolean {
  const consentRecord = getConsentFromHeaders(headers, options);
  
  if (!consentRecord) {
    // No consent record found - only grant necessary consent
    return category === CONSENT_CATEGORIES.NECESSARY;
  }

  return consentRecord.choices[category] || false;
}

/**
 * Gets all consent choices from headers.
 * 
 * @param headers - HTTP headers containing cookie information
 * @param options - Cookie parsing options
 * @returns Record of consent choices or default (only necessary)
 */
export function getConsentChoicesFromHeaders(
  headers: ConsentHeaders,
  options: ConsentCookieOptions = {}
): Record<ConsentCategory, boolean> {
  const consentRecord = getConsentFromHeaders(headers, options);
  
  if (!consentRecord) {
    // Return default consent (only necessary)
    return {
      [CONSENT_CATEGORIES.NECESSARY]: true,
      [CONSENT_CATEGORIES.ANALYTICS]: false,
      [CONSENT_CATEGORIES.MARKETING]: false,
      [CONSENT_CATEGORIES.FUNCTIONAL]: false,
    };
  }

  return consentRecord.choices;
}

/**
 * Determines if Global Privacy Control (GPC) is enabled from headers.
 * This can be used to override user consent choices.
 */
export function isGpcEnabledFromHeaders(headers: ConsentHeaders): boolean {
  // Check Sec-GPC header (standard)
  if (headers['sec-gpc'] === '1') {
    return true;
  }

  // Check DNT header (legacy support)
  if (headers.dnt === '1') {
    return true;
  }

  return false;
}

/**
 * Applies GPC overrides to consent choices if GPC is enabled.
 * 
 * @param choices - Current consent choices
 * @param headers - HTTP headers to check for GPC
 * @returns Consent choices with GPC overrides applied
 */
export function applyGpcOverrides(
  choices: Record<ConsentCategory, boolean>,
  headers: ConsentHeaders
): Record<ConsentCategory, boolean> {
  if (!isGpcEnabledFromHeaders(headers)) {
    return choices;
  }

  // GPC forces analytics and marketing to be false
  return {
    ...choices,
    [CONSENT_CATEGORIES.ANALYTICS]: false,
    [CONSENT_CATEGORIES.MARKETING]: false,
  };
}

/**
 * Builds a secure Set-Cookie header for consent cookies.
 * 
 * @param signedPayload - The signed cookie value from signConsentCookie()
 * @param options - Cookie options including name and security attributes
 * @returns Complete Set-Cookie header string with secure attributes
 */
export function buildConsentCookieHeader(
  signedPayload: string,
  options: ConsentCookieOptions & { 
    maxAge?: number;
    expires?: Date;
    domain?: string;
  } = {}
): string {
  const {
    cookieName = DEFAULT_CONSENT_COOKIE_NAME,
    maxAge,
    expires,
    domain
  } = options;

  // Base cookie with name and signed payload
  const cookieParts = [`${cookieName}=${signedPayload}`];

  // Security attributes (always included for compliance)
  cookieParts.push('Secure');
  cookieParts.push('SameSite=Lax');
  cookieParts.push('Path=/');

  // Optional attributes
  if (maxAge !== undefined) {
    cookieParts.push(`Max-Age=${maxAge}`);
  }

  if (expires) {
    cookieParts.push(`Expires=${expires.toUTCString()}`);
  }

  if (domain) {
    cookieParts.push(`Domain=${domain}`);
  }

  return cookieParts.join('; ');
}

```

---

### ui-contract.ts

**Path:** `src\ui-contract.ts`

**Language:** TypeScript

```typescript
import { ConsentCategory, CONSENT_PURPOSES } from './categories';
import { ConsentRecord } from './consent-manager';

/**
 * Interface for the UI to interact with consent state.
 */
export interface IConsentUiState {
  /**
   * Whether the consent banner should be visible.
   */
  isVisible: boolean;

  /**
   * The current consent record.
   */
  record: ConsentRecord;

  /**
   * Purpose descriptions for each category.
   */
  purposes: Record<ConsentCategory, string>;

  /**
   * Grants consent for specific categories.
   */
  grant: (categories: ConsentCategory[]) => Promise<void>;

  /**
   * Denies consent for specific categories (withdraws).
   */
  deny: (categories: ConsentCategory[]) => Promise<void>;

  /**
   * Grants all categories.
   */
  grantAll: () => Promise<void>;

  /**
   * Denies all except necessary.
   */
  denyAll: () => Promise<void>;

  /**
   * Closes the banner without making changes (if allowed).
   */
  close: () => void;
}

```

---

### consent-manager.test.ts

**Path:** `tests\consent-manager.test.ts`

**Language:** TypeScript

```typescript
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

```

---

### gate.test.ts

**Path:** `tests\gate.test.ts`

**Language:** TypeScript

```typescript
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

```

---

### server.test.ts

**Path:** `tests\server.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getConsentFromHeaders,
  hasConsentFromHeaders,
  getConsentChoicesFromHeaders,
  isGpcEnabledFromHeaders,
  applyGpcOverrides,
  buildConsentCookieHeader,
  DEFAULT_CONSENT_COOKIE_NAME,
  ConsentHeaders,
  ConsentCookieOptions
} from '../src/server';
import { CONSENT_CATEGORIES } from '../src/categories';

describe('Server-side Consent Resolution', () => {
  const validConsentRecord = {
    choices: {
      [CONSENT_CATEGORIES.NECESSARY]: true,
      [CONSENT_CATEGORIES.ANALYTICS]: true,
      [CONSENT_CATEGORIES.MARKETING]: false,
      [CONSENT_CATEGORIES.FUNCTIONAL]: true,
    },
    updatedAt: Date.now(),
    expiresAt: Date.now() + 86400000, // 24 hours from now
    gpcApplied: false,
  };

  const expiredConsentRecord = {
    ...validConsentRecord,
    expiresAt: Date.now() - 86400000, // 24 hours ago
  };

  describe('getConsentFromHeaders', () => {
    it('should parse valid consent cookie from headers', () => {
      const headers: ConsentHeaders = {
        cookie: `${DEFAULT_CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(validConsentRecord))}`,
      };

      const result = getConsentFromHeaders(headers);
      expect(result).toEqual(validConsentRecord);
    });

    it('should return null when no cookie header is present', () => {
      const headers: ConsentHeaders = {};
      const result = getConsentFromHeaders(headers);
      expect(result).toBeNull();
    });

    it('should return null when consent cookie is not found', () => {
      const headers: ConsentHeaders = {
        cookie: 'other_cookie=value',
      };
      const result = getConsentFromHeaders(headers);
      expect(result).toBeNull();
    });

    it('should return null for expired consent records', () => {
      const headers: ConsentHeaders = {
        cookie: `${DEFAULT_CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(expiredConsentRecord))}`,
      };
      const result = getConsentFromHeaders(headers);
      expect(result).toBeNull();
    });

    it('should return null for malformed JSON', () => {
      const headers: ConsentHeaders = {
        cookie: `${DEFAULT_CONSENT_COOKIE_NAME}=invalid_json`,
      };
      const result = getConsentFromHeaders(headers);
      expect(result).toBeNull();
    });

    it('should return null for invalid consent record structure', () => {
      const invalidRecord = { invalid: 'structure' };
      const headers: ConsentHeaders = {
        cookie: `${DEFAULT_CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(invalidRecord))}`,
      };
      const result = getConsentFromHeaders(headers);
      expect(result).toBeNull();
    });

    it('should work with custom cookie name', () => {
      const customCookieName = 'custom_consent';
      const headers: ConsentHeaders = {
        cookie: `${customCookieName}=${encodeURIComponent(JSON.stringify(validConsentRecord))}`,
      };
      const options: ConsentCookieOptions = { cookieName: customCookieName };
      
      const result = getConsentFromHeaders(headers, options);
      expect(result).toEqual(validConsentRecord);
    });

    it('should ensure necessary category is always true', () => {
      const invalidConsentRecord = {
        ...validConsentRecord,
        choices: {
          ...validConsentRecord.choices,
          [CONSENT_CATEGORIES.NECESSARY]: false,
        },
      };
      const headers: ConsentHeaders = {
        cookie: `${DEFAULT_CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(invalidConsentRecord))}`,
      };

      const result = getConsentFromHeaders(headers);
      expect(result?.choices[CONSENT_CATEGORIES.NECESSARY]).toBe(true);
    });

    it('should handle multiple cookies correctly', () => {
      const headers: ConsentHeaders = {
        cookie: `session_id=abc123; ${DEFAULT_CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(validConsentRecord))}; theme=dark`,
      };
      const result = getConsentFromHeaders(headers);
      expect(result).toEqual(validConsentRecord);
    });
  });

  describe('hasConsentFromHeaders', () => {
    it('should return true for granted consent category', () => {
      const headers: ConsentHeaders = {
        cookie: `${DEFAULT_CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(validConsentRecord))}`,
      };
      const result = hasConsentFromHeaders(headers, CONSENT_CATEGORIES.ANALYTICS);
      expect(result).toBe(true);
    });

    it('should return false for denied consent category', () => {
      const headers: ConsentHeaders = {
        cookie: `${DEFAULT_CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(validConsentRecord))}`,
      };
      const result = hasConsentFromHeaders(headers, CONSENT_CATEGORIES.MARKETING);
      expect(result).toBe(false);
    });

    it('should return true for necessary category when no consent record exists', () => {
      const headers: ConsentHeaders = {};
      const result = hasConsentFromHeaders(headers, CONSENT_CATEGORIES.NECESSARY);
      expect(result).toBe(true);
    });

    it('should return false for non-necessary category when no consent record exists', () => {
      const headers: ConsentHeaders = {};
      const result = hasConsentFromHeaders(headers, CONSENT_CATEGORIES.ANALYTICS);
      expect(result).toBe(false);
    });
  });

  describe('getConsentChoicesFromHeaders', () => {
    it('should return consent choices from valid record', () => {
      const headers: ConsentHeaders = {
        cookie: `${DEFAULT_CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(validConsentRecord))}`,
      };
      const result = getConsentChoicesFromHeaders(headers);
      expect(result).toEqual(validConsentRecord.choices);
    });

    it('should return default choices when no consent record exists', () => {
      const headers: ConsentHeaders = {};
      const result = getConsentChoicesFromHeaders(headers);
      expect(result).toEqual({
        [CONSENT_CATEGORIES.NECESSARY]: true,
        [CONSENT_CATEGORIES.ANALYTICS]: false,
        [CONSENT_CATEGORIES.MARKETING]: false,
        [CONSENT_CATEGORIES.FUNCTIONAL]: false,
      });
    });
  });

  describe('isGpcEnabledFromHeaders', () => {
    it('should return true when Sec-GPC header is 1', () => {
      const headers: ConsentHeaders = { 'sec-gpc': '1' };
      expect(isGpcEnabledFromHeaders(headers)).toBe(true);
    });

    it('should return true when DNT header is 1', () => {
      const headers: ConsentHeaders = { dnt: '1' };
      expect(isGpcEnabledFromHeaders(headers)).toBe(true);
    });

    it('should return false when neither GPC nor DNT headers are present', () => {
      const headers: ConsentHeaders = {};
      expect(isGpcEnabledFromHeaders(headers)).toBe(false);
    });

    it('should return false when headers are present but not set to 1', () => {
      const headers: ConsentHeaders = { 'sec-gpc': '0', dnt: '0' };
      expect(isGpcEnabledFromHeaders(headers)).toBe(false);
    });
  });

  describe('applyGpcOverrides', () => {
    it('should force analytics and marketing to false when GPC is enabled', () => {
      const choices = {
        [CONSENT_CATEGORIES.NECESSARY]: true,
        [CONSENT_CATEGORIES.ANALYTICS]: true,
        [CONSENT_CATEGORIES.MARKETING]: true,
        [CONSENT_CATEGORIES.FUNCTIONAL]: true,
      };
      const headers: ConsentHeaders = { 'sec-gpc': '1' };
      
      const result = applyGpcOverrides(choices, headers);
      expect(result).toEqual({
        [CONSENT_CATEGORIES.NECESSARY]: true,
        [CONSENT_CATEGORIES.ANALYTICS]: false,
        [CONSENT_CATEGORIES.MARKETING]: false,
        [CONSENT_CATEGORIES.FUNCTIONAL]: true,
      });
    });

    it('should not modify choices when GPC is not enabled', () => {
      const choices = {
        [CONSENT_CATEGORIES.NECESSARY]: true,
        [CONSENT_CATEGORIES.ANALYTICS]: true,
        [CONSENT_CATEGORIES.MARKETING]: false,
        [CONSENT_CATEGORIES.FUNCTIONAL]: true,
      };
      const headers: ConsentHeaders = {};
      
      const result = applyGpcOverrides(choices, headers);
      expect(result).toEqual(choices);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty cookie header', () => {
      const headers: ConsentHeaders = { cookie: '' };
      const result = getConsentFromHeaders(headers);
      expect(result).toBeNull();
    });

    it('should handle cookie header with only whitespace', () => {
      const headers: ConsentHeaders = { cookie: '   ' };
      const result = getConsentFromHeaders(headers);
      expect(result).toBeNull();
    });

    it('should handle malformed cookie entries', () => {
      const headers: ConsentHeaders = {
        cookie: `invalid_cookie; ${DEFAULT_CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(validConsentRecord))}`,
      };
      const result = getConsentFromHeaders(headers);
      expect(result).toEqual(validConsentRecord);
    });

    it('should handle consent record with missing categories', () => {
      const incompleteRecord = {
        choices: {
          [CONSENT_CATEGORIES.NECESSARY]: true,
          [CONSENT_CATEGORIES.ANALYTICS]: true,
        },
        updatedAt: Date.now(),
        expiresAt: Date.now() + 86400000,
        gpcApplied: false,
      };
      const headers: ConsentHeaders = {
        cookie: `${DEFAULT_CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(incompleteRecord))}`,
      };
      const result = getConsentFromHeaders(headers);
      expect(result).toBeNull(); // Should fail validation
    });
  });

  describe('buildConsentCookieHeader', () => {
    const mockSignedPayload = 'encoded_json.hmac_signature';

    it('should build a basic secure cookie header', () => {
      const header = buildConsentCookieHeader(mockSignedPayload);
      
      expect(header).toContain(`${DEFAULT_CONSENT_COOKIE_NAME}=${mockSignedPayload}`);
      expect(header).toContain('Secure');
      expect(header).toContain('SameSite=Lax');
      expect(header).toContain('Path=/');
      expect(header.split('; ').length).toBe(4); // name+value + 3 security attributes
    });

    it('should include custom cookie name when provided', () => {
      const customName = 'custom_consent';
      const header = buildConsentCookieHeader(mockSignedPayload, {
        cookieName: customName
      });
      
      expect(header).toContain(`${customName}=${mockSignedPayload}`);
      expect(header).toContain('Secure');
      expect(header).toContain('SameSite=Lax');
      expect(header).toContain('Path=/');
    });

    it('should include Max-Age when provided', () => {
      const maxAge = 86400; // 1 day in seconds
      const header = buildConsentCookieHeader(mockSignedPayload, {
        maxAge
      });
      
      expect(header).toContain(`Max-Age=${maxAge}`);
      expect(header.split('; ').length).toBe(5); // name+value + 3 security + max-age
    });

    it('should include Expires when provided', () => {
      const expires = new Date('2026-12-31T23:59:59Z');
      const header = buildConsentCookieHeader(mockSignedPayload, {
        expires
      });
      
      expect(header).toContain(`Expires=${expires.toUTCString()}`);
      expect(header.split('; ').length).toBe(5); // name+value + 3 security + expires
    });

    it('should include Domain when provided', () => {
      const domain = '.example.com';
      const header = buildConsentCookieHeader(mockSignedPayload, {
        domain
      });
      
      expect(header).toContain(`Domain=${domain}`);
      expect(header.split('; ').length).toBe(5); // name+value + 3 security + domain
    });

    it('should include all optional attributes when provided', () => {
      const maxAge = 31536000; // 1 year in seconds
      const expires = new Date('2026-12-31T23:59:59Z');
      const domain = '.example.com';
      
      const header = buildConsentCookieHeader(mockSignedPayload, {
        maxAge,
        expires,
        domain
      });
      
      expect(header).toContain(`${DEFAULT_CONSENT_COOKIE_NAME}=${mockSignedPayload}`);
      expect(header).toContain('Secure');
      expect(header).toContain('SameSite=Lax');
      expect(header).toContain('Path=/');
      expect(header).toContain(`Max-Age=${maxAge}`);
      expect(header).toContain(`Expires=${expires.toUTCString()}`);
      expect(header).toContain(`Domain=${domain}`);
      expect(header.split('; ').length).toBe(7); // name+value + 3 security + 3 optional
    });

    it('should always include security attributes regardless of options', () => {
      const header = buildConsentCookieHeader(mockSignedPayload, {
        maxAge: 123,
        expires: new Date(),
        domain: 'test.com'
      });
      
      expect(header).toContain('Secure');
      expect(header).toContain('SameSite=Lax');
      expect(header).toContain('Path=/');
    });

    it('should handle empty options object', () => {
      const header = buildConsentCookieHeader(mockSignedPayload, {});
      
      expect(header).toContain(`${DEFAULT_CONSENT_COOKIE_NAME}=${mockSignedPayload}`);
      expect(header).toContain('Secure');
      expect(header).toContain('SameSite=Lax');
      expect(header).toContain('Path=/');
      expect(header.split('; ').length).toBe(4);
    });

    it('should maintain proper attribute order', () => {
      const header = buildConsentCookieHeader(mockSignedPayload, {
        maxAge: 86400,
        expires: new Date('2026-12-31T23:59:59Z'),
        domain: '.example.com'
      });
      
      const parts = header.split('; ');
      expect(parts[0]).toBe(`${DEFAULT_CONSENT_COOKIE_NAME}=${mockSignedPayload}`);
      expect(parts[1]).toBe('Secure');
      expect(parts[2]).toBe('SameSite=Lax');
      expect(parts[3]).toBe('Path=/');
      // Optional attributes follow in the order they were added
      expect(parts).toContain('Max-Age=86400');
      expect(parts).toContain('Expires=Thu, 31 Dec 2026 23:59:59 GMT');
      expect(parts).toContain('Domain=.example.com');
    });
  });
});

```

---

### tsup.config.ts

**Path:** `tsup.config.ts`

**Language:** TypeScript

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  external: ['react'],
});

```

---

