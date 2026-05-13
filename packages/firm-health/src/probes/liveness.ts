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
