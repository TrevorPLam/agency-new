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
