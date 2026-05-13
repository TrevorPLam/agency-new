/**
 * Rate limit policy configuration
 */
export interface RateLimitPolicy {
  /** Number of requests allowed */
  limit: number
  /** Time window in seconds */
  window: number
  /** Policy name for identification */
  name: string
  /** Description of what this policy protects */
  description?: string
}

/**
 * Predefined rate limit policies
 */
export const RATE_LIMIT_POLICIES: Record<string, RateLimitPolicy> = {
  // Authentication endpoints
  'auth-login': {
    name: 'auth-login',
    limit: 5,
    window: 300, // 5 minutes
    description: 'Login attempts per IP'
  },
  'auth-register': {
    name: 'auth-register',
    limit: 3,
    window: 3600, // 1 hour
    description: 'Registration attempts per IP'
  },
  'auth-password-reset': {
    name: 'auth-password-reset',
    limit: 3,
    window: 3600, // 1 hour
    description: 'Password reset requests per email'
  },

  // API endpoints
  'api-general': {
    name: 'api-general',
    limit: 100,
    window: 60, // 1 minute
    description: 'General API requests per authenticated user'
  },
  'api-upload': {
    name: 'api-upload',
    limit: 10,
    window: 60, // 1 minute
    description: 'File upload requests per user'
  },
  'api-search': {
    name: 'api-search',
    limit: 30,
    window: 60, // 1 minute
    description: 'Search requests per user'
  },

  // Form submissions
  'form-contact': {
    name: 'form-contact',
    limit: 5,
    window: 3600, // 1 hour
    description: 'Contact form submissions per IP'
  },
  'form-lead': {
    name: 'form-lead',
    limit: 20,
    window: 3600, // 1 hour
    description: 'Lead form submissions per IP'
  },

  // Webhook endpoints
  'webhook-ingest': {
    name: 'webhook-ingest',
    limit: 1000,
    window: 60, // 1 minute
    description: 'Webhook ingestion per source'
  },

  // Admin endpoints
  'admin-export': {
    name: 'admin-export',
    limit: 2,
    window: 3600, // 1 hour
    description: 'Data export requests per admin'
  },
  'admin-bulk': {
    name: 'admin-bulk',
    limit: 5,
    window: 3600, // 1 hour
    description: 'Bulk operations per admin'
  }
}

/**
 * Get a rate limit policy by name
 */
export function getRateLimitPolicy(name: string): RateLimitPolicy | undefined {
  return RATE_LIMIT_POLICIES[name]
}

/**
 * Validate a rate limit policy configuration
 */
export function validateRateLimitPolicy(policy: RateLimitPolicy): boolean {
  return (
    typeof policy.name === 'string' &&
    policy.name.length > 0 &&
    typeof policy.limit === 'number' &&
    policy.limit > 0 &&
    typeof policy.window === 'number' &&
    policy.window > 0
  )
}

/**
 * Register a custom rate limit policy
 */
export function registerRateLimitPolicy(policy: RateLimitPolicy): void {
  if (!validateRateLimitPolicy(policy)) {
    throw new Error(`Invalid rate limit policy: ${policy.name}`)
  }
  
  RATE_LIMIT_POLICIES[policy.name] = policy
}
