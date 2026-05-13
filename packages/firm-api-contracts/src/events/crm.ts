import { z } from 'zod'
import { defineEvent } from './registry'

/**
 * Lead created event data
 */
export const LeadCreatedDataSchema = z.object({
  leadId: z.string().uuid().describe('Lead UUID'),
  firstName: z.string().describe('First name'),
  lastName: z.string().describe('Last name'),
  email: z.string().email().describe('Email address'),
  phone: z.string().optional().describe('Phone number'),
  company: z.string().optional().describe('Company name'),
  source: z.enum(['form', 'import', 'manual', 'api', 'webhook']).describe('Lead source'),
  sourceDetails: z.record(z.unknown()).optional().describe('Source-specific details'),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).default('new').describe('Lead status'),
  score: z.number().min(0).max(100).default(0).describe('Lead score'),
  tags: z.array(z.string()).default([]).describe('Lead tags'),
  customFields: z.record(z.unknown()).default({}).describe('Custom field values'),
  duplicateOf: z.string().uuid().optional().describe('If this is a duplicate, reference to original lead')
})

export type LeadCreatedData = z.infer<typeof LeadCreatedDataSchema>

/**
 * Lead created event definition
 */
export const LeadCreatedEvent = defineEvent(
  'lead/created',
  LeadCreatedDataSchema,
  {
    description: 'Triggered when a new lead is created',
    version: '1.0'
  }
)

/**
 * Lead updated event data
 */
export const LeadUpdatedDataSchema = z.object({
  leadId: z.string().uuid().describe('Lead UUID'),
  changes: z.record(z.object({
    oldValue: z.unknown(),
    newValue: z.unknown()
  })).describe('Field changes'),
  updatedBy: z.enum(['system', 'user', 'api']).describe('Who made the update'),
  updatedById: z.string().uuid().optional().describe('User ID if updated by user')
})

export type LeadUpdatedData = z.infer<typeof LeadUpdatedDataSchema>

/**
 * Lead updated event definition
 */
export const LeadUpdatedEvent = defineEvent(
  'lead/updated',
  LeadUpdatedDataSchema,
  {
    description: 'Triggered when a lead is updated',
    version: '1.0'
  }
)

/**
 * Lead synced event data
 */
export const LeadSyncedDataSchema = z.object({
  leadId: z.string().uuid().describe('Lead UUID'),
  crmProvider: z.enum(['gohighlevel', 'hubspot', 'salesforce', 'pipedrive', 'zoho']).describe('CRM provider'),
  externalId: z.string().describe('External CRM ID'),
  syncType: z.enum(['create', 'update', 'delete']).describe('Sync operation type'),
  status: z.enum(['success', 'failed', 'pending']).describe('Sync status'),
  errorMessage: z.string().optional().describe('Error message if sync failed'),
  syncedAt: z.string().datetime().describe('When the sync occurred')
})

export type LeadSyncedData = z.infer<typeof LeadSyncedDataSchema>

/**
 * Lead synced event definition
 */
export const LeadSyncedEvent = defineEvent(
  'lead/synced',
  LeadSyncedDataSchema,
  {
    description: 'Triggered when a lead is synced to external CRM',
    version: '1.0'
  }
)

/**
 * Lead converted event data
 */
export const LeadConvertedDataSchema = z.object({
  leadId: z.string().uuid().describe('Lead UUID'),
  convertedTo: z.enum(['customer', 'opportunity']).describe('What the lead was converted to'),
  convertedById: z.string().uuid().describe('Entity ID it was converted to'),
  conversionValue: z.number().optional().describe('Value of the conversion'),
  convertedAt: z.string().datetime().describe('When conversion occurred')
})

export type LeadConvertedData = z.infer<typeof LeadConvertedDataSchema>

/**
 * Lead converted event definition
 */
export const LeadConvertedEvent = defineEvent(
  'lead/converted',
  LeadConvertedDataSchema,
  {
    description: 'Triggered when a lead is converted to customer or opportunity',
    version: '1.0'
  }
)
