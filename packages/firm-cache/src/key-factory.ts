/**
 * Cache key factory for consistent key generation
 * 
 * Provides type-safe key generation with proper naming conventions
 * and tenant scoping.
 */

export interface CacheKeyOptions {
  prefix?: string
  version?: string
  separator?: string
}

/**
 * Default cache key configuration
 */
const DEFAULT_CONFIG: Required<CacheKeyOptions> = {
  separator: ':',
  version: 'v1'
}

/**
 * Cache key factory class
 */
export class CacheKeyFactory {
  private readonly tenantId: string
  private readonly config: CacheKeyOptions

  constructor(tenantId: string, config: CacheKeyOptions = {}) {
    this.tenantId = tenantId
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Generate a cache key with tenant prefix
   */
  key(parts: string[]): string {
    const { prefix, version, separator } = this.config
    
    const keyParts = [
      'tenant',
      this.tenantId,
      ...(prefix ? [prefix] : []),
      version,
      ...parts
    ].filter(Boolean)

    return keyParts.join(separator)
  }

  /**
   * Generate a session key
   */
  session(sessionId: string): string {
    return this.key(['session', sessionId])
  }

  /**
   * Generate a user session key
   */
  userSession(userId: string, sessionId: string): string {
    return this.key(['user', userId, 'session', sessionId])
  }

  /**
   * Generate a user preferences key
   */
  userPreferences(userId: string): string {
    return this.key(['user', userId, 'preferences'])
  }

  /**
   * Generate a form data key
   */
  formData(formId: string): string {
    return this.key(['form', formId, 'data'])
  }

  /**
   * Generate a lead data key
   */
  leadData(leadId: string): string {
    return this.key(['lead', leadId, 'data'])
  }

  /**
   * Generate a CRM sync key
   */
  crmSync(syncId: string): string {
    return this.key(['crm', 'sync', syncId])
  }

  /**
   * Generate an email cache key
   */
  email(emailId: string): string {
    return this.key(['email', emailId])
  }

  /**
   * Generate a booking cache key
   */
  booking(bookingId: string): string {
    return this.key(['booking', bookingId])
  }

  /**
   * Generate a rate limit key
   */
  rateLimit(identifier: string, window: string): string {
    return this.key(['rate-limit', identifier, window])
  }

  /**
   * Generate a feature flag key
   */
  featureFlag(flagName: string): string {
    return this.key(['feature', flagName])
  }

  /**
   * Generate a configuration key
   */
  config(configType: string): string {
    return this.key(['config', configType])
  }

  /**
   * Generate a temporary data key
   */
  temp(identifier: string): string {
    return this.key(['temp', identifier])
  }

  /**
   * Generate a lock key
   */
  lock(resource: string, identifier: string): string {
    return this.key(['lock', resource, identifier])
  }

  /**
   * Get the tenant ID for this factory
   */
  getTenantId(): string {
    return this.tenantId
  }
}

/**
 * Create a cache key factory for a tenant
 */
export function createCacheKeyFactory(tenantId: string, config?: CacheKeyOptions): CacheKeyFactory {
  return new CacheKeyFactory(tenantId, config)
}
