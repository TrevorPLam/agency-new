import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

/**
 * RFC 7807 Problem Details error response
 */
export const ProblemDetailsSchema = z.object({
  type: z.string().url().openapi({
    example: 'https://api.firm.com/errors/validation-failed',
    description: 'Error type identifier'
  }),
  title: z.string().openapi({
    example: 'Validation Failed',
    description: 'Human-readable error title'
  }),
  status: z.number().int().min(400).max(599).openapi({
    example: 400,
    description: 'HTTP status code'
  }),
  detail: z.string().openapi({
    example: 'The request failed validation',
    description: 'Detailed error message'
  }),
  instance: z.string().url().optional().openapi({
    example: 'https://api.firm.com/errors/12345',
    description: 'Specific error instance identifier'
  }),
  errors: z.array(z.object({
    field: z.string().openapi({
      example: 'email',
      description: 'Field name with error'
    }),
    message: z.string().openapi({
      example: 'Invalid email format',
      description: 'Error message for field'
    }),
    code: z.string().openapi({
      example: 'INVALID_EMAIL',
      description: 'Machine-readable error code'
    })
  })).optional().openapi({
    description: 'Field-specific validation errors'
  }),
  metadata: z.record(z.unknown()).optional().openapi({
    description: 'Additional error metadata'
  })
}).openapi('ProblemDetails')

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>

/**
 * Pagination cursor schema
 */
export const CursorSchema = z.string().openapi({
  example: 'eyJpZCI6IjEyMzQ1IiwidXBkYXRlZEF0IjoiMjAyNC0wMS0wMVQwMDowMDowMFoifQ==',
  description: 'Base64-encoded pagination cursor'
})

/**
 * Pagination metadata
 */
export const PaginationMetaSchema = z.object({
  nextCursor: CursorSchema.optional().openapi({
    description: 'Cursor for next page'
  }),
  prevCursor: CursorSchema.optional().openapi({
    description: 'Cursor for previous page'
  }),
  hasMore: z.boolean().openapi({
    example: true,
    description: 'Whether more items are available'
  }),
  totalCount: z.number().int().nonnegative().optional().openapi({
    example: 150,
    description: 'Total number of items (when available)'
  }),
  pageSize: z.number().int().positive().openapi({
    example: 20,
    description: 'Page size used for this request'
  })
}).openapi('PaginationMeta')

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>

/**
 * Paginated response wrapper
 */
export function PaginatedResponseSchema<T>(itemSchema: z.ZodSchema<T>, schemaName?: string) {
  const name = schemaName || `${itemSchema.constructor.name}Response`
  return z.object({
    items: z.array(itemSchema).openapi({
      description: 'Array of items for current page'
    }),
    meta: PaginationMetaSchema.openapi({
      description: 'Pagination metadata'
    })
  }).openapi(`Paginated${name}`)
}

/**
 * Success response wrapper
 */
export function SuccessResponseSchema<T>(dataSchema: z.ZodSchema<T>) {
  return z.object({
    success: z.literal(true).openapi({
      description: 'Success indicator'
    }),
    data: dataSchema.openapi({
      description: 'Response data'
    }),
    meta: z.record(z.unknown()).optional().openapi({
      description: 'Additional metadata'
    })
  }).openapi(`Success${dataSchema.constructor.name}Response`)
}

/**
 * Error response wrapper
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false).openapi({
    description: 'Success indicator'
  }),
  error: ProblemDetailsSchema.openapi({
    description: 'Error details'
  }),
  meta: z.record(z.unknown()).optional().openapi({
    description: 'Additional metadata'
  })
}).openapi('ErrorResponse')

/**
 * Common error types
 */
export const ErrorTypes = {
  // Validation errors
  VALIDATION_FAILED: 'https://api.firm.com/errors/validation-failed',
  INVALID_INPUT: 'https://api.firm.com/errors/invalid-input',
  MISSING_REQUIRED_FIELD: 'https://api.firm.com/errors/missing-required-field',
  
  // Authentication errors
  UNAUTHORIZED: 'https://api.firm.com/errors/unauthorized',
  INVALID_TOKEN: 'https://api.firm.com/errors/invalid-token',
  TOKEN_EXPIRED: 'https://api.firm.com/errors/token-expired',
  INVALID_API_KEY: 'https://api.firm.com/errors/invalid-api-key',
  
  // Authorization errors
  FORBIDDEN: 'https://api.firm.com/errors/forbidden',
  INSUFFICIENT_PERMISSIONS: 'https://api.firm.com/errors/insufficient-permissions',
  CROSS_TENANT_ACCESS: 'https://api.firm.com/errors/cross-tenant-access',
  
  // Resource errors
  NOT_FOUND: 'https://api.firm.com/errors/not-found',
  RESOURCE_CONFLICT: 'https://api.firm.com/errors/resource-conflict',
  RESOURCE_LOCKED: 'https://api.firm.com/errors/resource-locked',
  
  // Rate limiting
  RATE_LIMITED: 'https://api.firm.com/errors/rate-limited',
  QUOTA_EXCEEDED: 'https://api.firm.com/errors/quota-exceeded',
  
  // Business logic errors
  LEAD_ALREADY_EXISTS: 'https://api.firm.com/errors/lead-already-exists',
  INVALID_LEAD_STATUS: 'https://api.firm.com/errors/invalid-lead-status',
  BOOKING_CONFLICT: 'https://api.firm.com/errors/booking-conflict',
  FORM_SUBMISSION_FAILED: 'https://api.firm.com/errors/form-submission-failed',
  
  // System errors
  INTERNAL_SERVER_ERROR: 'https://api.firm.com/errors/internal-server-error',
  SERVICE_UNAVAILABLE: 'https://api.firm.com/errors/service-unavailable',
  DATABASE_ERROR: 'https://api.firm.com/errors/database-error',
  EXTERNAL_SERVICE_ERROR: 'https://api.firm.com/errors/external-service-error'
} as const

/**
 * Create a problem details error
 */
export function createProblemDetails(
  type: string,
  title: string,
  status: number,
  detail: string,
  options?: {
    instance?: string
    errors?: Array<{ field: string; message: string; code: string }>
    metadata?: Record<string, unknown>
  }
): ProblemDetails {
  return {
    type,
    title,
    status,
    detail,
    instance: options?.instance,
    errors: options?.errors,
    metadata: options?.metadata
  }
}

/**
 * Common error creators
 */
export const ErrorCreators = {
  validationFailed: (detail: string, errors?: Array<{ field: string; message: string; code: string }>) =>
    createProblemDetails(ErrorTypes.VALIDATION_FAILED, 'Validation Failed', 400, detail, { errors }),
    
  unauthorized: (detail: string = 'Authentication required') =>
    createProblemDetails(ErrorTypes.UNAUTHORIZED, 'Unauthorized', 401, detail),
    
  forbidden: (detail: string = 'Access denied') =>
    createProblemDetails(ErrorTypes.FORBIDDEN, 'Forbidden', 403, detail),
    
  notFound: (resource: string = 'Resource') =>
    createProblemDetails(ErrorTypes.NOT_FOUND, 'Not Found', 404, `${resource} not found`),
    
  rateLimited: (detail: string = 'Rate limit exceeded') =>
    createProblemDetails(ErrorTypes.RATE_LIMITED, 'Rate Limited', 429, detail),
    
  internalServerError: (detail: string = 'Internal server error') =>
    createProblemDetails(ErrorTypes.INTERNAL_SERVER_ERROR, 'Internal Server Error', 500, detail)
}
