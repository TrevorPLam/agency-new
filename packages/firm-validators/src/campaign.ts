/**
 * Campaign schema validation
 * Provides comprehensive validation for campaign data with business rules
 */

import { z } from 'zod';
import type { Campaign, CampaignType, CampaignStatus, EmailTemplateId, UserId, TenantId } from '@firm/types';
import {
  campaignIdField,
  tenantIdField,
  userIdField,
  nameField,
  textField,
  optionalTextField,
  enumField,
  arrayField,
  optionalArrayField,
  objectField,
  optionalObjectField,
  timestampField,
  metadataField,
  booleanField,
  optionalBooleanField,
  emailTemplateIdField,
} from './common';

// Campaign Audience schema
const campaignAudienceSchema = objectField({
  totalRecipients: numberField('Total recipients', 1, 10000000),
  segments: arrayField(z.string(), 'Segments', 0, 50),
  filters: metadataField(),
}, 'Campaign audience');

// Campaign Schedule schema
const campaignScheduleSchema = objectField({
  scheduledAt: timestampField('Scheduled at').optional(),
  sendImmediately: booleanField('Send immediately', false),
  timezone: enumField(['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney'] as const, 'Timezone'),
  recurrence: optionalObjectField(
    objectField({
      frequency: textField('Frequency', 1, 50),
      interval: numberField('Interval', 1, 365),
      endDate: timestampField('End date').optional(),
    }, 'Recurrence'),
    'Recurrence'
  ),
}, 'Campaign schedule');

// Campaign Content schema
const campaignContentSchema = objectField({
  subject: optionalTextField('Subject', 200),
  body: textField('Body', 1, 100000),
  attachments: optionalArrayField(
    objectField({
      id: uuidField('Attachment ID'),
      name: textField('Attachment name', 1, 255),
      url: textField('Attachment URL', 1, 2000),
      size: numberField('Attachment size', 0),
      type: enumField(['image', 'document', 'spreadsheet', 'presentation', 'video', 'audio', 'archive', 'other'] as const, 'Attachment type'),
    }, 'Campaign attachment'),
    'Campaign attachments',
    0,
    10
  ),
  variables: metadataField(), // Template variables
}, 'Campaign content');

// Campaign Performance schema
const campaignPerformanceSchema = objectField({
  sent: numberField('Sent', 0),
  delivered: numberField('Delivered', 0),
  opened: numberField('Opened', 0),
  clicked: numberField('Clicked', 0),
  converted: numberField('Converted', 0),
  bounced: numberField('Bounced', 0),
  unsubscribed: numberField('Unsubscribed', 0),
}, 'Campaign performance');

// Campaign schema
export const campaignSchema = objectField({
  id: campaignIdField(),
  tenantId: tenantIdField(),
  name: nameField('Campaign name'),
  description: optionalTextField('Description', 1000),
  type: enumField(['email', 'sms', 'social', 'webinar', 'event', 'content', 'retargeting'] as const, 'Campaign type'),
  status: enumField(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'] as const, 'Campaign status'),
  templateId: emailTemplateIdField().optional(),
  audience: campaignAudienceSchema,
  schedule: campaignScheduleSchema,
  content: campaignContentSchema,
  performance: campaignPerformanceSchema,
  metadata: metadataField(),
  createdAt: timestampField('Created at'),
  updatedAt: timestampField('Updated at'),
}, 'Campaign');

// Enhanced campaign schema with business validation
export const campaignSchemaWithValidation = campaignSchema
  .superRefine((data, ctx) => {
    // Business validation rules
    
    // Campaign type specific validation
    if (data.type === 'email' && !data.content.subject) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email campaigns require a subject',
        path: ['content', 'subject'],
      });
    }
    
    if (data.type === 'sms' && data.content.body.length > 1600) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SMS campaigns cannot exceed 1600 characters',
        path: ['content', 'body'],
      });
    }
    
    // Schedule validation
    if (data.schedule.scheduledAt && data.schedule.sendImmediately) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cannot schedule campaign and send immediately',
        path: ['schedule'],
      });
    }
    
    if (data.schedule.scheduledAt) {
      const scheduledTime = new Date(data.schedule.scheduledAt);
      const now = new Date();
      
      if (scheduledTime <= now) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Scheduled time must be in the future',
          path: ['schedule', 'scheduledAt'],
        });
      }
      
      // Cannot schedule more than 1 year in advance
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      if (scheduledTime > oneYearFromNow) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cannot schedule campaign more than 1 year in advance',
          path: ['schedule', 'scheduledAt'],
        });
      }
    }
    
    // Recurrence validation
    if (data.schedule.recurrence) {
      const { frequency, interval, endDate } = data.schedule.recurrence;
      
      if (interval < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Recurrence interval must be at least 1',
          path: ['schedule', 'recurrence', 'interval'],
        });
      }
      
      if (endDate && new Date(endDate) <= new Date(data.schedule.scheduledAt)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Recurrence end date must be after scheduled date',
          path: ['schedule', 'recurrence', 'endDate'],
        });
      }
    }
    
    // Audience validation
    if (data.audience.totalRecipients === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Campaign must have at least 1 recipient',
        path: ['audience', 'totalRecipients'],
      });
    }
    
    // Content validation based on type
    if (data.type === 'email' && data.content.body.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email content must be at least 10 characters',
        path: ['content', 'body'],
      });
    }
    
    // Attachment validation
    if (data.content.attachments) {
      const totalSize = data.content.attachments.reduce((sum, att) => sum + att.size, 0);
      const maxSize = 25 * 1024 * 1024; // 25MB
      
      if (totalSize > maxSize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Total attachment size cannot exceed 25MB',
          path: ['content', 'attachments'],
        });
      }
    }
  })
  .transform((data) => {
    // Auto-calculate performance metrics
    if (data.performance.sent === 0 && data.status === 'completed') {
      // Set default performance for completed campaigns
      data.performance = {
        sent: data.audience.totalRecipients,
        delivered: Math.round(data.audience.totalRecipients * 0.95), // Assume 95% delivery
        opened: Math.round(data.audience.totalRecipients * 0.25), // Assume 25% open
        clicked: Math.round(data.audience.totalRecipients * 0.05), // Assume 5% click
        converted: Math.round(data.audience.totalRecipients * 0.02), // Assume 2% conversion
        bounced: Math.round(data.audience.totalRecipients * 0.03), // Assume 3% bounce
        unsubscribed: Math.round(data.audience.totalRecipients * 0.01), // Assume 1% unsubscribe
      };
    }
    
    // Auto-generate subject if not provided for email campaigns
    if (data.type === 'email' && !data.content.subject && data.name) {
      data.content.subject = data.name;
    }
    
    return data;
  });

// Type assertions
export type CampaignInput = z.infer<typeof campaignSchema>;
export type CampaignInputWithValidation = z.infer<typeof campaignSchemaWithValidation>;

// Runtime validation functions
export const validateCampaign = (data: unknown) => campaignSchema.safeParse(data);
export const validateCampaignWithValidation = (data: unknown) => campaignSchemaWithValidation.safeParse(data);

// Compile-time validation
export const campaignSchemaSatisfies = campaignSchema satisfies z.ZodType<Campaign>;
