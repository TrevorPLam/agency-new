// Event system
export * from './events'

// Route contracts
export * from './routes/trpc'
export * from './routes/openapi'

// Response schemas
export * from './responses'

// OpenAPI generation
export * from './openapi'

// Re-export commonly used types
export type {
  BaseEvent,
  TypedEvent,
  EventDefinition,
  EventRegistry
} from './events'

export type {
  ProblemDetails,
  PaginationMeta
} from './responses'

export {
  EVENT_REGISTRY,
  defineEvent,
  createTypedEvent,
  validateEvent,
  isEventRegistered,
  getRegisteredEventTypes
} from './events'

export {
  LeadRoutes,
  FormRoutes,
  BookingRoutes,
  type AppRouter
} from './routes/trpc'

export {
  LeadOpenApiRoutes,
  FormOpenApiRoutes,
  OpenApiComponents
} from './routes/openapi'

export {
  generateOpenAPIDocument,
  writeOpenAPIDocument,
  registry
} from './openapi'

export {
  ProblemDetailsSchema,
  PaginationMetaSchema,
  PaginatedResponseSchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
  ErrorTypes,
  ErrorCreators,
  createProblemDetails
} from './responses'
