# firm-logger

Generated on: 2026-05-13T02:25:38.624Z
Total files: 8

**Description:** Structured logging for Firm Platform

**Version:** 1.0.0

## Table of Contents

- [context.ts](#context-ts)
- [index.ts](#index-ts)
- [logger.ts](#logger-ts)
- [redact.ts](#redact-ts)
- [context.test.ts](#context-test-ts)
- [logger.test.ts](#logger-test-ts)
- [redact.test.ts](#redact-test-ts)
- [tsup.config.ts](#tsup-config-ts)

## File Contents

### context.ts

**Path:** `src\context.ts`

**Language:** TypeScript

```typescript
/**
 * Logger context integration with unified request context
 * 
 * Migrates from separate AsyncLocalStorage to shared @firm/request-context
 * while maintaining backward compatibility.
 */

import type { LoggerContext } from './logger';
import { getCurrentContext as getUnifiedContext, setRequestContext } from '@firm/request-context';

/**
 * Convert unified request context to logger context
 */
function convertToLoggerContext(unifiedContext: any): LoggerContext {
  return {
    correlationId: unifiedContext.correlationId || unifiedContext.requestId,
    tenantId: unifiedContext.tenantId,
    userId: unifiedContext.userId,
    sessionId: unifiedContext.sessionId,
    traceId: unifiedContext.traceId,
    requestId: unifiedContext.requestId,
    // Legacy support
    spanId: unifiedContext.spanId,
    impersonatedBy: unifiedContext.impersonatedBy,
    delegatedBy: unifiedContext.delegatedBy,
    isAuthenticated: unifiedContext.isAuthenticated,
    isImpersonated: unifiedContext.isImpersonated,
    isDelegated: unifiedContext.isDelegated,
  };
}

/**
 * Create a context manager for logger state
 * @returns Context manager instance
 */
export function createContextManager() {
  return new ContextManager();
}

/**
 * Context manager for handling logger context in async operations
 * Now uses unified request context internally
 */
export class ContextManager {
  /**
   * Run a function with specific context
   * @param context - Context to set
   * @param fn - Function to run
   * @returns Result of the function
   */
  async run<T>(context: LoggerContext, fn: () => Promise<T>): Promise<T> {
    // Convert logger context to unified context and set it
    const unifiedContext = {
      correlationId: context.correlationId,
      tenantId: context.tenantId,
      userId: context.userId,
      sessionId: context.sessionId,
      traceId: context.traceId,
      requestId: context.requestId,
      spanId: context.spanId,
      impersonatedBy: context.impersonatedBy,
      delegatedBy: context.delegatedBy,
      isAuthenticated: context.isAuthenticated,
      isImpersonated: context.isImpersonated,
      isDelegated: context.isDelegated,
    };

    // Update unified request context
    setRequestContext(unifiedContext);

    return fn();
  }

  /**
   * Get current context from unified request context
   * @returns Current logger context
   */
  getContext(): LoggerContext {
    const unifiedContext = getUnifiedContext();
    return convertToLoggerContext(unifiedContext);
  }

  /**
   * Create child context manager with additional context
   * @param context - Additional context
   * @returns Child context manager
   */
  child(context: LoggerContext): ContextManager {
    const child = new ContextManager();
    const currentContext = this.getContext();
    const mergedContext = { ...currentContext, ...context };
    
    // Update unified context with merged context
    setRequestContext({
      correlationId: mergedContext.correlationId,
      tenantId: mergedContext.tenantId,
      userId: mergedContext.userId,
      sessionId: mergedContext.sessionId,
      traceId: mergedContext.traceId,
      requestId: mergedContext.requestId,
      spanId: mergedContext.spanId,
      impersonatedBy: mergedContext.impersonatedBy,
      delegatedBy: mergedContext.delegatedBy,
      isAuthenticated: mergedContext.isAuthenticated,
      isImpersonated: mergedContext.isImpersonated,
      isDelegated: mergedContext.isDelegated,
    });
    
    return child;
  }

  /**
   * Set context values directly
   * @param context - Context to set
   */
  setContext(context: LoggerContext): void {
    setRequestContext({
      correlationId: context.correlationId,
      tenantId: context.tenantId,
      userId: context.userId,
      sessionId: context.sessionId,
      traceId: context.traceId,
      requestId: context.requestId,
      spanId: context.spanId,
      impersonatedBy: context.impersonatedBy,
      delegatedBy: context.delegatedBy,
      isAuthenticated: context.isAuthenticated,
      isImpersonated: context.isImpersonated,
      isDelegated: context.isDelegated,
    });
  }

  /**
   * Clear all context
   */
  clear(): void {
    // Clear unified context
    const currentContext = getUnifiedContext();
    const clearedContext = { ...currentContext };
    delete clearedContext.correlationId;
    delete clearedContext.tenantId;
    delete clearedContext.userId;
    delete clearedContext.sessionId;
    delete clearedContext.traceId;
    delete clearedContext.requestId;
    delete clearedContext.spanId;
    delete clearedContext.impersonatedBy;
    delete clearedContext.delegatedBy;
    delete clearedContext.isAuthenticated;
    delete clearedContext.isImpersonated;
    delete clearedContext.isDelegated;
    
    setRequestContext(clearedContext);
  }

  /**
   * Get specific context value
   * @param key - Context key to get
   * @returns Context value or undefined
   */
  get<T = any>(key: keyof LoggerContext): T | undefined {
    const context = this.getContext();
    return context[key] as T;
  }

  /**
   * Set specific context value
   * @param key - Context key to set
   * @param value - Value to set
   */
  set<K extends keyof LoggerContext>(key: K, value: LoggerContext[K]): void {
    const currentContext = this.getContext();
    const updatedContext = { ...currentContext, [key]: value };
    this.setContext(updatedContext);
  }
}

/**
 * Get current logger context from unified request context
 * @returns Current logger context
 */
export function getCurrentContext(): LoggerContext {
  const unifiedContext = getUnifiedContext();
  return convertToLoggerContext(unifiedContext);
}

/**
 * Run function with context using unified request context
 * @param context - Context to set
 * @param fn - Function to run
 * @returns Result of the function
 */
export function runWithContext<T>(context: LoggerContext, fn: () => T): T {
  const unifiedContext = {
    correlationId: context.correlationId,
    tenantId: context.tenantId,
    userId: context.userId,
    sessionId: context.sessionId,
    traceId: context.traceId,
    requestId: context.requestId,
    spanId: context.spanId,
    impersonatedBy: context.impersonatedBy,
    delegatedBy: context.delegatedBy,
    isAuthenticated: context.isAuthenticated,
    isImpersonated: context.isImpersonated,
    isDelegated: context.isDelegated,
  };

  setRequestContext(unifiedContext);
  return fn();
}

/**
 * Run async function with context using unified request context
 * @param context - Context to set
 * @param fn - Async function to run
 * @returns Result of the async function
 */
export function runWithContextAsync<T>(context: LoggerContext, fn: () => Promise<T>): Promise<T> {
  const unifiedContext = {
    correlationId: context.correlationId,
    tenantId: context.tenantId,
    userId: context.userId,
    sessionId: context.sessionId,
    traceId: context.traceId,
    requestId: context.requestId,
    spanId: context.spanId,
    impersonatedBy: context.impersonatedBy,
    delegatedBy: context.delegatedBy,
    isAuthenticated: context.isAuthenticated,
    isImpersonated: context.isImpersonated,
    isDelegated: context.isDelegated,
  };

  setRequestContext(unifiedContext);
  return fn();
}

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
// Main logger creation and types
export {
  createLogger,
  createContextualLogger,
  type LoggerOptions,
  type LoggerContext,
  type ContextualLogger,
} from './logger';

// Context management
export {
  createContextManager,
  getCurrentContext,
  runWithContext,
  runWithContextAsync,
  type ContextManager,
} from './context';

// PII redaction
export {
  createRedactionSerializer,
  redactValue,
  containsPii,
} from './redact';

// Re-export createLogger as default
export { createLogger as default } from './logger';

```

---

### logger.ts

**Path:** `src\logger.ts`

**Language:** TypeScript

```typescript
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

```

---

### redact.ts

**Path:** `src\redact.ts`

**Language:** TypeScript

```typescript
/**
 * Default PII fields that should be redacted
 */
const DEFAULT_PII_FIELDS = [
  'email',
  'phone',
  'password',
  'ssn',
  'socialSecurityNumber',
  'creditCard',
  'creditCardNumber',
  'cvv',
  'token',
  'apiKey',
  'secret',
  'privateKey',
  'address',
  'fullName',
  'firstName',
  'lastName',
  'dateOfBirth',
  'ipAddress',
  'userAgent',
];

/**
 * Create a PII redaction serializer for Pino
 * @param additionalFields - Additional PII fields to redact
 * @returns Serializer object for Pino
 */
export function createRedactionSerializer(additionalFields: string[] = []) {
  const piiFields = new Set([...DEFAULT_PII_FIELDS, ...additionalFields]);
  
  return {
    /**
     * Redact PII from log objects
     * @param obj - Object to serialize
     * @returns Redacted object
     */
    serialize(obj: any): any {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      return redactObject(obj, piiFields);
    },
  };
}

/**
 * Recursively redact PII fields from an object
 * @param obj - Object to redact
 * @param piiFields - Set of PII field names
 * @returns Redacted object
 */
function redactObject(obj: any, piiFields: Set<string>): any {
  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item, piiFields));
  }

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const redacted: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (piiFields.has(key) || isPiiField(key, piiFields)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactObject(value, piiFields);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Check if a field name matches PII patterns
 * @param fieldName - Field name to check
 * @param piiFields - Set of known PII fields
 * @returns True if field should be redacted
 */
function isPiiField(fieldName: string, piiFields: Set<string>): boolean {
  // Direct match
  if (piiFields.has(fieldName)) {
    return true;
  }

  // Pattern matching for nested fields (user.email, contact.phone, etc.)
  const patterns = [
    /email/i,
    /phone/i,
    /password/i,
    /ssn/i,
    /creditcard/i,
    /token/i,
    /secret/i,
    /key/i,
    /address/i,
    /name/i,
    /birth/i,
    /ip/i,
  ];

  return patterns.some(pattern => pattern.test(fieldName));
}

/**
 * Redact a specific value
 * @param value - Value to redact
 * @param type - Type of redaction
 * @returns Redacted value
 */
export function redactValue(value: string, type: 'partial' | 'full' = 'full'): string {
  if (type === 'partial') {
    // Show first and last characters, mask middle
    if (value.length <= 4) {
      return '[REDACTED]';
    }
    
    const start = value.substring(0, 2);
    const end = value.substring(value.length - 2);
    const middle = '*'.repeat(value.length - 4);
    
    return `${start}${middle}${end}`;
  }

  return '[REDACTED]';
}

/**
 * Check if a string contains PII patterns
 * @param text - Text to check
 * @returns True if PII patterns are detected
 */
export function containsPii(text: string): boolean {
  const piiPatterns = [
    // Email pattern
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    // Phone pattern (basic)
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    // SSN pattern
    /\b\d{3}-\d{2}-\d{4}\b/g,
    // Credit card pattern
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ];

  return piiPatterns.some(pattern => pattern.test(text));
}

```

---

### context.test.ts

**Path:** `tests\context.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect } from 'vitest';
import { createContextManager, getCurrentContext, runWithContext } from '../src/context';

describe('Context Management', () => {
  it('creates context manager', () => {
    const manager = createContextManager();
    
    expect(manager).toBeDefined();
    expect(typeof manager.getContext).toBe('function');
    expect(typeof manager.run).toBe('function');
  });

  it('gets empty context initially', () => {
    const manager = createContextManager();
    const context = manager.getContext();
    
    expect(context).toEqual({});
  });

  it('sets and gets context values', () => {
    const manager = createContextManager();
    
    manager.set('testKey', 'testValue');
    const value = manager.get('testKey');
    
    expect(value).toBe('testValue');
  });

  it('runs function with context', async () => {
    const manager = createContextManager();
    
    let capturedContext: any = {};
    
    await manager.run({ key: 'value' }, async () => {
      capturedContext = getCurrentContext();
    });
    
    expect(capturedContext.key).toBe('value');
  });

  it('merges context in nested runs', async () => {
    const manager = createContextManager();
    
    let capturedContext: any = {};
    
    await manager.run({ outer: 'value' }, async () => {
      await manager.run({ inner: 'nested' }, async () => {
        capturedContext = getCurrentContext();
      });
    });
    
    expect(capturedContext.outer).toBe('value');
    expect(capturedContext.inner).toBe('nested');
  });

  it('creates child context manager', () => {
    const parent = createContextManager();
    parent.set('parentKey', 'parentValue');
    
    const child = parent.child({ childKey: 'childValue' });
    const context = child.getContext();
    
    expect(context.parentKey).toBe('parentValue');
    expect(context.childKey).toBe('childValue');
  });
});

describe('runWithContext', () => {
  it('runs function with context directly', async () => {
    let capturedContext: any = {};
    
    await runWithContext({ direct: 'context' }, async () => {
      capturedContext = getCurrentContext();
    });
    
    expect(capturedContext.direct).toBe('context');
  });
});

```

---

### logger.test.ts

**Path:** `tests\logger.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createLogger, createContextualLogger } from '../src';

describe('createLogger', () => {
  it('creates a logger with default options', () => {
    const logger = createLogger('test-service');
    
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('creates a logger with custom options', () => {
    const logger = createLogger('test-service', {
      level: 'debug',
      pretty: false,
      piiFields: ['customField'],
    });
    
    expect(logger).toBeDefined();
  });

  it('logs structured JSON data', () => {
    const logger = createLogger('test-service', { pretty: false });
    
    // Mock console to capture output
    const originalConsoleLog = console.log;
    let capturedOutput: string = '';
    
    console.log = (message: string) => {
      capturedOutput = message;
    };
    
    logger.info({ test: 'data' }, 'Test message');
    
    // Restore console
    console.log = originalConsoleLog;
    
    const parsed = JSON.parse(capturedOutput);
    expect(parsed.service).toBe('test-service');
    expect(parsed.test).toBe('data');
    expect(parsed.msg).toBe('Test message');
  });

  it('includes timestamp in logs', () => {
    const logger = createLogger('test-service', { pretty: false });
    
    const originalConsoleLog = console.log;
    let capturedOutput: string = '';
    
    console.log = (message: string) => {
      capturedOutput = message;
    };
    
    logger.info({ test: 'data' });
    
    console.log = originalConsoleLog;
    
    const parsed = JSON.parse(capturedOutput);
    expect(parsed.timestamp).toBeDefined();
    expect(typeof parsed.timestamp).toBe('string');
  });
});

describe('createContextualLogger', () => {
  it('creates a contextual logger', () => {
    const logger = createContextualLogger('test-service');
    
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.runWithContext).toBe('function');
  });

  it('runs function with context', async () => {
    const logger = createContextualLogger('test-service');
    
    const originalConsoleLog = console.log;
    let capturedOutput: string = '';
    
    console.log = (message: string) => {
      capturedOutput = message;
    };
    
    await logger.runWithContext(
      { correlationId: 'test-123', tenantId: 'tenant-456' },
      async () => {
        logger.info({ action: 'test' }, 'Test with context');
      }
    );
    
    console.log = originalConsoleLog;
    
    const parsed = JSON.parse(capturedOutput);
    expect(parsed.correlationId).toBe('test-123');
    expect(parsed.tenantId).toBe('tenant-456');
    expect(parsed.action).toBe('test');
  });

  it('creates child logger with additional context', async () => {
    const logger = createContextualLogger('test-service');
    
    const originalConsoleLog = console.log;
    let capturedOutput: string = '';
    
    console.log = (message: string) => {
      capturedOutput = message;
    };
    
    const childLogger = logger.child({ userId: 'user-789' });
    
    await childLogger.runWithContext(
      { correlationId: 'test-123' },
      async () => {
        childLogger.info({ action: 'test' }, 'Test with child context');
      }
    );
    
    console.log = originalConsoleLog;
    
    const parsed = JSON.parse(capturedOutput);
    expect(parsed.correlationId).toBe('test-123');
    expect(parsed.userId).toBe('user-789');
    expect(parsed.action).toBe('test');
  });

  it('handles nested context correctly', async () => {
    const logger = createContextualLogger('test-service');
    
    const originalConsoleLog = console.log;
    let capturedOutput: string = '';
    
    console.log = (message: string) => {
      capturedOutput = message;
    };
    
    await logger.runWithContext(
      { correlationId: 'outer' },
      async () => {
        await logger.runWithContext(
          { tenantId: 'inner' },
          async () => {
            logger.info({ action: 'nested' }, 'Nested context test');
          }
        );
      }
    );
    
    console.log = originalConsoleLog;
    
    const parsed = JSON.parse(capturedOutput);
    expect(parsed.correlationId).toBe('outer');
    expect(parsed.tenantId).toBe('inner');
    expect(parsed.action).toBe('nested');
  });
});

```

---

### redact.test.ts

**Path:** `tests\redact.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect } from 'vitest';
import { createRedactionSerializer, redactValue, containsPii } from '../src/redact';

describe('PII Redaction', () => {
  it('creates serializer with default PII fields', () => {
    const serializer = createRedactionSerializer();
    
    expect(serializer).toBeDefined();
    expect(typeof serializer.serialize).toBe('function');
  });

  it('creates serializer with additional PII fields', () => {
    const serializer = createRedactionSerializer(['customField']);
    
    expect(serializer).toBeDefined();
  });

  it('redacts PII fields from objects', () => {
    const serializer = createRedactionSerializer();
    
    const obj = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      address: '123 Main St',
      normalField: 'normal value',
    };
    
    const redacted = serializer.serialize(obj);
    
    expect(redacted.name).toBe('[REDACTED]');
    expect(redacted.email).toBe('[REDACTED]');
    expect(redacted.phone).toBe('[REDACTED]');
    expect(redacted.address).toBe('[REDACTED]');
    expect(redacted.normalField).toBe('normal value');
  });

  it('redacts nested PII fields', () => {
    const serializer = createRedactionSerializer();
    
    const obj = {
      user: {
        contact: {
          email: 'john@example.com',
          phone: '555-1234',
        },
        name: 'John Doe',
      },
      normal: {
        nested: 'value',
      },
    };
    
    const redacted = serializer.serialize(obj);
    
    expect(redacted.user.contact.email).toBe('[REDACTED]');
    expect(redacted.user.contact.phone).toBe('[REDACTED]');
    expect(redacted.user.name).toBe('[REDACTED]');
    expect(redacted.normal.nested).toBe('value');
  });

  it('redacts arrays with PII', () => {
    const serializer = createRedactionSerializer();
    
    const obj = {
      users: [
        { email: 'user1@example.com' },
        { email: 'user2@example.com' },
        { name: 'Normal User' },
      ],
    };
    
    const redacted = serializer.serialize(obj);
    
    expect(redacted.users[0].email).toBe('[REDACTED]');
    expect(redacted.users[1].email).toBe('[REDACTED]');
    expect(redacted.users[2].name).toBe('[REDACTED]'); // name is a PII field
  });

  it('handles non-object values', () => {
    const serializer = createRedactionSerializer();
    
    expect(serializer.serialize(null)).toBe(null);
    expect(serializer.serialize('string')).toBe('string');
    expect(serializer.serialize(123)).toBe(123);
    expect(serializer.serialize(undefined)).toBe(undefined);
  });
});

describe('redactValue', () => {
  it('fully redacts values', () => {
    const result = redactValue('sensitive-data');
    expect(result).toBe('[REDACTED]');
  });

  it('partially redacts values', () => {
    const result = redactValue('sensitive-data', 'partial');
    expect(result).toBe('se***ed');
  });

  it('handles short values for partial redaction', () => {
    const result = redactValue('123', 'partial');
    expect(result).toBe('[REDACTED]');
  });
});

describe('containsPii', () => {
  it('detects email addresses', () => {
    expect(containsPii('user@example.com')).toBe(true);
    expect(containsPii('normal text')).toBe(false);
  });

  it('detects phone numbers', () => {
    expect(containsPii('Call 555-123-4567')).toBe(true);
    expect(containsPii('Call 5551234567')).toBe(true);
    expect(containsPii('Call me')).toBe(false);
  });

  it('detects SSN patterns', () => {
    expect(containsPii('SSN: 123-45-6789')).toBe(true);
    expect(containsPii('ID: 123456789')).toBe(false);
  });

  it('detects credit card patterns', () => {
    expect(containsPii('Card: 1234-5678-9012-3456')).toBe(true);
    expect(containsPii('Card: 1234567890123456')).toBe(true);
    expect(containsPii('Account: 123456')).toBe(false);
  });
});

```

---

### tsup.config.ts

**Path:** `tsup.config.ts`

**Language:** TypeScript

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['pino'],
})

```

---

