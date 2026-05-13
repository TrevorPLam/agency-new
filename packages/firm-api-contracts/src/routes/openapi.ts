import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

/**
 * Common OpenAPI components
 */
export const OpenApiComponents = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    },
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key'
    }
  },
  parameters: {
    tenantId: {
      name: 'X-Tenant-ID',
      in: 'header',
      required: true,
      schema: { type: 'string', format: 'uuid' },
      description: 'Tenant UUID for multi-tenancy'
    },
    cursor: {
      name: 'cursor',
      in: 'query',
      required: false,
      schema: { type: 'string' },
      description: 'Cursor for pagination'
    },
    limit: {
      name: 'limit',
      in: 'query',
      required: false,
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      description: 'Number of items per page'
    }
  },
  schemas: {
    Error: z.object({
      error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.unknown()).optional()
      })
    }).openapi('Error'),
    
    PaginationMeta: z.object({
      nextCursor: z.string().optional(),
      hasMore: z.boolean()
    }).openapi('PaginationMeta'),
    
    UTMParams: z.object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      term: z.string().optional(),
      content: z.string().optional()
    }).openapi('UTMParams'),
    
    Consent: z.object({
      marketing: z.boolean().default(false),
      analytics: z.boolean().default(false),
      necessary: z.boolean().default(true)
    }).openapi('Consent')
  }
}

/**
 * Lead management OpenAPI routes
 */
export const LeadOpenApiRoutes = {
  '/v1/leads': {
    post: {
      tags: ['Leads'],
      summary: 'Create a new lead',
      description: 'Creates a new lead in the system',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        OpenApiComponents.parameters.tenantId
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              firstName: z.string().min(1).openapi({
                example: 'John',
                description: 'First name'
              }),
              lastName: z.string().min(1).openapi({
                example: 'Doe',
                description: 'Last name'
              }),
              email: z.string().email().openapi({
                example: 'john.doe@example.com',
                description: 'Email address'
              }),
              phone: z.string().optional().openapi({
                example: '+1-555-0123',
                description: 'Phone number'
              }),
              company: z.string().optional().openapi({
                example: 'Acme Corp',
                description: 'Company name'
              }),
              source: z.enum(['form', 'import', 'manual', 'api', 'webhook']).openapi({
                example: 'form',
                description: 'Lead source'
              }),
              sourceDetails: z.record(z.unknown()).optional().openapi({
                description: 'Source-specific details'
              }),
              tags: z.array(z.string()).default([]).openapi({
                example: ['vip', 'enterprise'],
                description: 'Lead tags'
              }),
              customFields: z.record(z.unknown()).default({}).openapi({
                description: 'Custom field values'
              })
            })
          }
        }
      },
      responses: {
        201: {
          description: 'Lead created successfully',
          content: {
            'application/json': {
              schema: z.object({
                leadId: z.string().uuid().openapi({
                  description: 'Lead UUID'
                }),
                status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).openapi({
                  description: 'Lead status'
                }),
                score: z.number().min(0).max(100).openapi({
                  description: 'Lead score'
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
      tags: ['Leads'],
      summary: 'List leads',
      description: 'Retrieves a paginated list of leads',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        OpenApiComponents.parameters.tenantId,
        OpenApiComponents.parameters.cursor,
        OpenApiComponents.parameters.limit,
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['new', 'contacted', 'qualified', 'converted', 'lost']
          },
          description: 'Filter by lead status'
        },
        {
          name: 'source',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['form', 'import', 'manual', 'api', 'webhook']
          },
          description: 'Filter by lead source'
        },
        {
          name: 'tags',
          in: 'query',
          required: false,
          schema: {
            type: 'array',
            items: { type: 'string' }
          },
          style: 'form',
          explode: false,
          description: 'Filter by tags'
        },
        {
          name: 'search',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Search term for name/email/company'
        }
      ],
      responses: {
        200: {
          description: 'Leads retrieved successfully',
          content: {
            'application/json': {
              schema: z.object({
                items: z.array(z.object({
                  leadId: z.string().uuid(),
                  firstName: z.string(),
                  lastName: z.string(),
                  email: z.string().email(),
                  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
                  score: z.number().min(0).max(100),
                  createdAt: z.string().datetime()
                })),
                meta: { $ref: '#/components/schemas/PaginationMeta' }
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
  
  '/v1/leads/{leadId}': {
    get: {
      tags: ['Leads'],
      summary: 'Get lead details',
      description: 'Retrieves detailed information about a specific lead',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        OpenApiComponents.parameters.tenantId,
        {
          name: 'leadId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Lead UUID'
        }
      ],
      responses: {
        200: {
          description: 'Lead retrieved successfully',
          content: {
            'application/json': {
              schema: z.object({
                leadId: z.string().uuid(),
                firstName: z.string(),
                lastName: z.string(),
                email: z.string().email(),
                phone: z.string().optional(),
                company: z.string().optional(),
                status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
                score: z.number().min(0).max(100),
                tags: z.array(z.string()),
                customFields: z.record(z.unknown()),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime()
              })
            }
          }
        },
        404: {
          description: 'Lead not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    
    put: {
      tags: ['Leads'],
      summary: 'Update lead',
      description: 'Updates lead information',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        OpenApiComponents.parameters.tenantId,
        {
          name: 'leadId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Lead UUID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              firstName: z.string().min(1).optional(),
              lastName: z.string().min(1).optional(),
              email: z.string().email().optional(),
              phone: z.string().optional(),
              company: z.string().optional(),
              status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
              tags: z.array(z.string()).optional(),
              customFields: z.record(z.unknown()).optional()
            })
          }
        }
      },
      responses: {
        200: {
          description: 'Lead updated successfully',
          content: {
            'application/json': {
              schema: z.object({
                leadId: z.string().uuid(),
                updatedAt: z.string().datetime()
              })
            }
          }
        },
        404: {
          description: 'Lead not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    
    delete: {
      tags: ['Leads'],
      summary: 'Delete lead',
      description: 'Deletes a lead from the system',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        OpenApiComponents.parameters.tenantId,
        {
          name: 'leadId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Lead UUID'
        }
      ],
      responses: {
        200: {
          description: 'Lead deleted successfully',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean()
              })
            }
          }
        },
        404: {
          description: 'Lead not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  
  '/v1/leads/{leadId}/sync': {
    post: {
      tags: ['Leads'],
      summary: 'Sync lead to CRM',
      description: 'Initiates synchronization of a lead to external CRM',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        OpenApiComponents.parameters.tenantId,
        {
          name: 'leadId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Lead UUID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              crmProvider: z.enum(['gohighlevel', 'hubspot', 'salesforce', 'pipedrive', 'zoho']).openapi({
                example: 'hubspot',
                description: 'CRM provider to sync to'
              })
            })
          }
        }
      },
      responses: {
        202: {
          description: 'Sync initiated successfully',
          content: {
            'application/json': {
              schema: z.object({
                syncId: z.string().uuid(),
                status: z.enum(['pending', 'success', 'failed']),
                externalId: z.string().optional()
              })
            }
          }
        },
        404: {
          description: 'Lead not found',
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

/**
 * Form management OpenAPI routes
 */
export const FormOpenApiRoutes = {
  '/v1/forms': {
    post: {
      tags: ['Forms'],
      summary: 'Submit form',
      description: 'Submits a form and creates lead if applicable',
      security: [],
      parameters: [
        OpenApiComponents.parameters.tenantId
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              formId: z.string().uuid().openapi({
                description: 'Form UUID'
              }),
              formType: z.enum(['contact', 'lead', 'quote', 'appointment', 'newsletter']).openapi({
                example: 'contact',
                description: 'Form type'
              }),
              fields: z.record(z.unknown()).openapi({
                description: 'Form field values'
              }),
              userAgent: z.string().optional().openapi({
                description: 'User agent string'
              }),
              referrer: z.string().url().optional().openapi({
                description: 'Referring URL'
              }),
              utm: { $ref: '#/components/schemas/UTMParams' },
              consent: { $ref: '#/components/schemas/Consent' }
            })
          }
        }
      },
      responses: {
        201: {
          description: 'Form submitted successfully',
          content: {
            'application/json': {
              schema: z.object({
                submissionId: z.string().uuid(),
                status: z.enum(['success', 'validation_failed']),
                leadId: z.string().uuid().optional(),
                errors: z.array(z.object({
                  field: z.string(),
                  message: z.string(),
                  code: z.string()
                })).optional()
              })
            }
          }
        },
        400: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    
    get: {
      tags: ['Forms'],
      summary: 'List forms',
      description: 'Retrieves a paginated list of forms',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        OpenApiComponents.parameters.tenantId,
        OpenApiComponents.parameters.cursor,
        OpenApiComponents.parameters.limit,
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['contact', 'lead', 'quote', 'appointment', 'newsletter']
          },
          description: 'Filter by form type'
        },
        {
          name: 'isActive',
          in: 'query',
          required: false,
          schema: { type: 'boolean' },
          description: 'Filter by active status'
        }
      ],
      responses: {
        200: {
          description: 'Forms retrieved successfully',
          content: {
            'application/json': {
              schema: z.object({
                items: z.array(z.object({
                  formId: z.string().uuid(),
                  name: z.string(),
                  type: z.enum(['contact', 'lead', 'quote', 'appointment', 'newsletter']),
                  isActive: z.boolean(),
                  submissionCount: z.number(),
                  createdAt: z.string().datetime()
                })),
                meta: { $ref: '#/components/schemas/PaginationMeta' }
              })
            }
          }
        }
      }
    }
  }
}
