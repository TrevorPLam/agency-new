/**
 * Security audit event types
 */
export type SecurityEventType = 
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.password.reset'
  | 'auth.mfa.enabled'
  | 'auth.mfa.disabled'
  | 'auth.impersonation.start'
  | 'auth.impersonation.end'
  | 'csrf.token.generated'
  | 'csrf.token.verified'
  | 'csrf.token.failed'
  | 'rate.limit.exceeded'
  | 'turnstile.verified'
  | 'turnstile.failed'
  | 'csp.violation'
  | 'security.header.missing'
  | 'permission.denied'
  | 'data.access.sensitive'
  | 'admin.action'
  | 'config.changed'

/**
 * Security audit event severity levels
 */
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Security audit event context
 */
export interface SecurityEventContext {
  /** User ID if available */
  userId?: string
  /** IP address */
  ip?: string
  /** User agent */
  userAgent?: string
  /** Tenant ID */
  tenantId?: string
  /** Session ID */
  sessionId?: string
  /** Request ID */
  requestId?: string
  /** Resource being accessed */
  resource?: string
  /** Action being performed */
  action?: string
  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Security audit event
 */
export interface SecurityEvent {
  /** Event type */
  type: SecurityEventType
  /** Event severity */
  severity: SecuritySeverity
  /** Event timestamp */
  timestamp: Date
  /** Event message */
  message: string
  /** Event context */
  context: SecurityEventContext
  /** Event ID */
  id: string
}

/**
 * Security audit logger configuration
 */
export interface SecurityAuditConfig {
  /** Minimum severity level to log */
  minSeverity?: SecuritySeverity
  /** Whether to log to console */
  enableConsole?: boolean
  /** Whether to log to file (if implemented) */
  enableFile?: boolean
  /** Whether to log to external service (if implemented) */
  enableRemote?: boolean
  /** Remote logging endpoint */
  remoteEndpoint?: string
  /** API key for remote logging */
  remoteApiKey?: string
  /** Custom event formatter */
  formatter?: (event: SecurityEvent) => string
}

/**
 * Security audit logger
 */
export class SecurityAuditLogger {
  private readonly config: Required<SecurityAuditConfig>
  private readonly severityLevels: Record<SecuritySeverity, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  }

  constructor(config: SecurityAuditConfig = {}) {
    this.config = {
      minSeverity: config.minSeverity || 'low',
      enableConsole: config.enableConsole !== false,
      enableFile: config.enableFile || false,
      enableRemote: config.enableRemote || false,
      remoteEndpoint: config.remoteEndpoint || '',
      remoteApiKey: config.remoteApiKey || '',
      formatter: config.formatter || this.defaultFormatter
    }
  }

  /**
   * Log a security event
   */
  log(event: Omit<SecurityEvent, 'id' | 'timestamp'>): SecurityEvent {
    const fullEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date()
    }

    // Check severity threshold
    if (this.shouldLog(fullEvent.severity)) {
      this.writeLog(fullEvent)
    }

    return fullEvent
  }

  /**
   * Log authentication success
   */
  logAuthSuccess(
    userId: string,
    context: Partial<SecurityEventContext> = {}
  ): SecurityEvent {
    return this.log({
      type: 'auth.login.success',
      severity: 'medium',
      message: `User ${userId} logged in successfully`,
      context: { ...context, userId }
    })
  }

  /**
   * Log authentication failure
   */
  logAuthFailure(
    reason: string,
    context: Partial<SecurityEventContext> = {}
  ): SecurityEvent {
    return this.log({
      type: 'auth.login.failure',
      severity: 'high',
      message: `Authentication failed: ${reason}`,
      context
    })
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(
    policy: string,
    context: Partial<SecurityEventContext> = {}
  ): SecurityEvent {
    return this.log({
      type: 'rate.limit.exceeded',
      severity: 'medium',
      message: `Rate limit exceeded for policy: ${policy}`,
      context: { ...context, metadata: { policy } }
    })
  }

  /**
   * Log CSRF token failure
   */
  logCsrfFailure(
    reason: string,
    context: Partial<SecurityEventContext> = {}
  ): SecurityEvent {
    return this.log({
      type: 'csrf.token.failed',
      severity: 'high',
      message: `CSRF token verification failed: ${reason}`,
      context
    })
  }

  /**
   * Log permission denied
   */
  logPermissionDenied(
    resource: string,
    action: string,
    context: Partial<SecurityEventContext> = {}
  ): SecurityEvent {
    return this.log({
      type: 'permission.denied',
      severity: 'medium',
      message: `Permission denied for ${action} on ${resource}`,
      context: { ...context, resource, action }
    })
  }

  /**
   * Log admin action
   */
  logAdminAction(
    action: string,
    description: string,
    context: Partial<SecurityEventContext> = {}
  ): SecurityEvent {
    return this.log({
      type: 'admin.action',
      severity: 'high',
      message: `Admin action: ${action} - ${description}`,
      context: { ...context, action, metadata: { description } }
    })
  }

  /**
   * Check if event should be logged based on severity
   */
  private shouldLog(severity: SecuritySeverity): boolean {
    return this.severityLevels[severity] >= this.severityLevels[this.config.minSeverity]
  }

  /**
   * Write log to configured outputs
   */
  private writeLog(event: SecurityEvent): void {
    if (this.config.enableConsole) {
      this.writeToConsole(event)
    }

    if (this.config.enableFile) {
      this.writeToFile(event)
    }

    if (this.config.enableRemote) {
      this.writeToRemote(event)
    }
  }

  /**
   * Write to console
   */
  private writeToConsole(event: SecurityEvent): void {
    const level = this.getConsoleLevel(event.severity)
    const message = this.config.formatter(event)
    
    console[level](`[SECURITY] ${message}`)
  }

  /**
   * Write to file (placeholder - would need file system implementation)
   */
  private writeToFile(event: SecurityEvent): void {
    // File logging implementation would go here
    // For now, we'll just log to console with file indicator
    console.log(`[FILE] ${this.config.formatter(event)}`)
  }

  /**
   * Write to remote service (placeholder - would need HTTP client)
   */
  private writeToRemote(event: SecurityEvent): void {
    // Remote logging implementation would go here
    // For now, we'll just log to console with remote indicator
    console.log(`[REMOTE] ${this.config.formatter(event)}`)
  }

  /**
   * Get console logging level based on severity
   */
  private getConsoleLevel(severity: SecuritySeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'low':
      case 'medium':
        return 'log'
      case 'high':
        return 'warn'
      case 'critical':
        return 'error'
      default:
        return 'log'
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Default event formatter
   */
  private defaultFormatter(event: SecurityEvent): string {
    const context = event.context
    const contextParts = [
      context.userId && `user:${context.userId}`,
      context.ip && `ip:${context.ip}`,
      context.tenantId && `tenant:${context.tenantId}`,
      context.resource && `resource:${context.resource}`,
      context.action && `action:${context.action}`
    ].filter(Boolean)

    const contextStr = contextParts.length > 0 ? ` [${contextParts.join(', ')}]` : ''
    return `${event.timestamp.toISOString()} ${event.type}${contextStr} ${event.message}`
  }

  /**
   * Get configuration
   */
  getConfig(): SecurityAuditConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SecurityAuditConfig>): void {
    Object.assign(this.config, updates)
  }
}

/**
 * Create security audit logger
 */
export function createSecurityAuditLogger(config: SecurityAuditConfig = {}): SecurityAuditLogger {
  return new SecurityAuditLogger(config)
}

/**
 * Default security audit logger instance
 */
export const defaultSecurityAuditLogger = createSecurityAuditLogger()
