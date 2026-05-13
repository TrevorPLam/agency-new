import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  SyntheticCheckManager, 
  syntheticCheckManager, 
  registerSyntheticCheck, 
  runSyntheticChecks,
  getSyntheticChecks
} from '../src/probes/synthetic.js';
import type { SyntheticCheck, HealthCheckResult } from '../src/types.js';

describe('SyntheticCheckManager', () => {
  let manager: SyntheticCheckManager;

  beforeEach(() => {
    manager = new SyntheticCheckManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('registerCheck', () => {
    it('should register a synthetic check', () => {
      const check: SyntheticCheck = {
        name: 'test-check',
        timeoutMs: 1000,
        enabled: true,
        check: vi.fn().mockResolvedValue({
          status: 'healthy',
          timestamp: new Date(),
          duration: 10
        })
      };

      manager.registerCheck(check);
      const checks = manager.getChecks();

      expect(checks).toHaveLength(1);
      expect(checks[0].name).toBe('test-check');
      expect(checks[0].runCount).toBe(0);
    });

    it('should allow multiple checks with same name (overwrite)', () => {
      const check1: SyntheticCheck = {
        name: 'test-check',
        timeoutMs: 1000,
        enabled: true,
        check: vi.fn()
      };

      const check2: SyntheticCheck = {
        name: 'test-check',
        timeoutMs: 2000,
        enabled: false,
        check: vi.fn()
      };

      manager.registerCheck(check1);
      manager.registerCheck(check2);
      
      const checks = manager.getChecks();
      expect(checks).toHaveLength(1);
      expect(checks[0].timeoutMs).toBe(2000);
      expect(checks[0].enabled).toBe(false);
    });
  });

  describe('unregisterCheck', () => {
    it('should unregister a synthetic check', () => {
      const check: SyntheticCheck = {
        name: 'test-check',
        timeoutMs: 1000,
        enabled: true,
        check: vi.fn()
      };

      manager.registerCheck(check);
      expect(manager.getChecks()).toHaveLength(1);

      manager.unregisterCheck('test-check');
      expect(manager.getChecks()).toHaveLength(0);
    });

    it('should handle unregistering non-existent check', () => {
      expect(() => manager.unregisterCheck('non-existent')).not.toThrow();
    });
  });

  describe('runCheck', () => {
    it('should run a specific check successfully', async () => {
      const mockResult: HealthCheckResult = {
        status: 'healthy',
        timestamp: new Date(),
        duration: 10
      };

      const check: SyntheticCheck = {
        name: 'test-check',
        timeoutMs: 1000,
        enabled: true,
        check: vi.fn().mockResolvedValue(mockResult)
      };

      manager.registerCheck(check);
      const result = await manager.runCheck('test-check');

      expect(result.status).toBe('healthy');
      expect(check.check).toHaveBeenCalled();
      
      const registeredCheck = manager.getCheck('test-check');
      expect(registeredCheck?.lastResult).toEqual(result);
      expect(registeredCheck?.runCount).toBe(1);
    });

    it('should throw error for non-existent check', async () => {
      await expect(manager.runCheck('non-existent')).rejects.toThrow("Check 'non-existent' not found");
    });

    it('should throw error for disabled check', async () => {
      const check: SyntheticCheck = {
        name: 'disabled-check',
        timeoutMs: 1000,
        enabled: false,
        check: vi.fn()
      };

      manager.registerCheck(check);
      await expect(manager.runCheck('disabled-check')).rejects.toThrow("Check 'disabled-check' is disabled");
    });

    it('should timeout check that takes too long', async () => {
      const check: SyntheticCheck = {
        name: 'slow-check',
        timeoutMs: 100,
        enabled: true,
        check: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 200))
        )
      };

      manager.registerCheck(check);
      
      const promise = manager.runCheck('slow-check');
      vi.advanceTimersByTime(100);
      
      const result = await promise;

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('timed out');
    });
  });

  describe('runAllChecks', () => {
    it('should run all enabled checks in parallel', async () => {
      const check1: SyntheticCheck = {
        name: 'check1',
        timeoutMs: 1000,
        enabled: true,
        check: vi.fn().mockResolvedValue({
          status: 'healthy',
          timestamp: new Date(),
          duration: 10
        })
      };

      const check2: SyntheticCheck = {
        name: 'check2',
        timeoutMs: 1000,
        enabled: true,
        check: vi.fn().mockResolvedValue({
          status: 'healthy',
          timestamp: new Date(),
          duration: 10
        })
      };

      const disabledCheck: SyntheticCheck = {
        name: 'disabled-check',
        timeoutMs: 1000,
        enabled: false,
        check: vi.fn()
      };

      manager.registerCheck(check1);
      manager.registerCheck(check2);
      manager.registerCheck(disabledCheck);

      const results = await manager.runAllChecks();

      expect(Object.keys(results)).toHaveLength(2);
      expect(results).toHaveProperty('check1');
      expect(results).toHaveProperty('check2');
      expect(results).not.toHaveProperty('disabled-check');
      expect(check1.check).toHaveBeenCalled();
      expect(check2.check).toHaveBeenCalled();
      expect(disabledCheck.check).not.toHaveBeenCalled();
    });

    it('should return empty object when no checks are enabled', async () => {
      const disabledCheck: SyntheticCheck = {
        name: 'disabled-check',
        timeoutMs: 1000,
        enabled: false,
        check: vi.fn()
      };

      manager.registerCheck(disabledCheck);
      const results = await manager.runAllChecks();

      expect(results).toEqual({});
    });
  });

  describe('runner', () => {
    it('should start and stop runner', () => {
      expect(manager.isRunnerActive()).toBe(false);

      manager.startRunner(1000);
      expect(manager.isRunnerActive()).toBe(true);

      manager.stopRunner();
      expect(manager.isRunnerActive()).toBe(false);
    });

    it('should not start runner if already running', () => {
      manager.startRunner(1000);
      expect(manager.isRunnerActive()).toBe(true);

      manager.startRunner(500); // Should not change anything
      expect(manager.isRunnerActive()).toBe(true);
    });

    it('should run checks on interval', async () => {
      const check: SyntheticCheck = {
        name: 'test-check',
        timeoutMs: 1000,
        enabled: true,
        check: vi.fn().mockResolvedValue({
          status: 'healthy',
          timestamp: new Date(),
          duration: 10
        })
      };

      manager.registerCheck(check);
      manager.startRunner(1000);

      // Advance time to trigger first run
      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      expect(check.check).toHaveBeenCalledTimes(1);

      manager.stopRunner();
    });
  });
});

describe('synthetic check exports', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should use singleton syntheticCheckManager', () => {
    const check: SyntheticCheck = {
      name: 'test-check',
      timeoutMs: 1000,
      enabled: true,
      check: vi.fn()
    };

    registerSyntheticCheck(check);
    const checks = getSyntheticChecks();

    expect(checks).toHaveLength(1);
    expect(checks[0].name).toBe('test-check');
  });

  it('should run checks using runSyntheticChecks', async () => {
    const check: SyntheticCheck = {
      name: 'test-check',
      timeoutMs: 1000,
      enabled: true,
      check: vi.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: new Date(),
        duration: 10
      })
    };

    registerSyntheticCheck(check);
    const results = await runSyntheticChecks();

    expect(results).toHaveProperty('test-check');
    expect(results['test-check'].status).toBe('healthy');
  });
});
