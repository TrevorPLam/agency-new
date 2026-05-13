/**
 * Shared test utilities for environment validation tests
 */

import { beforeEach, afterEach, expect, it } from 'vitest';
import {
  VALID_AUTH_SECRET,
  VALID_API_KEY_SECRET,
  VALID_DATABASE_URL,
  VALID_REDIS_URL,
  VALID_AUTH_URL,
  VALID_APP_VERSION,
  VALID_REGION,
  VALID_INSTANCE_ID,
  VALID_SCHEMA,
  VALID_KEY_PREFIX,
  VALID_API_URL,
} from './constants';

// Store original environment and test state
let originalEnv: NodeJS.ProcessEnv;
let currentTestSnapshot: NodeJS.ProcessEnv;
let testIsolationActive = false;

/**
 * Setup test environment isolation with snapshot restoration
 */
export const setupTestEnvironment = (): void => {
  if (!testIsolationActive) {
    originalEnv = { ...process.env };
    testIsolationActive = true;
  }
  currentTestSnapshot = { ...process.env };
};

/**
 * Cleanup test environment and restore to test snapshot
 */
export const cleanupTestEnvironment = (): void => {
  if (currentTestSnapshot) {
    // Clear current environment
    Object.keys(process.env).forEach(key => {
      delete process.env[key];
    });
    // Restore test snapshot
    Object.entries(currentTestSnapshot).forEach(([key, value]) => {
      if (value !== undefined) {
        process.env[key] = value;
      }
    });
  }
};

/**
 * Complete cleanup - restore original environment (called after all tests)
 */
export const finalCleanup = (): void => {
  if (testIsolationActive && originalEnv) {
    Object.keys(process.env).forEach(key => {
      delete process.env[key];
    });
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value !== undefined) {
        process.env[key] = value;
      }
    });
    testIsolationActive = false;
  }
};

/**
 * Set up environment variables for testing with validation
 */
export const setEnvironmentVariables = (vars: Record<string, string | undefined>): void => {
  Object.entries(vars).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
};

/**
 * Safely set environment variables without affecting others
 */
export const safeSetEnvironmentVariables = (vars: Record<string, string | undefined>): NodeJS.ProcessEnv => {
  const currentEnv = { ...process.env };
  Object.entries(vars).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
  return currentEnv;
};

/**
 * Restore environment variables from a previous state
 */
export const restoreEnvironmentVariables = (previousEnv: NodeJS.ProcessEnv): void => {
  Object.keys(process.env).forEach(key => {
    if (!(key in previousEnv)) {
      delete process.env[key];
    }
  });
  Object.entries(previousEnv).forEach(([key, value]) => {
    if (value !== undefined) {
      process.env[key] = value;
    }
  });
};

/**
 * Clear all environment variables
 */
export const clearEnvironmentVariables = (): void => {
  Object.keys(process.env).forEach(key => {
    delete process.env[key];
  });
};

/**
 * Setup and cleanup hooks for test isolation with enhanced safety
 */
export const useTestIsolation = (): void => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });
};

/**
 * Enhanced test isolation with validation
 */
export const useEnhancedTestIsolation = (): void => {
  beforeEach(() => {
    setupTestEnvironment();
    // Validate environment is clean
    const envKeys = Object.keys(process.env);
    if (envKeys.length > 50) { // Reasonable limit for test environment
      console.warn(`Test environment has ${envKeys.length} variables, consider cleanup`);
    }
  });

  afterEach(() => {
    cleanupTestEnvironment();
    // Validate cleanup was successful
    const remainingKeys = Object.keys(process.env).filter(key => !key.startsWith('NODE_'));
    if (remainingKeys.length > 20) {
      console.warn('Environment may not have been properly cleaned up');
    }
  });
};

/**
 * Expect an error with specific message
 */
export const expectErrorWithMessage = (
  fn: () => void,
  expectedMessage: string | RegExp
): void => {
  try {
    fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    if (error instanceof Error) {
      if (typeof expectedMessage === 'string') {
        expect(error.message).toContain(expectedMessage);
      } else {
        expect(error.message).toMatch(expectedMessage);
      }
    } else {
      throw error;
    }
  }
};

/**
 * Expect an error with specific message using constants
 */
export const expectSpecificError = (
  fn: () => void,
  expectedMessage: string
): void => {
  expectErrorWithMessage(fn, expectedMessage);
};

/**
 * Expect an error with partial message match
 */
export const expectPartialError = (
  fn: () => void,
  expectedPartialMessage: string
): void => {
  try {
    fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    if (error instanceof Error) {
      expect(error.message).toContain(expectedPartialMessage);
    } else {
      throw error;
    }
  }
};

/**
 * Expect an error without checking message
 */
export const expectAnyError = (fn: () => void): void => {
  expect(fn).toThrow();
};

/**
 * Create a test environment configuration
 */
export const createTestEnvironment = (overrides: Record<string, string | undefined> = {}): Record<string, string> => {
  const baseEnv: Record<string, string> = {
    // Database
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
    DATABASE_SCHEMA: 'public',
    
    // Redis
    REDIS_URL: 'redis://localhost:6379',
    REDIS_KEY_PREFIX: 'test:',
    
    // Auth
    AUTH_SECRET: 'a'.repeat(32),
    AUTH_URL: 'https://auth.example.com',
    AUTH_API_KEY_SECRET: 'b'.repeat(32),
    NEXT_PUBLIC_AUTH_URL: 'https://auth.example.com',
    NEXT_PUBLIC_APP_VERSION: 'v1.0.0',
    
    // Platform
    NODE_ENV: 'development',
    APP_VERSION: 'v1.0.0',
    PLATFORM_REGION: 'us-east-1',
    PLATFORM_INSTANCE_ID: 'instance-123',
    NEXT_PUBLIC_API_URL: 'https://api.example.com',
  };

  const env = { ...baseEnv };
  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  });

  return env;
};

/**
 * Setup a complete test environment
 */
export const setupCompleteTestEnvironment = (overrides: Record<string, string | undefined> = {}): void => {
  const env = createTestEnvironment(overrides);
  setEnvironmentVariables(env);
};

/**
 * Modular setup functions for different test scenarios
 */
export const setupAuthEnvironment = (overrides: Record<string, string | undefined> = {}): void => {
  const authEnv = {
    AUTH_SECRET: VALID_AUTH_SECRET,
    AUTH_URL: VALID_AUTH_URL,
    AUTH_API_KEY_SECRET: VALID_API_KEY_SECRET,
    NEXT_PUBLIC_AUTH_URL: VALID_AUTH_URL,
    NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
    ...overrides
  };
  setEnvironmentVariables(authEnv);
};

export const setupDatabaseEnvironment = (overrides: Record<string, string | undefined> = {}): void => {
  const dbEnv = {
    DATABASE_URL: VALID_DATABASE_URL,
    DATABASE_SCHEMA: VALID_SCHEMA,
    ...overrides
  };
  setEnvironmentVariables(dbEnv);
};

export const setupRedisEnvironment = (overrides: Record<string, string | undefined> = {}): void => {
  const redisEnv = {
    REDIS_URL: VALID_REDIS_URL,
    REDIS_KEY_PREFIX: VALID_KEY_PREFIX,
    ...overrides
  };
  setEnvironmentVariables(redisEnv);
};

export const setupPlatformEnvironment = (overrides: Record<string, string | undefined> = {}): void => {
  const platformEnv = {
    NODE_ENV: 'development',
    APP_VERSION: VALID_APP_VERSION,
    PLATFORM_REGION: VALID_REGION,
    PLATFORM_INSTANCE_ID: VALID_INSTANCE_ID,
    NEXT_PUBLIC_API_URL: VALID_API_URL,
    ...overrides
  };
  setEnvironmentVariables(platformEnv);
};

/**
 * Minimal setup for single variable testing
 */
export const setupMinimalEnvironment = (vars: Record<string, string | undefined>): void => {
  // Only set the provided variables, don't set up full environment
  setEnvironmentVariables(vars);
};

/**
 * Performance-optimized test setup utilities
 */
export const setupPerformanceOptimized = {
  /**
   * Setup only required variables for a specific module
   */
  authOnly: (overrides: Record<string, string | undefined> = {}): void => {
    const minimalAuthEnv = {
      AUTH_SECRET: VALID_AUTH_SECRET,
      AUTH_URL: VALID_AUTH_URL,
      AUTH_API_KEY_SECRET: VALID_API_KEY_SECRET,
      NEXT_PUBLIC_AUTH_URL: VALID_AUTH_URL,
      NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
      ...overrides
    };
    setEnvironmentVariables(minimalAuthEnv);
  },

  databaseOnly: (overrides: Record<string, string | undefined> = {}): void => {
    const minimalDbEnv = {
      DATABASE_URL: VALID_DATABASE_URL,
      DATABASE_SCHEMA: VALID_SCHEMA,
      ...overrides
    };
    setEnvironmentVariables(minimalDbEnv);
  },

  redisOnly: (overrides: Record<string, string | undefined> = {}): void => {
    const minimalRedisEnv = {
      REDIS_URL: VALID_REDIS_URL,
      REDIS_KEY_PREFIX: VALID_KEY_PREFIX,
      ...overrides
    };
    setEnvironmentVariables(minimalRedisEnv);
  },

  platformOnly: (overrides: Record<string, string | undefined> = {}): void => {
    const minimalPlatformEnv = {
      NODE_ENV: 'development',
      APP_VERSION: VALID_APP_VERSION,
      PLATFORM_REGION: VALID_REGION,
      PLATFORM_INSTANCE_ID: VALID_INSTANCE_ID,
      NEXT_PUBLIC_API_URL: VALID_API_URL,
      ...overrides
    };
    setEnvironmentVariables(minimalPlatformEnv);
  },

  /**
   * Setup only variables needed for validation testing
   */
  validationOnly: (vars: Record<string, string | undefined>): void => {
    setEnvironmentVariables(vars);
  },

  /**
   * Lazy environment setup - only setup when first accessed
   */
  lazySetup: (setupFn: () => void): () => void => {
    let setup = false;
    return () => {
      if (!setup) {
        setupFn();
        setup = true;
      }
    };
  },
};

/**
 * Performance monitoring utilities
 */
export const performanceUtils = {
  /**
   * Measure test execution time
   */
  measureTime: <T>(fn: () => T): { result: T; duration: number } => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return {
      result,
      duration: end - start
    };
  },

  /**
   * Benchmark test performance
   */
  benchmark: (name: string, fn: () => void, iterations: number = 100): void => {
    const times: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      const end = performance.now();
      times.push(end - start);
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    console.log(`${name} benchmark (${iterations} iterations):`);
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
  },
};

/**
 * Test data generators
 */
export const generateTestData = {
  longString: (length: number): string => 'a'.repeat(length),
  tooLongString: (length: number): string => 'a'.repeat(length + 1),
  validUrl: (protocol: string, domain: string, port?: number): string => 
    port ? `${protocol}://${domain}:${port}` : `${protocol}://${domain}`,
  invalidUrl: (protocol: string): string => `${protocol}://invalid.com`,
  validVersion: (major: number, minor: number, patch: number, prerelease?: string): string =>
    prerelease ? `v${major}.${minor}.${patch}-${prerelease}` : `v${major}.${minor}.${patch}`,
  invalidVersion: (major: number, minor: number, patch: number): string => `${major}.${minor}.${patch}`,
};

/**
 * Common test scenarios
 */
export const testScenarios = {
  missingRequiredVar: (varName: string, setupFn: () => void, accessFn: () => void): void => {
    it(`should throw error for missing ${varName}`, () => {
      setupFn();
      delete process.env[varName];
      expectAnyError(accessFn);
    });
  },

  invalidFormat: (varName: string, invalidValue: string, expectedError: string, setupFn: () => void, accessFn: () => void): void => {
    it(`should throw error for invalid ${varName} format`, () => {
      setupFn();
      process.env[varName] = invalidValue;
      expectErrorWithMessage(accessFn, expectedError);
    });
  },

  validValue: (varName: string, validValue: string, setupFn: () => void, accessFn: () => void): void => {
    it(`should validate ${varName}`, () => {
      setupFn();
      process.env[varName] = validValue;
      expect(() => accessFn()).not.toThrow();
    });
  },

  defaultValue: (varName: string, expectedDefault: any, setupFn: () => void, accessFn: () => void): void => {
    it(`should use default ${varName} when not provided`, () => {
      setupFn();
      delete process.env[varName];
      expect(accessFn()).toBe(expectedDefault);
    });
  },

  boundaryValue: (varName: string, value: string, expected: any, setupFn: () => void, accessFn: () => void): void => {
    it(`should handle boundary ${varName}`, () => {
      setupFn();
      process.env[varName] = value;
      expect(accessFn()).toBe(expected);
    });
  },
};

/**
 * Standardized test naming conventions
 */
export const testNaming = {
  // Validation patterns
  validatesRequired: (varName: string) => `validates required ${varName}`,
  validatesOptional: (varName: string) => `validates optional ${varName}`,
  rejectsInvalid: (varName: string, reason: string) => `rejects invalid ${varName} (${reason})`,
  acceptsValid: (varName: string) => `accepts valid ${varName}`,
  usesDefault: (varName: string) => `uses default ${varName} when not provided`,
  
  // Edge case patterns
  handlesBoundary: (varName: string, boundary: string) => `handles boundary ${varName} (${boundary})`,
  handlesMaximum: (varName: string) => `handles maximum ${varName}`,
  handlesMinimum: (varName: string) => `handles minimum ${varName}`,
  handlesEmpty: (varName: string) => `handles empty ${varName}`,
  handlesNull: (varName: string) => `handles null ${varName}`,
  
  // Integration patterns
  createsConfig: (configName: string) => `creates correct ${configName} config object`,
  validatesIntegration: (feature: string) => `validates ${feature} integration`,
  maintainsCompatibility: (feature: string) => `maintains backward compatibility for ${feature}`,
  
  // Security patterns
  rejectsMalicious: (varName: string, attack: string) => `rejects malicious ${varName} (${attack})`,
  sanitizesInput: (varName: string) => `sanitizes ${varName} input`,
  preventsInjection: (varName: string) => `prevents injection attacks in ${varName}`,
};
