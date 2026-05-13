/**
 * Test constants for environment validation tests
 */

// Valid test values
export const VALID_AUTH_SECRET = 'super-secret-auth-key-32-chars-long';
export const VALID_API_KEY_SECRET = 'api-key-secret-32-chars-long-minimum';
export const VALID_DATABASE_URL = 'postgresql://app_user:secure_password@db.example.com:5432/production_db';
export const VALID_REDIS_URL = 'redis://redis.example.com:6379';
export const VALID_REDIS_SECURE_URL = 'rediss://redis.example.com:6380';
export const VALID_AUTH_URL = 'https://auth.example.com';
export const VALID_LOCALHOST_AUTH_URL = 'http://localhost:3000';
export const VALID_API_URL = 'https://api.example.com';
export const VALID_APP_VERSION = 'v2.1.0';
export const VALID_REGION = 'us-west-2';
export const VALID_INSTANCE_ID = 'i-0123456789abcdef0';
export const VALID_SCHEMA = 'tenant_123_schema';
export const VALID_KEY_PREFIX = 'tenant123:';

// Invalid test values
export const INVALID_SHORT_SECRET = 'short';
export const INVALID_HTTP_AUTH_URL = 'http://auth.example.com';
export const INVALID_DATABASE_URL = 'mysql://user:pass@localhost:3306/test';
export const INVALID_REDIS_URL = 'http://localhost:6379';
export const INVALID_SCHEMA = 'Invalid-Schema';
export const INVALID_REGION = 'Invalid Region';
export const INVALID_APP_VERSION = '1.0.0';
export const INVALID_KEY_PREFIX = 'Invalid Prefix!';
export const INVALID_API_URL = 'ftp://invalid.com';

// Realistic invalid values for better testing
export const INVALID_MALFORMED_URL = 'https://example.com:invalid-port/path';
export const INVALID_MALFORMED_SECRET = 'insecure-secret-too-short';
export const INVALID_SPECIAL_CHARS_URL = 'https://example.com/path with spaces';
export const INVALID_NULL_VERSION = 'null';
export const INVALID_UNDEFINED_VERSION = 'undefined';
export const INVALID_EMPTY_URL = '';
export const INVALID_SPACES_ONLY = '   ';

// Boundary values
export const MAX_SECRET_LENGTH = 32;
export const MIN_SECRET_LENGTH = 32;
export const MAX_POOL_SIZE = 100;
export const MIN_POOL_SIZE = 1;
export const MAX_TIMEOUT_SECONDS = 300;
export const MIN_TIMEOUT_SECONDS = 1;
export const MAX_SESSION_TIMEOUT_HOURS = 168;
export const MIN_SESSION_TIMEOUT_HOURS = 1;
export const MAX_CONCURRENT_SESSIONS = 20;
export const MIN_CONCURRENT_SESSIONS = 1;
export const MAX_RATE_LIMIT_ATTEMPTS = 100;
export const MIN_RATE_LIMIT_ATTEMPTS = 1;
export const MAX_RATE_LIMIT_WINDOW_MINUTES = 60;
export const MIN_RATE_LIMIT_WINDOW_MINUTES = 1;
export const MAX_TOTP_ISSUER_LENGTH = 100;
export const MAX_SCHEMA_LENGTH = 63;
export const MAX_INSTANCE_ID_LENGTH = 100;
export const MAX_WEBHOOK_TIMEOUT_SECONDS = 300;
export const MIN_WEBHOOK_TIMEOUT_SECONDS = 1;
export const MAX_AI_RATE_LIMIT_PER_MINUTE = 1000;
export const MIN_AI_RATE_LIMIT_PER_MINUTE = 1;
export const MAX_STORAGE_BUCKET_LENGTH = 63;
export const MAX_KEY_PREFIX_LENGTH = 50;
export const MAX_REDIS_DB = 15;
export const MIN_REDIS_DB = 0;
export const MAX_REDIS_TIMEOUT_MS = 60000;
export const MIN_REDIS_TIMEOUT_MS = 100;
export const MAX_REDIS_DEFAULT_TTL_SECONDS = 86400;
export const MIN_REDIS_DEFAULT_TTL_SECONDS = 1;
export const MAX_REDIS_MAX_RETRIES = 10;
export const MIN_REDIS_MAX_RETRIES = 0;

// Default values
export const DEFAULT_SESSION_TIMEOUT_HOURS = 24;
export const DEFAULT_MAX_CONCURRENT_SESSIONS = 5;
export const DEFAULT_MFA_ENABLED = false;
export const DEFAULT_IMPERSONATION_ENABLED = false;
export const DEFAULT_RATE_LIMIT_ATTEMPTS = 5;
export const DEFAULT_RATE_LIMIT_WINDOW_MINUTES = 1;
export const DEFAULT_DATABASE_POOL_SIZE = 10;
export const DEFAULT_DATABASE_TIMEOUT_SECONDS = 30;
export const DEFAULT_DATABASE_SSL_ENABLED = true;
export const DEFAULT_REDIS_DB = 0;
export const DEFAULT_REDIS_TIMEOUT_MS = 5000;
export const DEFAULT_REDIS_MAX_RETRIES = 3;
export const DEFAULT_REDIS_DEFAULT_TTL_SECONDS = 3600;
export const DEFAULT_REDIS_CLUSTER_ENABLED = false;
export const DEFAULT_PLATFORM_DEBUG_ENABLED = false;
export const DEFAULT_PLATFORM_LOG_LEVEL = 'info';
export const DEFAULT_PLATFORM_OBSERVABILITY_ENABLED = true;
export const DEFAULT_PLATFORM_FEATURE_FLAGS_ENABLED = false;
export const DEFAULT_PLATFORM_WEBHOOKS_ENABLED = true;
export const DEFAULT_PLATFORM_WEBHOOK_TIMEOUT_SECONDS = 30;
export const DEFAULT_PLATFORM_JOBS_ENABLED = true;
export const DEFAULT_PLATFORM_EMAIL_ENABLED = true;
export const DEFAULT_PLATFORM_STORAGE_ENABLED = true;
export const DEFAULT_PLATFORM_AI_ENABLED = false;

// Environment names
export const ENV_DEVELOPMENT = 'development';
export const ENV_PRODUCTION = 'production';
export const ENV_STAGING = 'staging';

// OAuth providers
export const OAUTH_PROVIDERS = ['google', 'github', 'microsoft'];

// Test data generators
export const generateLongString = (length: number): string => 'a'.repeat(length);
export const generateTooLongString = (length: number): string => 'a'.repeat(length + 1);

// Enhanced test data generators for edge cases
export const generateEdgeCaseData = {
  // Unicode and international characters
  unicodeString: (): string => '🔐🌍🚀áéíóúñ中文日本語한국어',
  emojiString: (): string => '🔑🔒🛡️⚡🎯',
  chineseChars: (): string => '中文测试环境变量',
  japaneseChars: (): string => '日本語環境変数テスト',
  koreanChars: (): string => '한국어환경변수테스트',
  
  // Special characters that might cause issues
  specialChars: (): string => 'test-env_var.test@123#$',
  whitespaceVariants: (): string => '  test\tvalue\n\r  ',
  controlChars: (): string => 'test\x00\x1f\x7fvalue',
  
  // Numeric edge cases
  zeroString: (): string => '0',
  negativeNumber: (): string => '-1',
  largeNumber: (): string => '999999999999999999999',
  decimalNumber: (): string => '3.14159',
  
  // URL edge cases
  urlWithCredentials: (): string => 'postgresql://user:pass@localhost:5432/test',
  urlWithPort: (): string => 'https://example.com:8080',
  urlWithPath: (): string => 'https://example.com/api/v1/auth',
  urlWithQuery: (): string => 'https://example.com?param=value&other=test',
  urlWithFragment: (): string => 'https://example.com#section',
  
  // Boolean edge cases
  truthyStrings: (): string[] => ['true', '1', 'yes', 'on', 'enabled'],
  falsyStrings: (): string[] => ['false', '0', 'no', 'off', 'disabled', ''],
  
  // JSON-like strings
  jsonString: (): string => '{"key": "value", "nested": {"test": true}}',
  malformedJson: (): string => '{key: value, nested: {test: true}}',
  
  // SQL injection patterns (should be escaped/rejected)
  sqlInjection: (): string => "'; DROP TABLE users; --",
  xssPattern: (): string => '<script>alert("xss")</script>',
  
  // Path traversal patterns
  pathTraversal: (): string => '../../../etc/passwd',
  windowsPath: (): string => 'C:\\Windows\\System32',
  
  // Empty and null-like values
  emptyString: (): string => '',
  spaceString: (): string => ' ',
  tabString: (): string => '\t',
  newlineString: (): string => '\n',
};

// Error message constants for standardized validation
export const ERROR_MESSAGES = {
  // Auth errors
  AUTH_SECRET_TOO_SHORT: 'AUTH_SECRET must be at least 32 characters long',
  AUTH_API_KEY_SECRET_TOO_SHORT: 'AUTH_API_KEY_SECRET must be at least 32 characters long',
  AUTH_URL_HTTPS_REQUIRED: 'AUTH_URL must use HTTPS in production or localhost',
  AUTH_TOTP_ISSUER_TOO_LONG: 'AUTH_TOTP_ISSUER must be at most',
  AUTH_PUBLIC_PROVIDERS_INVALID: 'Invalid OAuth provider',
  
  // Database errors
  DATABASE_URL_INVALID: 'DATABASE_URL must be a PostgreSQL connection string',
  DATABASE_SCHEMA_INVALID: 'DATABASE_SCHEMA must contain only lowercase letters',
  DATABASE_SCHEMA_TOO_LONG: 'DATABASE_SCHEMA must be at most',
  DATABASE_SCHEMA_INVALID_START: 'DATABASE_SCHEMA must start with a letter',
  
  // Redis errors
  REDIS_URL_INVALID: 'REDIS_URL must be a Redis connection string',
  REDIS_KEY_PREFIX_INVALID: 'REDIS_KEY_PREFIX must contain only lowercase letters',
  REDIS_KEY_PREFIX_TOO_LONG: 'REDIS_KEY_PREFIX must be at most',
  REDIS_DB_OUT_OF_RANGE: 'REDIS_DB must be between',
  REDIS_TIMEOUT_OUT_OF_RANGE: 'REDIS_TIMEOUT_MS must be between',
  REDIS_TTL_OUT_OF_RANGE: 'REDIS_DEFAULT_TTL_SECONDS must be between',
  REDIS_RETRIES_OUT_OF_RANGE: 'REDIS_MAX_RETRIES must be between',
  
  // Platform errors
  APP_VERSION_INVALID: 'APP_VERSION must follow semantic versioning',
  PLATFORM_REGION_INVALID: 'PLATFORM_REGION must contain only lowercase letters',
  PLATFORM_INSTANCE_ID_TOO_LONG: 'PLATFORM_INSTANCE_ID must be at most',
  PLATFORM_API_URL_INVALID: 'NEXT_PUBLIC_API_URL must be a valid HTTP/HTTPS URL',
  PLATFORM_STORAGE_BUCKET_INVALID: 'PLATFORM_STORAGE_BUCKET must contain only lowercase letters',
  PLATFORM_STORAGE_BUCKET_TOO_LONG: 'PLATFORM_STORAGE_BUCKET must be at most',
  
  // General errors
  ENV_VALIDATION_FAILED: 'Environment validation failed',
  REQUIRED_VAR_MISSING: 'is required',
} as const;
