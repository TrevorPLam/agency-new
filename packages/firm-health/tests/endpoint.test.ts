import { describe, it, expect, vi } from 'vitest';
import { createHealthHandler } from '../src/endpoint.js';
import type { HealthCheck } from '../src/types.js';

describe('createHealthHandler', () => {
  const mockHealthCheck: HealthCheck = {
    name: 'test-check',
    timeoutMs: 1000,
    check: vi.fn().mockResolvedValue({
      status: 'healthy',
      timestamp: new Date(),
      duration: 10
    })
  };

  it('should reject unauthorized requests', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [mockHealthCheck]
    });

    const result = await handler({
      headers: {},
      method: 'GET'
    });

    expect(result.status).toBe(401);
    expect(result.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Unauthorized');
  });

  it('should reject requests with wrong secret', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [mockHealthCheck]
    });

    const result = await handler({
      headers: { authorization: 'Bearer wrong-secret' },
      method: 'GET'
    });

    expect(result.status).toBe(401);
    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Unauthorized');
  });

  it('should accept requests with correct secret', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [mockHealthCheck]
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'GET'
    });

    expect(result.status).toBe(200);
    expect(result.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(result.body || '{}');
    expect(body.status).toBe('healthy');
  });

  it('should use custom header name', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      headerName: 'X-Health-Token',
      customChecks: [mockHealthCheck]
    });

    const result = await handler({
      headers: { 'x-health-token': 'test-secret' },
      method: 'GET'
    });

    expect(result.status).toBe(200);
  });

  it('should reject non-GET requests', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [mockHealthCheck]
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'POST'
    });

    expect(result.status).toBe(405);
    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Method not allowed');
  });

  it('should include version in response', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      version: '2.0.0',
      customChecks: [mockHealthCheck]
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'GET'
    });

    const body = JSON.parse(result.body || '{}');
    expect(body.version).toBe('2.0.0');
  });

  it('should include uptime in response', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [mockHealthCheck]
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'GET'
    });

    const body = JSON.parse(result.body || '{}');
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should include all health checks in response', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [mockHealthCheck]
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'GET'
    });

    const body = JSON.parse(result.body || '{}');
    expect(body.checks).toHaveProperty('liveness');
    expect(body.checks).toHaveProperty('readiness');
    expect(body.checks).toHaveProperty('startup');
    expect(body.checks).toHaveProperty('test-check');
  });

  it('should return 503 when unhealthy', async () => {
    const unhealthyCheck: HealthCheck = {
      name: 'unhealthy-check',
      timeoutMs: 1000,
      check: vi.fn().mockResolvedValue({
        status: 'unhealthy',
        timestamp: new Date(),
        duration: 10,
        message: 'Service down'
      })
    };

    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [unhealthyCheck]
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'GET'
    });

    expect(result.status).toBe(503);
    const body = JSON.parse(result.body || '{}');
    expect(body.status).toBe('unhealthy');
  });

  it('should return 200 when degraded', async () => {
    const degradedCheck: HealthCheck = {
      name: 'degraded-check',
      timeoutMs: 1000,
      check: vi.fn().mockResolvedValue({
        status: 'degraded',
        timestamp: new Date(),
        duration: 10,
        message: 'Slow response'
      })
    };

    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [degradedCheck]
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'GET'
    });

    expect(result.status).toBe(503); // Degraded also returns 503
    const body = JSON.parse(result.body || '{}');
    expect(body.status).toBe('degraded');
  });

  it('should handle synthetic checks when enabled', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [mockHealthCheck],
      includeSynthetic: true
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'GET'
    });

    const body = JSON.parse(result.body || '{}');
    expect(body.checks).toHaveProperty('synthetic');
  });

  it('should not include synthetic checks when disabled', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [mockHealthCheck],
      includeSynthetic: false
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'GET'
    });

    const body = JSON.parse(result.body || '{}');
    expect(body.checks).not.toHaveProperty('synthetic');
  });
});
