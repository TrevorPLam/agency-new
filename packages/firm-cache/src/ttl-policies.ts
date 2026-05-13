/**
 * TTL (Time To Live) policies for different cache types
 * 
 * Provides standardized TTL values for different cache scenarios
 * to ensure consistent caching behavior across the platform.
 */

/**
 * TTL policy interface
 */
export interface TTLPolicy {
  name: string
  ttlSeconds: number
  description: string
}

/**
 * Common TTL policies
 */
export const TTLPolicies = {
  // Very short TTL for frequently changing data
  USER_SESSION: {
    name: 'USER_SESSION',
    ttlSeconds: 30 * 60, // 30 minutes
    description: 'User session data - short TTL for security'
  } as TTLPolicy,

  // Short TTL for temporary data
  TEMPORARY_DATA: {
    name: 'TEMPORARY_DATA',
    ttlSeconds: 5 * 60, // 5 minutes
    description: 'Temporary data that should expire quickly'
  } as TTLPolicy,

  // Medium TTL for user preferences
  USER_PREFERENCES: {
    name: 'USER_PREFERENCES',
    ttlSeconds: 24 * 60 * 7, // 7 days
    description: 'User preferences and settings - medium TTL'
  } as TTLPolicy,

  // Long TTL for configuration data
  CONFIGURATION: {
    name: 'CONFIGURATION',
    ttlSeconds: 24 * 60 * 30, // 30 days
    description: 'Configuration data that changes infrequently'
  } as TTLPolicy,

  // Very long TTL for rarely changing data
  STATIC_DATA: {
    name: 'STATIC_DATA',
    ttlSeconds: 24 * 60 * 90, // 90 days
    description: 'Static data that rarely changes'
  } as TTLPolicy,

  // Rate limiting TTL
  RATE_LIMIT: {
    name: 'RATE_LIMIT',
    ttlSeconds: 60, // 1 minute
    description: 'Rate limit counters - short TTL for accuracy'
  } as TTLPolicy,

  // Form data TTL
  FORM_DATA: {
    name: 'FORM_DATA',
    ttlSeconds: 2 * 60 * 60, // 2 hours
    description: 'Form submission data - medium TTL'
  } as TTLPolicy,

  // Lead data TTL
  LEAD_DATA: {
    name: 'LEAD_DATA',
    ttlSeconds: 24 * 60 * 14, // 2 weeks
    description: 'Lead data - longer TTL for business continuity'
  } as TTLPolicy,

  // Email data TTL
  EMAIL_DATA: {
    name: 'EMAIL_DATA',
    ttlSeconds: 24 * 60 * 7, // 7 days
    description: 'Email tracking data - medium TTL'
  } as TTLPolicy,

  // Booking data TTL
  BOOKING_DATA: {
    name: 'BOOKING_DATA',
    ttlSeconds: 24 * 60 * 3, // 3 days
    description: 'Booking data - short TTL for time-sensitive data'
  } as TTLPolicy,

  // API response cache
  API_RESPONSE: {
    name: 'API_RESPONSE',
    ttlSeconds: 15 * 60, // 15 minutes
    description: 'API response cache - short TTL for data freshness'
  } as TTLPolicy,

  // Feature flag TTL
  FEATURE_FLAG: {
    name: 'FEATURE_FLAG',
    ttlSeconds: 10 * 60, // 10 minutes
    description: 'Feature flags - short TTL for quick updates'
  } as TTLPolicy,

  // Analytics data TTL
  ANALYTICS_DATA: {
    name: 'ANALYTICS_DATA',
    ttlSeconds: 24 * 60 * 2, // 2 days
    description: 'Analytics data - medium TTL for reporting'
  } as TTLPolicy,

  // Security data TTL
  SECURITY_DATA: {
    name: 'SECURITY_DATA',
    ttlSeconds: 5 * 60, // 5 minutes
    description: 'Security-related data - short TTL for security'
  } as TTLPolicy,

  // Cache warming data
  CACHE_WARMING: {
    name: 'CACHE_WARMING',
    ttlSeconds: 24 * 60, // 24 hours
    description: 'Cache warming data - longer TTL for persistence'
  } as TTLPolicy
} as const

/**
 * Get TTL policy by name
 */
export function getTTLPolicy(name: string): TTLPolicy | undefined {
  return Object.values(TTLPolicies).find(policy => policy.name === name)
}

/**
 * Get all TTL policies
 */
export function getAllTTLPolicies(): TTLPolicy[] {
  return Object.values(TTLPolicies)
}

/**
 * Validate TTL value against policy
 */
export function validateTTL(policyName: string, ttlSeconds: number): boolean {
  const policy = getTTLPolicy(policyName)
  if (!policy) {
    throw new Error(`Unknown TTL policy: ${policyName}`)
  }
  
  // TTL should not be negative
  if (ttlSeconds < 0) {
    return false
  }
  
  // TTL should not exceed maximum allowed (90 days)
  const maxTTL = 24 * 60 * 90
  if (ttlSeconds > maxTTL) {
    return false
  }
  
  return true
}

/**
 * Get TTL seconds with validation
 */
export function getTTLSeconds(policyName: string): number {
  const policy = getTTLPolicy(policyName)
  if (!policy) {
    throw new Error(`Unknown TTL policy: ${policyName}`)
  }
  
  return policy.ttlSeconds
}

/**
 * Format TTL for human readable display
 */
export function formatTTL(ttlSeconds: number): string {
  const days = Math.floor(ttlSeconds / (24 * 60 * 60))
  const hours = Math.floor((ttlSeconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((ttlSeconds % (60 * 60)) / 60)
  const seconds = ttlSeconds % 60
  
  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`)
  
  return parts.join(' ')
}

/**
 * TTL policy validator for different use cases
 */
export class TTLValidator {
  private readonly maxTTL: number
  private readonly minTTL: number

  constructor(maxTTL: number = 24 * 60 * 90, minTTL: number = 1) {
    this.maxTTL = maxTTL
    this.minTTL = minTTL
  }

  /**
   * Validate a TTL value
   */
  validate(ttlSeconds: number): { isValid: boolean; error?: string } {
    if (ttlSeconds < this.minTTL) {
      return {
        isValid: false,
        error: `TTL cannot be less than ${this.minTTL} second${this.minTTL === 1 ? '' : 's'}`
      }
    }

    if (ttlSeconds > this.maxTTL) {
      return {
        isValid: false,
        error: `TTL cannot exceed ${formatTTL(this.maxTTL)}`
      }
    }

    return { isValid: true }
  }

  /**
   * Get the maximum allowed TTL
   */
  getMaxTTL(): number {
    return this.maxTTL
  }

  /**
   * Get the minimum allowed TTL
   */
  getMinTTL(): number {
    return this.minTTL
  }
}
