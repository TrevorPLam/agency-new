# firm-health

Generated on: 2026-05-13T02:25:38.604Z
Total files: 15

**Description:** Health checks and probes for agency platform

**Version:** 1.0.0

## Table of Contents

- [endpoint.ts](#endpoint-ts)
- [index.ts](#index-ts)
- [liveness.ts](#liveness-ts)
- [readiness.ts](#readiness-ts)
- [rls-check.ts](#rls-check-ts)
- [startup.ts](#startup-ts)
- [synthetic.ts](#synthetic-ts)
- [types.ts](#types-ts)
- [endpoint.test.ts](#endpoint-test-ts)
- [liveness.test.ts](#liveness-test-ts)
- [readiness.test.ts](#readiness-test-ts)
- [startup.test.ts](#startup-test-ts)
- [synthetic.test.ts](#synthetic-test-ts)
- [vitest.config.ts](#vitest-config-ts)
- [tsup.config.ts](#tsup-config-ts)

## File Contents

### endpoint.ts

**Path:** `src\endpoint.ts`

**Language:** TypeScript

```typescript
import { HealthResponse, HealthCheck } from './types.js';
import { livenessProbe } from './probes/liveness.js';
import { readinessProbe } from './probes/readiness.js';
import { startupProbe } from './probes/startup.js';
import { runSyntheticChecks } from './probes/synthetic.js';

export interface HealthEndpointOptions {
  /**
   * Secret token required to access the health endpoint
   */
  secret: string;
  
  /**
   * Header name for the secret token (default: 'Authorization')
   */
  headerName?: string;
  
  /**
   * Custom health checks to include in readiness probe
   */
  customChecks?: HealthCheck[];
  
  /**
   * Application version
   */
  version?: string;
  
  /**
   * Include synthetic checks in the response
   */
  includeSynthetic?: boolean;
  
  /**
   * Timeout for readiness probe in milliseconds
   */
  readinessTimeoutMs?: number;
}

/**
 * Creates a health check handler that can be used with various web frameworks
 * 
 * @param options Configuration options for the health endpoint
 * @returns Request handler function
 */
export function createHealthHandler(options: HealthEndpointOptions) {
  const {
    secret,
    headerName = 'Authorization',
    customChecks = [],
    version = '1.0.0',
    includeSynthetic = false,
    readinessTimeoutMs = 5000
  } = options;

  return async (request: {
    headers: Record<string, string>;
    method?: string;
  }): Promise<{
    status: number;
    headers: Record<string, string>;
    body?: string;
  }> => {
    // Only allow GET requests
    if (request.method && request.method !== 'GET') {
      return {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    // Check authorization
    const authHeader = request.headers[headerName.toLowerCase()];
    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const startTime = Date.now();
    const timestamp = new Date();
    const uptime = typeof globalThis.process !== 'undefined' ? 
      globalThis.process.uptime() : 0;

    try {
      // Run all probes in parallel
      const [livenessResult, readinessResult, startupResult] = await Promise.allSettled([
        livenessProbe(),
        readinessProbe(customChecks, readinessTimeoutMs),
        startupProbe()
      ]);

      // Get synthetic checks if requested
      let syntheticResults: Record<string, any> = {};
      if (includeSynthetic) {
        try {
          syntheticResults = await runSyntheticChecks();
        } catch (error) {
          // Synthetic check failures shouldn't affect overall health
          syntheticResults = {
            error: error instanceof Error ? error.message : 'Synthetic checks failed'
          };
        }
      }

      // Extract results from Promise.allSettled
      const liveness = livenessResult.status === 'fulfilled' ? livenessResult.value : {
        status: 'unhealthy' as const,
        timestamp,
        duration: 0,
        message: livenessResult.reason instanceof Error ? livenessResult.reason.message : 'Liveness probe failed'
      };

      const readiness = readinessResult.status === 'fulfilled' ? readinessResult.value : {
        status: 'unhealthy' as const,
        timestamp,
        duration: 0,
        message: readinessResult.reason instanceof Error ? readinessResult.reason.message : 'Readiness probe failed'
      };

      const startup = startupResult.status === 'fulfilled' ? startupResult.value : {
        status: 'unhealthy' as const,
        timestamp,
        duration: 0,
        message: startupResult.reason instanceof Error ? startupResult.reason.message : 'Startup probe failed'
      };

      // Combine all checks
      const checks: Record<string, any> = {
        liveness,
        readiness,
        startup,
        ...(includeSynthetic && { synthetic: syntheticResults })
      };

      // Determine overall status
      const statuses = Object.values(checks).map((check: any) => check.status);
      const hasUnhealthy = statuses.includes('unhealthy');
      const hasDegraded = statuses.includes('degraded');

      let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
      if (hasUnhealthy) {
        overallStatus = 'unhealthy';
      } else if (hasDegraded) {
        overallStatus = 'degraded';
      } else {
        overallStatus = 'healthy';
      }

      const response: HealthResponse = {
        status: overallStatus,
        timestamp,
        checks,
        uptime,
        version
      };

      const httpStatus = overallStatus === 'healthy' ? 200 : 503;

      return {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response)
      };

    } catch (error) {
      const errorResponse: HealthResponse = {
        status: 'unhealthy',
        timestamp,
        checks: {
          liveness: { status: 'unhealthy', timestamp, duration: 0, message: 'Health check failed' },
          readiness: { status: 'unhealthy', timestamp, duration: 0, message: 'Health check failed' },
          startup: { status: 'unhealthy', timestamp, duration: 0, message: 'Health check failed' }
        },
        uptime,
        version
      };

      return {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorResponse)
      };
    }
  };
}

/**
 * Express.js middleware for health endpoint
 */
export function expressHealthMiddleware(options: HealthEndpointOptions) {
  const handler = createHealthHandler(options);
  
  return async (req: any, res: any) => {
    const result = await handler({
      headers: req.headers,
      method: req.method
    });
    
    res.status(result.status);
    Object.entries(result.headers).forEach(([key, value]) => {
      res.set(key, value);
    });
    
    if (result.body) {
      res.send(result.body);
    } else {
      res.end();
    }
  };
}

/**
 * Next.js API route handler for health endpoint
 */
export function nextHealthHandler(options: HealthEndpointOptions) {
  const handler = createHealthHandler(options);
  
  return async (req: Request) => {
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    const result = await handler({
      headers,
      method: req.method
    });
    
    return new Response(result.body, {
      status: result.status,
      headers: result.headers
    });
  };
}

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
// Export types
export type {
  HealthCheckResult,
  HealthResponse,
  HealthCheck,
  SyntheticCheck,
  ProbeType
} from './types.js';

// Export probes
export { livenessProbe } from './probes/liveness.js';
export { readinessProbe, readinessProbeWithRLS } from './probes/readiness.js';
export { createRLSCheck, rlsHealthCheck } from './probes/rls-check.js';
export { 
  startupProbe,
  markBootstrapped,
  markBootstrapFailed,
  resetBootstrapState
} from './probes/startup.js';

// Export synthetic check manager
export {
  SyntheticCheckManager,
  syntheticCheckManager,
  registerSyntheticCheck,
  runSyntheticChecks,
  getSyntheticChecks
} from './probes/synthetic.js';

// Export health endpoint
export {
  createHealthHandler,
  expressHealthMiddleware,
  nextHealthHandler
} from './endpoint.js';

export type { HealthEndpointOptions } from './endpoint.js';

```

---

### liveness.ts

**Path:** `src\probes\liveness.ts`

**Language:** TypeScript

```typescript
import { HealthCheckResult } from '../types.js';

/**
 * Liveness probe checks if the application is still running.
 * This only checks the event loop and never calls external systems.
 * 
 * @returns Promise<HealthCheckResult> - Always healthy if event loop is responsive
 */
export async function livenessProbe(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Check event loop responsiveness by measuring tick time
    const tickStart = process.hrtime.bigint();
    
    // Use setImmediate to check if event loop is processing tasks
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Event loop unresponsive'));
      }, 100); // 100ms timeout for event loop check
      
      setImmediate(() => {
        clearTimeout(timeout);
        resolve();
      });
    });
    
    const tickEnd = process.hrtime.bigint();
    const tickDuration = Number(tickEnd - tickStart) / 1000000; // Convert to milliseconds
    
    const duration = Date.now() - startTime;
    
    // Consider unhealthy if event loop tick took too long (>50ms)
    if (tickDuration > 50) {
      return {
        status: 'degraded',
        timestamp: new Date(),
        duration,
        message: `Event loop slow: ${tickDuration.toFixed(2)}ms`,
        details: {
          tickDuration,
          threshold: 50
        }
      };
    }
    
    return {
      status: 'healthy',
      timestamp: new Date(),
      duration,
      message: 'Event loop responsive',
      details: {
        tickDuration,
        uptime: process.uptime()
      }
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date(),
      duration: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Unknown error',
      details: {
        error: error instanceof Error ? error.stack : String(error)
      }
    };
  }
}

```

---

### readiness.ts

**Path:** `src\probes\readiness.ts`

**Language:** TypeScript

```typescript
import type { HealthCheck, HealthCheckResult } from '../types.js';
import { createRLSCheck } from './rls-check.js';

/**
 * Readiness probe checks if the application is ready to serve traffic.
 * This checks all dependencies like database, external services, etc.
 * 
 * @param checks Array of health checks to run in parallel
 * @param timeoutMs Maximum time to wait for all checks (default: 5000ms)
 * @returns Promise<HealthCheckResult> - Overall readiness status
 */
export async function readinessProbe(
  checks: HealthCheck[],
  timeoutMs: number = 5000
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Run all checks in parallel with timeout
    const checkPromises = checks.map(async (check) => {
      const checkStartTime = Date.now();
      
      try {
        // Add individual timeout for each check
        const result = await Promise.race([
          check.check(),
          new Promise<HealthCheckResult>((_, reject) =>
            setTimeout(() => reject(new Error(`Check ${check.name} timed out`)), check.timeoutMs)
          )
        ]);
        
        return {
          name: check.name,
          result: {
            ...result,
            duration: Date.now() - checkStartTime
          }
        };
      } catch (error) {
        return {
          name: check.name,
          result: {
            status: 'unhealthy',
            timestamp: new Date(),
            duration: Date.now() - checkStartTime,
            message: error instanceof Error ? error.message : 'Unknown error',
            details: {
              error: error instanceof Error ? error.stack : String(error)
            }
          }
        };
      }
    });
    
    // Wait for all checks with overall timeout
    const results = await Promise.race([
      Promise.all(checkPromises),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Readiness probe timed out')), timeoutMs)
      )
    ]);
    
    const duration = Date.now() - startTime;
    
    // Determine overall status
    const unhealthyChecks = results.filter(r => r.result.status === 'unhealthy');
    const degradedChecks = results.filter(r => r.result.status === 'degraded');
    
    let status: 'healthy' | 'unhealthy' | 'degraded';
    let message: string;
    
    if (unhealthyChecks.length > 0) {
      status = 'unhealthy';
      message = `${unhealthyChecks.length} dependencies unhealthy`;
    } else if (degradedChecks.length > 0) {
      status = 'degraded';
      message = `${degradedChecks.length} dependencies degraded`;
    } else {
      status = 'healthy';
      message = 'All dependencies healthy';
    }
    
    return {
      status,
      timestamp: new Date(),
      duration,
      message,
      details: {
        totalChecks: results.length,
        healthy: results.filter(r => r.result.status === 'healthy').length,
        degraded: degradedChecks.length,
        unhealthy: unhealthyChecks.length,
        checks: results.reduce((acc, r) => {
          acc[r.name] = r.result;
          return acc;
        }, {} as Record<string, HealthCheckResult>)
      }
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date(),
      duration: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Readiness probe failed',
      details: {
        error: error instanceof Error ? error.stack : String(error)
      }
    };
  }
}

/**
 * Readiness probe with RLS check included by default
 * This ensures tenant isolation security is verified before serving traffic
 */
export async function readinessProbeWithRLS(
  additionalChecks: HealthCheck[] = [],
  timeoutMs: number = 5000
): Promise<HealthCheckResult> {
  // Include RLS check by default for tenant isolation security
  const rlsCheck = createRLSCheck()
  const allChecks = [rlsCheck, ...additionalChecks]
  
  return readinessProbe(allChecks, timeoutMs)
}

```

---

### rls-check.ts

**Path:** `src\probes\rls-check.ts`

**Language:** TypeScript

```typescript
import type { HealthCheckResult } from '../types.js'
import { createDirectConnection, getDatabaseConfig } from '@firm/db/connection/factories'
import { tenantScopedTables } from '@firm/db/schemas/rls-policies'
import { sql } from 'drizzle-orm'

/**
 * Check if Row Level Security is properly enabled on all tenant-scoped tables
 * This ensures tenant isolation is enforced at the database level
 */
export async function rlsHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  const requireRLS = process.env['REQUIRE_RLS'] !== 'false'
  
  if (!requireRLS) {
    return {
      status: 'healthy',
      timestamp: new Date(),
      duration: Date.now() - startTime,
      message: 'RLS enforcement disabled (REQUIRE_RLS=false)',
      details: {
        skipped: true,
        reason: 'Environment variable REQUIRE_RLS is set to false'
      }
    }
  }

  try {
    const config = getDatabaseConfig()
    const db = createDirectConnection(config)
    
    // Query PostgreSQL catalog to check RLS status
    const rlsQuery = sql`
      SELECT 
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename = ANY(${sql.array(tenantScopedTables)})
      ORDER BY tablename
    `
    
    const result = await db.execute(rlsQuery)
    const tables = result.rows || []
    
    // Check if all required tables have RLS enabled
    const missingRLS = tables.filter((table: { rowsecurity: boolean }) => !table.rowsecurity)
    const protectedTables = tables.filter((table: { rowsecurity: boolean }) => table.rowsecurity)
    
    // Check for tables that don't exist
    const existingTableNames = tables.map((table: { tablename: string }) => table.tablename)
    const nonExistentTables = tenantScopedTables.filter(table => !existingTableNames.includes(table))
    
    const duration = Date.now() - startTime
    
    if (nonExistentTables.length > 0) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        duration,
        message: `${nonExistentTables.length} tenant tables not found`,
        details: {
          missingTables: nonExistentTables,
          existingTables: existingTableNames,
          totalRequired: tenantScopedTables.length
        }
      }
    }
    
    if (missingRLS.length > 0) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        duration,
        message: `${missingRLS.length} tables missing RLS protection`,
        details: {
          unprotectedTables: missingRLS.map((table: { tablename: string }) => table.tablename),
          protectedTables: protectedTables.map((table: { tablename: string }) => table.tablename),
          totalRequired: tenantScopedTables.length
        }
      }
    }
    
    return {
      status: 'healthy',
      timestamp: new Date(),
      duration,
      message: `RLS enabled on all ${protectedTables.length} tenant tables`,
      details: {
        protectedTables: protectedTables.map((table: { tablename: string }) => table.tablename),
        totalRequired: tenantScopedTables.length,
        policiesActive: true
      }
    }
    
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date(),
      duration: Date.now() - startTime,
      message: 'Failed to verify RLS status',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }
  }
}

/**
 * Create a health check object for RLS verification
 */
export function createRLSCheck(): import('../types.js').HealthCheck {
  return {
    name: 'row-level-security',
    timeoutMs: 10000, // 10 second timeout for RLS verification
    check: rlsHealthCheck
  }
}

```

---

### startup.ts

**Path:** `src\probes\startup.ts`

**Language:** TypeScript

```typescript
import { HealthCheckResult } from '../types.js';

let isBootstrapped = false;
let bootstrapTime: Date | null = null;
let bootstrapError: Error | null = null;

/**
 * Marks the application as bootstrapped and ready to serve traffic.
 * This should be called after all initialization is complete.
 */
export function markBootstrapped(): void {
  isBootstrapped = true;
  bootstrapTime = new Date();
  bootstrapError = null;
}

/**
 * Marks the application as failed to bootstrap.
 * This should be called if bootstrap fails.
 */
export function markBootstrapFailed(error: Error): void {
  isBootstrapped = false;
  bootstrapTime = null;
  bootstrapError = error;
}

/**
 * Resets the bootstrap state (useful for testing).
 */
export function resetBootstrapState(): void {
  isBootstrapped = false;
  bootstrapTime = null;
  bootstrapError = null;
}

/**
 * Startup probe checks if the application has completed bootstrap.
 * This only checks the bootstrapped flag and never calls external systems.
 * 
 * @returns Promise<HealthCheckResult> - Bootstrap status
 */
export async function startupProbe(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const duration = Date.now() - startTime;
    
    if (bootstrapError) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        duration,
        message: `Bootstrap failed: ${bootstrapError.message}`,
        details: {
          error: bootstrapError.stack,
          isBootstrapped: false
        }
      };
    }
    
    if (!isBootstrapped) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        duration,
        message: 'Application not bootstrapped',
        details: {
          isBootstrapped: false,
          uptime: typeof process !== 'undefined' ? process.uptime() : 0
        }
      };
    }
    
    return {
      status: 'healthy',
      timestamp: new Date(),
      duration,
      message: 'Application bootstrapped successfully',
      details: {
        isBootstrapped: true,
        bootstrapTime: bootstrapTime!,
        uptime: typeof process !== 'undefined' ? process.uptime() : 0,
        bootstrapDuration: bootstrapTime ? 
          Math.round((bootstrapTime.getTime() - (typeof process !== 'undefined' ? process.uptime() * 1000 : 0))) : 
          undefined
      }
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date(),
      duration: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Startup probe failed',
      details: {
        error: error instanceof Error ? error.stack : String(error),
        isBootstrapped
      }
    };
  }
}

```

---

### synthetic.ts

**Path:** `src\probes\synthetic.ts`

**Language:** TypeScript

```typescript
import { SyntheticCheck, HealthCheckResult } from '../types.js';

interface RegisteredCheck extends SyntheticCheck {
  lastRun?: Date;
  lastResult?: HealthCheckResult;
  runCount: number;
}

class SyntheticCheckManager {
  private checks = new Map<string, RegisteredCheck>();
  private isRunning = false;
  private intervalId: any = null;

  /**
   * Registers a synthetic check for monitoring.
   * 
   * @param check The synthetic check to register
   */
  registerCheck(check: SyntheticCheck): void {
    const registeredCheck: RegisteredCheck = {
      ...check,
      runCount: 0
    };
    
    this.checks.set(check.name, registeredCheck);
  }

  /**
   * Unregisters a synthetic check.
   * 
   * @param name The name of the check to unregister
   */
  unregisterCheck(name: string): void {
    this.checks.delete(name);
  }

  /**
   * Gets all registered checks.
   */
  getChecks(): RegisteredCheck[] {
    return Array.from(this.checks.values());
  }

  /**
   * Gets a specific check by name.
   */
  getCheck(name: string): RegisteredCheck | undefined {
    return this.checks.get(name);
  }

  /**
   * Runs a specific synthetic check.
   * 
   * @param name The name of the check to run
   * @returns Promise<HealthCheckResult> - The result of the check
   */
  async runCheck(name: string): Promise<HealthCheckResult> {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Check '${name}' not found`);
    }

    if (!check.enabled) {
      throw new Error(`Check '${name}' is disabled`);
    }

    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        check.check(),
        new Promise<HealthCheckResult>((_, reject) =>
          globalThis.setTimeout(() => reject(new Error(`Check ${name} timed out`)), check.timeoutMs)
        )
      ]);

      const finalResult = {
        ...result,
        duration: Date.now() - startTime
      };

      // Update check metadata
      check.lastRun = new Date();
      check.lastResult = finalResult;
      check.runCount++;

      return finalResult;
    } catch (error) {
      const errorResult: HealthCheckResult = {
        status: 'unhealthy',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          error: error instanceof Error ? error.stack : String(error)
        }
      };

      // Update check metadata
      check.lastRun = new Date();
      check.lastResult = errorResult;
      check.runCount++;

      return errorResult;
    }
  }

  /**
   * Runs all enabled synthetic checks in parallel.
   * 
   * @returns Promise<Record<string, HealthCheckResult>> - Results of all checks
   */
  async runAllChecks(): Promise<Record<string, HealthCheckResult>> {
    const enabledChecks = Array.from(this.checks.values())
      .filter(check => check.enabled);

    if (enabledChecks.length === 0) {
      return {};
    }

    const checkPromises = enabledChecks.map(async (check) => {
      try {
        const result = await this.runCheck(check.name);
        return { name: check.name, result };
      } catch (error) {
        const errorResult: HealthCheckResult = {
          status: 'unhealthy',
          timestamp: new Date(),
          duration: 0,
          message: error instanceof Error ? error.message : 'Unknown error',
          details: {
            error: error instanceof Error ? error.stack : String(error)
          }
        };
        return { name: check.name, result: errorResult };
      }
    });

    const results = await Promise.all(checkPromises);
    
    return results.reduce((acc, { name, result }) => {
      acc[name] = result;
      return acc;
    }, {} as Record<string, HealthCheckResult>);
  }

  /**
   * Starts the synthetic check runner with the specified interval.
   * Note: This is a basic implementation. In production, you'd want
   * to use a proper job scheduler like cron or Bull.
   * 
   * @param intervalMs Interval in milliseconds between runs
   */
  startRunner(intervalMs: number = 60000): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.intervalId = globalThis.setInterval(async () => {
      try {
        await this.runAllChecks();
      } catch (error) {
        // Log error but don't stop the runner
        console.error('Synthetic check runner error:', error);
      }
    }, intervalMs);
  }

  /**
   * Stops the synthetic check runner.
   */
  stopRunner(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      globalThis.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Gets the runner status.
   */
  isRunnerActive(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const syntheticCheckManager = new SyntheticCheckManager();

// Export class for testing
export { SyntheticCheckManager };

// Export convenience functions
export const registerSyntheticCheck = (check: SyntheticCheck): void => {
  syntheticCheckManager.registerCheck(check);
};

export const runSyntheticChecks = async (): Promise<Record<string, HealthCheckResult>> => {
  return syntheticCheckManager.runAllChecks();
};

export const getSyntheticChecks = (): RegisteredCheck[] => {
  return syntheticCheckManager.getChecks();
};

```

---

### types.ts

**Path:** `src\types.ts`

**Language:** TypeScript

```typescript
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  duration: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  checks: Record<string, HealthCheckResult>;
  uptime: number;
  version: string;
}

export interface HealthCheck {
  name: string;
  timeoutMs: number;
  check: () => Promise<HealthCheckResult>;
}

export interface SyntheticCheck extends HealthCheck {
  schedule?: string;
  enabled: boolean;
}

export type ProbeType = 'liveness' | 'readiness' | 'startup';

```

---

### endpoint.test.ts

**Path:** `tests\endpoint.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createHealthHandler } from '../src/endpoint.js';
import type { HealthCheck } from '../src/types.js';

describe('createHealthHandler', () => {
  const mockHealthCheck: HealthCheck = {
    name: 'test-check',
    timeoutMs: 1000,
    check: vi.fn().mockResolvedValue({
      status: 'healthy',
      timestamp: new Date(),
      duration: 10
    })
  };

  it('should reject unauthorized requests', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [mockHealthCheck]
    });

    const result = await handler({
      headers: {},
      method: 'GET'
    });

    expect(result.status).toBe(401);
    expect(result.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Unauthorized');
  });

  it('should reject requests with wrong secret', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [mockHealthCheck]
    });

    const result = await handler({
      headers: { authorization: 'Bearer wrong-secret' },
      method: 'GET'
    });

    expect(result.status).toBe(401);
    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Unauthorized');
  });

  it('should accept requests with correct secret', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [mockHealthCheck]
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'GET'
    });

    expect(result.status).toBe(200);
    expect(result.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(result.body || '{}');
    expect(body.status).toBe('healthy');
  });

  it('should use custom header name', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      headerName: 'X-Health-Token',
      customChecks: [mockHealthCheck]
    });

    const result = await handler({
      headers: { 'x-health-token': 'test-secret' },
      method: 'GET'
    });

    expect(result.status).toBe(200);
  });

  it('should reject non-GET requests', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [mockHealthCheck]
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'POST'
    });

    expect(result.status).toBe(405);
    const body = JSON.parse(result.body || '{}');
    expect(body.error).toBe('Method not allowed');
  });

  it('should include version in response', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      version: '2.0.0',
      customChecks: [mockHealthCheck]
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'GET'
    });

    const body = JSON.parse(result.body || '{}');
    expect(body.version).toBe('2.0.0');
  });

  it('should include uptime in response', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [mockHealthCheck]
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'GET'
    });

    const body = JSON.parse(result.body || '{}');
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should include all health checks in response', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [mockHealthCheck]
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'GET'
    });

    const body = JSON.parse(result.body || '{}');
    expect(body.checks).toHaveProperty('liveness');
    expect(body.checks).toHaveProperty('readiness');
    expect(body.checks).toHaveProperty('startup');
    expect(body.checks).toHaveProperty('test-check');
  });

  it('should return 503 when unhealthy', async () => {
    const unhealthyCheck: HealthCheck = {
      name: 'unhealthy-check',
      timeoutMs: 1000,
      check: vi.fn().mockResolvedValue({
        status: 'unhealthy',
        timestamp: new Date(),
        duration: 10,
        message: 'Service down'
      })
    };

    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [unhealthyCheck]
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'GET'
    });

    expect(result.status).toBe(503);
    const body = JSON.parse(result.body || '{}');
    expect(body.status).toBe('unhealthy');
  });

  it('should return 200 when degraded', async () => {
    const degradedCheck: HealthCheck = {
      name: 'degraded-check',
      timeoutMs: 1000,
      check: vi.fn().mockResolvedValue({
        status: 'degraded',
        timestamp: new Date(),
        duration: 10,
        message: 'Slow response'
      })
    };

    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [degradedCheck]
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'GET'
    });

    expect(result.status).toBe(503); // Degraded also returns 503
    const body = JSON.parse(result.body || '{}');
    expect(body.status).toBe('degraded');
  });

  it('should handle synthetic checks when enabled', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [mockHealthCheck],
      includeSynthetic: true
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'GET'
    });

    const body = JSON.parse(result.body || '{}');
    expect(body.checks).toHaveProperty('synthetic');
  });

  it('should not include synthetic checks when disabled', async () => {
    const handler = createHealthHandler({
      secret: 'test-secret',
      customChecks: [mockHealthCheck],
      includeSynthetic: false
    });

    const result = await handler({
      headers: { authorization: 'Bearer test-secret' },
      method: 'GET'
    });

    const body = JSON.parse(result.body || '{}');
    expect(body.checks).not.toHaveProperty('synthetic');
  });
});

```

---

### liveness.test.ts

**Path:** `tests\liveness.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { livenessProbe } from '../src/probes/liveness.js';

describe('livenessProbe', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return healthy when event loop is responsive', async () => {
    const result = await livenessProbe();

    expect(result.status).toBe('healthy');
    expect(result.message).toBe('Event loop responsive');
    expect(result.details).toHaveProperty('tickDuration');
    expect(result.details).toHaveProperty('uptime');
    expect(typeof result.details?.tickDuration).toBe('number');
    expect(result.details?.tickDuration).toBeLessThan(50);
  });

  it('should return degraded when event loop is slow', async () => {
    // Mock process.hrtime.bigint to simulate slow tick
    const mockHrtime = vi.fn();
    const slowTick = BigInt(60 * 1000000); // 60ms in nanoseconds
    
    mockHrtime.mockReturnValueOnce(BigInt(0));
    mockHrtime.mockReturnValueOnce(slowTick);
    
    const originalHrtime = global.process?.hrtime;
    if (global.process) {
      global.process.hrtime = { bigint: mockHrtime } as any;
    }

    const result = await livenessProbe();

    expect(result.status).toBe('degraded');
    expect(result.message).toContain('Event loop slow');
    expect(result.details?.tickDuration).toBe(60);

    // Restore original
    if (global.process && originalHrtime) {
      global.process.hrtime = originalHrtime;
    }
  });

  it('should return unhealthy when setImmediate times out', async () => {
    // Mock setImmediate to never call the callback
    const originalSetImmediate = global.setImmediate;
    global.setImmediate = vi.fn(() => {}) as any;

    // Advance timers to trigger timeout
    const promise = livenessProbe();
    vi.advanceTimersByTime(100);
    
    const result = await promise;

    expect(result.status).toBe('unhealthy');
    expect(result.message).toBe('Event loop unresponsive');

    // Restore original
    global.setImmediate = originalSetImmediate;
  });

  it('should include duration in result', async () => {
    const result = await livenessProbe();

    expect(typeof result.duration).toBe('number');
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should have timestamp in result', async () => {
    const before = new Date();
    const result = await livenessProbe();
    const after = new Date();

    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

```

---

### readiness.test.ts

**Path:** `tests\readiness.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readinessProbe } from '../src/probes/readiness.js';
import type { HealthCheck } from '../src/types.js';

describe('readinessProbe', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should return healthy when all checks pass', async () => {
    const mockCheck: HealthCheck = {
      name: 'test-check',
      timeoutMs: 1000,
      check: vi.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: new Date(),
        duration: 10,
        message: 'All good'
      })
    };

    const result = await readinessProbe([mockCheck]);

    expect(result.status).toBe('healthy');
    expect(result.message).toBe('All dependencies healthy');
    expect(result.details?.totalChecks).toBe(1);
    expect(result.details?.healthy).toBe(1);
    expect(result.details?.degraded).toBe(0);
    expect(result.details?.unhealthy).toBe(0);
  });

  it('should return unhealthy when any check fails', async () => {
    const mockCheck: HealthCheck = {
      name: 'failing-check',
      timeoutMs: 1000,
      check: vi.fn().mockResolvedValue({
        status: 'unhealthy',
        timestamp: new Date(),
        duration: 10,
        message: 'Connection failed'
      })
    };

    const result = await readinessProbe([mockCheck]);

    expect(result.status).toBe('unhealthy');
    expect(result.message).toBe('1 dependencies unhealthy');
    expect(result.details?.unhealthy).toBe(1);
  });

  it('should return degraded when any check is degraded', async () => {
    const mockCheck: HealthCheck = {
      name: 'slow-check',
      timeoutMs: 1000,
      check: vi.fn().mockResolvedValue({
        status: 'degraded',
        timestamp: new Date(),
        duration: 10,
        message: 'Slow response'
      })
    };

    const result = await readinessProbe([mockCheck]);

    expect(result.status).toBe('degraded');
    expect(result.message).toBe('1 dependencies degraded');
    expect(result.details?.degraded).toBe(1);
  });

  it('should handle multiple checks with mixed results', async () => {
    const mockChecks: HealthCheck[] = [
      {
        name: 'healthy-check',
        timeoutMs: 1000,
        check: vi.fn().mockResolvedValue({
          status: 'healthy',
          timestamp: new Date(),
          duration: 10
        })
      },
      {
        name: 'degraded-check',
        timeoutMs: 1000,
        check: vi.fn().mockResolvedValue({
          status: 'degraded',
          timestamp: new Date(),
          duration: 10
        })
      },
      {
        name: 'unhealthy-check',
        timeoutMs: 1000,
        check: vi.fn().mockResolvedValue({
          status: 'unhealthy',
          timestamp: new Date(),
          duration: 10
        })
      }
    ];

    const result = await readinessProbe(mockChecks);

    expect(result.status).toBe('unhealthy'); // Unhealthy takes precedence
    expect(result.details?.totalChecks).toBe(3);
    expect(result.details?.healthy).toBe(1);
    expect(result.details?.degraded).toBe(1);
    expect(result.details?.unhealthy).toBe(1);
  });

  it('should timeout individual checks that take too long', async () => {
    const slowCheck: HealthCheck = {
      name: 'slow-check',
      timeoutMs: 100,
      check: vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      )
    };

    const promise = readinessProbe([slowCheck]);
    vi.advanceTimersByTime(100);
    
    const result = await promise;

    expect(result.status).toBe('unhealthy');
    expect(result.details?.unhealthy).toBe(1);
    expect(result.details?.checks['slow-check'].message).toContain('timed out');
  });

  it('should timeout overall probe when it takes too long', async () => {
    const slowCheck: HealthCheck = {
      name: 'slow-check',
      timeoutMs: 10000,
      check: vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      )
    };

    const promise = readinessProbe([slowCheck], 100);
    vi.advanceTimersByTime(100);
    
    const result = await promise;

    expect(result.status).toBe('unhealthy');
    expect(result.message).toBe('Readiness probe timed out');
  });

  it('should run checks in parallel', async () => {
    const check1: HealthCheck = {
      name: 'check1',
      timeoutMs: 1000,
      check: vi.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: new Date(),
        duration: 10
      })
    };

    const check2: HealthCheck = {
      name: 'check2',
      timeoutMs: 1000,
      check: vi.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: new Date(),
        duration: 10
      })
    };

    await readinessProbe([check1, check2]);

    expect(check1.check).toHaveBeenCalled();
    expect(check2.check).toHaveBeenCalled();
  });
});

```

---

### startup.test.ts

**Path:** `tests\startup.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  startupProbe, 
  markBootstrapped, 
  markBootstrapFailed, 
  resetBootstrapState 
} from '../src/probes/startup.js';

describe('startupProbe', () => {
  beforeEach(() => {
    resetBootstrapState();
    vi.useFakeTimers();
  });

  afterEach(() => {
    resetBootstrapState();
    vi.useRealTimers();
  });

  it('should return unhealthy when not bootstrapped', async () => {
    const result = await startupProbe();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toBe('Application not bootstrapped');
    expect(result.details?.isBootstrapped).toBe(false);
  });

  it('should return healthy when bootstrapped', async () => {
    markBootstrapped();
    
    const result = await startupProbe();

    expect(result.status).toBe('healthy');
    expect(result.message).toBe('Application bootstrapped successfully');
    expect(result.details?.isBootstrapped).toBe(true);
    expect(result.details?.bootstrapTime).toBeInstanceOf(Date);
  });

  it('should return unhealthy when bootstrap failed', async () => {
    const error = new Error('Database connection failed');
    markBootstrapFailed(error);
    
    const result = await startupProbe();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toBe('Bootstrap failed: Database connection failed');
    expect(result.details?.isBootstrapped).toBe(false);
    expect(result.details?.error).toContain('Database connection failed');
  });

  it('should include bootstrap duration in details', async () => {
    markBootstrapped();
    
    const result = await startupProbe();

    expect(result.details?.bootstrapDuration).toBeDefined();
    expect(typeof result.details?.bootstrapDuration).toBe('number');
  });

  it('should handle multiple bootstrap state changes', async () => {
    // Initial state
    let result = await startupProbe();
    expect(result.status).toBe('unhealthy');

    // Mark as failed
    markBootstrapFailed(new Error('Config error'));
    result = await startupProbe();
    expect(result.status).toBe('unhealthy');
    expect(result.message).toContain('Config error');

    // Mark as bootstrapped
    markBootstrapped();
    result = await startupProbe();
    expect(result.status).toBe('healthy');
    expect(result.message).toBe('Application bootstrapped successfully');
  });

  it('should include duration in result', async () => {
    markBootstrapped();
    
    const result = await startupProbe();

    expect(typeof result.duration).toBe('number');
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should have timestamp in result', async () => {
    markBootstrapped();
    
    const before = new Date();
    const result = await startupProbe();
    const after = new Date();

    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

```

---

### synthetic.test.ts

**Path:** `tests\synthetic.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  SyntheticCheckManager, 
  syntheticCheckManager, 
  registerSyntheticCheck, 
  runSyntheticChecks,
  getSyntheticChecks
} from '../src/probes/synthetic.js';
import type { SyntheticCheck, HealthCheckResult } from '../src/types.js';

describe('SyntheticCheckManager', () => {
  let manager: SyntheticCheckManager;

  beforeEach(() => {
    manager = new SyntheticCheckManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('registerCheck', () => {
    it('should register a synthetic check', () => {
      const check: SyntheticCheck = {
        name: 'test-check',
        timeoutMs: 1000,
        enabled: true,
        check: vi.fn().mockResolvedValue({
          status: 'healthy',
          timestamp: new Date(),
          duration: 10
        })
      };

      manager.registerCheck(check);
      const checks = manager.getChecks();

      expect(checks).toHaveLength(1);
      expect(checks[0].name).toBe('test-check');
      expect(checks[0].runCount).toBe(0);
    });

    it('should allow multiple checks with same name (overwrite)', () => {
      const check1: SyntheticCheck = {
        name: 'test-check',
        timeoutMs: 1000,
        enabled: true,
        check: vi.fn()
      };

      const check2: SyntheticCheck = {
        name: 'test-check',
        timeoutMs: 2000,
        enabled: false,
        check: vi.fn()
      };

      manager.registerCheck(check1);
      manager.registerCheck(check2);
      
      const checks = manager.getChecks();
      expect(checks).toHaveLength(1);
      expect(checks[0].timeoutMs).toBe(2000);
      expect(checks[0].enabled).toBe(false);
    });
  });

  describe('unregisterCheck', () => {
    it('should unregister a synthetic check', () => {
      const check: SyntheticCheck = {
        name: 'test-check',
        timeoutMs: 1000,
        enabled: true,
        check: vi.fn()
      };

      manager.registerCheck(check);
      expect(manager.getChecks()).toHaveLength(1);

      manager.unregisterCheck('test-check');
      expect(manager.getChecks()).toHaveLength(0);
    });

    it('should handle unregistering non-existent check', () => {
      expect(() => manager.unregisterCheck('non-existent')).not.toThrow();
    });
  });

  describe('runCheck', () => {
    it('should run a specific check successfully', async () => {
      const mockResult: HealthCheckResult = {
        status: 'healthy',
        timestamp: new Date(),
        duration: 10
      };

      const check: SyntheticCheck = {
        name: 'test-check',
        timeoutMs: 1000,
        enabled: true,
        check: vi.fn().mockResolvedValue(mockResult)
      };

      manager.registerCheck(check);
      const result = await manager.runCheck('test-check');

      expect(result.status).toBe('healthy');
      expect(check.check).toHaveBeenCalled();
      
      const registeredCheck = manager.getCheck('test-check');
      expect(registeredCheck?.lastResult).toEqual(result);
      expect(registeredCheck?.runCount).toBe(1);
    });

    it('should throw error for non-existent check', async () => {
      await expect(manager.runCheck('non-existent')).rejects.toThrow("Check 'non-existent' not found");
    });

    it('should throw error for disabled check', async () => {
      const check: SyntheticCheck = {
        name: 'disabled-check',
        timeoutMs: 1000,
        enabled: false,
        check: vi.fn()
      };

      manager.registerCheck(check);
      await expect(manager.runCheck('disabled-check')).rejects.toThrow("Check 'disabled-check' is disabled");
    });

    it('should timeout check that takes too long', async () => {
      const check: SyntheticCheck = {
        name: 'slow-check',
        timeoutMs: 100,
        enabled: true,
        check: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 200))
        )
      };

      manager.registerCheck(check);
      
      const promise = manager.runCheck('slow-check');
      vi.advanceTimersByTime(100);
      
      const result = await promise;

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('timed out');
    });
  });

  describe('runAllChecks', () => {
    it('should run all enabled checks in parallel', async () => {
      const check1: SyntheticCheck = {
        name: 'check1',
        timeoutMs: 1000,
        enabled: true,
        check: vi.fn().mockResolvedValue({
          status: 'healthy',
          timestamp: new Date(),
          duration: 10
        })
      };

      const check2: SyntheticCheck = {
        name: 'check2',
        timeoutMs: 1000,
        enabled: true,
        check: vi.fn().mockResolvedValue({
          status: 'healthy',
          timestamp: new Date(),
          duration: 10
        })
      };

      const disabledCheck: SyntheticCheck = {
        name: 'disabled-check',
        timeoutMs: 1000,
        enabled: false,
        check: vi.fn()
      };

      manager.registerCheck(check1);
      manager.registerCheck(check2);
      manager.registerCheck(disabledCheck);

      const results = await manager.runAllChecks();

      expect(Object.keys(results)).toHaveLength(2);
      expect(results).toHaveProperty('check1');
      expect(results).toHaveProperty('check2');
      expect(results).not.toHaveProperty('disabled-check');
      expect(check1.check).toHaveBeenCalled();
      expect(check2.check).toHaveBeenCalled();
      expect(disabledCheck.check).not.toHaveBeenCalled();
    });

    it('should return empty object when no checks are enabled', async () => {
      const disabledCheck: SyntheticCheck = {
        name: 'disabled-check',
        timeoutMs: 1000,
        enabled: false,
        check: vi.fn()
      };

      manager.registerCheck(disabledCheck);
      const results = await manager.runAllChecks();

      expect(results).toEqual({});
    });
  });

  describe('runner', () => {
    it('should start and stop runner', () => {
      expect(manager.isRunnerActive()).toBe(false);

      manager.startRunner(1000);
      expect(manager.isRunnerActive()).toBe(true);

      manager.stopRunner();
      expect(manager.isRunnerActive()).toBe(false);
    });

    it('should not start runner if already running', () => {
      manager.startRunner(1000);
      expect(manager.isRunnerActive()).toBe(true);

      manager.startRunner(500); // Should not change anything
      expect(manager.isRunnerActive()).toBe(true);
    });

    it('should run checks on interval', async () => {
      const check: SyntheticCheck = {
        name: 'test-check',
        timeoutMs: 1000,
        enabled: true,
        check: vi.fn().mockResolvedValue({
          status: 'healthy',
          timestamp: new Date(),
          duration: 10
        })
      };

      manager.registerCheck(check);
      manager.startRunner(1000);

      // Advance time to trigger first run
      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      expect(check.check).toHaveBeenCalledTimes(1);

      manager.stopRunner();
    });
  });
});

describe('synthetic check exports', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should use singleton syntheticCheckManager', () => {
    const check: SyntheticCheck = {
      name: 'test-check',
      timeoutMs: 1000,
      enabled: true,
      check: vi.fn()
    };

    registerSyntheticCheck(check);
    const checks = getSyntheticChecks();

    expect(checks).toHaveLength(1);
    expect(checks[0].name).toBe('test-check');
  });

  it('should run checks using runSyntheticChecks', async () => {
    const check: SyntheticCheck = {
      name: 'test-check',
      timeoutMs: 1000,
      enabled: true,
      check: vi.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: new Date(),
        duration: 10
      })
    };

    registerSyntheticCheck(check);
    const results = await runSyntheticChecks();

    expect(results).toHaveProperty('test-check');
    expect(results['test-check'].status).toBe('healthy');
  });
});

```

---

### vitest.config.ts

**Path:** `tests\vitest.config.ts`

**Language:** TypeScript

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});

```

---

### tsup.config.ts

**Path:** `tsup.config.ts`

**Language:** TypeScript

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['@firm/types', '@firm/logger'],
});

```

---

