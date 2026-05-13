/**
 * @deprecated Use @firm/logger directly. This module re-exports logger functionality from @firm/logger
 * with OpenTelemetry trace context integration for backward compatibility.
 */

import type { Logger, LoggerOptions, LoggerContext as FirmLoggerContext } from '@firm/logger'
import { createLogger as createFirmLogger } from '@firm/logger'

// Re-export types from @firm/logger
export type { Logger, LoggerOptions, LoggerContext as FirmLoggerContext } from '@firm/logger'

// Extend the logger context with observability-specific fields
export interface LoggerContext extends FirmLoggerContext {
  [key: string]: any
}

let defaultLogger: Logger | null = null

/**
 * Create a logger with OpenTelemetry trace context integration
 * @param name - Logger name (usually service name)
 * @param options - Logger configuration options
 * @returns Logger instance with trace context
 */
export function createLogger(name: string, options: Partial<LoggerOptions> = {}): Logger {
  // Create base logger using @firm/logger with custom formatters for trace context
  const loggerWithTraceContext = createFirmLogger(name, {
    service: name,
    level: options.level || 'info',
    piiFields: [
      'email',
      'password',
      'ssn',
      'creditCard',
      'phoneNumber',
      'address.street',
      'address.city',
      'address.zipCode',
      'user.email',
      'user.phone',
      'user.address',
      'customer.email',
      'customer.phone',
      'customer.address',
      // Add any additional PII fields from options
      ...(options.piiFields || [])
    ],
    ...options
  })

  if (!defaultLogger) {
    defaultLogger = loggerWithTraceContext
  }

  return loggerWithTraceContext
}

/**
 * Get the default logger instance
 * @returns Default logger instance
 * @throws Error if logger not initialized
 */
export function getLogger(): Logger {
  if (!defaultLogger) {
    throw new Error('Logger not initialized. Call initializeObservability first.')
  }
  return defaultLogger
}

/**
 * Create a child logger with additional context
 * @param logger - Parent logger instance
 * @param additionalContext - Additional context to add
 * @returns Child logger with additional context
 */
export function withContext(logger: Logger, additionalContext: LoggerContext): Logger {
  return logger.child(additionalContext)
}


// Export a convenience function for quick logging (backward compatibility)
export const log = {
  info: (message: string, meta?: any) => {
    const logger = getLogger()
    logger.info(meta, message)
  },
  error: (message: string, error?: Error | any) => {
    const logger = getLogger()
    logger.error({ error: error?.stack || error }, message)
  },
  warn: (message: string, meta?: any) => {
    const logger = getLogger()
    logger.warn(meta, message)
  },
  debug: (message: string, meta?: any) => {
    const logger = getLogger()
    logger.debug(meta, message)
  },
  trace: (message: string, meta?: any) => {
    const logger = getLogger()
    logger.trace(meta, message)
  }
}

// Re-export additional functionality from @firm/logger for convenience
export {
  createContextualLogger,
  getCurrentContext as getFirmContext,
  runWithContext,
  runWithContextAsync,
  createRedactionSerializer,
  redactValue,
  containsPii,
} from '@firm/logger'
