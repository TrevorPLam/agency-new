import { describe, it, expect } from 'vitest';
import { createNextConfig } from '../src/index';
import { createSecurityHeaders } from '../src/security-headers';

describe('Security Headers Configuration', () => {
  describe('createNextConfig', () => {
    it('should include basic security headers by default', async () => {
      const config = createNextConfig();
      const headers = await config.headers!();
      const headerItems = headers[0].headers;

      // Check for basic security headers
      expect(headerItems.some((h: any) => h.key === 'X-Content-Type-Options' && h.value === 'nosniff')).toBe(true);
      expect(headerItems.some((h: any) => h.key === 'X-Frame-Options' && h.value === 'DENY')).toBe(true);
      expect(headerItems.some((h: any) => h.key === 'X-XSS-Protection' && h.value === '1; mode=block')).toBe(true);
      expect(headerItems.some((h: any) => h.key === 'Referrer-Policy' && h.value === 'strict-origin-when-cross-origin')).toBe(true);
    });

    it('should include HSTS header when enabled', async () => {
      const config = createNextConfig({ enableHSTS: true });
      const headers = await config.headers!();
      const headerItems = headers[0].headers;

      expect(headerItems.some((h: any) => 
        h.key === 'Strict-Transport-Security' && 
        h.value === 'max-age=31536000; includeSubDomains; preload'
      )).toBe(true);
    });

    it('should not include HSTS header when disabled', async () => {
      const config = createNextConfig({ enableHSTS: false });
      const headers = await config.headers!();
      const headerItems = headers[0].headers;

      expect(headerItems.some((h: any) => h.key === 'Strict-Transport-Security')).toBe(false);
    });

    it('should include CSP header when enabled', async () => {
      const config = createNextConfig({ enableCSP: true });
      const headers = await config.headers!();
      const headerItems = headers[0].headers;

      expect(headerItems.some((h: any) => h.key === 'Content-Security-Policy')).toBe(true);
    });

    it('should not include CSP header when disabled', async () => {
      const config = createNextConfig({ enableCSP: false });
      const headers = await config.headers!();
      const headerItems = headers[0].headers;

      expect(headerItems.some((h: any) => h.key === 'Content-Security-Policy')).toBe(false);
    });

    it('should include Permissions-Policy header', async () => {
      const config = createNextConfig();
      const headers = await config.headers!();
      const headerItems = headers[0].headers;

      const permissionsHeader = headerItems.find((h: any) => h.key === 'Permissions-Policy');
      expect(permissionsHeader).toBeDefined();
      
      const policyValue = permissionsHeader!.value;
      expect(policyValue).toContain('camera=()');
      expect(policyValue).toContain('microphone=()');
      expect(policyValue).toContain('geolocation=()');
      expect(policyValue).toContain('payment=()');
      expect(policyValue).toContain('usb=()');
      expect(policyValue).toContain('magnetometer=()');
      expect(policyValue).toContain('gyroscope=()');
      expect(policyValue).toContain('accelerometer=()');
    });

    it('should merge custom headers', async () => {
      const customHeaders = [
        { key: 'X-Custom-Header', value: 'custom-value' },
        { key: 'X-Another-Header', value: 'another-value' }
      ];

      const config = createNextConfig({ customHeaders });
      const headers = await config.headers!();
      const headerItems = headers[0].headers;

      expect(headerItems.some((h: any) => h.key === 'X-Custom-Header' && h.value === 'custom-value')).toBe(true);
      expect(headerItems.some((h: any) => h.key === 'X-Another-Header' && h.value === 'another-value')).toBe(true);
    });

    it('should include both default and custom headers', async () => {
      const customHeaders = [
        { key: 'X-Custom-Header', value: 'custom-value' }
      ];

      const config = createNextConfig({ customHeaders });
      const headers = await config.headers!();
      const headerItems = headers[0].headers;

      // Should have default headers
      expect(headerItems.some((h: any) => h.key === 'X-Content-Type-Options' && h.value === 'nosniff')).toBe(true);
      
      // Should have custom headers
      expect(headerItems.some((h: any) => h.key === 'X-Custom-Header' && h.value === 'custom-value')).toBe(true);
    });
  });

  describe('createSecurityHeaders', () => {
    it('should return basic security headers by default', () => {
      const headers = createSecurityHeaders();

      expect(headers.some(h => h.key === 'X-Content-Type-Options' && h.value === 'nosniff')).toBe(true);
      expect(headers.some(h => h.key === 'X-Frame-Options' && h.value === 'DENY')).toBe(true);
      expect(headers.some(h => h.key === 'X-XSS-Protection' && h.value === '1; mode=block')).toBe(true);
      expect(headers.some(h => h.key === 'Referrer-Policy' && h.value === 'strict-origin-when-cross-origin')).toBe(true);
    });

    it('should include HSTS header when enabled', () => {
      const headers = createSecurityHeaders({ enableHSTS: true });

      expect(headers.some(h => 
        h.key === 'Strict-Transport-Security' && 
        h.value === 'max-age=31536000; includeSubDomains; preload'
      )).toBe(true);
    });

    it('should not include HSTS header when disabled', () => {
      const headers = createSecurityHeaders({ enableHSTS: false });

      expect(headers.some(h => h.key === 'Strict-Transport-Security')).toBe(false);
    });

    it('should include CSP header when enabled', () => {
      const headers = createSecurityHeaders({ enableCSP: true });

      expect(headers.some(h => h.key === 'Content-Security-Policy')).toBe(true);
    });

    it('should not include CSP header when disabled', () => {
      const headers = createSecurityHeaders({ enableCSP: false });

      expect(headers.some(h => h.key === 'Content-Security-Policy')).toBe(false);
    });

    it('should include Permissions-Policy header', () => {
      const headers = createSecurityHeaders();

      const permissionsHeader = headers.find(h => h.key === 'Permissions-Policy');
      expect(permissionsHeader).toBeDefined();
      
      const policyValue = permissionsHeader!.value;
      expect(policyValue).toContain('camera=()');
      expect(policyValue).toContain('microphone=()');
      expect(policyValue).toContain('geolocation=()');
    });

    it('should merge custom headers', () => {
      const customHeaders = [
        { key: 'X-Custom-Header', value: 'custom-value' }
      ];

      const headers = createSecurityHeaders({ customHeaders });

      expect(headers.some(h => h.key === 'X-Custom-Header' && h.value === 'custom-value')).toBe(true);
      expect(headers.some(h => h.key === 'X-Content-Type-Options' && h.value === 'nosniff')).toBe(true);
    });
  });

  describe('Security Header Values Validation', () => {
    it('should have correct HSTS values', async () => {
      const config = createNextConfig({ enableHSTS: true });
      const headers = await config.headers!();
      const hstsHeader = headers[0].headers.find((h: any) => h.key === 'Strict-Transport-Security');

      expect(hstsHeader!.value).toBe('max-age=31536000; includeSubDomains; preload');
    });

    it('should have correct X-Content-Type-Options value', async () => {
      const config = createNextConfig();
      const headers = await config.headers!();
      const header = headers[0].headers.find((h: any) => h.key === 'X-Content-Type-Options');

      expect(header!.value).toBe('nosniff');
    });

    it('should have correct X-Frame-Options value', async () => {
      const config = createNextConfig();
      const headers = await config.headers!();
      const header = headers[0].headers.find((h: any) => h.key === 'X-Frame-Options');

      expect(header!.value).toBe('DENY');
    });

    it('should have correct X-XSS-Protection value', async () => {
      const config = createNextConfig();
      const headers = await config.headers!();
      const header = headers[0].headers.find((h: any) => h.key === 'X-XSS-Protection');

      expect(header!.value).toBe('1; mode=block');
    });

    it('should have correct Referrer-Policy value', async () => {
      const config = createNextConfig();
      const headers = await config.headers!();
      const header = headers[0].headers.find((h: any) => h.key === 'Referrer-Policy');

      expect(header!.value).toBe('strict-origin-when-cross-origin');
    });
  });
});
