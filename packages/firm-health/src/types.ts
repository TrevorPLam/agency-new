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
