import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { platformEnv } from '../platform';
import { useEnhancedTestIsolation, setupPlatformEnvironment, expectSpecificError, expectAnyError } from './utils';
import {
  VALID_APP_VERSION,
  VALID_REGION,
  VALID_INSTANCE_ID,
  VALID_API_URL,
  VALID_AUTH_URL,
  INVALID_REGION,
  INVALID_APP_VERSION,
  INVALID_API_URL,
  MAX_INSTANCE_ID_LENGTH,
  MAX_WEBHOOK_TIMEOUT_SECONDS,
  MIN_WEBHOOK_TIMEOUT_SECONDS,
  MAX_AI_RATE_LIMIT_PER_MINUTE,
  MIN_AI_RATE_LIMIT_PER_MINUTE,
  MAX_STORAGE_BUCKET_LENGTH,
  generateLongString,
  generateTooLongString,
  DEFAULT_PLATFORM_DEBUG_ENABLED,
  DEFAULT_PLATFORM_LOG_LEVEL,
  DEFAULT_PLATFORM_OBSERVABILITY_ENABLED,
  DEFAULT_PLATFORM_FEATURE_FLAGS_ENABLED,
  DEFAULT_PLATFORM_WEBHOOKS_ENABLED,
  DEFAULT_PLATFORM_WEBHOOK_TIMEOUT_SECONDS,
  DEFAULT_PLATFORM_JOBS_ENABLED,
  DEFAULT_PLATFORM_EMAIL_ENABLED,
  DEFAULT_PLATFORM_STORAGE_ENABLED,
  DEFAULT_PLATFORM_AI_ENABLED,
  ENV_DEVELOPMENT,
  ENV_PRODUCTION,
  ENV_STAGING,
  ERROR_MESSAGES,
} from './constants';

describe('Platform Environment Validation', () => {
  useEnhancedTestIsolation();

  describe('Required Server Variables', () => {
    const setupRequiredVars = () => {
      setupPlatformEnvironment();
    };

    it('should validate required NODE_ENV', () => {
      setupRequiredVars();
      expect(platformEnv.NODE_ENV).toBe(ENV_DEVELOPMENT);
    });

    it('should use default NODE_ENV when not provided', () => {
      setupRequiredVars();
      delete process.env.NODE_ENV;
      expect(platformEnv.NODE_ENV).toBe(ENV_DEVELOPMENT);
    });

    it('should validate required APP_VERSION', () => {
      setupRequiredVars();
      process.env.APP_VERSION = VALID_APP_VERSION;
      expect(platformEnv.APP_VERSION).toBe(VALID_APP_VERSION);
    });

    it('should validate semantic versioning format', () => {
      setupRequiredVars();
      process.env.APP_VERSION = 'v2.0.0-beta';
      expect(platformEnv.APP_VERSION).toBe('v2.0.0-beta');
    });

    it('should throw error for invalid APP_VERSION format', () => {
      setupRequiredVars();
      process.env.APP_VERSION = INVALID_APP_VERSION;
      expectSpecificError(
        () => platformEnv.APP_VERSION,
        ERROR_MESSAGES.APP_VERSION_INVALID
      );
    });

    it('should validate required PLATFORM_REGION', () => {
      setupRequiredVars();
      process.env.PLATFORM_REGION = VALID_REGION;
      expect(platformEnv.PLATFORM_REGION).toBe(VALID_REGION);
    });

    it('should throw error for invalid PLATFORM_REGION format', () => {
      setupRequiredVars();
      process.env.PLATFORM_REGION = INVALID_REGION;
      expectSpecificError(
        () => platformEnv.PLATFORM_REGION,
        ERROR_MESSAGES.PLATFORM_REGION_INVALID
      );
    });

    it('should validate required PLATFORM_INSTANCE_ID', () => {
      setupRequiredVars();
      process.env.PLATFORM_INSTANCE_ID = VALID_INSTANCE_ID;
      expect(platformEnv.PLATFORM_INSTANCE_ID).toBe(VALID_INSTANCE_ID);
    });

    it('should throw error for missing PLATFORM_INSTANCE_ID', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_INSTANCE_ID;
      expectAnyError(() => platformEnv.PLATFORM_INSTANCE_ID);
    });

    it('should throw error for missing NEXT_PUBLIC_API_URL', () => {
      setupRequiredVars();
      delete process.env.NEXT_PUBLIC_API_URL;
      expectAnyError(() => platformEnv.NEXT_PUBLIC_API_URL);
    });

    it('should throw error for invalid NEXT_PUBLIC_API_URL format', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_API_URL = INVALID_API_URL;
      expectAnyError(() => platformEnv.NEXT_PUBLIC_API_URL);
    });
  });

  describe('Optional Variables', () => {
    const setupRequiredVars = () => {
      setupPlatformEnvironment();
    };

    it('should use default debug setting when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_DEBUG_ENABLED;
      expect(platformEnv.PLATFORM_DEBUG_ENABLED).toBe(DEFAULT_PLATFORM_DEBUG_ENABLED);
    });

    it('should validate debug enabled', () => {
      setupRequiredVars();
      process.env.PLATFORM_DEBUG_ENABLED = 'true';
      expect(platformEnv.PLATFORM_DEBUG_ENABLED).toBe(true);
    });

    it('should use default log level when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_LOG_LEVEL;
      expect(platformEnv.PLATFORM_LOG_LEVEL).toBe(DEFAULT_PLATFORM_LOG_LEVEL);
    });

    it('should validate custom log level', () => {
      setupRequiredVars();
      process.env.PLATFORM_LOG_LEVEL = 'debug';
      expect(platformEnv.PLATFORM_LOG_LEVEL).toBe('debug');
    });

    it('should use default observability setting when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_OBSERVABILITY_ENABLED;
      expect(platformEnv.PLATFORM_OBSERVABILITY_ENABLED).toBe(DEFAULT_PLATFORM_OBSERVABILITY_ENABLED);
    });

    it('should validate observability disabled', () => {
      setupRequiredVars();
      process.env.PLATFORM_OBSERVABILITY_ENABLED = 'false';
      expect(platformEnv.PLATFORM_OBSERVABILITY_ENABLED).toBe(false);
    });

    it('should validate OTEL collector endpoint when provided', () => {
      setupRequiredVars();
      process.env.PLATFORM_OBSERVABILITY_ENABLED = 'true';
      process.env.PLATFORM_OTEL_COLLECTOR_ENDPOINT = 'https://otel.example.com:4317';
      expect(platformEnv.PLATFORM_OTEL_COLLECTOR_ENDPOINT).toBe('https://otel.example.com:4317');
    });

    it('should use default feature flags setting when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_FEATURE_FLAGS_ENABLED;
      expect(platformEnv.PLATFORM_FEATURE_FLAGS_ENABLED).toBe(DEFAULT_PLATFORM_FEATURE_FLAGS_ENABLED);
    });

    it('should validate feature flags enabled', () => {
      setupRequiredVars();
      process.env.PLATFORM_FEATURE_FLAGS_ENABLED = 'true';
      expect(platformEnv.PLATFORM_FEATURE_FLAGS_ENABLED).toBe(true);
    });

    it('should use default webhooks setting when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_WEBHOOKS_ENABLED;
      expect(platformEnv.PLATFORM_WEBHOOKS_ENABLED).toBe(DEFAULT_PLATFORM_WEBHOOKS_ENABLED);
    });

    it('should validate webhooks disabled', () => {
      setupRequiredVars();
      process.env.PLATFORM_WEBHOOKS_ENABLED = 'false';
      expect(platformEnv.PLATFORM_WEBHOOKS_ENABLED).toBe(false);
    });

    it('should use default webhook timeout when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_WEBHOOK_TIMEOUT_SECONDS;
      expect(platformEnv.PLATFORM_WEBHOOK_TIMEOUT_SECONDS).toBe(DEFAULT_PLATFORM_WEBHOOK_TIMEOUT_SECONDS);
    });

    it('should validate custom webhook timeout', () => {
      setupRequiredVars();
      process.env.PLATFORM_WEBHOOK_TIMEOUT_SECONDS = '60';
      expect(platformEnv.PLATFORM_WEBHOOK_TIMEOUT_SECONDS).toBe(60);
    });

    it('should use default jobs setting when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_JOBS_ENABLED;
      expect(platformEnv.PLATFORM_JOBS_ENABLED).toBe(DEFAULT_PLATFORM_JOBS_ENABLED);
    });

    it('should validate jobs disabled', () => {
      setupRequiredVars();
      process.env.PLATFORM_JOBS_ENABLED = 'false';
      expect(platformEnv.PLATFORM_JOBS_ENABLED).toBe(false);
    });

    it('should use default email setting when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_EMAIL_ENABLED;
      expect(platformEnv.PLATFORM_EMAIL_ENABLED).toBe(DEFAULT_PLATFORM_EMAIL_ENABLED);
    });

    it('should validate email disabled', () => {
      setupRequiredVars();
      process.env.PLATFORM_EMAIL_ENABLED = 'false';
      expect(platformEnv.PLATFORM_EMAIL_ENABLED).toBe(false);
    });

    it('should use default storage setting when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_STORAGE_ENABLED;
      expect(platformEnv.PLATFORM_STORAGE_ENABLED).toBe(DEFAULT_PLATFORM_STORAGE_ENABLED);
    });

    it('should validate storage disabled', () => {
      setupRequiredVars();
      process.env.PLATFORM_STORAGE_ENABLED = 'false';
      expect(platformEnv.PLATFORM_STORAGE_ENABLED).toBe(false);
    });

    it('should use default AI setting when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_AI_ENABLED;
      expect(platformEnv.PLATFORM_AI_ENABLED).toBe(DEFAULT_PLATFORM_AI_ENABLED);
    });

    it('should validate AI enabled', () => {
      setupRequiredVars();
      process.env.PLATFORM_AI_ENABLED = 'true';
      expect(platformEnv.PLATFORM_AI_ENABLED).toBe(true);
    });
  });

  describe('Client Variables', () => {
    const setupRequiredVars = () => {
      setupPlatformEnvironment();
    };

    it('should validate NEXT_PUBLIC_PLATFORM_ENV', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_PLATFORM_ENV = 'staging';
      expect(platformEnv.NEXT_PUBLIC_PLATFORM_ENV).toBe('staging');
    });

    it('should use default NEXT_PUBLIC_PLATFORM_ENV when not provided', () => {
      setupRequiredVars();
      delete process.env.NEXT_PUBLIC_PLATFORM_ENV;
      expect(platformEnv.NEXT_PUBLIC_PLATFORM_ENV).toBe(ENV_DEVELOPMENT);
    });

    it('should validate NEXT_PUBLIC_DEBUG_ENABLED', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_DEBUG_ENABLED = 'true';
      expect(platformEnv.NEXT_PUBLIC_DEBUG_ENABLED).toBe(true);
    });

    it('should validate NEXT_PUBLIC_FEATURE_FLAGS_ENABLED', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_FEATURE_FLAGS_ENABLED = 'true';
      expect(platformEnv.NEXT_PUBLIC_FEATURE_FLAGS_ENABLED).toBe(true);
    });

    it('should validate NEXT_PUBLIC_AI_ENABLED', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_AI_ENABLED = 'true';
      expect(platformEnv.NEXT_PUBLIC_AI_ENABLED).toBe(true);
    });

    it('should validate NEXT_PUBLIC_SENTRY_DSN', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://1234567890abcdef.ingest.sentry.io/123456';
      expect(platformEnv.NEXT_PUBLIC_SENTRY_DSN).toBe('https://1234567890abcdef.ingest.sentry.io/123456');
    });

    it('should validate NEXT_PUBLIC_ANALYTICS_ENABLED', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = 'true';
      expect(platformEnv.NEXT_PUBLIC_ANALYTICS_ENABLED).toBe(true);
    });

    it('should validate NEXT_PUBLIC_ANALYTICS_ID', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_ANALYTICS_ID = 'GA-123456789';
      expect(platformEnv.NEXT_PUBLIC_ANALYTICS_ID).toBe('GA-123456789');
    });
  });

  describe('Edge Cases', () => {
    const setupRequiredVars = () => {
      setupPlatformEnvironment();
    };

    it('should handle maximum instance ID length', () => {
      setupRequiredVars();
      process.env.PLATFORM_INSTANCE_ID = generateLongString(MAX_INSTANCE_ID_LENGTH);
      expect(platformEnv.PLATFORM_INSTANCE_ID).toBe(generateLongString(MAX_INSTANCE_ID_LENGTH));
    });

    it('should reject instance ID that exceeds maximum length', () => {
      setupRequiredVars();
      process.env.PLATFORM_INSTANCE_ID = generateTooLongString(MAX_INSTANCE_ID_LENGTH);
      expectAnyError(() => platformEnv.PLATFORM_INSTANCE_ID);
    });

    it('should handle maximum webhook timeout', () => {
      setupRequiredVars();
      process.env.PLATFORM_WEBHOOK_TIMEOUT_SECONDS = MAX_WEBHOOK_TIMEOUT_SECONDS.toString();
      expect(platformEnv.PLATFORM_WEBHOOK_TIMEOUT_SECONDS).toBe(MAX_WEBHOOK_TIMEOUT_SECONDS);
    });

    it('should handle minimum webhook timeout', () => {
      setupRequiredVars();
      process.env.PLATFORM_WEBHOOK_TIMEOUT_SECONDS = MIN_WEBHOOK_TIMEOUT_SECONDS.toString();
      expect(platformEnv.PLATFORM_WEBHOOK_TIMEOUT_SECONDS).toBe(MIN_WEBHOOK_TIMEOUT_SECONDS);
    });

    it('should handle maximum AI rate limit', () => {
      setupRequiredVars();
      process.env.PLATFORM_AI_RATE_LIMIT_PER_MINUTE = MAX_AI_RATE_LIMIT_PER_MINUTE.toString();
      expect(platformEnv.PLATFORM_AI_RATE_LIMIT_PER_MINUTE).toBe(MAX_AI_RATE_LIMIT_PER_MINUTE);
    });

    it('should handle minimum AI rate limit', () => {
      setupRequiredVars();
      process.env.PLATFORM_AI_RATE_LIMIT_PER_MINUTE = MIN_AI_RATE_LIMIT_PER_MINUTE.toString();
      expect(platformEnv.PLATFORM_AI_RATE_LIMIT_PER_MINUTE).toBe(MIN_AI_RATE_LIMIT_PER_MINUTE);
    });

    it('should handle valid storage bucket name', () => {
      setupRequiredVars();
      process.env.PLATFORM_STORAGE_BUCKET = 'my-valid-bucket.name';
      expect(platformEnv.PLATFORM_STORAGE_BUCKET).toBe('my-valid-bucket.name');
    });

    it('should reject storage bucket with invalid characters', () => {
      setupRequiredVars();
      process.env.PLATFORM_STORAGE_BUCKET = 'Invalid_Bucket_Name';
      expectSpecificError(
        () => platformEnv.PLATFORM_STORAGE_BUCKET,
        ERROR_MESSAGES.PLATFORM_STORAGE_BUCKET_INVALID
      );
    });

    it('should handle maximum storage bucket length', () => {
      setupRequiredVars();
      process.env.PLATFORM_STORAGE_BUCKET = generateLongString(MAX_STORAGE_BUCKET_LENGTH);
      expect(platformEnv.PLATFORM_STORAGE_BUCKET).toBe(generateLongString(MAX_STORAGE_BUCKET_LENGTH));
    });

    it('should reject storage bucket that exceeds maximum length', () => {
      setupRequiredVars();
      process.env.PLATFORM_STORAGE_BUCKET = generateTooLongString(MAX_STORAGE_BUCKET_LENGTH);
      expectAnyError(() => platformEnv.PLATFORM_STORAGE_BUCKET);
    });
  });
});
