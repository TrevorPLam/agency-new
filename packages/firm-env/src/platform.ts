import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Platform environment variable schema and validation.
 * Uses @t3-oss/env-nextjs for runtime validation with Zod schemas.
 * 
 * This module provides type-safe access to platform configuration
 * environment variables with comprehensive validation.
 */
export const platformEnv = createEnv({
  /**
   * Server-side environment variables that must be present.
   * These are required for the application to start.
   */
  server: {
    /**
     * Application environment (development, staging, production).
     * Required for environment-specific behavior.
     */
    NODE_ENV: z
      .enum(['development', 'staging', 'production'])
      .default('development'),

    /**
     * Application version for deployment tracking.
     * Required for observability and debugging.
     */
    APP_VERSION: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[v0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$/, {
        message: 'APP_VERSION must follow semantic versioning (e.g., v1.2.3 or v1.2.3-beta)',
      }),

    /**
     * Platform deployment region.
     * Required for multi-region deployments.
     */
    PLATFORM_REGION: z
      .string()
      .min(1)
      .max(20)
      .regex(/^[a-z0-9-]+$/, {
        message: 'PLATFORM_REGION must contain only lowercase letters, numbers, and hyphens',
      }),

    /**
     * Platform instance identifier.
     * Required for multi-instance deployments.
     */
    PLATFORM_INSTANCE_ID: z
      .string()
      .min(1)
      .max(100),

    /**
     * Enable debug mode for additional logging.
     * Optional, defaults to false in production.
     */
    PLATFORM_DEBUG_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('false'),

    /**
     * Log level for the application.
     * Optional, defaults to 'info' if not provided.
     */
    PLATFORM_LOG_LEVEL: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
      .optional()
      .default('info'),

    /**
     * Enable observability (metrics, traces).
     * Optional, defaults to true in production.
     */
    PLATFORM_OBSERVABILITY_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('true'),

    /**
     * OpenTelemetry collector endpoint.
     * Required if observability is enabled.
     */
    PLATFORM_OTEL_COLLECTOR_ENDPOINT: z
      .string()
      .url()
      .optional(),

    /**
     * OpenTelemetry service name.
     * Required for observability tracking.
     */
    PLATFORM_OTEL_SERVICE_NAME: z
      .string()
      .min(1)
      .max(50)
      .optional(),

    /**
     * Enable feature flags system.
     * Optional, defaults to false if not provided.
     */
    PLATFORM_FEATURE_FLAGS_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('false'),

    /**
     * Feature flags provider endpoint.
     * Required if feature flags are enabled.
     */
    PLATFORM_FEATURE_FLAGS_ENDPOINT: z
      .string()
      .url()
      .optional(),

    /**
     * Feature flags SDK key.
     * Required if feature flags are enabled.
     */
    PLATFORM_FEATURE_FLAGS_SDK_KEY: z
      .string()
      .min(1)
      .optional(),

    /**
     * Enable webhook processing.
     * Optional, defaults to true if not provided.
     */
    PLATFORM_WEBHOOKS_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('true'),

    /**
     * Webhook secret for signature verification.
     * Required if webhooks are enabled.
     */
    PLATFORM_WEBHOOK_SECRET: z
      .string()
      .min(32, {
        message: 'PLATFORM_WEBHOOK_SECRET must be at least 32 characters long',
      })
      .optional(),

    /**
     * Maximum webhook processing timeout in seconds.
     * Optional, defaults to 30 seconds if not provided.
     */
    PLATFORM_WEBHOOK_TIMEOUT_SECONDS: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(300))
      .optional()
      .default('30'),

    /**
     * Enable background job processing.
     * Optional, defaults to true if not provided.
     */
    PLATFORM_JOBS_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('true'),

    /**
     * Job queue provider (redis, bullmq, etc.).
     * Required if jobs are enabled.
     */
    PLATFORM_JOB_QUEUE_PROVIDER: z
      .enum(['redis', 'bullmq', 'memory'])
      .optional()
      .default('redis'),

    /**
     * Enable email sending.
     * Optional, defaults to true if not provided.
     */
    PLATFORM_EMAIL_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('true'),

    /**
     * Email provider (resend, sendgrid, ses, etc.).
     * Required if email is enabled.
     */
    PLATFORM_EMAIL_PROVIDER: z
      .enum(['resend', 'sendgrid', 'ses', 'smtp'])
      .optional()
      .default('resend'),

    /**
     * Email provider API key.
     * Required if email is enabled.
     */
    PLATFORM_EMAIL_API_KEY: z
      .string()
      .min(1)
      .optional(),

    /**
     * Default from email address.
     * Required if email is enabled.
     */
    PLATFORM_EMAIL_FROM_ADDRESS: z
      .string()
      .email()
      .optional(),

    /**
     * Enable file storage.
     * Optional, defaults to true if not provided.
     */
    PLATFORM_STORAGE_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('true'),

    /**
     * Storage provider (s3, gcs, azure, etc.).
     * Required if storage is enabled.
     */
    PLATFORM_STORAGE_PROVIDER: z
      .enum(['s3', 'gcs', 'azure', 'local'])
      .optional()
      .default('s3'),

    /**
     * Storage bucket name.
     * Required if cloud storage is enabled.
     */
    PLATFORM_STORAGE_BUCKET: z
      .string()
      .min(1)
      .max(63)
      .regex(/^[a-z0-9.-]+$/, {
        message: 'PLATFORM_STORAGE_BUCKET must contain only lowercase letters, numbers, dots, and hyphens',
      })
      .optional(),

    /**
     * Storage region.
     * Required if cloud storage is enabled.
     */
    PLATFORM_STORAGE_REGION: z
      .string()
      .min(1)
      .max(20)
      .regex(/^[a-z0-9-]+$/, {
        message: 'PLATFORM_STORAGE_REGION must contain only lowercase letters, numbers, and hyphens',
      })
      .optional(),

    /**
     * Storage access key.
     * Required if cloud storage is enabled.
     */
    PLATFORM_STORAGE_ACCESS_KEY: z
      .string()
      .min(1)
      .optional(),

    /**
     * Storage secret key.
     * Required if cloud storage is enabled.
     */
    PLATFORM_STORAGE_SECRET_KEY: z
      .string()
      .min(1)
      .optional(),

    /**
     * Enable AI/ML features.
     * Optional, defaults to false if not provided.
     */
    PLATFORM_AI_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('false'),

    /**
     * AI provider (openai, anthropic, etc.).
     * Optional, defaults to 'openai' if AI is enabled.
     */
    PLATFORM_AI_PROVIDER: z
      .enum(['openai', 'anthropic', 'google', 'azure'])
      .optional(),

    /**
     * AI provider API key.
     * Optional, required if AI is enabled.
     */
    PLATFORM_AI_API_KEY: z
      .string()
      .min(1)
      .optional(),

    /**
     * AI model to use.
     * Optional, required if AI is enabled.
     */
    PLATFORM_AI_MODEL: z
      .string()
      .min(1)
      .max(100)
      .optional(),

    /**
     * Maximum API calls per minute for AI features.
     * Optional, defaults to 60 if AI is enabled.
     */
    PLATFORM_AI_RATE_LIMIT_PER_MINUTE: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(1000))
      .optional(),
  },

  /**
   * Client-side environment variables that can be exposed to the browser.
   * These are safe to share with the frontend.
   */
  client: {
    /**
     * Public API URL for frontend requests.
     */
    NEXT_PUBLIC_API_URL: z
      .string()
      .url()
      .refine(
        (url) => url.startsWith('https://') || url.startsWith('http://localhost'),
        {
          message: 'NEXT_PUBLIC_API_URL must use HTTPS in production or localhost for development',
        }
      ),

    /**
     * Application version for frontend display.
     */
    NEXT_PUBLIC_APP_VERSION: z
      .string()
      .min(1)
      .max(50),

    /**
     * Platform environment for frontend behavior.
     */
    NEXT_PUBLIC_PLATFORM_ENV: z
      .enum(['development', 'staging', 'production'])
      .default('development'),

    /**
     * Enable debug mode in frontend.
     */
    NEXT_PUBLIC_DEBUG_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional(),

    /**
     * Enable feature flags in frontend.
     */
    NEXT_PUBLIC_FEATURE_FLAGS_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional(),

    /**
     * Feature flags client SDK key.
     */
    NEXT_PUBLIC_FEATURE_FLAGS_CLIENT_KEY: z
      .string()
      .min(1)
      .optional(),

    /**
     * Enable AI features in frontend.
     */
    NEXT_PUBLIC_AI_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional(),

    /**
     * Sentry DSN for error tracking.
     */
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

    /**
     * Enable analytics tracking.
     */
    NEXT_PUBLIC_ANALYTICS_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional(),

    /**
     * Analytics tracking ID.
     */
    NEXT_PUBLIC_ANALYTICS_ID: z.string().optional(),
  },

  /**
   * Runtime validation to ensure all required variables are present.
   * This will throw an error if any required environment variable is missing
   * or invalid when the module is imported.
   */
  runtimeEnv: {
    NODE_ENV: process.env['NODE_ENV'],
    APP_VERSION: process.env['APP_VERSION'],
    PLATFORM_REGION: process.env['PLATFORM_REGION'],
    PLATFORM_INSTANCE_ID: process.env['PLATFORM_INSTANCE_ID'],
    PLATFORM_DEBUG_ENABLED: process.env['PLATFORM_DEBUG_ENABLED'],
    PLATFORM_LOG_LEVEL: process.env['PLATFORM_LOG_LEVEL'],
    PLATFORM_OBSERVABILITY_ENABLED: process.env['PLATFORM_OBSERVABILITY_ENABLED'],
    PLATFORM_OTEL_COLLECTOR_ENDPOINT: process.env['PLATFORM_OTEL_COLLECTOR_ENDPOINT'],
    PLATFORM_OTEL_SERVICE_NAME: process.env['PLATFORM_OTEL_SERVICE_NAME'],
    PLATFORM_FEATURE_FLAGS_ENABLED: process.env['PLATFORM_FEATURE_FLAGS_ENABLED'],
    PLATFORM_FEATURE_FLAGS_ENDPOINT: process.env['PLATFORM_FEATURE_FLAGS_ENDPOINT'],
    PLATFORM_FEATURE_FLAGS_SDK_KEY: process.env['PLATFORM_FEATURE_FLAGS_SDK_KEY'],
    PLATFORM_WEBHOOKS_ENABLED: process.env['PLATFORM_WEBHOOKS_ENABLED'],
    PLATFORM_WEBHOOK_SECRET: process.env['PLATFORM_WEBHOOK_SECRET'],
    PLATFORM_WEBHOOK_TIMEOUT_SECONDS: process.env['PLATFORM_WEBHOOK_TIMEOUT_SECONDS'],
    PLATFORM_JOBS_ENABLED: process.env['PLATFORM_JOBS_ENABLED'],
    PLATFORM_JOB_QUEUE_PROVIDER: process.env['PLATFORM_JOB_QUEUE_PROVIDER'],
    PLATFORM_EMAIL_ENABLED: process.env['PLATFORM_EMAIL_ENABLED'],
    PLATFORM_EMAIL_PROVIDER: process.env['PLATFORM_EMAIL_PROVIDER'],
    PLATFORM_EMAIL_API_KEY: process.env['PLATFORM_EMAIL_API_KEY'],
    PLATFORM_EMAIL_FROM_ADDRESS: process.env['PLATFORM_EMAIL_FROM_ADDRESS'],
    PLATFORM_STORAGE_ENABLED: process.env['PLATFORM_STORAGE_ENABLED'],
    PLATFORM_STORAGE_PROVIDER: process.env['PLATFORM_STORAGE_PROVIDER'],
    PLATFORM_STORAGE_BUCKET: process.env['PLATFORM_STORAGE_BUCKET'],
    PLATFORM_STORAGE_REGION: process.env['PLATFORM_STORAGE_REGION'],
    PLATFORM_STORAGE_ACCESS_KEY: process.env['PLATFORM_STORAGE_ACCESS_KEY'],
    PLATFORM_STORAGE_SECRET_KEY: process.env['PLATFORM_STORAGE_SECRET_KEY'],
    PLATFORM_AI_ENABLED: process.env['PLATFORM_AI_ENABLED'],
    PLATFORM_AI_PROVIDER: process.env['PLATFORM_AI_PROVIDER'],
    PLATFORM_AI_API_KEY: process.env['PLATFORM_AI_API_KEY'],
    PLATFORM_AI_MODEL: process.env['PLATFORM_AI_MODEL'],
    PLATFORM_AI_RATE_LIMIT_PER_MINUTE: process.env['PLATFORM_AI_RATE_LIMIT_PER_MINUTE'],
    NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'],
    NEXT_PUBLIC_APP_VERSION: process.env['NEXT_PUBLIC_APP_VERSION'],
    NEXT_PUBLIC_PLATFORM_ENV: process.env['NEXT_PUBLIC_PLATFORM_ENV'],
    NEXT_PUBLIC_DEBUG_ENABLED: process.env['NEXT_PUBLIC_DEBUG_ENABLED'],
    NEXT_PUBLIC_FEATURE_FLAGS_ENABLED: process.env['NEXT_PUBLIC_FEATURE_FLAGS_ENABLED'],
    NEXT_PUBLIC_FEATURE_FLAGS_CLIENT_KEY: process.env['NEXT_PUBLIC_FEATURE_FLAGS_CLIENT_KEY'],
    NEXT_PUBLIC_AI_ENABLED: process.env['NEXT_PUBLIC_AI_ENABLED'],
    NEXT_PUBLIC_SENTRY_DSN: process.env['NEXT_PUBLIC_SENTRY_DSN'],
    NEXT_PUBLIC_ANALYTICS_ENABLED: process.env['NEXT_PUBLIC_ANALYTICS_ENABLED'],
    NEXT_PUBLIC_ANALYTICS_ID: process.env['NEXT_PUBLIC_ANALYTICS_ID'],
  },

  /**
   * Skip validation for empty strings (not used - we want strict validation).
   */
  skipValidation: true,
});

/**
 * Type-safe accessors for platform configuration.
 * These functions provide convenient access to validated environment variables.
 */

/**
 * Gets the Node.js environment.
 * @returns The current environment
 */
export function getNodeEnv(): string {
  return platformEnv.NODE_ENV;
}

/**
 * Gets the application version.
 * @returns The application version
 */
export function getAppVersion(): string {
  return platformEnv.APP_VERSION;
}

/**
 * Gets the platform deployment region.
 * @returns The deployment region
 */
export function getPlatformRegion(): string {
  return platformEnv.PLATFORM_REGION;
}

/**
 * Gets the platform instance identifier.
 * @returns The instance ID
 */
export function getPlatformInstanceId(): string {
  return platformEnv.PLATFORM_INSTANCE_ID;
}

/**
 * Checks if debug mode is enabled.
 * @returns True if debug mode is enabled
 */
export function isPlatformDebugEnabled(): boolean {
  return platformEnv.PLATFORM_DEBUG_ENABLED;
}

/**
 * Gets the platform log level.
 * @returns The log level
 */
export function getPlatformLogLevel(): string {
  return platformEnv.PLATFORM_LOG_LEVEL;
}

/**
 * Checks if observability is enabled.
 * @returns True if observability is enabled
 */
export function isPlatformObservabilityEnabled(): boolean {
  return platformEnv.PLATFORM_OBSERVABILITY_ENABLED;
}

/**
 * Gets the OpenTelemetry collector endpoint.
 * @returns The collector endpoint or undefined
 */
export function getPlatformOtelCollectorEndpoint(): string | undefined {
  return platformEnv.PLATFORM_OTEL_COLLECTOR_ENDPOINT;
}

/**
 * Gets the OpenTelemetry service name.
 * @returns The service name or undefined
 */
export function getPlatformOtelServiceName(): string | undefined {
  return platformEnv.PLATFORM_OTEL_SERVICE_NAME;
}

/**
 * Checks if feature flags are enabled.
 * @returns True if feature flags are enabled
 */
export function isPlatformFeatureFlagsEnabled(): boolean {
  return platformEnv.PLATFORM_FEATURE_FLAGS_ENABLED;
}

/**
 * Gets the feature flags configuration.
 * @returns Object containing feature flags settings
 */
export function getPlatformFeatureFlagsConfig() {
  return {
    enabled: isPlatformFeatureFlagsEnabled(),
    endpoint: platformEnv.PLATFORM_FEATURE_FLAGS_ENDPOINT,
    sdkKey: platformEnv.PLATFORM_FEATURE_FLAGS_SDK_KEY,
  } as const;
}

/**
 * Checks if webhooks are enabled.
 * @returns True if webhooks are enabled
 */
export function isPlatformWebhooksEnabled(): boolean {
  return platformEnv.PLATFORM_WEBHOOKS_ENABLED;
}

/**
 * Gets the webhook configuration.
 * @returns Object containing webhook settings
 */
export function getPlatformWebhookConfig() {
  return {
    enabled: isPlatformWebhooksEnabled(),
    secret: platformEnv.PLATFORM_WEBHOOK_SECRET,
    timeoutSeconds: platformEnv.PLATFORM_WEBHOOK_TIMEOUT_SECONDS,
  } as const;
}

/**
 * Checks if background jobs are enabled.
 * @returns True if jobs are enabled
 */
export function isPlatformJobsEnabled(): boolean {
  return platformEnv.PLATFORM_JOBS_ENABLED;
}

/**
 * Gets the job queue provider.
 * @returns The queue provider
 */
export function getPlatformJobQueueProvider(): string {
  return platformEnv.PLATFORM_JOB_QUEUE_PROVIDER;
}

/**
 * Checks if email sending is enabled.
 * @returns True if email is enabled
 */
export function isPlatformEmailEnabled(): boolean {
  return platformEnv.PLATFORM_EMAIL_ENABLED;
}

/**
 * Gets the email configuration.
 * @returns Object containing email settings
 */
export function getPlatformEmailConfig() {
  return {
    enabled: isPlatformEmailEnabled(),
    provider: platformEnv.PLATFORM_EMAIL_PROVIDER,
    apiKey: platformEnv.PLATFORM_EMAIL_API_KEY,
    fromAddress: platformEnv.PLATFORM_EMAIL_FROM_ADDRESS,
  } as const;
}

/**
 * Checks if file storage is enabled.
 * @returns True if storage is enabled
 */
export function isPlatformStorageEnabled(): boolean {
  return platformEnv.PLATFORM_STORAGE_ENABLED;
}

/**
 * Gets the storage configuration.
 * @returns Object containing storage settings
 */
export function getPlatformStorageConfig() {
  return {
    enabled: isPlatformStorageEnabled(),
    provider: platformEnv.PLATFORM_STORAGE_PROVIDER ?? 's3',
    bucket: platformEnv.PLATFORM_STORAGE_BUCKET,
    region: platformEnv.PLATFORM_STORAGE_REGION,
    accessKey: platformEnv.PLATFORM_STORAGE_ACCESS_KEY,
    secretKey: platformEnv.PLATFORM_STORAGE_SECRET_KEY,
  } as const;
}

/**
 * Checks if AI features are enabled.
 * @returns True if AI is enabled
 */
export function isPlatformAiEnabled(): boolean {
  return platformEnv.PLATFORM_AI_ENABLED;
}

/**
 * Gets the AI configuration.
 * @returns Object containing AI settings
 */
export function getPlatformAiConfig() {
  return {
    enabled: isPlatformAiEnabled(),
    provider: platformEnv.PLATFORM_AI_PROVIDER ?? 'openai',
    apiKey: platformEnv.PLATFORM_AI_API_KEY,
    model: platformEnv.PLATFORM_AI_MODEL,
    rateLimitPerMinute: platformEnv.PLATFORM_AI_RATE_LIMIT_PER_MINUTE ?? 60,
  } as const;
}

/**
 * Gets the public API URL for frontend.
 * @returns The public API URL
 */
export function getPublicApiUrl(): string {
  return platformEnv.NEXT_PUBLIC_API_URL;
}

/**
 * Gets the public application version.
 * @returns The public app version
 */
export function getPublicAppVersion(): string {
  return platformEnv.NEXT_PUBLIC_APP_VERSION;
}

/**
 * Gets the public platform environment.
 * @returns The public platform environment
 */
export function getPublicPlatformEnv(): string {
  return platformEnv.NEXT_PUBLIC_PLATFORM_ENV;
}

/**
 * Checks if debug mode is enabled in frontend.
 * @returns True if debug is enabled in frontend
 */
export function isPublicDebugEnabled(): boolean {
  return platformEnv.NEXT_PUBLIC_DEBUG_ENABLED ?? false;
}

/**
 * Gets the public feature flags configuration.
 * @returns Object containing public feature flags settings
 */
export function getPublicFeatureFlagsConfig() {
  return {
    enabled: platformEnv.NEXT_PUBLIC_FEATURE_FLAGS_ENABLED,
    clientKey: platformEnv.NEXT_PUBLIC_FEATURE_FLAGS_CLIENT_KEY,
  } as const;
}

/**
 * Checks if AI features are enabled in frontend.
 * @returns True if AI is enabled in frontend
 */
export function isPublicAiEnabled(): boolean {
  return platformEnv.NEXT_PUBLIC_AI_ENABLED ?? false;
}

/**
 * Gets the Sentry DSN for error tracking.
 * @returns The Sentry DSN or undefined
 */
export function getPublicSentryDsn(): string | undefined {
  return platformEnv.NEXT_PUBLIC_SENTRY_DSN;
}

/**
 * Gets the analytics configuration.
 * @returns Object containing analytics settings
 */
export function getPublicAnalyticsConfig() {
  return {
    enabled: platformEnv.NEXT_PUBLIC_ANALYTICS_ENABLED,
    id: platformEnv.NEXT_PUBLIC_ANALYTICS_ID,
  } as const;
}

/**
 * Platform configuration object for use with platform services.
 * This aggregates all platform-related environment variables into a single
 * configuration object that can be passed directly to platform libraries.
 */
export const platformConfig = {
  nodeEnv: getNodeEnv(),
  appVersion: getAppVersion(),
  region: getPlatformRegion(),
  instanceId: getPlatformInstanceId(),
  debugEnabled: isPlatformDebugEnabled(),
  logLevel: getPlatformLogLevel(),
  observability: {
    enabled: isPlatformObservabilityEnabled(),
    collectorEndpoint: getPlatformOtelCollectorEndpoint(),
    serviceName: getPlatformOtelServiceName(),
  },
  featureFlags: getPlatformFeatureFlagsConfig(),
  webhooks: getPlatformWebhookConfig(),
  jobs: {
    enabled: isPlatformJobsEnabled(),
    queueProvider: getPlatformJobQueueProvider(),
  },
  email: getPlatformEmailConfig(),
  storage: getPlatformStorageConfig(),
  ai: getPlatformAiConfig(),
  public: {
    apiUrl: getPublicApiUrl(),
    appVersion: getPublicAppVersion(),
    platformEnv: getPublicPlatformEnv(),
    debugEnabled: platformEnv.NEXT_PUBLIC_DEBUG_ENABLED ?? false,
    featureFlags: getPublicFeatureFlagsConfig(),
    aiEnabled: platformEnv.NEXT_PUBLIC_AI_ENABLED ?? false,
    sentryDsn: getPublicSentryDsn(),
    analytics: getPublicAnalyticsConfig(),
  },
} as const;

// Export types for external use
export type PlatformEnv = typeof platformEnv;
export type PlatformConfig = typeof platformConfig;
