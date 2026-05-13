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
