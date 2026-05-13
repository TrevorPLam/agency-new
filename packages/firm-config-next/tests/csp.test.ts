import { describe, it, expect } from 'vitest';
import { createNextConfig } from '../src/index';
import { createSecurityHeaders } from '../src/security-headers';
import { createCSPValue } from '../src/csp';

describe('CSP Security Configuration', () => {
  describe('createNextConfig', () => {
    it('should not include unsafe-inline or unsafe-eval in script-src CSP', async () => {
      const config = createNextConfig({ enableCSP: true });
      const headers = await config.headers!();
      const cspHeader = headers[0].headers.find((h: any) => h.key === 'Content-Security-Policy');
      
      expect(cspHeader).toBeDefined();
      expect(cspHeader!.value).not.toContain('unsafe-inline');
      expect(cspHeader!.value).not.toContain('unsafe-eval');
      expect(cspHeader!.value).toContain('strict-dynamic');
    });

    it('should include nonce placeholder in script-src CSP', async () => {
      const config = createNextConfig({ enableCSP: true });
      const headers = await config.headers!();
      const cspHeader = headers[0].headers.find((h: any) => h.key === 'Content-Security-Policy');
      
      expect(cspHeader!.value).toContain("'nonce-${nonce}'");
    });
  });

  describe('createSecurityHeaders', () => {
    it('should not include unsafe-inline or unsafe-eval in script-src CSP', () => {
      const headers = createSecurityHeaders({ enableCSP: true });
      const cspHeader = headers.find(h => h.key === 'Content-Security-Policy');
      
      expect(cspHeader).toBeDefined();
      expect(cspHeader!.value).not.toContain('unsafe-inline');
      expect(cspHeader!.value).not.toContain('unsafe-eval');
      expect(cspHeader!.value).toContain('strict-dynamic');
    });

    it('should include nonce placeholder in script-src CSP', () => {
      const headers = createSecurityHeaders({ enableCSP: true });
      const cspHeader = headers.find(h => h.key === 'Content-Security-Policy');
      
      expect(cspHeader!.value).toContain("'nonce-${nonce}'");
    });
  });

  describe('createCSPValue', () => {
    it('should not include unsafe-inline or unsafe-eval in script-src directive', () => {
      const cspValue = createCSPValue({ nonce: 'test-nonce' });
      
      expect(cspValue).not.toContain('unsafe-inline');
      expect(cspValue).not.toContain('unsafe-eval');
      expect(cspValue).toContain('strict-dynamic');
    });

    it('should include nonce in script-src directive', () => {
      const cspValue = createCSPValue({ nonce: 'test-nonce' });
      
      expect(cspValue).toContain('nonce-test-nonce');
    });

    it('should handle custom directives without unsafe sources', () => {
      const cspValue = createCSPValue({
        nonce: 'test-nonce',
        customDirectives: {
          'script-src': ["'self'", 'https://trusted.cdn.com']
        }
      });
      
      expect(cspValue).not.toContain('unsafe-inline');
      expect(cspValue).not.toContain('unsafe-eval');
      expect(cspValue).toContain('strict-dynamic');
    });

    it('should include custom directives but still contain strict-dynamic', () => {
      const cspValue = createCSPValue({
        nonce: 'test-nonce',
        customDirectives: {
          'script-src': ["'self'", 'https://trusted.cdn.com']
        }
      });
      
      expect(cspValue).toContain('strict-dynamic');
      expect(cspValue).toContain('https://trusted.cdn.com');
    });
  });

  describe('CSP Directive Validation', () => {
    it('should validate that script-src contains required security sources', () => {
      const cspValue = createCSPValue({ nonce: 'test-nonce' });
      
      // Should contain self, nonce, and strict-dynamic
      expect(cspValue).toContain("'self'");
      expect(cspValue).toContain('nonce-test-nonce');
      expect(cspValue).toContain('strict-dynamic');
      
      // Should not contain unsafe sources
      expect(cspValue).not.toContain('unsafe-inline');
      expect(cspValue).not.toContain('unsafe-eval');
      expect(cspValue).not.toContain('data:');
    });

    it('should maintain style-src with unsafe-inline for CSS compatibility', () => {
      const cspValue = createCSPValue({ nonce: 'test-nonce' });
      
      // Style-src can still use unsafe-inline for CSS compatibility
      expect(cspValue).toContain('nonce-test-nonce');
    });
  });
});
