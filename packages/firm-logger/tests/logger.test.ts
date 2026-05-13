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
