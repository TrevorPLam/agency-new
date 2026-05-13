import { z } from 'zod'
import { TRPCRouterRecord } from '@trpc/server'

/**
 * Common input schemas
 */
export const PaginationInputSchema = z.object({
  cursor: z.string().optional().describe('Cursor for pagination'),
  limit: z.number().min(1).max(100).default(20).describe('Number of items per page')
})

export const TenantInputSchema = z.object({
  tenantId: z.string().uuid().describe('Tenant UUID')
})

export const DateRangeInputSchema = z.object({
  startDate: z.string().datetime().optional().describe('Start date filter'),
  endDate: z.string().datetime().optional().describe('End date filter')
})

/**
 * Lead management route contracts
 */
export const LeadRoutes = {
  // Lead CRUD operations
  createLead: {
    input: z.object({
      tenantId: z.string().uuid(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      company: z.string().optional(),
      source: z.enum(['form', 'import', 'manual', 'api', 'webhook']),
      sourceDetails: z.record(z.unknown()).optional(),
      tags: z.array(z.string()).default([]),
      customFields: z.record(z.unknown()).default({})
    }),
    output: z.object({
      leadId: z.string().uuid(),
      status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
      score: z.number().min(0).max(100),
      createdAt: z.string().datetime()
    })
  },

  getLead: {
    input: z.object({
      tenantId: z.string().uuid(),
      leadId: z.string().uuid()
    }),
    output: z.object({
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
  },

  listLeads: {
    input: z.object({
      tenantId: z.string().uuid(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
      source: z.enum(['form', 'import', 'manual', 'api', 'webhook']).optional(),
      tags: z.array(z.string()).optional(),
      search: z.string().optional()
    }),
    output: z.object({
      items: z.array(z.object({
        leadId: z.string().uuid(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
        score: z.number().min(0).max(100),
        createdAt: z.string().datetime()
      })),
      nextCursor: z.string().optional(),
      hasMore: z.boolean()
    })
  },

  updateLead: {
    input: z.object({
      tenantId: z.string().uuid(),
      leadId: z.string().uuid(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
      tags: z.array(z.string()).optional(),
      customFields: z.record(z.unknown()).optional()
    }),
    output: z.object({
      leadId: z.string().uuid(),
      updatedAt: z.string().datetime()
    })
  },

  deleteLead: {
    input: z.object({
      tenantId: z.string().uuid(),
      leadId: z.string().uuid()
    }),
    output: z.object({
      success: z.boolean()
    })
  },

  // Lead sync operations
  syncLead: {
    input: z.object({
      tenantId: z.string().uuid(),
      leadId: z.string().uuid(),
      crmProvider: z.enum(['gohighlevel', 'hubspot', 'salesforce', 'pipedrive', 'zoho'])
    }),
    output: z.object({
      syncId: z.string().uuid(),
      status: z.enum(['pending', 'success', 'failed']),
      externalId: z.string().optional()
    })
  },

  getSyncStatus: {
    input: z.object({
      tenantId: z.string().uuid(),
      syncId: z.string().uuid()
    }),
    output: z.object({
      syncId: z.string().uuid(),
      leadId: z.string().uuid(),
      crmProvider: z.enum(['gohighlevel', 'hubspot', 'salesforce', 'pipedrive', 'zoho']),
      status: z.enum(['pending', 'success', 'failed']),
      externalId: z.string().optional(),
      errorMessage: z.string().optional(),
      createdAt: z.string().datetime(),
      completedAt: z.string().datetime().optional()
    })
  }
} satisfies TRPCRouterRecord

/**
 * Form management route contracts
 */
export const FormRoutes = {
  submitForm: {
    input: z.object({
      tenantId: z.string().uuid(),
      formId: z.string().uuid(),
      formType: z.enum(['contact', 'lead', 'quote', 'appointment', 'newsletter']),
      fields: z.record(z.unknown()),
      userAgent: z.string().optional(),
      referrer: z.string().url().optional(),
      utm: z.object({
        source: z.string().optional(),
        medium: z.string().optional(),
        campaign: z.string().optional(),
        term: z.string().optional(),
        content: z.string().optional()
      }).optional(),
      consent: z.object({
        marketing: z.boolean().default(false),
        analytics: z.boolean().default(false),
        necessary: z.boolean().default(true)
      })
    }),
    output: z.object({
      submissionId: z.string().uuid(),
      status: z.enum(['success', 'validation_failed']),
      leadId: z.string().uuid().optional(),
      errors: z.array(z.object({
        field: z.string(),
        message: z.string(),
        code: z.string()
      })).optional()
    })
  },

  getForm: {
    input: z.object({
      tenantId: z.string().uuid(),
      formId: z.string().uuid()
    }),
    output: z.object({
      formId: z.string().uuid(),
      name: z.string(),
      type: z.enum(['contact', 'lead', 'quote', 'appointment', 'newsletter']),
      fields: z.array(z.object({
        name: z.string(),
        type: z.string(),
        label: z.string(),
        required: z.boolean(),
        validation: z.record(z.unknown()).optional()
      })),
      isActive: z.boolean(),
      createdAt: z.string().datetime()
    })
  },

  listForms: {
    input: z.object({
      tenantId: z.string().uuid(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      type: z.enum(['contact', 'lead', 'quote', 'appointment', 'newsletter']).optional(),
      isActive: z.boolean().optional()
    }),
    output: z.object({
      items: z.array(z.object({
        formId: z.string().uuid(),
        name: z.string(),
        type: z.enum(['contact', 'lead', 'quote', 'appointment', 'newsletter']),
        isActive: z.boolean(),
        submissionCount: z.number(),
        createdAt: z.string().datetime()
      })),
      nextCursor: z.string().optional(),
      hasMore: z.boolean()
    })
  }
} satisfies TRPCRouterRecord

/**
 * Booking management route contracts
 */
export const BookingRoutes = {
  createBooking: {
    input: z.object({
      tenantId: z.string().uuid(),
      serviceId: z.string().uuid(),
      customerId: z.string().uuid(),
      startTime: z.string().datetime(),
      notes: z.string().optional(),
      customerInfo: z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional()
      })
    }),
    output: z.object({
      bookingId: z.string().uuid(),
      status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      duration: z.number(),
      createdAt: z.string().datetime()
    })
  },

  getBooking: {
    input: z.object({
      tenantId: z.string().uuid(),
      bookingId: z.string().uuid()
    }),
    output: z.object({
      bookingId: z.string().uuid(),
      serviceId: z.string().uuid(),
      customerId: z.string().uuid(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      duration: z.number(),
      status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
      notes: z.string().optional(),
      customerInfo: z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional()
      }),
      serviceInfo: z.object({
        name: z.string(),
        price: z.number(),
        category: z.string()
      }),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime()
    })
  },

  listBookings: {
    input: z.object({
      tenantId: z.string().uuid(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']).optional(),
      customerId: z.string().uuid().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional()
    }),
    output: z.object({
      items: z.array(z.object({
        bookingId: z.string().uuid(),
        serviceId: z.string().uuid(),
        customerId: z.string().uuid(),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
        status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
        customerInfo: z.object({
          name: z.string(),
          email: z.string().email()
        }),
        serviceInfo: z.object({
          name: z.string(),
          price: z.number()
        })
      })),
      nextCursor: z.string().optional(),
      hasMore: z.boolean()
    })
  },

  updateBooking: {
    input: z.object({
      tenantId: z.string().uuid(),
      bookingId: z.string().uuid(),
      startTime: z.string().datetime().optional(),
      notes: z.string().optional(),
      status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']).optional()
    }),
    output: z.object({
      bookingId: z.string().uuid(),
      updatedAt: z.string().datetime()
    })
  },

  cancelBooking: {
    input: z.object({
      tenantId: z.string().uuid(),
      bookingId: z.string().uuid(),
      reason: z.string().optional()
    }),
    output: z.object({
      bookingId: z.string().uuid(),
      status: z.enum(['cancelled']),
      cancelledAt: z.string().datetime()
    })
  }
} satisfies TRPCRouterRecord

/**
 * Combined router type
 */
export type AppRouter = {
  leads: typeof LeadRoutes
  forms: typeof FormRoutes
  bookings: typeof BookingRoutes
}
