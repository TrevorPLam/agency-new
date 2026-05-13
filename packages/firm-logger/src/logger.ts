import pino, { type Logger, type LogFn } from 'pino';
import { AsyncLocalStorage } from 'async_hooks';
import { createRedactionSerializer } from './redact';
import { createContextManager } from './context';

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  /** Service name for logs */
  service: string;
  /** Minimum log level */
  level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  /** Enable pretty printing in development */
  pretty?: boolean;
  /** Additional PII fields to redact */
  piiFields?: string[];
}

/**
 * Logger context for correlation and tenant tracking
 */
export interface LoggerContext {
  /** Correlation ID for request tracing */
  correlationId?: string;
  /** Tenant ID for multi-tenant systems */
  tenantId?: string;
  /** User ID for audit trails */
  userId?: string;
  /** Session ID for user sessions */
  sessionId?: string;
  /** Request ID for HTTP requests */
  requestId?: string;
  /** Trace ID from observability */
  traceId?: string;
  /** Span ID from observability */
  spanId?: string;
  /** Authentication flags */
  isAuthenticated?: boolean;
  isImpersonated?: boolean;
  isDelegated?: boolean;
  /** Impersonation/delegation metadata */
  impersonatedBy?: string;
  delegatedBy?: string;
}

/**
 * Create a structured JSON logger with Pino
 * @param name - Logger name (usually service name)
 * @param options - Logger configuration options
 * @returns Configured logger instance
 */
export function createLogger(name: string, options: LoggerOptions = { service: name }): Logger {
  const redactionSerializer = createRedactionSerializer(options.piiFields);
  
  const baseConfig = {
    name: options.service,
    level: options.level || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => ({ level: label }),
      log: (object: any) => {
        const { correlationId, tenantId, userId, sessionId, requestId, ...logData } = object;
        
        return {
          ...logData,
          service: options.service,
          timestamp: new Date().toISOString(),
          ...(correlationId && { correlationId }),
          ...(tenantId && { tenantId }),
          ...(userId && { userId }),
          ...(sessionId && { sessionId }),
          ...(requestId && { requestId }),
        };
      },
    },
    serializers: {
      ...redactionSerializer,
    },
  };

  // Add pretty printing for development
  if (options.pretty) {
    return pino({
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  return pino(baseConfig);
}

/**
 * Logger with context management capabilities
 */
export class ContextualLogger {
  private logger: Logger;
  private contextManager = createContextManager();

  constructor(name: string, options: LoggerOptions = { service: name }) {
    this.logger = createLogger(name, options);
  }

  /**
   * Run a function with logger context
   * @param context - Context to set
   * @param fn - Function to run
   * @returns Result of the function
   */
  async runWithContext<T>(context: LoggerContext, fn: () => Promise<T>): Promise<T> {
    return this.contextManager.run(context, fn);
  }

  /**
   * Get current logger with context applied
   * @returns Logger with current context
   */
  private getLoggerWithContext(): Logger {
    const context = this.contextManager.getContext();
    return this.logger.child(context);
  }

  // Log methods with automatic context
  debug: LogFn = (obj: any, msg?: string, ...args: any[]) => {
    this.getLoggerWithContext().debug(obj, msg, ...args);
  };

  info: LogFn = (obj: any, msg?: string, ...args: any[]) => {
    this.getLoggerWithContext().info(obj, msg, ...args);
  };

  warn: LogFn = (obj: any, msg?: string, ...args: any[]) => {
    this.getLoggerWithContext().warn(obj, msg, ...args);
  };

  error: LogFn = (obj: any, msg?: string, ...args: any[]) => {
    this.getLoggerWithContext().error(obj, msg, ...args);
  };

  fatal: LogFn = (obj: any, msg?: string, ...args: any[]) => {
    this.getLoggerWithContext().fatal(obj, msg, ...args);
  };

  /**
   * Create child logger with additional context
   * @param context - Additional context
   * @returns Child logger
   */
  child(context: LoggerContext): ContextualLogger {
    const child = new ContextualLogger(this.logger.name);
    child.logger = this.logger;
    child.contextManager = this.contextManager.child(context);
    return child;
  }
}

/**
 * Create a contextual logger with context management
 * @param name - Logger name
 * @param options - Logger options
 * @returns Contextual logger instance
 */
export function createContextualLogger(name: string, options: LoggerOptions = { service: name }): ContextualLogger {
  return new ContextualLogger(name, options);
}

// Export the main createLogger function as default
export default createLogger;
