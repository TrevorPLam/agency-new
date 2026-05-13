import { z } from 'zod'
import { defineEvent } from './registry'

/**
 * Form submission event data
 */
export const FormSubmittedDataSchema = z.object({
  formId: z.string().uuid().describe('Form UUID'),
  formType: z.enum(['contact', 'lead', 'quote', 'appointment', 'newsletter']).describe('Form type'),
  fields: z.record(z.unknown()).describe('Form field values'),
  userAgent: z.string().optional().describe('User agent string'),
  ipAddress: z.string().ip().optional().describe('Client IP address'),
  referrer: z.string().url().optional().describe('Referring URL'),
  utm: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
    term: z.string().optional(),
    content: z.string().optional()
  }).optional().describe('UTM parameters'),
  consent: z.object({
    marketing: z.boolean().default(false),
    analytics: z.boolean().default(false),
    necessary: z.boolean().default(true)
  }).describe('Consent preferences')
})

export type FormSubmittedData = z.infer<typeof FormSubmittedDataSchema>

/**
 * Form submitted event definition
 */
export const FormSubmittedEvent = defineEvent(
  'form/submitted',
  FormSubmittedDataSchema,
  {
    description: 'Triggered when a user submits a form',
    version: '1.0'
  }
)

/**
 * Form validation failed event data
 */
export const FormValidationFailedDataSchema = z.object({
  formId: z.string().uuid().describe('Form UUID'),
  formType: z.enum(['contact', 'lead', 'quote', 'appointment', 'newsletter']).describe('Form type'),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string()
  })).describe('Validation errors'),
  fields: z.record(z.unknown()).describe('Submitted field values'),
  userAgent: z.string().optional().describe('User agent string'),
  ipAddress: z.string().ip().optional().describe('Client IP address')
})

export type FormValidationFailedData = z.infer<typeof FormValidationFailedDataSchema>

/**
 * Form validation failed event definition
 */
export const FormValidationFailedEvent = defineEvent(
  'form/validation-failed',
  FormValidationFailedDataSchema,
  {
    description: 'Triggered when form validation fails',
    version: '1.0'
  }
)
