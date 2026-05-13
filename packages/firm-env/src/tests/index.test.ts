import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateEnvironment,
  isDevelopment,
  isProduction,
  isStaging,
  getEnvironment,
  env,
  envConfig,
  databaseEnv,
  redisEnv,
  authEnv,
  platformEnv,
} from '../index';
import { useEnhancedTestIsolation, setupCompleteTestEnvironment, expectSpecificError, expectAnyError } from './utils';
import {
  VALID_DATABASE_URL,
  VALID_SCHEMA,
  VALID_REDIS_URL,
  VALID_KEY_PREFIX,
  VALID_AUTH_SECRET,
  VALID_AUTH_URL,
  VALID_API_KEY_SECRET,
  VALID_APP_VERSION,
  VALID_API_URL,
  VALID_REGION,
  VALID_INSTANCE_ID,
  ENV_DEVELOPMENT,
  ENV_PRODUCTION,
  ENV_STAGING,
  DEFAULT_SESSION_TIMEOUT_HOURS,
  DEFAULT_DATABASE_POOL_SIZE,
  DEFAULT_REDIS_DB,
  ERROR_MESSAGES,
} from './constants';

describe('Environment Index', () => {
  useEnhancedTestIsolation();

  describe('Environment Validation', () => {
    const setupRequiredVars = () => {
      setupCompleteTestEnvironment({
        DATABASE_URL: VALID_DATABASE_URL,
        DATABASE_SCHEMA: VALID_SCHEMA,
        REDIS_URL: VALID_REDIS_URL,
        REDIS_KEY_PREFIX: VALID_KEY_PREFIX,
        AUTH_SECRET: VALID_AUTH_SECRET,
        AUTH_URL: VALID_AUTH_URL,
        AUTH_API_KEY_SECRET: VALID_API_KEY_SECRET,
        NEXT_PUBLIC_AUTH_URL: VALID_AUTH_URL,
        NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
        NODE_ENV: ENV_DEVELOPMENT,
        APP_VERSION: VALID_APP_VERSION,
        PLATFORM_REGION: VALID_REGION,
        PLATFORM_INSTANCE_ID: VALID_INSTANCE_ID,
        NEXT_PUBLIC_API_URL: VALID_API_URL,
      });
    };

    it('should validate environment without throwing', () => {
      setupRequiredVars();
      expect(() => validateEnvironment()).not.toThrow();
    });

    it('should throw error when required variables are missing', () => {
      setupRequiredVars();
      delete process.env.DATABASE_URL;
      expectSpecificError(
        () => validateEnvironment(),
        ERROR_MESSAGES.ENV_VALIDATION_FAILED
      );
    });
  });

  describe('Environment Detection', () => {
    const setupRequiredVars = () => {
      setupCompleteTestEnvironment({
        NODE_ENV: ENV_DEVELOPMENT,
        APP_VERSION: VALID_APP_VERSION,
        PLATFORM_REGION: VALID_REGION,
        PLATFORM_INSTANCE_ID: VALID_INSTANCE_ID,
        NEXT_PUBLIC_API_URL: VALID_API_URL,
        NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
      });
    };

    it('should detect development environment', () => {
      setupRequiredVars();
      expect(isDevelopment()).toBe(true);
      expect(isProduction()).toBe(false);
      expect(isStaging()).toBe(false);
      expect(getEnvironment()).toBe(ENV_DEVELOPMENT);
    });

    it('should detect production environment', () => {
      setupRequiredVars();
      process.env.NODE_ENV = ENV_PRODUCTION;
      expect(isDevelopment()).toBe(false);
      expect(isProduction()).toBe(true);
      expect(isStaging()).toBe(false);
      expect(getEnvironment()).toBe(ENV_PRODUCTION);
    });

    it('should detect staging environment', () => {
      setupRequiredVars();
      process.env.NODE_ENV = ENV_STAGING;
      expect(isDevelopment()).toBe(false);
      expect(isProduction()).toBe(false);
      expect(isStaging()).toBe(true);
      expect(getEnvironment()).toBe(ENV_STAGING);
    });

    it('should use default development environment', () => {
      setupRequiredVars();
      delete process.env.NODE_ENV;
      expect(isDevelopment()).toBe(true);
      expect(isProduction()).toBe(false);
      expect(isStaging()).toBe(false);
      expect(getEnvironment()).toBe(ENV_DEVELOPMENT);
    });
  });

  describe('Environment Object', () => {
    const setupRequiredVars = () => {
      setupCompleteTestEnvironment({
        NODE_ENV: ENV_PRODUCTION,
        APP_VERSION: 'v1.2.3',
        PLATFORM_REGION: 'us-west-2',
        PLATFORM_INSTANCE_ID: 'i-1234567890abcdef0',
        NEXT_PUBLIC_API_URL: VALID_API_URL,
        NEXT_PUBLIC_APP_VERSION: 'v1.2.3',
      });
    };

    it('should create correct env object', () => {
      setupRequiredVars();
      expect(env).toEqual({
        isDevelopment: false,
        isProduction: true,
        isStaging: false,
        current: 'production',
        config: envConfig,
      });
    });

    it('should have correct config structure', () => {
      setupRequiredVars();
      expect(envConfig).toHaveProperty('database');
      expect(envConfig).toHaveProperty('redis');
      expect(envConfig).toHaveProperty('auth');
      expect(envConfig).toHaveProperty('platform');
    });
  });

  describe('Module Exports', () => {
    beforeEach(() => {
      // Set minimal required variables
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.DATABASE_SCHEMA = 'public';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.REDIS_KEY_PREFIX = 'test:';
      process.env.AUTH_SECRET = 'a'.repeat(32);
      process.env.AUTH_URL = 'https://auth.example.com';
      process.env.AUTH_API_KEY_SECRET = 'b'.repeat(32);
      process.env.NEXT_PUBLIC_AUTH_URL = 'https://auth.example.com';
      process.env.NEXT_PUBLIC_APP_VERSION = 'v1.0.0';
      process.env.NODE_ENV = 'development';
      process.env.APP_VERSION = 'v1.0.0';
      process.env.PLATFORM_REGION = 'us-east-1';
      process.env.PLATFORM_INSTANCE_ID = 'instance-123';
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
      process.env.NEXT_PUBLIC_APP_VERSION = 'v1.0.0';
    });

    it('should export database environment', () => {
      expect(databaseEnv).toBeDefined();
      expect(databaseEnv.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/test');
      expect(databaseEnv.DATABASE_SCHEMA).toBe('public');
    });

    it('should export redis environment', () => {
      expect(redisEnv).toBeDefined();
      expect(redisEnv.REDIS_URL).toBe('redis://localhost:6379');
      expect(redisEnv.REDIS_KEY_PREFIX).toBe('test:');
    });

    it('should export auth environment', () => {
      expect(authEnv).toBeDefined();
      expect(authEnv.AUTH_SECRET).toBe('a'.repeat(32));
      expect(authEnv.AUTH_URL).toBe('https://auth.example.com');
      expect(authEnv.NEXT_PUBLIC_AUTH_URL).toBe('https://auth.example.com');
    });

    it('should export platform environment', () => {
      expect(platformEnv).toBeDefined();
      expect(platformEnv.NODE_ENV).toBe('development');
      expect(platformEnv.APP_VERSION).toBe('v1.0.0');
      expect(platformEnv.PLATFORM_REGION).toBe('us-east-1');
      expect(platformEnv.PLATFORM_INSTANCE_ID).toBe('instance-123');
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      // Set comprehensive environment for integration testing
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
      process.env.DATABASE_SCHEMA = 'tenant_schema';
      process.env.DATABASE_POOL_SIZE = '20';
      process.env.REDIS_URL = 'rediss://redis.example.com:6380';
      process.env.REDIS_KEY_PREFIX = 'tenant123:';
      process.env.REDIS_DB = '2';
      process.env.REDIS_TIMEOUT_MS = '10000';
      process.env.AUTH_SECRET = 'super-secret-auth-key-32-chars';
      process.env.AUTH_URL = 'https://auth.example.com';
      process.env.AUTH_SESSION_TIMEOUT_HOURS = '12';
      process.env.AUTH_MFA_ENABLED = 'true';
      process.env.AUTH_API_KEY_SECRET = 'api-key-secret-32-chars-long';
      process.env.NEXT_PUBLIC_AUTH_URL = 'https://auth.example.com';
      process.env.NEXT_PUBLIC_APP_VERSION = 'v2.1.0';
      process.env.NEXT_PUBLIC_AUTH_MFA_ENABLED = 'true';
      process.env.NODE_ENV = 'production';
      process.env.APP_VERSION = 'v2.1.0';
      process.env.PLATFORM_REGION = 'eu-west-1';
      process.env.PLATFORM_INSTANCE_ID = 'prod-instance-456';
      process.env.PLATFORM_DEBUG_ENABLED = 'false';
      process.env.PLATFORM_OBSERVABILITY_ENABLED = 'true';
      process.env.PLATFORM_AI_ENABLED = 'true';
      process.env.PLATFORM_AI_PROVIDER = 'openai';
      process.env.PLATFORM_AI_MODEL = 'gpt-4';
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
      process.env.NEXT_PUBLIC_DEBUG_ENABLED = 'false';
      process.env.NEXT_PUBLIC_AI_ENABLED = 'true';
    });

    it('should create comprehensive env config', () => {
      expect(envConfig.database).toBeDefined();
      expect(envConfig.redis).toBeDefined();
      expect(envConfig.auth).toBeDefined();
      expect(envConfig.platform).toBeDefined();

      expect(envConfig.database.url).toBe('postgresql://user:pass@localhost:5432/testdb');
      expect(envConfig.database.schema).toBe('tenant_schema');
      expect(envConfig.database.poolSize).toBe(20);

      expect(envConfig.redis.url).toBe('rediss://redis.example.com:6380');
      expect(envConfig.redis.keyPrefix).toBe('tenant123:');
      expect(envConfig.redis.db).toBe(2);
      expect(envConfig.redis.sslEnabled).toBe(true);

      expect(envConfig.auth.secret).toBe('super-secret-auth-key-32-chars');
      expect(envConfig.auth.sessionTimeoutHours).toBe(12);
      expect(envConfig.auth.mfaEnabled).toBe(true);
      expect(envConfig.auth.publicMfaEnabled).toBe(true);

      expect(envConfig.platform.nodeEnv).toBe('production');
      expect(envConfig.platform.appVersion).toBe('v2.1.0');
      expect(envConfig.platform.region).toBe('eu-west-1');
      expect(envConfig.platform.debugEnabled).toBe(false);
      expect(envConfig.platform.observability.enabled).toBe(true);
      expect(envConfig.platform.ai.enabled).toBe(true);
      expect(envConfig.platform.public.aiEnabled).toBe(true);
    });

    it('should provide consistent environment detection', () => {
      expect(env.isDevelopment).toBe(false);
      expect(env.isProduction).toBe(true);
      expect(env.isStaging).toBe(false);
      expect(env.current).toBe('production');
    });

    it('should validate complete environment', () => {
      expect(() => validateEnvironment()).not.toThrow();
    });

    // Enhanced integration tests
    it('should handle cross-module dependencies correctly', () => {
      // Test that auth config depends on platform environment
      expect(envConfig.auth.publicUrl).toBe(envConfig.platform.public.apiUrl);
      expect(envConfig.auth.publicMfaEnabled).toBe(envConfig.platform.public.aiEnabled);
    });

    it('should maintain consistency between server and client variables', () => {
      // Test that public variables match their server counterparts
      expect(envConfig.auth.publicMfaEnabled).toBe(envConfig.auth.mfaEnabled);
      expect(envConfig.platform.public.debugEnabled).toBe(envConfig.platform.debugEnabled);
      expect(envConfig.platform.public.aiEnabled).toBe(envConfig.platform.ai.enabled);
    });

    it('should handle environment-specific configurations', () => {
      // Test production-specific behavior
      expect(envConfig.platform.debugEnabled).toBe(false);
      expect(envConfig.platform.observability.enabled).toBe(true);
    });

    it('should validate configuration interdependencies', () => {
      // Test that related configurations are consistent
      if (envConfig.auth.mfaEnabled) {
        expect(envConfig.auth.publicMfaEnabled).toBeDefined();
      }
      if (envConfig.platform.ai.enabled) {
        expect(envConfig.platform.ai.provider).toBeDefined();
        expect(envConfig.platform.ai.model).toBeDefined();
      }
    });

    it('should handle optional configurations gracefully', () => {
      // Remove optional variables and test defaults
      delete process.env.AUTH_SESSION_TIMEOUT_HOURS;
      delete process.env.DATABASE_POOL_SIZE;
      delete process.env.REDIS_DB;
      
      expect(envConfig.auth.sessionTimeoutHours).toBe(DEFAULT_SESSION_TIMEOUT_HOURS);
      expect(envConfig.database.poolSize).toBe(DEFAULT_DATABASE_POOL_SIZE);
      expect(envConfig.redis.db).toBe(DEFAULT_REDIS_DB);
    });

    it('should validate security configurations', () => {
      // Test that security-related configurations are properly set
      expect(envConfig.auth.secret.length).toBeGreaterThanOrEqual(32);
      expect(envConfig.auth.apiKeySecret.length).toBeGreaterThanOrEqual(32);
      expect(envConfig.auth.url).toMatch(/^https:/);
      expect(envConfig.database.url).toMatch(/^postgresql:/);
    });

    it('should handle feature flag configurations', () => {
      // Test feature flag consistency
      const featureFlags = [
        envConfig.platform.debugEnabled,
        envConfig.platform.observability.enabled,
        envConfig.platform.ai.enabled,
        envConfig.auth.mfaEnabled,
      ];
      
      // All feature flags should be boolean
      featureFlags.forEach(flag => {
        expect(typeof flag).toBe('boolean');
      });
    });

    it('should provide complete configuration object', () => {
      // Test that the main env object contains all expected properties
      expect(env).toHaveProperty('isDevelopment');
      expect(env).toHaveProperty('isProduction');
      expect(env).toHaveProperty('isStaging');
      expect(env).toHaveProperty('current');
      expect(env).toHaveProperty('config');
      
      expect(env.config).toHaveProperty('database');
      expect(env.config).toHaveProperty('redis');
      expect(env.config).toHaveProperty('auth');
      expect(env.config).toHaveProperty('platform');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', () => {
      // Create invalid environment
      process.env.DATABASE_URL = 'invalid-url';
      process.env.REDIS_URL = 'invalid-url';
      process.env.AUTH_SECRET = 'short';
      
      expectSpecificError(
        () => validateEnvironment(),
        ERROR_MESSAGES.ENV_VALIDATION_FAILED
      );
    });

    it('should provide meaningful error messages', () => {
      try {
        validateEnvironment();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(ERROR_MESSAGES.ENV_VALIDATION_FAILED);
      }
    });
  });
});
