import { z } from 'zod'
import { defineEvent } from './registry'

/**
 * Email sent event data
 */
export const EmailSentDataSchema = z.object({
  emailId: z.string().uuid().describe('Email UUID'),
  templateId: z.string().optional().describe('Email template ID'),
  to: z.array(z.string().email()).describe('Recipient email addresses'),
  cc: z.array(z.string().email()).optional().describe('CC recipients'),
  bcc: z.array(z.string().email()).optional().describe('BCC recipients'),
  subject: z.string().describe('Email subject'),
  from: z.string().email().describe('Sender email address'),
  replyTo: z.string().email().optional().describe('Reply-to address'),
  provider: z.enum(['resend', 'smtp', 'sendgrid', 'ses']).describe('Email provider'),
  providerMessageId: z.string().optional().describe('Provider message ID'),
  category: z.enum(['transactional', 'marketing', 'notification']).describe('Email category'),
  metadata: z.record(z.unknown()).optional().describe('Email metadata'),
  attachments: z.array(z.object({
    filename: z.string(),
    contentType: z.string(),
    size: z.number()
  })).optional().describe('Email attachments')
})

export type EmailSentData = z.infer<typeof EmailSentDataSchema>

/**
 * Email sent event definition
 */
export const EmailSentEvent = defineEvent(
  'email/sent',
  EmailSentDataSchema,
  {
    description: 'Triggered when an email is successfully sent',
    version: '1.0'
  }
)

/**
 * Email delivered event data
 */
export const EmailDeliveredDataSchema = z.object({
  emailId: z.string().uuid().describe('Email UUID'),
  providerMessageId: z.string().describe('Provider message ID'),
  provider: z.enum(['resend', 'smtp', 'sendgrid', 'ses']).describe('Email provider'),
  deliveredAt: z.string().datetime().describe('Delivery timestamp'),
  recipient: z.string().email().describe('Delivered to address')
})

export type EmailDeliveredData = z.infer<typeof EmailDeliveredDataSchema>

/**
 * Email delivered event definition
 */
export const EmailDeliveredEvent = defineEvent(
  'email/delivered',
  EmailDeliveredDataSchema,
  {
    description: 'Triggered when an email is successfully delivered',
    version: '1.0'
  }
)

/**
 * Email bounced event data
 */
export const EmailBouncedDataSchema = z.object({
  emailId: z.string().uuid().describe('Email UUID'),
  providerMessageId: z.string().describe('Provider message ID'),
  provider: z.enum(['resend', 'smtp', 'sendgrid', 'ses']).describe('Email provider'),
  bouncedAt: z.string().datetime().describe('Bounce timestamp'),
  recipient: z.string().email().describe('Bounced email address'),
  bounceType: z.enum(['hard', 'soft', 'transient']).describe('Bounce type'),
  bounceReason: z.string().describe('Bounce reason'),
  bounceCode: z.string().optional().describe('Provider bounce code')
})

export type EmailBouncedData = z.infer<typeof EmailBouncedDataSchema>

/**
 * Email bounced event definition
 */
export const EmailBouncedEvent = defineEvent(
  'email/bounced',
  EmailBouncedDataSchema,
  {
    description: 'Triggered when an email bounces',
    version: '1.0'
  }
)

/**
 * Email opened event data
 */
export const EmailOpenedDataSchema = z.object({
  emailId: z.string().uuid().describe('Email UUID'),
  providerMessageId: z.string().describe('Provider message ID'),
  provider: z.enum(['resend', 'smtp', 'sendgrid', 'ses']).describe('Email provider'),
  openedAt: z.string().datetime().describe('Open timestamp'),
  recipient: z.string().email().describe('Opened by address'),
  userAgent: z.string().optional().describe('User agent string'),
  ipAddress: z.string().ip().optional().describe('Client IP address')
})

export type EmailOpenedData = z.infer<typeof EmailOpenedDataSchema>

/**
 * Email opened event definition
 */
export const EmailOpenedEvent = defineEvent(
  'email/opened',
  EmailOpenedDataSchema,
  {
    description: 'Triggered when an email is opened',
    version: '1.0'
  }
)

/**
 * Email clicked event data
 */
export const EmailClickedDataSchema = z.object({
  emailId: z.string().uuid().describe('Email UUID'),
  providerMessageId: z.string().describe('Provider message ID'),
  provider: z.enum(['resend', 'smtp', 'sendgrid', 'ses']).describe('Email provider'),
  clickedAt: z.string().datetime().describe('Click timestamp'),
  recipient: z.string().email().describe('Clicked by address'),
  url: z.string().url().describe('Clicked URL'),
  userAgent: z.string().optional().describe('User agent string'),
  ipAddress: z.string().ip().optional().describe('Client IP address')
})

export type EmailClickedData = z.infer<typeof EmailClickedDataSchema>

/**
 * Email clicked event definition
 */
export const EmailClickedEvent = defineEvent(
  'email/clicked',
  EmailClickedDataSchema,
  {
    description: 'Triggered when an email link is clicked',
    version: '1.0'
  }
)
