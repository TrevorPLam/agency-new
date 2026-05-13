import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { databaseEnv, databaseConfig } from '../database';
import { useEnhancedTestIsolation, setupDatabaseEnvironment, expectSpecificError, expectAnyError } from './utils';
import {
  VALID_DATABASE_URL,
  VALID_SCHEMA,
  INVALID_DATABASE_URL,
  INVALID_SCHEMA,
  MAX_POOL_SIZE,
  MIN_POOL_SIZE,
  MAX_TIMEOUT_SECONDS,
  MIN_TIMEOUT_SECONDS,
  MAX_SCHEMA_LENGTH,
  DEFAULT_DATABASE_POOL_SIZE,
  DEFAULT_DATABASE_TIMEOUT_SECONDS,
  DEFAULT_DATABASE_SSL_ENABLED,
  generateLongString,
  generateTooLongString,
  ERROR_MESSAGES,
} from './constants';

describe('Database Environment Validation', () => {
  useEnhancedTestIsolation();

  describe('Required Variables', () => {
    const setupRequiredVars = () => {
      setupDatabaseEnvironment({
        DATABASE_URL: VALID_DATABASE_URL,
        DATABASE_SCHEMA: VALID_SCHEMA,
      });
    };

    it('should validate required database URL', () => {
      setupRequiredVars();
      expect(databaseEnv.DATABASE_URL).toBe(VALID_DATABASE_URL);
    });

    it('should throw error for missing DATABASE_URL', () => {
      setupRequiredVars();
      delete process.env.DATABASE_URL;
      expectAnyError(() => databaseEnv.DATABASE_URL);
    });

    it('should throw error for invalid DATABASE_URL protocol', () => {
      setupRequiredVars();
      process.env.DATABASE_URL = INVALID_DATABASE_URL;
      expectSpecificError(
        () => databaseEnv.DATABASE_URL,
        ERROR_MESSAGES.DATABASE_URL_INVALID
      );
    });

    it('should validate required DATABASE_SCHEMA', () => {
      setupRequiredVars();
      expect(databaseEnv.DATABASE_SCHEMA).toBe(VALID_SCHEMA);
    });

    it('should throw error for invalid DATABASE_SCHEMA format', () => {
      setupRequiredVars();
      process.env.DATABASE_SCHEMA = INVALID_SCHEMA;
      expectSpecificError(
        () => databaseEnv.DATABASE_SCHEMA,
        ERROR_MESSAGES.DATABASE_SCHEMA_INVALID
      );
    });

    it('should throw error for missing DATABASE_SCHEMA', () => {
      setupRequiredVars();
      delete process.env.DATABASE_SCHEMA;
      expectAnyError(() => databaseEnv.DATABASE_SCHEMA);
    });
  });

  describe('Optional Variables', () => {
    const setupRequiredVars = () => {
      setupDatabaseEnvironment({
        DATABASE_URL: VALID_DATABASE_URL,
        DATABASE_SCHEMA: VALID_SCHEMA,
      });
    };

    it('should use default pool size when not provided', () => {
      setupRequiredVars();
      delete process.env.DATABASE_POOL_SIZE;
      expect(databaseEnv.DATABASE_POOL_SIZE).toBe(DEFAULT_DATABASE_POOL_SIZE);
    });

    it('should validate custom pool size', () => {
      setupRequiredVars();
      process.env.DATABASE_POOL_SIZE = '20';
      expect(databaseEnv.DATABASE_POOL_SIZE).toBe(20);
    });

    it('should throw error for invalid pool size range', () => {
      setupRequiredVars();
      process.env.DATABASE_POOL_SIZE = (MAX_POOL_SIZE + 1).toString();
      expectAnyError(() => databaseEnv.DATABASE_POOL_SIZE);
    });

    it('should use default timeout when not provided', () => {
      setupRequiredVars();
      delete process.env.DATABASE_TIMEOUT_SECONDS;
      expect(databaseEnv.DATABASE_TIMEOUT_SECONDS).toBe(DEFAULT_DATABASE_TIMEOUT_SECONDS);
    });

    it('should validate custom timeout', () => {
      setupRequiredVars();
      process.env.DATABASE_TIMEOUT_SECONDS = '60';
      expect(databaseEnv.DATABASE_TIMEOUT_SECONDS).toBe(60);
    });

    it('should use default SSL setting when not provided', () => {
      setupRequiredVars();
      delete process.env.DATABASE_SSL_ENABLED;
      expect(databaseEnv.DATABASE_SSL_ENABLED).toBe(DEFAULT_DATABASE_SSL_ENABLED);
    });

    it('should validate SSL disabled', () => {
      setupRequiredVars();
      process.env.DATABASE_SSL_ENABLED = 'false';
      expect(databaseEnv.DATABASE_SSL_ENABLED).toBe(false);
    });

    it('should validate read replica URL when provided', () => {
      setupRequiredVars();
      process.env.DATABASE_READ_REPLICA_URL = 'postgresql://user:pass@localhost:5432/replica';
      expect(databaseEnv.DATABASE_READ_REPLICA_URL).toBe('postgresql://user:pass@localhost:5432/replica');
    });

    it('should handle missing read replica URL', () => {
      setupRequiredVars();
      delete process.env.DATABASE_READ_REPLICA_URL;
      expect(databaseEnv.DATABASE_READ_REPLICA_URL).toBeUndefined();
    });
  });

  describe('Database Config Object', () => {
    const setupRequiredVars = () => {
      setupDatabaseEnvironment({
        DATABASE_URL: VALID_DATABASE_URL,
        DATABASE_SCHEMA: VALID_SCHEMA,
        DATABASE_POOL_SIZE: '15',
        DATABASE_TIMEOUT_SECONDS: '45',
        DATABASE_SSL_ENABLED: 'false',
        DATABASE_READ_REPLICA_URL: 'postgresql://user:pass@localhost:5432/replica',
      });
    };

    it('should create correct database config object', () => {
      setupRequiredVars();
      expect(databaseConfig).toEqual({
        url: VALID_DATABASE_URL,
        readReplicaUrl: 'postgresql://user:pass@localhost:5432/replica',
        poolSize: 15,
        timeoutSeconds: 45,
        sslEnabled: false,
        schema: VALID_SCHEMA,
        hasReadReplica: true,
      });
    });

    it('should fall back to primary URL when no read replica', () => {
      setupRequiredVars();
      delete process.env.DATABASE_READ_REPLICA_URL;
      expect(databaseConfig.readReplicaUrl).toBe(VALID_DATABASE_URL);
      expect(databaseConfig.hasReadReplica).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    const setupRequiredVars = () => {
      setupDatabaseEnvironment({
        DATABASE_URL: VALID_DATABASE_URL,
        DATABASE_SCHEMA: VALID_SCHEMA,
      });
    };

    it('should handle maximum pool size', () => {
      setupRequiredVars();
      process.env.DATABASE_POOL_SIZE = MAX_POOL_SIZE.toString();
      expect(databaseEnv.DATABASE_POOL_SIZE).toBe(MAX_POOL_SIZE);
    });

    it('should handle minimum pool size', () => {
      setupRequiredVars();
      process.env.DATABASE_POOL_SIZE = MIN_POOL_SIZE.toString();
      expect(databaseEnv.DATABASE_POOL_SIZE).toBe(MIN_POOL_SIZE);
    });

    it('should handle maximum timeout', () => {
      setupRequiredVars();
      process.env.DATABASE_TIMEOUT_SECONDS = MAX_TIMEOUT_SECONDS.toString();
      expect(databaseEnv.DATABASE_TIMEOUT_SECONDS).toBe(MAX_TIMEOUT_SECONDS);
    });

    it('should handle minimum timeout', () => {
      setupRequiredVars();
      process.env.DATABASE_TIMEOUT_SECONDS = MIN_TIMEOUT_SECONDS.toString();
      expect(databaseEnv.DATABASE_TIMEOUT_SECONDS).toBe(MIN_TIMEOUT_SECONDS);
    });

    it('should handle maximum schema length', () => {
      setupRequiredVars();
      process.env.DATABASE_SCHEMA = generateLongString(MAX_SCHEMA_LENGTH);
      expect(databaseEnv.DATABASE_SCHEMA).toBe(generateLongString(MAX_SCHEMA_LENGTH));
    });

    it('should reject schema that exceeds maximum length', () => {
      setupRequiredVars();
      process.env.DATABASE_SCHEMA = generateTooLongString(MAX_SCHEMA_LENGTH);
      expectAnyError(() => databaseEnv.DATABASE_SCHEMA);
    });

    it('should accept valid schema with underscores', () => {
      setupRequiredVars();
      process.env.DATABASE_SCHEMA = 'tenant_123_schema';
      expect(databaseEnv.DATABASE_SCHEMA).toBe('tenant_123_schema');
    });

    it('should accept schema starting with underscore', () => {
      setupRequiredVars();
      process.env.DATABASE_SCHEMA = '_private_schema';
      expect(databaseEnv.DATABASE_SCHEMA).toBe('_private_schema');
    });

    it('should reject schema starting with number', () => {
      setupRequiredVars();
      process.env.DATABASE_SCHEMA = '123_invalid';
      expectAnyError(() => databaseEnv.DATABASE_SCHEMA);
    });
  });
});
