import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

/**
 * Booking management OpenAPI routes
 */
export const BookingOpenApiRoutes = {
  '/v1/bookings': {
    post: {
      tags: ['Bookings'],
      summary: 'Create a new booking',
      description: 'Creates a new booking appointment',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        {
          name: 'X-Tenant-ID',
          in: 'header',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Tenant UUID for multi-tenancy'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              serviceId: z.string().uuid().openapi({
                description: 'Service UUID'
              }),
              customerId: z.string().uuid().openapi({
                description: 'Customer UUID'
              }),
              startTime: z.string().datetime().openapi({
                description: 'Booking start time (ISO 8601)'
              }),
              endTime: z.string().datetime().openapi({
                description: 'Booking end time (ISO 8601)'
              }),
              duration: z.number().min(1).openapi({
                description: 'Duration in minutes'
              }),
              notes: z.string().optional().openapi({
                description: 'Booking notes'
              }),
              customerName: z.string().min(1).openapi({
                description: 'Customer name'
              }),
              customerEmail: z.string().email().openapi({
                description: 'Customer email'
              }),
              customerPhone: z.string().optional().openapi({
                description: 'Customer phone'
              }),
              serviceName: z.string().min(1).openapi({
                description: 'Service name'
              }),
              servicePrice: z.number().min(0).optional().openapi({
                description: 'Service price'
              }),
              serviceCategory: z.string().optional().openapi({
                description: 'Service category'
              }),
              calendarProvider: z.enum(['calcom', 'google', 'outlook']).optional().openapi({
                description: 'Calendar provider for integration'
              }),
              metadata: z.record(z.unknown()).optional().openapi({
                description: 'Additional metadata'
              })
            })
          }
        }
      },
      responses: {
        201: {
          description: 'Booking created successfully',
          content: {
            'application/json': {
              schema: z.object({
                bookingId: z.string().uuid().openapi({
                  description: 'Booking UUID'
                }),
                status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']).openapi({
                  description: 'Booking status'
                }),
                startTime: z.string().datetime().openapi({
                  description: 'Start time'
                }),
                endTime: z.string().datetime().openapi({
                  description: 'End time'
                }),
                duration: z.number().openapi({
                  description: 'Duration in minutes'
                }),
                customerName: z.string().openapi({
                  description: 'Customer name'
                }),
                customerEmail: z.string().email().openapi({
                  description: 'Customer email'
                }),
                serviceName: z.string().openapi({
                  description: 'Service name'
                }),
                createdAt: z.string().datetime().openapi({
                  description: 'Creation timestamp'
                })
              })
            }
          }
        },
        400: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    
    get: {
      tags: ['Bookings'],
      summary: 'List bookings',
      description: 'Retrieves a paginated list of bookings',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        {
          name: 'X-Tenant-ID',
          in: 'header',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Tenant UUID for multi-tenancy'
        },
        {
          name: 'cursor',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Cursor for pagination'
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Number of items per page'
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show']
          },
          description: 'Filter by booking status'
        },
        {
          name: 'customerId',
          in: 'query',
          required: false,
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by customer UUID'
        },
        {
          name: 'serviceCategory',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Filter by service category'
        },
        {
          name: 'startDate',
          in: 'query',
          required: false,
          schema: { type: 'string', format: 'date' },
          description: 'Filter by start date (YYYY-MM-DD)'
        },
        {
          name: 'endDate',
          in: 'query',
          required: false,
          schema: { type: 'string', format: 'date' },
          description: 'Filter by end date (YYYY-MM-DD)'
        }
      ],
      responses: {
        200: {
          description: 'Bookings retrieved successfully',
          content: {
            'application/json': {
              schema: z.object({
                items: z.array(z.object({
                  bookingId: z.string().uuid(),
                  serviceId: z.string().uuid(),
                  customerId: z.string().uuid(),
                  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
                  startTime: z.string().datetime(),
                  endTime: z.string().datetime(),
                  duration: z.number(),
                  customerName: z.string(),
                  customerEmail: z.string().email(),
                  customerPhone: z.string().optional(),
                  serviceName: z.string(),
                  servicePrice: z.string().optional(),
                  serviceCategory: z.string().optional(),
                  notes: z.string().optional(),
                  createdAt: z.string().datetime(),
                  updatedAt: z.string().datetime()
                })),
                meta: z.object({
                  nextCursor: z.string().optional(),
                  hasMore: z.boolean()
                })
              })
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  
  '/v1/bookings/{bookingId}': {
    get: {
      tags: ['Bookings'],
      summary: 'Get booking details',
      description: 'Retrieves detailed information about a specific booking',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        {
          name: 'X-Tenant-ID',
          in: 'header',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Tenant UUID for multi-tenancy'
        },
        {
          name: 'bookingId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Booking UUID'
        }
      ],
      responses: {
        200: {
          description: 'Booking retrieved successfully',
          content: {
            'application/json': {
              schema: z.object({
                bookingId: z.string().uuid(),
                serviceId: z.string().uuid(),
                customerId: z.string().uuid(),
                status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
                startTime: z.string().datetime(),
                endTime: z.string().datetime(),
                duration: z.number(),
                notes: z.string().optional(),
                customerName: z.string(),
                customerEmail: z.string().email(),
                customerPhone: z.string().optional(),
                serviceName: z.string(),
                servicePrice: z.string().optional(),
                serviceCategory: z.string().optional(),
                calendarProvider: z.enum(['calcom', 'google', 'outlook']).optional(),
                externalEventId: z.string().optional(),
                metadata: z.record(z.unknown()).optional(),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
                cancelledAt: z.string().datetime().optional(),
                completedAt: z.string().datetime().optional()
              })
            }
          }
        },
        404: {
          description: 'Booking not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    
    put: {
      tags: ['Bookings'],
      summary: 'Update booking',
      description: 'Updates booking information',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        {
          name: 'X-Tenant-ID',
          in: 'header',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Tenant UUID for multi-tenancy'
        },
        {
          name: 'bookingId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Booking UUID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              startTime: z.string().datetime().optional(),
              endTime: z.string().datetime().optional(),
              duration: z.number().min(1).optional(),
              notes: z.string().optional(),
              customerName: z.string().min(1).optional(),
              customerEmail: z.string().email().optional(),
              customerPhone: z.string().optional(),
              serviceName: z.string().min(1).optional(),
              servicePrice: z.number().min(0).optional(),
              serviceCategory: z.string().optional(),
              status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']).optional(),
              metadata: z.record(z.unknown()).optional()
            })
          }
        }
      },
      responses: {
        200: {
          description: 'Booking updated successfully',
          content: {
            'application/json': {
              schema: z.object({
                bookingId: z.string().uuid(),
                updatedAt: z.string().datetime()
              })
            }
          }
        },
        404: {
          description: 'Booking not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    
    delete: {
      tags: ['Bookings'],
      summary: 'Delete booking',
      description: 'Deletes a booking from the system',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        {
          name: 'X-Tenant-ID',
          in: 'header',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Tenant UUID for multi-tenancy'
        },
        {
          name: 'bookingId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Booking UUID'
        }
      ],
      responses: {
        200: {
          description: 'Booking deleted successfully',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean()
              })
            }
          }
        },
        404: {
          description: 'Booking not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  
  '/v1/bookings/{bookingId}/confirm': {
    post: {
      tags: ['Bookings'],
      summary: 'Confirm booking',
      description: 'Confirms a pending booking',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        {
          name: 'X-Tenant-ID',
          in: 'header',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Tenant UUID for multi-tenancy'
        },
        {
          name: 'bookingId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Booking UUID'
        }
      ],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: z.object({
              notes: z.string().optional().openapi({
                description: 'Confirmation notes'
              }),
              sendConfirmationEmail: z.boolean().default(true).openapi({
                description: 'Send confirmation email to customer'
              })
            })
          }
        }
      },
      responses: {
        200: {
          description: 'Booking confirmed successfully',
          content: {
            'application/json': {
              schema: z.object({
                bookingId: z.string().uuid(),
                status: z.literal('confirmed'),
                confirmedAt: z.string().datetime()
              })
            }
          }
        },
        404: {
          description: 'Booking not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  
  '/v1/bookings/{bookingId}/cancel': {
    post: {
      tags: ['Bookings'],
      summary: 'Cancel booking',
      description: 'Cancels a booking',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        {
          name: 'X-Tenant-ID',
          in: 'header',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Tenant UUID for multi-tenancy'
        },
        {
          name: 'bookingId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Booking UUID'
        }
      ],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: z.object({
              reason: z.string().optional().openapi({
                description: 'Cancellation reason'
              }),
              sendCancellationEmail: z.boolean().default(true).openapi({
                description: 'Send cancellation email to customer'
              }),
              refundAmount: z.number().min(0).optional().openapi({
                description: 'Refund amount (if applicable)'
              })
            })
          }
        }
      },
      responses: {
        200: {
          description: 'Booking cancelled successfully',
          content: {
            'application/json': {
              schema: z.object({
                bookingId: z.string().uuid(),
                status: z.literal('cancelled'),
                cancelledAt: z.string().datetime()
              })
            }
          }
        },
        404: {
          description: 'Booking not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  }
}
