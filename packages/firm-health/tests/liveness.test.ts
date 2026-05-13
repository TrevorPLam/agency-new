import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { livenessProbe } from '../src/probes/liveness.js';

describe('livenessProbe', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return healthy when event loop is responsive', async () => {
    const result = await livenessProbe();

    expect(result.status).toBe('healthy');
    expect(result.message).toBe('Event loop responsive');
    expect(result.details).toHaveProperty('tickDuration');
    expect(result.details).toHaveProperty('uptime');
    expect(typeof result.details?.tickDuration).toBe('number');
    expect(result.details?.tickDuration).toBeLessThan(50);
  });

  it('should return degraded when event loop is slow', async () => {
    // Mock process.hrtime.bigint to simulate slow tick
    const mockHrtime = vi.fn();
    const slowTick = BigInt(60 * 1000000); // 60ms in nanoseconds
    
    mockHrtime.mockReturnValueOnce(BigInt(0));
    mockHrtime.mockReturnValueOnce(slowTick);
    
    const originalHrtime = global.process?.hrtime;
    if (global.process) {
      global.process.hrtime = { bigint: mockHrtime } as any;
    }

    const result = await livenessProbe();

    expect(result.status).toBe('degraded');
    expect(result.message).toContain('Event loop slow');
    expect(result.details?.tickDuration).toBe(60);

    // Restore original
    if (global.process && originalHrtime) {
      global.process.hrtime = originalHrtime;
    }
  });

  it('should return unhealthy when setImmediate times out', async () => {
    // Mock setImmediate to never call the callback
    const originalSetImmediate = global.setImmediate;
    global.setImmediate = vi.fn(() => {}) as any;

    // Advance timers to trigger timeout
    const promise = livenessProbe();
    vi.advanceTimersByTime(100);
    
    const result = await promise;

    expect(result.status).toBe('unhealthy');
    expect(result.message).toBe('Event loop unresponsive');

    // Restore original
    global.setImmediate = originalSetImmediate;
  });

  it('should include duration in result', async () => {
    const result = await livenessProbe();

    expect(typeof result.duration).toBe('number');
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should have timestamp in result', async () => {
    const before = new Date();
    const result = await livenessProbe();
    const after = new Date();

    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
