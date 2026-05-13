/**
 * Tests for authentication module
 * 
 * Tests the unified authentication pipeline and request handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authenticateRequest, quickAuthCheck, createAuthMiddleware } from '../src/authenticate';
import type { AuthenticationRequest, AuthenticationResult } from '../src/authenticate';

// Mock the session verification
vi.mock('../src/session', () => ({
  verifySession: vi.fn(),
  checkSessionExists: vi.fn(),
}));

describe('Authentication Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should authenticate with cookie successfully', async () => {
    const { verifySession } = await import('../src/session');
    vi.mocked(verifySession).mockResolvedValue({
      valid: true,
      session: {
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        email: 'user@example.com',
        role: 'user',
        permissions: ['read'],
        mfaVerified: true,
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        expiresAt: new Date(),
        createdAt: new Date(),
        lastAccessAt: new Date(),
      },
    });

    const request: AuthenticationRequest = {
      cookie: '__Host-session=test-session-token',
      userAgent: 'Mozilla/5.0',
      ip: '192.168.1.1',
    };

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(true);
    expect(result.method).toBe('cookie');
    expect(result.session).toBeDefined();
  });

  it('should authenticate with bearer token successfully', async () => {
    const { verifySession } = await import('../src/session');
    vi.mocked(verifySession).mockResolvedValue({
      valid: true,
      session: {
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        email: 'user@example.com',
        role: 'user',
        permissions: ['read'],
        mfaVerified: true,
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        expiresAt: new Date(),
        createdAt: new Date(),
        lastAccessAt: new Date(),
      },
    });

    const request: AuthenticationRequest = {
      authorization: 'Bearer test-bearer-token',
      userAgent: 'Mozilla/5.0',
      ip: '192.168.1.1',
    };

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(true);
    expect(result.method).toBe('bearer');
    expect(result.session).toBeDefined();
  });

  it('should handle API key authentication (placeholder)', async () => {
    const request: AuthenticationRequest = {
      xApiKey: 'firm_testapikey123',
      userAgent: 'Mozilla/5.0',
      ip: '192.168.1.1',
    };

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(false);
    expect(result.error).toBe('invalid_api_key');
  });

  it('should return no credentials error when no auth provided', async () => {
    const request: AuthenticationRequest = {
      userAgent: 'Mozilla/5.0',
      ip: '192.168.1.1',
    };

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(false);
    expect(result.error).toBe('no_credentials');
  });

  it('should handle invalid cookie format', async () => {
    const request: AuthenticationRequest = {
      cookie: 'invalid-cookie-format',
    };

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(false);
    expect(result.error).toBe('invalid_token');
  });

  it('should handle invalid bearer token format', async () => {
    const request: AuthenticationRequest = {
      authorization: 'Invalid token',
    };

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(false);
    expect(result.error).toBe('invalid_token');
  });

  it('should prioritize cookie over bearer token', async () => {
    const { verifySession } = await import('../src/session');
    vi.mocked(verifySession).mockResolvedValue({
      valid: true,
      session: {
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        email: 'user@example.com',
        role: 'user',
        permissions: ['read'],
        mfaVerified: true,
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        expiresAt: new Date(),
        createdAt: new Date(),
        lastAccessAt: new Date(),
      },
    });

    const request: AuthenticationRequest = {
      cookie: '__Host-session=test-session-token',
      authorization: 'Bearer other-token',
    };

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(true);
    expect(result.method).toBe('cookie');
  });
});

describe('Quick Auth Check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true for valid cookie session', async () => {
    const { checkSessionExists } = await import('../src/session');
    vi.mocked(checkSessionExists).mockResolvedValue(true);

    const request: AuthenticationRequest = {
      cookie: '__Host-session=test-session-token',
    };

    const result = await quickAuthCheck(request);

    expect(result.authenticated).toBe(true);
    expect(result.method).toBe('cookie');
  });

  it('should return true for valid bearer token', async () => {
    const { checkSessionExists } = await import('../src/session');
    vi.mocked(checkSessionExists).mockResolvedValue(true);

    const request: AuthenticationRequest = {
      authorization: 'Bearer test-token',
    };

    const result = await quickAuthCheck(request);

    expect(result.authenticated).toBe(true);
    expect(result.method).toBe('bearer');
  });

  it('should return false for no credentials', async () => {
    const request: AuthenticationRequest = {};

    const result = await quickAuthCheck(request);

    expect(result.authenticated).toBe(false);
  });
});

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should skip authentication for health endpoints', async () => {
    const middleware = createAuthMiddleware({
      skipPaths: ['/health', '/api/health'],
    });

    const request: AuthenticationRequest = {
      path: '/health',
      method: 'GET',
    };

    const next = vi.fn();
    const result = await middleware(request, next);

    expect(result.authenticated).toBe(true);
    expect(next).toHaveBeenCalled();
  });

  it('should require authentication for protected endpoints', async () => {
    const { verifySession } = await import('../src/session');
    vi.mocked(verifySession).mockResolvedValue({
      valid: false,
      error: 'invalid',
    });

    const middleware = createAuthMiddleware({
      requireAuth: true,
    });

    const request: AuthenticationRequest = {
      path: '/protected',
      method: 'GET',
      cookie: '__Host-session=invalid-token',
    };

    const next = vi.fn();
    const result = await middleware(request, next);

    expect(result.authenticated).toBe(false);
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow authentication when not required', async () => {
    const middleware = createAuthMiddleware({
      requireAuth: false,
    });

    const request: AuthenticationRequest = {
      path: '/public',
      method: 'GET',
    };

    const next = vi.fn();
    const result = await middleware(request, next);

    expect(result.authenticated).toBe(false); // No auth provided but not required
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle unsupported HTTP methods', async () => {
    const middleware = createAuthMiddleware({
      allowedMethods: ['GET', 'POST'],
    });

    const request: AuthenticationRequest = {
      path: '/test',
      method: 'PATCH',
    };

    const next = vi.fn();
    const result = await middleware(request, next);

    expect(result.authenticated).toBe(false);
    expect((result as any).error).toBe('method_not_allowed');
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() on successful authentication', async () => {
    const { verifySession } = await import('../src/session');
    vi.mocked(verifySession).mockResolvedValue({
      valid: true,
      session: {
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        email: 'user@example.com',
        role: 'user',
        permissions: ['read'],
        mfaVerified: true,
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        expiresAt: new Date(),
        createdAt: new Date(),
        lastAccessAt: new Date(),
      },
    });

    const middleware = createAuthMiddleware({
      requireAuth: true,
    });

    const request: AuthenticationRequest = {
      path: '/protected',
      method: 'GET',
      cookie: '__Host-session=valid-token',
    };

    const next = vi.fn();
    const result = await middleware(request, next);

    expect(result.authenticated).toBe(true);
    expect(next).toHaveBeenCalled();
  });
});
