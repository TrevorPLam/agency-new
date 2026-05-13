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
