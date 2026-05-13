import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readinessProbe } from '../src/probes/readiness.js';
import type { HealthCheck } from '../src/types.js';

describe('readinessProbe', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should return healthy when all checks pass', async () => {
    const mockCheck: HealthCheck = {
      name: 'test-check',
      timeoutMs: 1000,
      check: vi.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: new Date(),
        duration: 10,
        message: 'All good'
      })
    };

    const result = await readinessProbe([mockCheck]);

    expect(result.status).toBe('healthy');
    expect(result.message).toBe('All dependencies healthy');
    expect(result.details?.totalChecks).toBe(1);
    expect(result.details?.healthy).toBe(1);
    expect(result.details?.degraded).toBe(0);
    expect(result.details?.unhealthy).toBe(0);
  });

  it('should return unhealthy when any check fails', async () => {
    const mockCheck: HealthCheck = {
      name: 'failing-check',
      timeoutMs: 1000,
      check: vi.fn().mockResolvedValue({
        status: 'unhealthy',
        timestamp: new Date(),
        duration: 10,
        message: 'Connection failed'
      })
    };

    const result = await readinessProbe([mockCheck]);

    expect(result.status).toBe('unhealthy');
    expect(result.message).toBe('1 dependencies unhealthy');
    expect(result.details?.unhealthy).toBe(1);
  });

  it('should return degraded when any check is degraded', async () => {
    const mockCheck: HealthCheck = {
      name: 'slow-check',
      timeoutMs: 1000,
      check: vi.fn().mockResolvedValue({
        status: 'degraded',
        timestamp: new Date(),
        duration: 10,
        message: 'Slow response'
      })
    };

    const result = await readinessProbe([mockCheck]);

    expect(result.status).toBe('degraded');
    expect(result.message).toBe('1 dependencies degraded');
    expect(result.details?.degraded).toBe(1);
  });

  it('should handle multiple checks with mixed results', async () => {
    const mockChecks: HealthCheck[] = [
      {
        name: 'healthy-check',
        timeoutMs: 1000,
        check: vi.fn().mockResolvedValue({
          status: 'healthy',
          timestamp: new Date(),
          duration: 10
        })
      },
      {
        name: 'degraded-check',
        timeoutMs: 1000,
        check: vi.fn().mockResolvedValue({
          status: 'degraded',
          timestamp: new Date(),
          duration: 10
        })
      },
      {
        name: 'unhealthy-check',
        timeoutMs: 1000,
        check: vi.fn().mockResolvedValue({
          status: 'unhealthy',
          timestamp: new Date(),
          duration: 10
        })
      }
    ];

    const result = await readinessProbe(mockChecks);

    expect(result.status).toBe('unhealthy'); // Unhealthy takes precedence
    expect(result.details?.totalChecks).toBe(3);
    expect(result.details?.healthy).toBe(1);
    expect(result.details?.degraded).toBe(1);
    expect(result.details?.unhealthy).toBe(1);
  });

  it('should timeout individual checks that take too long', async () => {
    const slowCheck: HealthCheck = {
      name: 'slow-check',
      timeoutMs: 100,
      check: vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      )
    };

    const promise = readinessProbe([slowCheck]);
    vi.advanceTimersByTime(100);
    
    const result = await promise;

    expect(result.status).toBe('unhealthy');
    expect(result.details?.unhealthy).toBe(1);
    expect(result.details?.checks['slow-check'].message).toContain('timed out');
  });

  it('should timeout overall probe when it takes too long', async () => {
    const slowCheck: HealthCheck = {
      name: 'slow-check',
      timeoutMs: 10000,
      check: vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      )
    };

    const promise = readinessProbe([slowCheck], 100);
    vi.advanceTimersByTime(100);
    
    const result = await promise;

    expect(result.status).toBe('unhealthy');
    expect(result.message).toBe('Readiness probe timed out');
  });

  it('should run checks in parallel', async () => {
    const check1: HealthCheck = {
      name: 'check1',
      timeoutMs: 1000,
      check: vi.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: new Date(),
        duration: 10
      })
    };

    const check2: HealthCheck = {
      name: 'check2',
      timeoutMs: 1000,
      check: vi.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: new Date(),
        duration: 10
      })
    };

    await readinessProbe([check1, check2]);

    expect(check1.check).toHaveBeenCalled();
    expect(check2.check).toHaveBeenCalled();
  });
});
