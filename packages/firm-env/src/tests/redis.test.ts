import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { redisEnv, redisConfig } from '../redis';
import { useEnhancedTestIsolation, setupRedisEnvironment, expectSpecificError, expectAnyError } from './utils';
import {
  VALID_REDIS_URL,
  VALID_REDIS_SECURE_URL,
  VALID_KEY_PREFIX,
  INVALID_REDIS_URL,
  INVALID_KEY_PREFIX,
  MAX_REDIS_DB,
  MIN_REDIS_DB,
  MAX_REDIS_TIMEOUT_MS,
  MIN_REDIS_TIMEOUT_MS,
  MAX_REDIS_DEFAULT_TTL_SECONDS,
  MIN_REDIS_DEFAULT_TTL_SECONDS,
  MAX_REDIS_MAX_RETRIES,
  MIN_REDIS_MAX_RETRIES,
  MAX_KEY_PREFIX_LENGTH,
  DEFAULT_REDIS_DB,
  DEFAULT_REDIS_TIMEOUT_MS,
  DEFAULT_REDIS_MAX_RETRIES,
  DEFAULT_REDIS_DEFAULT_TTL_SECONDS,
  DEFAULT_REDIS_CLUSTER_ENABLED,
  generateLongString,
  generateTooLongString,
  ERROR_MESSAGES,
} from './constants';

describe('Redis Environment Validation', () => {
  useEnhancedTestIsolation();

  describe('Required Variables', () => {
    const setupRequiredVars = () => {
      setupRedisEnvironment({
        REDIS_URL: VALID_REDIS_URL,
        REDIS_KEY_PREFIX: VALID_KEY_PREFIX,
      });
    };

    it('should validate required Redis URL', () => {
      setupRequiredVars();
      expect(redisEnv.REDIS_URL).toBe(VALID_REDIS_URL);
    });

    it('should validate secure Redis URL', () => {
      setupRequiredVars();
      process.env.REDIS_URL = VALID_REDIS_SECURE_URL;
      expect(redisEnv.REDIS_URL).toBe(VALID_REDIS_SECURE_URL);
    });

    it('should throw error for missing REDIS_URL', () => {
      setupRequiredVars();
      delete process.env.REDIS_URL;
      expectAnyError(() => redisEnv.REDIS_URL);
    });

    it('should throw error for invalid REDIS_URL protocol', () => {
      setupRequiredVars();
      process.env.REDIS_URL = INVALID_REDIS_URL;
      expectSpecificError(
        () => redisEnv.REDIS_URL,
        ERROR_MESSAGES.REDIS_URL_INVALID
      );
    });

    it('should validate required REDIS_KEY_PREFIX', () => {
      setupRequiredVars();
      process.env.REDIS_KEY_PREFIX = 'tenant123:';
      expect(redisEnv.REDIS_KEY_PREFIX).toBe('tenant123:');
    });

    it('should throw error for missing REDIS_KEY_PREFIX', () => {
      setupRequiredVars();
      delete process.env.REDIS_KEY_PREFIX;
      expectAnyError(() => redisEnv.REDIS_KEY_PREFIX);
    });

    it('should throw error for invalid REDIS_KEY_PREFIX characters', () => {
      setupRequiredVars();
      process.env.REDIS_KEY_PREFIX = INVALID_KEY_PREFIX;
      expectSpecificError(
        () => redisEnv.REDIS_KEY_PREFIX,
        ERROR_MESSAGES.REDIS_KEY_PREFIX_INVALID
      );
    });
  });

  describe('Optional Variables', () => {
    const setupRequiredVars = () => {
      setupRedisEnvironment({
        REDIS_URL: VALID_REDIS_URL,
        REDIS_KEY_PREFIX: VALID_KEY_PREFIX,
      });
    };

    it('should use default database when not provided', () => {
      setupRequiredVars();
      delete process.env.REDIS_DB;
      expect(redisEnv.REDIS_DB).toBe(DEFAULT_REDIS_DB);
    });

    it('should validate custom database number', () => {
      setupRequiredVars();
      process.env.REDIS_DB = '5';
      expect(redisEnv.REDIS_DB).toBe(5);
    });

    it('should throw error for invalid database number range', () => {
      setupRequiredVars();
      process.env.REDIS_DB = (MAX_REDIS_DB + 1).toString();
      expectAnyError(() => redisEnv.REDIS_DB);
    });

    it('should use default timeout when not provided', () => {
      setupRequiredVars();
      delete process.env.REDIS_TIMEOUT_MS;
      expect(redisEnv.REDIS_TIMEOUT_MS).toBe(DEFAULT_REDIS_TIMEOUT_MS);
    });

    it('should validate custom timeout', () => {
      setupRequiredVars();
      process.env.REDIS_TIMEOUT_MS = '10000';
      expect(redisEnv.REDIS_TIMEOUT_MS).toBe(10000);
    });

    it('should throw error for timeout below minimum', () => {
      setupRequiredVars();
      process.env.REDIS_TIMEOUT_MS = '50';
      expectAnyError(() => redisEnv.REDIS_TIMEOUT_MS);
    });

    it('should use default max retries when not provided', () => {
      setupRequiredVars();
      delete process.env.REDIS_MAX_RETRIES;
      expect(redisEnv.REDIS_MAX_RETRIES).toBe(DEFAULT_REDIS_MAX_RETRIES);
    });

    it('should validate custom max retries', () => {
      setupRequiredVars();
      process.env.REDIS_MAX_RETRIES = '5';
      expect(redisEnv.REDIS_MAX_RETRIES).toBe(5);
    });

    it('should use default TTL when not provided', () => {
      setupRequiredVars();
      delete process.env.REDIS_DEFAULT_TTL_SECONDS;
      expect(redisEnv.REDIS_DEFAULT_TTL_SECONDS).toBe(DEFAULT_REDIS_DEFAULT_TTL_SECONDS);
    });

    it('should validate custom TTL', () => {
      setupRequiredVars();
      process.env.REDIS_DEFAULT_TTL_SECONDS = '7200';
      expect(redisEnv.REDIS_DEFAULT_TTL_SECONDS).toBe(7200);
    });

    it('should throw error for TTL above maximum', () => {
      setupRequiredVars();
      process.env.REDIS_DEFAULT_TTL_SECONDS = (MAX_REDIS_DEFAULT_TTL_SECONDS + 1).toString();
      expectAnyError(() => redisEnv.REDIS_DEFAULT_TTL_SECONDS);
    });

    it('should use default cluster setting when not provided', () => {
      setupRequiredVars();
      delete process.env.REDIS_CLUSTER_ENABLED;
      expect(redisEnv.REDIS_CLUSTER_ENABLED).toBe(DEFAULT_REDIS_CLUSTER_ENABLED);
    });

    it('should validate cluster enabled', () => {
      setupRequiredVars();
      process.env.REDIS_CLUSTER_ENABLED = 'true';
      expect(redisEnv.REDIS_CLUSTER_ENABLED).toBe(true);
    });

    it('should validate cluster nodes when provided', () => {
      setupRequiredVars();
      process.env.REDIS_CLUSTER_ENABLED = 'true';
      process.env.REDIS_CLUSTER_NODES = 'redis://node1:6379,redis://node2:6379,redis://node3:6379';
      expect(redisEnv.REDIS_CLUSTER_NODES).toEqual([
        'redis://node1:6379',
        'redis://node2:6379',
        'redis://node3:6379',
      ]);
    });
  });

  describe('Redis Config Object', () => {
    const setupRequiredVars = () => {
      setupRedisEnvironment({
        REDIS_URL: VALID_REDIS_SECURE_URL,
        REDIS_KEY_PREFIX: 'tenant123:',
        REDIS_DB: '2',
        REDIS_TIMEOUT_MS: '8000',
        REDIS_MAX_RETRIES: '5',
        REDIS_DEFAULT_TTL_SECONDS: '1800',
        REDIS_CLUSTER_ENABLED: 'false',
      });
    };

    it('should create correct redis config object', () => {
      setupRequiredVars();
      expect(redisConfig).toEqual({
        url: VALID_REDIS_SECURE_URL,
        db: 2,
        timeoutMs: 8000,
        maxRetries: 5,
        keyPrefix: 'tenant123:',
        defaultTtlSeconds: 1800,
        clusterEnabled: false,
        clusterNodes: undefined,
        sslEnabled: true,
      });
    });

    it('should detect SSL enabled correctly', () => {
      setupRequiredVars();
      expect(redisConfig.sslEnabled).toBe(true);
    });

    it('should detect SSL disabled correctly', () => {
      setupRequiredVars();
      process.env.REDIS_URL = VALID_REDIS_URL;
      expect(redisConfig.sslEnabled).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    const setupRequiredVars = () => {
      setupRedisEnvironment({
        REDIS_URL: VALID_REDIS_URL,
        REDIS_KEY_PREFIX: VALID_KEY_PREFIX,
      });
    };

    it('should handle maximum database number', () => {
      setupRequiredVars();
      process.env.REDIS_DB = MAX_REDIS_DB.toString();
      expect(redisEnv.REDIS_DB).toBe(MAX_REDIS_DB);
    });

    it('should handle minimum timeout', () => {
      setupRequiredVars();
      process.env.REDIS_TIMEOUT_MS = MIN_REDIS_TIMEOUT_MS.toString();
      expect(redisEnv.REDIS_TIMEOUT_MS).toBe(MIN_REDIS_TIMEOUT_MS);
    });

    it('should handle maximum timeout', () => {
      setupRequiredVars();
      process.env.REDIS_TIMEOUT_MS = MAX_REDIS_TIMEOUT_MS.toString();
      expect(redisEnv.REDIS_TIMEOUT_MS).toBe(MAX_REDIS_TIMEOUT_MS);
    });

    it('should handle maximum retries', () => {
      setupRequiredVars();
      process.env.REDIS_MAX_RETRIES = MAX_REDIS_MAX_RETRIES.toString();
      expect(redisEnv.REDIS_MAX_RETRIES).toBe(MAX_REDIS_MAX_RETRIES);
    });

    it('should handle zero retries', () => {
      setupRequiredVars();
      process.env.REDIS_MAX_RETRIES = MIN_REDIS_MAX_RETRIES.toString();
      expect(redisEnv.REDIS_MAX_RETRIES).toBe(MIN_REDIS_MAX_RETRIES);
    });

    it('should handle maximum TTL', () => {
      setupRequiredVars();
      process.env.REDIS_DEFAULT_TTL_SECONDS = MAX_REDIS_DEFAULT_TTL_SECONDS.toString();
      expect(redisEnv.REDIS_DEFAULT_TTL_SECONDS).toBe(MAX_REDIS_DEFAULT_TTL_SECONDS);
    });

    it('should handle minimum TTL', () => {
      setupRequiredVars();
      process.env.REDIS_DEFAULT_TTL_SECONDS = MIN_REDIS_DEFAULT_TTL_SECONDS.toString();
      expect(redisEnv.REDIS_DEFAULT_TTL_SECONDS).toBe(MIN_REDIS_DEFAULT_TTL_SECONDS);
    });

    it('should handle maximum key prefix length', () => {
      setupRequiredVars();
      process.env.REDIS_KEY_PREFIX = generateLongString(MAX_KEY_PREFIX_LENGTH);
      expect(redisEnv.REDIS_KEY_PREFIX).toBe(generateLongString(MAX_KEY_PREFIX_LENGTH));
    });

    it('should reject key prefix that exceeds maximum length', () => {
      setupRequiredVars();
      process.env.REDIS_KEY_PREFIX = generateTooLongString(MAX_KEY_PREFIX_LENGTH);
      expectAnyError(() => redisEnv.REDIS_KEY_PREFIX);
    });

    it('should accept valid key prefix with hyphens', () => {
      setupRequiredVars();
      process.env.REDIS_KEY_PREFIX = 'tenant-123_cache:';
      expect(redisEnv.REDIS_KEY_PREFIX).toBe('tenant-123_cache:');
    });

    it('should accept valid key prefix with underscores', () => {
      setupRequiredVars();
      process.env.REDIS_KEY_PREFIX = 'tenant_123_cache:';
      expect(redisEnv.REDIS_KEY_PREFIX).toBe('tenant_123_cache:');
    });

    it('should accept key prefix without trailing colon', () => {
      setupRequiredVars();
      process.env.REDIS_KEY_PREFIX = 'tenant123';
      expect(redisEnv.REDIS_KEY_PREFIX).toBe('tenant123');
    });

    it('should handle cluster config with nodes', () => {
      setupRequiredVars();
      process.env.REDIS_CLUSTER_ENABLED = 'true';
      process.env.REDIS_CLUSTER_NODES = 'redis://node1:6379, redis://node2:6379';
      
      expect(redisConfig.clusterEnabled).toBe(true);
      expect(redisConfig.clusterNodes).toEqual([
        'redis://node1:6379',
        'redis://node2:6379',
      ]);
    });

    it('should handle cluster config without nodes', () => {
      setupRequiredVars();
      process.env.REDIS_CLUSTER_ENABLED = 'true';
      delete process.env.REDIS_CLUSTER_NODES;
      
      expect(redisConfig.clusterEnabled).toBe(true);
      expect(redisConfig.clusterNodes).toBeUndefined();
    });
  });
});
