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
