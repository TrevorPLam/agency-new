import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  startupProbe, 
  markBootstrapped, 
  markBootstrapFailed, 
  resetBootstrapState 
} from '../src/probes/startup.js';

describe('startupProbe', () => {
  beforeEach(() => {
    resetBootstrapState();
    vi.useFakeTimers();
  });

  afterEach(() => {
    resetBootstrapState();
    vi.useRealTimers();
  });

  it('should return unhealthy when not bootstrapped', async () => {
    const result = await startupProbe();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toBe('Application not bootstrapped');
    expect(result.details?.isBootstrapped).toBe(false);
  });

  it('should return healthy when bootstrapped', async () => {
    markBootstrapped();
    
    const result = await startupProbe();

    expect(result.status).toBe('healthy');
    expect(result.message).toBe('Application bootstrapped successfully');
    expect(result.details?.isBootstrapped).toBe(true);
    expect(result.details?.bootstrapTime).toBeInstanceOf(Date);
  });

  it('should return unhealthy when bootstrap failed', async () => {
    const error = new Error('Database connection failed');
    markBootstrapFailed(error);
    
    const result = await startupProbe();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toBe('Bootstrap failed: Database connection failed');
    expect(result.details?.isBootstrapped).toBe(false);
    expect(result.details?.error).toContain('Database connection failed');
  });

  it('should include bootstrap duration in details', async () => {
    markBootstrapped();
    
    const result = await startupProbe();

    expect(result.details?.bootstrapDuration).toBeDefined();
    expect(typeof result.details?.bootstrapDuration).toBe('number');
  });

  it('should handle multiple bootstrap state changes', async () => {
    // Initial state
    let result = await startupProbe();
    expect(result.status).toBe('unhealthy');

    // Mark as failed
    markBootstrapFailed(new Error('Config error'));
    result = await startupProbe();
    expect(result.status).toBe('unhealthy');
    expect(result.message).toContain('Config error');

    // Mark as bootstrapped
    markBootstrapped();
    result = await startupProbe();
    expect(result.status).toBe('healthy');
    expect(result.message).toBe('Application bootstrapped successfully');
  });

  it('should include duration in result', async () => {
    markBootstrapped();
    
    const result = await startupProbe();

    expect(typeof result.duration).toBe('number');
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should have timestamp in result', async () => {
    markBootstrapped();
    
    const before = new Date();
    const result = await startupProbe();
    const after = new Date();

    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
