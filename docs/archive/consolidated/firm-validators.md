# firm-validators

Generated on: 2026-05-13T02:25:38.765Z
Total files: 9

**Description:** Zod schemas for Firm platform validation

**Version:** 1.0.0

## Table of Contents

- [campaign.ts](#campaign-ts)
- [common.ts](#common-ts)
- [index.ts](#index-ts)
- [v1.ts](#v1-ts)
- [v2.ts](#v2-ts)
- [tenant.ts](#tenant-ts)
- [user.ts](#user-ts)
- [enum-validation.test.ts](#enum-validation-test-ts)
- [tsup.config.ts](#tsup-config-ts)

## File Contents

### campaign.ts

**Path:** `src\campaign.ts`

**Language:** TypeScript

```typescript
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

```

---

### common.ts

**Path:** `src\common.ts`

**Language:** TypeScript

```typescript
/**
 * Common validation primitives for Firm platform
 * Provides reusable field validators and common schema patterns
 */

import { z } from 'zod';
import {
  TenantId,
  UserId,
  LeadId,
  CampaignId,
  BookingId,
  InvoiceId,
  SubscriptionId,
  EmailTemplateId,
  FormId,
  WebhookId,
  ApiKeyId,
  SessionId,
  AuditLogId,
  SyncJobId,
  ReportId,
  asTenantId,
  asUserId,
  asLeadId,
  asCampaignId,
  asBookingId,
  asInvoiceId,
  asSubscriptionId,
  asEmailTemplateId,
  asFormId,
  asWebhookId,
  asApiKeyId,
  asSessionId,
  asAuditLogId,
  asSyncJobId,
  asReportId,
} from '@firm/types';

import type {
  TenantStatus,
  UserStatus,
  LeadStatus,
  LeadSource,
  LeadScore,
  CampaignType,
  CampaignStatus,
  BookingStatus,
  BookingType,
  InvoiceStatus,
  SubscriptionStatus,
  BillingCycle,
  EmailTemplateType,
  FormType,
  WebhookEvent,
  WebhookStatus,
  SyncJobStatus,
  ServiceTier,
  PermissionCategory,
  AuditAction,
  ReportType,
  TimePeriod,
  ExportFormat,
  NotificationType,
  ConsentCategory,
  ApiKeyPermission,
  ThemeMode,
  Currency,
  Language,
  Timezone,
  FileType,
  IntegrationStatus,
} from '@firm/types';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Phone validation regex (E.164 format)
const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

// URL validation regex
const URL_REGEX = /^https?:\/\/(?:[-\w.])+(?:[:\d]+)?(?:\/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:\w*))?)?$/;

// Base field validators
export const uuidField = (fieldName: string) => 
  z.string().regex(UUID_REGEX, { message: `${fieldName} must be a valid UUID v4` });

export const booleanField = (fieldName: string, defaultValue = false) =>
  z.boolean().default(defaultValue);

export const emailField = (fieldName: string = 'Email') =>
  z.string().regex(EMAIL_REGEX, { message: `${fieldName} must be a valid email address` });

export const phoneField = (fieldName: string = 'Phone number') =>
  z.string().regex(PHONE_REGEX, { message: `${fieldName} must be a valid phone number (E.164 format)` });

export const urlField = (fieldName: string = 'URL') =>
  z.string().regex(URL_REGEX, { message: `${fieldName} must be a valid URL` });

export const slugField = (fieldName: string = 'Slug') =>
  z.string()
    .regex(/^[a-z0-9-]+$/, { message: `${fieldName} can only contain lowercase letters, numbers, and hyphens` })
    .min(3, { message: `${fieldName} must be at least 3 characters long` })
    .max(50, { message: `${fieldName} cannot exceed 50 characters` })
    .refine((value) => !value.includes('--'), {
      message: `${fieldName} cannot contain consecutive hyphens`,
    });

export const nameField = (fieldName: string = 'Name') =>
  z.string()
    .min(1, { message: `${fieldName} is required` })
    .max(100, { message: `${fieldName} cannot exceed 100 characters` });

export const textField = (fieldName: string, min = 1, max = 1000) =>
  z.string()
    .min(min, { message: `${fieldName} must be at least ${min} character${min !== 1 ? 's' : ''} long` })
    .max(max, { message: `${fieldName} cannot exceed ${max} characters` });

export const optionalTextField = (fieldName: string, max = 1000) =>
  z.string().max(max, { message: `${fieldName} cannot exceed ${max} characters` }).optional();

// Branded ID validators
export const tenantIdField = () => uuidField('Tenant ID').transform(asTenantId);
export const userIdField = () => uuidField('User ID').transform(asUserId);
export const leadIdField = () => uuidField('Lead ID').transform(asLeadId);
export const campaignIdField = () => uuidField('Campaign ID').transform(asCampaignId);
export const bookingIdField = () => uuidField('Booking ID').transform(asBookingId);
export const invoiceIdField = () => uuidField('Invoice ID').transform(asInvoiceId);
export const subscriptionIdField = () => uuidField('Subscription ID').transform(asSubscriptionId);
export const emailTemplateIdField = () => uuidField('Email template ID').transform(asEmailTemplateId);
export const formIdField = () => uuidField('Form ID').transform(asFormId);
export const webhookIdField = () => uuidField('Webhook ID').transform(asWebhookId);
export const apiKeyIdField = () => uuidField('API key ID').transform(asApiKeyId);
export const sessionIdField = () => uuidField('Session ID').transform(asSessionId);
export const auditLogIdField = () => uuidField('Audit log ID').transform(asAuditLogId);
export const syncJobIdField = () => uuidField('Sync job ID').transform(asSyncJobId);
export const reportIdField = () => uuidField('Report ID').transform(asReportId);


// Enum validators
export const enumField = <T extends readonly string[]>(values: T, fieldName: string) =>
  z.enum(values, { required_error: `${fieldName} is required` });

export const tenantStatusField = () => z.enum(['active', 'inactive', 'suspended', 'trial', 'cancelled'] as const);
export const userStatusField = () => z.enum(['active', 'inactive', 'suspended', 'pending', 'invited'] as const);
export const leadStatusField = () => z.enum(['new', 'contacted', 'qualified', 'converted', 'lost', 'duplicate', 'unsubscribed'] as const);
export const leadSourceField = () => z.enum(['website', 'referral', 'social', 'email', 'phone', 'form', 'api', 'import', 'manual'] as const);
export const leadScoreField = () => z.enum(['hot', 'warm', 'cold'] as const);
export const campaignTypeField = () => z.enum(['email', 'sms', 'social', 'webinar', 'event', 'content', 'retargeting'] as const);
export const campaignStatusField = () => z.enum(['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'] as const);
export const bookingStatusField = () => z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'] as const);
export const bookingTypeField = () => z.enum(['consultation', 'service', 'follow_up', 'demo', 'meeting', 'appointment'] as const);
export const invoiceStatusField = () => z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partial'] as const);
export const subscriptionStatusField = () => z.enum(['active', 'trial', 'past_due', 'cancelled', 'unpaid', 'paused'] as const);
export const billingCycleField = () => z.enum(['monthly', 'quarterly', 'annual'] as const);
export const emailTemplateTypeField = () => z.enum(['welcome', 'confirmation', 'reminder', 'follow_up', 'newsletter', 'promotional', 'transactional', 'alert'] as const);
export const formTypeField = () => z.enum(['contact', 'lead_capture', 'survey', 'feedback', 'registration', 'application', 'quote_request'] as const);
export const webhookEventField = () => z.enum(['lead.created', 'lead.updated', 'lead.deleted', 'booking.created', 'booking.updated', 'booking.completed', 'invoice.created', 'invoice.paid', 'user.created', 'user.updated'] as const);
export const webhookStatusField = () => z.enum(['active', 'inactive', 'failed'] as const);
export const syncJobStatusField = () => z.enum(['pending', 'running', 'completed', 'failed', 'cancelled', 'retrying'] as const);
export const serviceTierField = () => z.enum(['starter', 'professional', 'business', 'enterprise', 'custom'] as const);
export const permissionCategoryField = () => z.enum(['tenant', 'user', 'lead', 'campaign', 'booking', 'invoice', 'analytics', 'settings', 'admin'] as const);
export const auditActionField = () => z.enum(['create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'sync', 'approve', 'reject'] as const);
export const reportTypeField = () => z.enum(['leads', 'campaigns', 'bookings', 'revenue', 'users', 'activity', 'conversion', 'retention'] as const);
export const timePeriodField = () => z.enum(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year', 'custom'] as const);
export const exportFormatField = () => z.enum(['csv', 'xlsx', 'json', 'pdf'] as const);
export const notificationTypeField = () => z.enum(['info', 'success', 'warning', 'error', 'alert'] as const);
export const consentCategoryField = () => z.enum(['necessary', 'analytics', 'marketing', 'preferences', 'functional'] as const);
export const apiKeyPermissionField = () => z.enum(['read', 'write', 'admin', 'webhooks', 'reports'] as const);
export const themeModeField = () => z.enum(['light', 'dark', 'system'] as const);
export const currencyField = () => z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK'] as const);
export const languageField = () => z.enum(['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'da', 'no'] as const);
export const timezoneField = () => z.enum(['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney'] as const);
export const fileTypeField = () => z.enum(['image', 'document', 'spreadsheet', 'presentation', 'video', 'audio', 'archive', 'other'] as const);
export const integrationStatusField = () => z.enum(['connected', 'disconnected', 'error', 'pending', 'expired'] as const);

// Common field patterns
export const timestampField = (fieldName: string = 'Timestamp') =>
  z.date({ required_error: `${fieldName} is required` });

export const optionalTimestampField = (fieldName: string = 'Timestamp') =>
  z.date().optional();

export const optionalBooleanField = (fieldName: string) =>
  z.boolean().optional();

export const numberField = (fieldName: string, min?: number, max?: number) => {
  let field = z.number({ required_error: `${fieldName} is required` });
  if (min !== undefined) field = field.min(min, { message: `${fieldName} must be at least ${min}` });
  if (max !== undefined) field = field.max(max, { message: `${fieldName} cannot exceed ${max}` });
  return field;
};

export const optionalNumberField = (fieldName: string, min?: number, max?: number) => {
  let field = z.number().optional();
  if (min !== undefined) field = field.min(min, { message: `${fieldName} must be at least ${min}` });
  if (max !== undefined) field = field.max(max, { message: `${fieldName} cannot exceed ${max}` });
  return field;
};

export const arrayField = <T extends z.ZodType>(schema: T, fieldName: string, min?: number, max?: number) => {
  let field = z.array(schema, { required_error: `${fieldName} is required` });
  if (min !== undefined) field = field.min(min, { message: `${fieldName} must contain at least ${min} item${min !== 1 ? 's' : ''}` });
  if (max !== undefined) field = field.max(max, { message: `${fieldName} cannot contain more than ${max} item${max !== 1 ? 's' : ''}` });
  return field;
};

export const optionalArrayField = <T extends z.ZodType>(schema: T, fieldName: string, min?: number, max?: number) => {
  let field = z.array(schema).optional();
  if (min !== undefined) field = field.min(min, { message: `${fieldName} must contain at least ${min} item${min !== 1 ? 's' : ''}` });
  if (max !== undefined) field = field.max(max, { message: `${fieldName} cannot contain more than ${max} item${max !== 1 ? 's' : ''}` });
  return field;
};

export const objectField = <T extends z.ZodRawShape>(shape: T, fieldName: string) =>
  z.object(shape, { required_error: `${fieldName} is required` });

export const optionalObjectField = <T extends z.ZodRawShape>(shape: T, fieldName: string) =>
  z.object(shape).optional();

// Metadata and custom fields
export const metadataField = () =>
  z.record(z.unknown(), { message: 'Metadata must be a valid object' });

export const customFieldsField = () =>
  z.record(
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.union([z.string(), z.number(), z.boolean()])),
      z.record(z.union([z.string(), z.number(), z.boolean()])),
      z.null(),
    ]),
    { message: 'Custom fields must be a valid object with string, number, boolean, array, or nested object values' }
  );

// Pagination and sorting
export const paginationParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const sortingParamsSchema = z.object({
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const searchParamsSchema = z.object({
  search: z.string().optional(),
  filters: z.record(z.unknown()).optional(),
});

// Common validation patterns
export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});

export const moneySchema = z.object({
  amount: z.number().min(0, 'Amount must be non-negative'),
  currency: currencyField(),
});

export const fileSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  type: z.string().min(1, 'File type is required'),
  size: z.number().min(0, 'File size must be non-negative'),
  url: z.string().url('File URL must be valid').optional(),
});

// Error handling utilities
export const createValidationError = (field: string, message: string, code?: string) => ({
  field,
  message,
  code: code || 'VALIDATION_ERROR',
});

export const formatZodError = (error: z.ZodError) => {
  return error.errors.map(err => createValidationError(
    err.path.join('.'),
    err.message,
    err.code
  ));
};

// Schema versioning utilities
export const createVersionedSchema = <T extends z.ZodType>(baseSchema: T, version: string) => {
  return baseSchema.extend({
    _version: z.literal(version),
    _schemaVersion: z.string().default(version),
  });
};

export const migrateSchema = <T extends z.ZodType>(oldSchema: T, newSchema: z.ZodType, migrationFn: (data: unknown) => unknown) => {
  return z.preprocess((data) => {
    const result = oldSchema.safeParse(data);
    if (result.success) {
      return migrationFn(result.data);
    }
    return data;
  }, newSchema);
};

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
/**
 * Firm Validators - Zod schemas for Firm platform
 * 
 * This package provides:
 * - Common validation primitives and field validators
 * - Entity schemas with business rules validation
 * - Schema versioning (v1/v2) for breaking changes
 * - Migration utilities between schema versions
 * - Cross-field validation and transformation
 * - Compile-time type safety with satisfies checks
 */

// Export all common primitives
export * from './common';

// Export lead schemas (v1 and v2)
export * from './lead/v1';
export * from './lead/v2';

// Export entity schemas
export * from './tenant';
export * from './user';

// Re-export commonly used schemas for convenience
export {
  // Lead schemas
  leadSchemaV1,
  leadSchemaV1WithValidation,
} from './lead/v1';

export {
  leadSchemaV2,
  leadSchemaV2WithValidation,
} from './lead/v2';

export {
  // Tenant schemas
  tenantSchema,
  tenantSchemaWithValidation,
} from './tenant';

export {
  // User schemas
  userSchema,
  userSchemaWithValidation,
} from './user';

// Export validation functions
export {
  validateLeadV1,
  validateLeadV1WithValidation,
} from './lead/v1';

export {
  validateLeadV2,
  validateLeadV2WithValidation,
  migrateLeadV1ToV2,
} from './lead/v2';

export {
  validateTenant,
  validateTenantWithValidation,
} from './tenant';

export {
  validateUser,
  validateUserWithValidation,
} from './user';

// Export type assertions
export {
  LeadV1,
  LeadV1WithValidation,
} from './lead/v1';

export {
  LeadV2,
  LeadV2WithValidation,
} from './lead/v2';

export {
  TenantInput,
  TenantInputWithValidation,
} from './tenant';

export {
  UserInput,
  UserInputWithValidation,
} from './user';

```

---

### v1.ts

**Path:** `src\lead\v1.ts`

**Language:** TypeScript

```typescript
/**
 * Lead schema v1 - Initial version of lead validation
 * Provides comprehensive validation for lead data with cross-field validation
 */

import { z } from 'zod';
import type { Lead, LeadStatus, LeadSource, LeadScore, UserId, TenantId } from '@firm/types';
import {
  leadIdField,
  tenantIdField,
  userIdField,
  nameField,
  emailField,
  phoneField,
  textField,
  optionalTextField,
  enumField,
  arrayField,
  optionalArrayField,
  objectField,
  optionalObjectField,
  timestampField,
  metadataField,
  customFieldsField,
  numberField,
} from '../common';

// Lead Note schema
const leadNoteSchema = objectField({
  id: uuidField('Note ID'),
  content: textField('Content', 1, 2000),
  createdBy: userIdField(),
  createdAt: timestampField('Created at'),
  isPrivate: booleanField('Is private', false),
}, 'Lead note');

// Lead Activity schema
const leadActivitySchema = objectField({
  id: uuidField('Activity ID'),
  type: textField('Type', 1, 50),
  description: textField('Description', 1, 500),
  createdBy: userIdField(),
  createdAt: timestampField('Created at'),
  metadata: metadataField(),
}, 'Lead activity');

// Lead schema v1
export const leadSchemaV1 = objectField({
  id: leadIdField(),
  tenantId: tenantIdField(),
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  email: emailField('Email').optional(),
  phone: phoneField('Phone number').optional(),
  company: optionalTextField('Company', 100),
  jobTitle: optionalTextField('Job title', 100),
  status: enumField(['new', 'contacted', 'qualified', 'converted', 'lost', 'duplicate', 'unsubscribed'] as const, 'Status'),
  source: enumField(['website', 'referral', 'social', 'email', 'phone', 'form', 'api', 'import', 'manual'] as const, 'Source'),
  score: enumField(['hot', 'warm', 'cold'] as const, 'Score'),
  scoreValue: numberField('Score value', 0, 100).default(0),
  assignedTo: userIdField().optional(),
  tags: optionalArrayField(z.string(), 'Tags', 0, 20),
  customFields: customFieldsField(),
  lastContactAt: timestampField('Last contact at').optional(),
  notes: arrayField(leadNoteSchema, 'Notes', 0, 50),
  activities: arrayField(leadActivitySchema, 'Activities', 0, 100),
  metadata: metadataField(),
  createdAt: timestampField('Created at'),
  updatedAt: timestampField('Updated at'),
}, 'Lead');

// Cross-field validation for lead
export const leadSchemaV1WithValidation = leadSchemaV1
  .superRefine((data, ctx) => {
    // At least email or phone must be provided
    if (!data.email && !data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either email or phone number must be provided',
        path: ['email'],
      });
    }

    // Score validation based on status
    if (data.status === 'converted' && data.score !== 'hot') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Converted leads must have hot score',
        path: ['score'],
      });
    }

    // Assigned user must be active
    if (data.assignedTo && data.status === 'new') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'New leads should not be assigned to users',
        path: ['assignedTo'],
      });
    }
  })
  .transform((data) => {
    // Auto-calculate score based on available data
    if (data.scoreValue === 0) {
      let calculatedScore = 0;
      
      if (data.email) calculatedScore += 20;
      if (data.phone) calculatedScore += 15;
      if (data.company) calculatedScore += 25;
      if (data.jobTitle) calculatedScore += 10;
      
      if (calculatedScore >= 60) {
        data.score = 'hot';
      } else if (calculatedScore >= 30) {
        data.score = 'warm';
      } else {
        data.score = 'cold';
      }
      
      data.scoreValue = calculatedScore;
    }
    
    return data;
  });

// Type assertions
export type LeadV1 = z.infer<typeof leadSchemaV1>;
export type LeadV1WithValidation = z.infer<typeof leadSchemaV1WithValidation>;

// Runtime validation functions
export const validateLeadV1 = (data: unknown) => leadSchemaV1.safeParse(data);
export const validateLeadV1WithValidation = (data: unknown) => leadSchemaV1WithValidation.safeParse(data);

// Compile-time validation
export const leadSchemaV1Satisfies = leadSchemaV1 satisfies z.ZodType<Lead>;

```

---

### v2.ts

**Path:** `src\lead\v2.ts`

**Language:** TypeScript

```typescript
/**
 * Lead schema v2 - Enhanced version with additional fields and validation
 * Extends v1 with new features: lead scoring, consent tracking, enrichment data
 */

import { z } from 'zod';
import type { Lead, LeadStatus, LeadSource, LeadScore, UserId, TenantId } from '@firm/types';
import { leadSchemaV1 } from './v1';
import {
  leadIdField,
  tenantIdField,
  userIdField,
  nameField,
  emailField,
  phoneField,
  textField,
  optionalTextField,
  enumField,
  arrayField,
  optionalArrayField,
  objectField,
  optionalObjectField,
  timestampField,
  metadataField,
  customFieldsField,
  numberField,
  booleanField,
} from '../common';

// Lead enrichment data schema
const leadEnrichmentSchema = objectField({
  source: optionalTextField('Enrichment source', 50),
  confidence: optionalNumberField('Confidence score', 0, 100),
  data: customFieldsField(),
  enrichedAt: optionalTimestampField('Enriched at'),
}, 'Lead enrichment');

// Lead consent tracking schema
const leadConsentSchema = objectField({
  email: booleanField('Email consent', false),
  sms: booleanField('SMS consent', false),
  phone: booleanField('Phone consent', false),
  marketing: booleanField('Marketing consent', false),
  analytics: booleanField('Analytics consent', false),
  consentDate: timestampField('Consent date'),
  ipAddress: optionalTextField('IP address', 45),
  userAgent: optionalTextField('User agent', 500),
  gpcSignal: booleanField('GPC signal', false),
}, 'Lead consent');

// Lead communication preferences schema
const leadPreferencesSchema = objectField({
  preferredChannel: enumField(['email', 'sms', 'phone', 'mail'] as const, 'Preferred channel'),
  timezone: enumField(['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney'] as const, 'Timezone'),
  language: enumField(['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'da', 'no'] as const, 'Language'),
  frequency: enumField(['immediate', 'daily', 'weekly', 'monthly', 'never'] as const, 'Communication frequency'),
  doNotCall: booleanField('Do not call', false),
  doNotEmail: booleanField('Do not email', false),
}, 'Lead preferences');

// Lead social media profiles schema
const socialProfileSchema = objectField({
  platform: enumField(['linkedin', 'twitter', 'facebook', 'instagram', 'website'] as const, 'Platform'),
  url: urlField('Profile URL'),
  username: optionalTextField('Username', 100),
  followers: optionalNumberField('Followers', 0),
  verified: booleanField('Verified', false),
}, 'Social profile');

// Lead v2 schema - extends v1 with new fields
export const leadSchemaV2 = leadSchemaV1
  .extend({
    // New fields in v2
    middleName: optionalTextField('Middle name', 50),
    suffix: optionalTextField('Suffix', 10),
    title: optionalTextField('Title', 20),
    website: urlField('Website').optional(),
    linkedinUrl: urlField('LinkedIn URL').optional(),
    industry: optionalTextField('Industry', 100),
    companySize: enumField(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] as const, 'Company size').optional(),
    annualRevenue: optionalNumberField('Annual revenue', 0),
    country: optionalTextField('Country', 2), // ISO 3166-1 alpha-2
    state: optionalTextField('State/Province', 100),
    city: optionalTextField('City', 100),
    postalCode: optionalTextField('Postal code', 20),
    description: optionalTextField('Description', 1000),
    
    // Consent and preferences
    consent: leadConsentSchema,
    preferences: leadPreferencesSchema,
    
    // Enrichment data
    enrichment: optionalObjectField(leadEnrichmentSchema, 'Enrichment'),
    
    // Social media profiles
    socialProfiles: optionalArrayField(socialProfileSchema, 'Social profiles', 0, 10),
    
    // Lead source details
    sourceDetails: customFieldsField(),
    utmSource: optionalTextField('UTM Source', 100),
    utmMedium: optionalTextField('UTM Medium', 100),
    utmCampaign: optionalTextField('UTM Campaign', 100),
    utmTerm: optionalTextField('UTM Term', 100),
    utmContent: optionalTextField('UTM Content', 100),
    
    // Lead scoring enhancements
    scoreFactors: optionalObjectField(
      objectField({
        email: numberField('Email score factor', 0, 50),
        phone: numberField('Phone score factor', 0, 50),
        company: numberField('Company score factor', 0, 50),
        jobTitle: numberField('Job title score factor', 0, 50),
        industry: numberField('Industry score factor', 0, 50),
        companySize: numberField('Company size score factor', 0, 50),
        revenue: numberField('Revenue score factor', 0, 50),
        website: numberField('Website score factor', 0, 50),
        socialProfiles: numberField('Social profiles score factor', 0, 50),
      }, 'Score factors'),
      'Score factors'
    ),
    
    // Activity tracking
    lastActivityAt: optionalTimestampField('Last activity at'),
    activityCount: optionalNumberField('Activity count', 0),
    conversionProbability: optionalNumberField('Conversion probability', 0, 100),
    
    // Data quality
    dataQuality: optionalObjectField(
      objectField({
        completeness: numberField('Completeness', 0, 100),
        accuracy: numberField('Accuracy', 0, 100),
        lastVerified: optionalTimestampField('Last verified'),
        verificationSource: optionalTextField('Verification source', 100),
      }, 'Data quality'),
      'Data quality'
    ),
  });

// Enhanced cross-field validation for v2
export const leadSchemaV2WithValidation = leadSchemaV2
  .superRefine((data, ctx) => {
    // Enhanced validation for v2
    
    // Consent validation
    if (data.consent) {
      const now = new Date();
      const consentDate = new Date(data.consent.consentDate);
      
      // Consent date cannot be in the future
      if (consentDate > now) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Consent date cannot be in the future',
          path: ['consent', 'consentDate'],
        });
      }
      
      // Consent date cannot be more than 2 years old
      const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
      if (consentDate < twoYearsAgo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Consent date is too old (must be within 2 years)',
          path: ['consent', 'consentDate'],
        });
      }
    }
    
    // Phone number validation for country
    if (data.phone && data.country) {
      // Basic validation - could be enhanced with country-specific rules
      if (data.country === 'US' && !data.phone.startsWith('+1')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'US phone numbers must start with +1',
          path: ['phone'],
        });
      }
    }
    
    // Website validation
    if (data.website && data.company) {
      // Check if website contains company name (basic validation)
      const websiteLower = data.website.toLowerCase();
      const companyLower = data.company.toLowerCase();
      if (!websiteLower.includes(companyLower) && websiteLower !== data.linkedinUrl) {
        // This is just a warning, not an error
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Website may not be related to company',
          path: ['website'],
        });
      }
    }
    
    // Score validation
    if (data.scoreValue !== undefined && data.scoreFactors) {
      // Recalculate score based on factors
      const calculatedScore = Object.values(data.scoreFactors).reduce((sum, factor) => sum + factor, 0);
      
      if (Math.abs(calculatedScore - data.scoreValue) > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Score value does not match calculated score from factors',
          path: ['scoreValue'],
        });
      }
    }
    
    // Data quality validation
    if (data.dataQuality) {
      const { completeness, accuracy } = data.dataQuality;
      
      if (completeness < 50) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Lead data completeness is too low',
          path: ['dataQuality', 'completeness'],
        });
      }
      
      if (accuracy < 70) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Lead data accuracy is too low',
          path: ['dataQuality', 'accuracy'],
        });
      }
    }
  })
  .transform((data) => {
    // Auto-calculate missing fields in v2
    
    // Calculate conversion probability based on score and other factors
    if (data.conversionProbability === undefined && data.scoreValue !== undefined) {
      let probability = 0;
      
      // Base probability from score
      if (data.score === 'hot') probability += 60;
      else if (data.score === 'warm') probability += 30;
      else if (data.score === 'cold') probability += 10;
      
      // Boost from consent
      if (data.consent?.email) probability += 15;
      if (data.consent?.phone) probability += 10;
      
      // Boost from data completeness
      if (data.dataQuality?.completeness) {
        probability += data.dataQuality.completeness * 0.2;
      }
      
      // Boost from enrichment
      if (data.enrichment) probability += 20;
      
      data.conversionProbability = Math.min(Math.round(probability), 100);
    }
    
    // Calculate data quality if missing
    if (data.dataQuality === undefined) {
      let completeness = 0;
      let totalFields = 0;
      let filledFields = 0;
      
      const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
      const optionalFields = ['company', 'jobTitle', 'website', 'industry'];
      
      requiredFields.forEach(field => {
        totalFields += 2; // Weight required fields higher
        if (data[field as keyof typeof data]) filledFields += 2;
      });
      
      optionalFields.forEach(field => {
        totalFields += 1;
        if (data[field as keyof typeof data]) filledFields += 1;
      });
      
      completeness = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
      
      data.dataQuality = {
        completeness,
        accuracy: 85, // Default accuracy
        lastVerified: new Date(),
        verificationSource: 'auto-calculation',
      };
    }
    
    return data;
  });

// Type assertions
export type LeadV2 = z.infer<typeof leadSchemaV2>;
export type LeadV2WithValidation = z.infer<typeof leadSchemaV2WithValidation>;

// Runtime validation functions
export const validateLeadV2 = (data: unknown) => leadSchemaV2.safeParse(data);
export const validateLeadV2WithValidation = (data: unknown) => leadSchemaV2WithValidation.safeParse(data);

// Migration function from v1 to v2
export const migrateLeadV1ToV2 = (leadV1: unknown) => {
  const v1Result = leadSchemaV1.safeParse(leadV1);
  if (!v1Result.success) {
    return v1Result;
  }
  
  const v1Data = v1Result.data;
  
  // Transform v1 data to v2 format
  const v2Data = {
    ...v1Data,
    // Add new v2 fields with defaults
    consent: {
      email: false,
      sms: false,
      phone: false,
      marketing: false,
      analytics: false,
      consentDate: new Date(),
      gpcSignal: false,
    },
    preferences: {
      preferredChannel: 'email' as const,
      timezone: 'UTC' as const,
      language: 'en' as const,
      frequency: 'weekly' as const,
      doNotCall: false,
      doNotEmail: false,
    },
    scoreFactors: {
      email: v1Data.email ? 20 : 0,
      phone: v1Data.phone ? 15 : 0,
      company: v1Data.company ? 25 : 0,
      jobTitle: v1Data.jobTitle ? 10 : 0,
      industry: 0,
      companySize: 0,
      revenue: 0,
      website: 0,
      socialProfiles: 0,
    },
    activityCount: 0,
    conversionProbability: v1Data.score === 'hot' ? 70 : v1Data.score === 'warm' ? 40 : 20,
  };
  
  return leadSchemaV2.safeParse(v2Data);
};

// Migration function from v2 to v1 (reverse migration)
export const migrateLeadV2ToV1 = (leadV2: unknown) => {
  const v2Result = leadSchemaV2.safeParse(leadV2);
  if (!v2Result.success) {
    return v2Result;
  }
  
  const v2Data = v2Result.data;
  
  // Transform v2 data back to v1 format
  // Only keep v1-compatible fields, discard v2-specific fields
  const v1Data = {
    // Core v1 fields
    id: v2Data.id,
    tenantId: v2Data.tenantId,
    userId: v2Data.userId,
    
    // Basic information
    firstName: v2Data.firstName,
    lastName: v2Data.lastName,
    email: v2Data.email,
    phone: v2Data.phone,
    company: v2Data.company,
    jobTitle: v2Data.jobTitle,
    
    // Lead management
    status: v2Data.status,
    source: v2Data.source,
    score: v2Data.score,
    scoreValue: v2Data.scoreValue,
    
    // Timestamps
    createdAt: v2Data.createdAt,
    updatedAt: v2Data.updatedAt,
    assignedAt: v2Data.assignedAt,
    lastContactedAt: v2Data.lastContactedAt,
    
    // Additional v1 fields
    notes: v2Data.notes,
    tags: v2Data.tags,
    metadata: v2Data.metadata,
    customFields: v2Data.customFields,
    
    // Optional v1 fields
    address: v2Data.address,
    leadOwner: v2Data.leadOwner,
    campaign: v2Data.campaign,
    expectedCloseDate: v2Data.expectedCloseDate,
    estimatedValue: v2Data.estimatedValue,
    actualValue: v2Data.actualValue,
    probability: v2Data.probability,
    nextFollowUpDate: v2Data.nextFollowUpDate,
    followUpNotes: v2Data.followUpNotes,
    conversionDate: v2Data.conversionDate,
    lostReason: v2Data.lostReason,
    duplicateOf: v2Data.duplicateOf,
    mergedAt: v2Data.mergedAt,
    archivedAt: v2Data.archivedAt,
    archivedReason: v2Data.archivedReason,
  };
  
  return leadSchemaV1.safeParse(v1Data);
};

// Compile-time validation
export const leadSchemaV2Satisfies = leadSchemaV2 satisfies z.ZodType<Lead>;

```

---

### tenant.ts

**Path:** `src\tenant.ts`

**Language:** TypeScript

```typescript
/**
 * Tenant schema validation
 * Provides comprehensive validation for tenant data with business rules
 */

import { z } from 'zod';
import type { Tenant, TenantStatus, ServiceTier, Currency, Language, Timezone, ThemeMode } from '@firm/types';
import {
  tenantIdField,
  nameField,
  slugField,
  urlField,
  enumField,
  objectField,
  optionalObjectField,
  timestampField,
  metadataField,
  numberField,
  booleanField,
  optionalBooleanField,
  arrayField,
  optionalArrayField,
} from './common';

// Tenant limits schema
const tenantLimitsSchema = objectField({
  users: numberField('User limit', 1, 10000),
  leads: numberField('Lead limit', 10, 1000000),
  campaigns: numberField('Campaign limit', 1, 1000),
  bookings: numberField('Booking limit', 10, 100000),
  storage: numberField('Storage limit (MB)', 100, 1000000),
  apiCalls: numberField('API call limit', 100, 10000000),
}, 'Tenant limits');

// Consent settings schema
const consentSettingsSchema = objectField({
  requiredCategories: arrayField(
    enumField(['necessary', 'analytics', 'marketing', 'preferences', 'functional'] as const, 'Required categories'),
    'Required categories',
    1,
    5
  ),
  defaultConsent: objectField({
    necessary: booleanField('Necessary consent', true),
    analytics: booleanField('Analytics consent', false),
    marketing: booleanField('Marketing consent', false),
    preferences: booleanField('Preferences consent', false),
    functional: booleanField('Functional consent', false),
  }, 'Default consent'),
  privacyPolicyUrl: urlField('Privacy policy URL').optional(),
  termsOfServiceUrl: urlField('Terms of service URL').optional(),
}, 'Consent settings');

// Tenant settings schema
const tenantSettingsSchema = objectField({
  timezone: enumField(['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney'] as const, 'Timezone'),
  currency: enumField(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK'] as const, 'Currency'),
  language: enumField(['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'da', 'no'] as const, 'Language'),
  theme: enumField(['light', 'dark', 'system'] as const, 'Theme'),
  features: metadataField(), // Feature flags
  limits: tenantLimitsSchema,
  consent: consentSettingsSchema,
  integrations: metadataField(), // Integration status
}, 'Tenant settings');

// Tenant schema
export const tenantSchema = objectField({
  id: tenantIdField(),
  name: nameField('Tenant name'),
  slug: slugField('Tenant slug'),
  domain: urlField('Domain').optional(),
  status: enumField(['active', 'inactive', 'suspended', 'trial', 'cancelled'] as const, 'Status'),
  serviceTier: enumField(['starter', 'professional', 'business', 'enterprise', 'custom'] as const, 'Service tier'),
  settings: tenantSettingsSchema,
  metadata: metadataField(),
  createdAt: timestampField('Created at'),
  updatedAt: timestampField('Updated at'),
}, 'Tenant');

// Enhanced tenant schema with business validation
export const tenantSchemaWithValidation = tenantSchema
  .superRefine((data, ctx) => {
    // Business validation rules
    
    // Slug uniqueness check (would be handled at database level)
    if (data.slug.includes('www') || data.slug.includes('http')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Slug should not contain "www" or "http"',
        path: ['slug'],
      });
    }
    
    // Domain validation
    if (data.domain && data.slug) {
      // Domain should match or be related to slug
      const domainLower = data.domain.toLowerCase();
      const slugLower = data.slug.toLowerCase();
      
      if (!domainLower.includes(slugLower) && !slugLower.includes(domainLower.replace(/^(https?:\/\/)?(www\.)?/, ''))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Domain should be related to tenant slug',
          path: ['domain'],
        });
      }
    }
    
    // Service tier limits validation
    const tierLimits = {
      starter: { users: 5, leads: 1000, campaigns: 10, bookings: 100, storage: 1000, apiCalls: 10000 },
      professional: { users: 25, leads: 10000, campaigns: 50, bookings: 1000, storage: 10000, apiCalls: 100000 },
      business: { users: 100, leads: 100000, campaigns: 200, bookings: 10000, storage: 100000, apiCalls: 1000000 },
      enterprise: { users: 1000, leads: 1000000, campaigns: 1000, bookings: 100000, storage: 1000000, apiCalls: 10000000 },
      custom: { users: 10000, leads: 1000000, campaigns: 1000, bookings: 100000, storage: 1000000, apiCalls: 10000000 }
    };
    
    const limits = tierLimits[data.serviceTier];
    if (limits) {
      const settings = data.settings.limits;
      
      if (settings.users > limits.users) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `User limit exceeds ${data.serviceTier} tier maximum of ${limits.users}`,
          path: ['settings', 'limits', 'users'],
        });
      }
      
      if (settings.leads > limits.leads) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Lead limit exceeds ${data.serviceTier} tier maximum of ${limits.leads}`,
          path: ['settings', 'limits', 'leads'],
        });
      }
      
      if (settings.campaigns > limits.campaigns) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Campaign limit exceeds ${data.serviceTier} tier maximum of ${limits.campaigns}`,
          path: ['settings', 'limits', 'campaigns'],
        });
      }
      
      if (settings.bookings > limits.bookings) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Booking limit exceeds ${data.serviceTier} tier maximum of ${limits.bookings}`,
          path: ['settings', 'limits', 'bookings'],
        });
      }
      
      if (settings.storage > limits.storage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Storage limit exceeds ${data.serviceTier} tier maximum of ${limits.storage}MB`,
          path: ['settings', 'limits', 'storage'],
        });
      }
      
      if (settings.apiCalls > limits.apiCalls) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `API call limit exceeds ${data.serviceTier} tier maximum of ${limits.apiCalls}`,
          path: ['settings', 'limits', 'apiCalls'],
        });
      }
    }
    
    // Consent validation
    const { requiredCategories, defaultConsent } = data.settings.consent;
    
    // Required categories must include necessary
    if (!requiredCategories.includes('necessary')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required consent categories must include "necessary"',
        path: ['settings', 'consent', 'requiredCategories'],
      });
    }
    
    // Default consent for necessary must be true
    if (!defaultConsent.necessary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Default consent for "necessary" must be true',
        path: ['settings', 'consent', 'defaultConsent', 'necessary'],
      });
    }
    
    // If privacy policy is required, terms of service should also be provided
    if (data.settings.consent.privacyPolicyUrl && !data.settings.consent.termsOfServiceUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Terms of service URL is required when privacy policy URL is provided',
        path: ['settings', 'consent', 'termsOfServiceUrl'],
      });
    }
  })
  .transform((data) => {
    // Auto-derive tenant settings based on service tier
    
    // Set default limits if not provided
    const tierDefaults = {
      starter: { users: 5, leads: 1000, campaigns: 10, bookings: 100, storage: 1000, apiCalls: 10000 },
      professional: { users: 25, leads: 10000, campaigns: 50, bookings: 1000, storage: 10000, apiCalls: 100000 },
      business: { users: 100, leads: 100000, campaigns: 200, bookings: 10000, storage: 100000, apiCalls: 1000000 },
      enterprise: { users: 1000, leads: 1000000, campaigns: 1000, bookings: 100000, storage: 1000000, apiCalls: 10000000 }
    };
    
    if (data.serviceTier !== 'custom' && tierDefaults[data.serviceTier]) {
      const defaults = tierDefaults[data.serviceTier];
      const currentLimits = data.settings.limits;
      
      // Only set defaults if values are 0 or undefined
      if (currentLimits.users === 0) currentLimits.users = defaults.users;
      if (currentLimits.leads === 0) currentLimits.leads = defaults.leads;
      if (currentLimits.campaigns === 0) currentLimits.campaigns = defaults.campaigns;
      if (currentLimits.bookings === 0) currentLimits.bookings = defaults.bookings;
      if (currentLimits.storage === 0) currentLimits.storage = defaults.storage;
      if (currentLimits.apiCalls === 0) currentLimits.apiCalls = defaults.apiCalls;
    }
    
    return data;
  });

// Type assertions
export type TenantInput = z.infer<typeof tenantSchema>;
export type TenantInputWithValidation = z.infer<typeof tenantSchemaWithValidation>;

// Runtime validation functions
export const validateTenant = (data: unknown) => tenantSchema.safeParse(data);
export const validateTenantWithValidation = (data: unknown) => tenantSchemaWithValidation.safeParse(data);

// Compile-time validation
export const tenantSchemaSatisfies = tenantSchema satisfies z.ZodType<Tenant>;

```

---

### user.ts

**Path:** `src\user.ts`

**Language:** TypeScript

```typescript
/**
 * User schema validation
 * Provides comprehensive validation for user data with role and permission validation
 */

import { z } from 'zod';
import type { User, UserStatus, UserId, TenantId } from '@firm/types';
import {
  userIdField,
  tenantIdField,
  nameField,
  emailField,
  phoneField,
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
  uuidField,
  numberField,
  urlField,
} from './common';

// User Role schema
const userRoleSchema = objectField({
  id: uuidField('Role ID'),
  name: textField('Role name', 1, 100),
  description: optionalTextField('Role description', 500),
  isSystem: booleanField('Is system role', false),
  permissions: arrayField(
    objectField({
      category: enumField(['tenant', 'user', 'lead', 'campaign', 'booking', 'invoice', 'analytics', 'settings', 'admin'] as const, 'Permission category'),
      action: textField('Permission action', 1, 100),
      resource: textField('Permission resource', 1, 100),
      conditions: metadataField(),
    }, 'Permission'),
    'Permissions',
    0,
    100
  ),
}, 'User role');

// User Preferences schema
const userPreferencesSchema = objectField({
  timezone: enumField(['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney'] as const, 'Timezone'),
  language: enumField(['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'da', 'no'] as const, 'Language'),
  theme: enumField(['light', 'dark', 'system'] as const, 'Theme'),
  notifications: objectField({
    email: objectField({
      info: booleanField('Email notifications - info', true),
      success: booleanField('Email notifications - success', true),
      warning: booleanField('Email notifications - warning', true),
      error: booleanField('Email notifications - error', true),
      alert: booleanField('Email notifications - alert', true),
    }, 'Email notifications'),
    push: objectField({
      info: booleanField('Push notifications - info', true),
      success: booleanField('Push notifications - success', true),
      warning: booleanField('Push notifications - warning', true),
      error: booleanField('Push notifications - error', true),
      alert: booleanField('Push notifications - alert', true),
    }, 'Push notifications'),
    sms: objectField({
      info: booleanField('SMS notifications - info', false),
      success: booleanField('SMS notifications - success', false),
      warning: booleanField('SMS notifications - warning', false),
      error: booleanField('SMS notifications - error', true),
      alert: booleanField('SMS notifications - alert', true),
    }, 'SMS notifications'),
  }, 'Notification preferences'),
  dashboard: objectField({
    layout: optionalTextField('Dashboard layout', 50),
    widgets: arrayField(
      objectField({
        id: textField('Widget ID', 1, 50),
        type: textField('Widget type', 1, 50),
        position: objectField({
          x: numberField('Widget X position', 0),
          y: numberField('Widget Y position', 0),
          w: numberField('Widget width', 1),
          h: numberField('Widget height', 1),
        }, 'Widget position'),
        config: metadataField(),
      }, 'Dashboard widget'),
      'Dashboard widgets',
      0,
      20
    ),
    defaultTimePeriod: enumField(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year', 'custom'] as const, 'Default time period'),
  }, 'Dashboard preferences'),
}, 'User preferences');

// User schema
export const userSchema = objectField({
  id: userIdField(),
  tenantId: tenantIdField(),
  email: emailField('Email'),
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  role: textField('Role', 1, 100),
  status: enumField(['active', 'inactive', 'suspended', 'pending', 'invited'] as const, 'Status'),
  permissions: arrayField(
    objectField({
      category: enumField(['tenant', 'user', 'lead', 'campaign', 'booking', 'invoice', 'analytics', 'settings', 'admin'] as const, 'Permission category'),
      action: textField('Permission action', 1, 100),
      resource: textField('Permission resource', 1, 100),
      conditions: metadataField(),
    }, 'Permission'),
    'Permissions',
    0,
    100
  ),
  lastLoginAt: timestampField('Last login at').optional(),
  emailVerified: booleanField('Email verified', false),
  phone: phoneField('Phone number').optional(),
  phoneVerified: booleanField('Phone verified', false),
  avatar: urlField('Avatar URL').optional(),
  preferences: userPreferencesSchema,
  metadata: metadataField(),
  createdAt: timestampField('Created at'),
  updatedAt: timestampField('Updated at'),
}, 'User');

// Enhanced user schema with business validation
export const userSchemaWithValidation = userSchema
  .superRefine((data, ctx) => {
    // Business validation rules
    
    // Email domain validation for tenant
    if (data.email && data.tenantId) {
      // This would typically be checked against tenant domain
      const emailDomain = data.email.split('@')[1]?.toLowerCase();
      // Skip validation for now - would need tenant data
    }
    
    // Phone validation for country
    if (data.phone && data.preferences?.timezone) {
      // Basic validation based on timezone
      const usTimezones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'];
      const euTimezones = ['Europe/London', 'Europe/Paris', 'Europe/Berlin'];
      
      if (usTimezones.includes(data.preferences.timezone) && !data.phone.startsWith('+1')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Phone number should start with +1 for US timezone',
          path: ['phone'],
        });
      }
    }
    
    // Role validation against permissions
    if (data.role && data.permissions.length > 0) {
      // Admin role should have all admin permissions
      const isAdmin = data.role.toLowerCase().includes('admin');
      const hasAdminPermissions = data.permissions.some(p => 
        p.category === 'admin' && p.action.includes('all')
      );
      
      if (isAdmin && !hasAdminPermissions) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Admin role requires admin permissions',
          path: ['permissions'],
        });
      }
    }
    
    // Avatar validation
    if (data.avatar) {
      // Check if avatar URL is valid image format
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const hasValidExtension = imageExtensions.some(ext => 
        data.avatar.toLowerCase().includes(ext)
      );
      
      if (!hasValidExtension) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Avatar URL must point to a valid image file',
          path: ['avatar'],
        });
      }
    }
    
    // Status validation
    if (data.status === 'active' && !data.emailVerified) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Active users must have verified email',
        path: ['emailVerified'],
      });
    }
    
    if (data.status === 'suspended' && data.lastLoginAt) {
      const suspensionTime = new Date();
      const lastLogin = new Date(data.lastLoginAt);
      const daysSinceLastLogin = (suspensionTime.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastLogin > 30) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cannot suspend user who logged in within last 30 days',
          path: ['status'],
        });
      }
    }
  })
  .transform((data) => {
    // Auto-derive permissions from role if not provided
    if (data.role && data.permissions.length === 0) {
      const rolePermissions = getRolePermissions(data.role);
      data.permissions = rolePermissions;
    }
    
    // Set default preferences if not provided
    if (!data.preferences) {
      data.preferences = {
        timezone: 'UTC',
        language: 'en',
        theme: 'system',
        notifications: {
          email: {
            info: true,
            success: true,
            warning: true,
            error: true,
            alert: true,
          },
          push: {
            info: true,
            success: true,
            warning: true,
            error: true,
            alert: true,
          },
          sms: {
            info: false,
            success: false,
            warning: false,
            error: true,
            alert: true,
          },
        },
        dashboard: {
          layout: 'default',
          widgets: [],
          defaultTimePeriod: 'this_month',
        },
      };
    }
    
    return data;
  });

// Helper function to get permissions based on role
function getRolePermissions(role: string) {
  const rolePermissions = {
    'admin': [
      { category: 'admin' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'tenant' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'user' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'lead' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'campaign' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'booking' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'invoice' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'analytics' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'settings' as const, action: 'all', resource: 'all', conditions: {} },
    ],
    'manager': [
      { category: 'lead' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'campaign' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'booking' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'invoice' as const, action: 'read', resource: 'all', conditions: {} },
      { category: 'analytics' as const, action: 'read', resource: 'all', conditions: {} },
    ],
    'agent': [
      { category: 'lead' as const, action: 'read', resource: 'own', conditions: {} },
      { category: 'lead' as const, action: 'update', resource: 'own', conditions: {} },
      { category: 'campaign' as const, action: 'read', resource: 'own', conditions: {} },
      { category: 'booking' as const, action: 'read', resource: 'own', conditions: {} },
      { category: 'booking' as const, action: 'update', resource: 'own', conditions: {} },
    ],
    'viewer': [
      { category: 'lead' as const, action: 'read', resource: 'own', conditions: {} },
      { category: 'campaign' as const, action: 'read', resource: 'own', conditions: {} },
      { category: 'booking' as const, action: 'read', resource: 'own', conditions: {} },
    ],
  };
  
  return rolePermissions[role.toLowerCase()] || [];
}

// Type assertions
export type UserInput = z.infer<typeof userSchema>;
export type UserInputWithValidation = z.infer<typeof userSchemaWithValidation>;

// Runtime validation functions
export const validateUser = (data: unknown) => userSchema.safeParse(data);
export const validateUserWithValidation = (data: unknown) => userSchemaWithValidation.safeParse(data);

// Compile-time validation
export const userSchemaSatisfies = userSchema satisfies z.ZodType<User>;

```

---

### enum-validation.test.ts

**Path:** `tests\enum-validation.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect } from 'vitest';
import {
  enumField,
  tenantStatusField,
  userStatusField,
  leadStatusField,
  leadSourceField,
  leadScoreField,
  campaignTypeField,
  campaignStatusField,
  bookingStatusField,
  bookingTypeField,
  invoiceStatusField,
  subscriptionStatusField,
  billingCycleField,
  emailTemplateTypeField,
  formTypeField,
  webhookEventField,
  webhookStatusField,
  syncJobStatusField,
  serviceTierField,
  permissionCategoryField,
  auditActionField,
  reportTypeField,
  timePeriodField,
  exportFormatField,
  notificationTypeField,
  consentCategoryField,
  apiKeyPermissionField,
  themeModeField,
  currencyField,
  languageField,
  timezoneField,
  fileTypeField,
  integrationStatusField,
} from '../src/common';

describe('Enum Field Validation', () => {
  describe('Generic enumField', () => {
    it('should accept valid enum values', () => {
      const schema = enumField(['red', 'green', 'blue'] as const, 'Color');
      
      expect(schema.safeParse('red').success).toBe(true);
      expect(schema.safeParse('green').success).toBe(true);
      expect(schema.safeParse('blue').success).toBe(true);
    });

    it('should reject invalid enum values', () => {
      const schema = enumField(['red', 'green', 'blue'] as const, 'Color');
      
      expect(schema.safeParse('yellow').success).toBe(false);
      expect(schema.safeParse('purple').success).toBe(false);
      expect(schema.safeParse('').success).toBe(false);
    });

    it('should provide custom error message', () => {
      const schema = enumField(['red', 'green', 'blue'] as const, 'Color');
      const result = schema.safeParse('yellow');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Color is required');
      }
    });
  });

  describe('Tenant Status Field', () => {
    it('should accept all valid tenant status values', () => {
      const schema = tenantStatusField();
      
      expect(schema.safeParse('active').success).toBe(true);
      expect(schema.safeParse('inactive').success).toBe(true);
      expect(schema.safeParse('suspended').success).toBe(true);
      expect(schema.safeParse('trial').success).toBe(true);
      expect(schema.safeParse('cancelled').success).toBe(true);
    });

    it('should reject invalid tenant status values', () => {
      const schema = tenantStatusField();
      
      expect(schema.safeParse('pending').success).toBe(false);
      expect(schema.safeParse('deleted').success).toBe(false);
      expect(schema.safeParse('archived').success).toBe(false);
    });
  });

  describe('User Status Field', () => {
    it('should accept all valid user status values', () => {
      const schema = userStatusField();
      
      expect(schema.safeParse('active').success).toBe(true);
      expect(schema.safeParse('inactive').success).toBe(true);
      expect(schema.safeParse('suspended').success).toBe(true);
      expect(schema.safeParse('pending').success).toBe(true);
      expect(schema.safeParse('invited').success).toBe(true);
    });

    it('should reject invalid user status values', () => {
      const schema = userStatusField();
      
      expect(schema.safeParse('deleted').success).toBe(false);
      expect(schema.safeParse('banned').success).toBe(false);
    });
  });

  describe('Lead Status Field', () => {
    it('should accept all valid lead status values', () => {
      const schema = leadStatusField();
      
      expect(schema.safeParse('new').success).toBe(true);
      expect(schema.safeParse('contacted').success).toBe(true);
      expect(schema.safeParse('qualified').success).toBe(true);
      expect(schema.safeParse('converted').success).toBe(true);
      expect(schema.safeParse('lost').success).toBe(true);
      expect(schema.safeParse('duplicate').success).toBe(true);
      expect(schema.safeParse('unsubscribed').success).toBe(true);
    });

    it('should reject invalid lead status values', () => {
      const schema = leadStatusField();
      
      expect(schema.safeParse('pending').success).toBe(false);
      expect(schema.safeParse('archived').success).toBe(false);
    });
  });

  describe('Lead Source Field', () => {
    it('should accept all valid lead source values', () => {
      const schema = leadSourceField();
      
      expect(schema.safeParse('website').success).toBe(true);
      expect(schema.safeParse('referral').success).toBe(true);
      expect(schema.safeParse('social').success).toBe(true);
      expect(schema.safeParse('email').success).toBe(true);
      expect(schema.safeParse('phone').success).toBe(true);
      expect(schema.safeParse('form').success).toBe(true);
      expect(schema.safeParse('api').success).toBe(true);
      expect(schema.safeParse('import').success).toBe(true);
      expect(schema.safeParse('manual').success).toBe(true);
    });

    it('should reject invalid lead source values', () => {
      const schema = leadSourceField();
      
      expect(schema.safeParse('direct').success).toBe(false);
      expect(schema.safeParse('paid').success).toBe(false);
    });
  });

  describe('Lead Score Field', () => {
    it('should accept all valid lead score values', () => {
      const schema = leadScoreField();
      
      expect(schema.safeParse('hot').success).toBe(true);
      expect(schema.safeParse('warm').success).toBe(true);
      expect(schema.safeParse('cold').success).toBe(true);
    });

    it('should reject invalid lead score values', () => {
      const schema = leadScoreField();
      
      expect(schema.safeParse('medium').success).toBe(false);
      expect(schema.safeParse('high').success).toBe(false);
    });
  });

  describe('Campaign Type Field', () => {
    it('should accept all valid campaign type values', () => {
      const schema = campaignTypeField();
      
      expect(schema.safeParse('email').success).toBe(true);
      expect(schema.safeParse('sms').success).toBe(true);
      expect(schema.safeParse('social').success).toBe(true);
      expect(schema.safeParse('webinar').success).toBe(true);
      expect(schema.safeParse('event').success).toBe(true);
      expect(schema.safeParse('content').success).toBe(true);
      expect(schema.safeParse('retargeting').success).toBe(true);
    });

    it('should reject invalid campaign type values', () => {
      const schema = campaignTypeField();
      
      expect(schema.safeParse('display').success).toBe(false);
      expect(schema.safeParse('video').success).toBe(false);
    });
  });

  describe('Campaign Status Field', () => {
    it('should accept all valid campaign status values', () => {
      const schema = campaignStatusField();
      
      expect(schema.safeParse('draft').success).toBe(true);
      expect(schema.safeParse('scheduled').success).toBe(true);
      expect(schema.safeParse('active').success).toBe(true);
      expect(schema.safeParse('paused').success).toBe(true);
      expect(schema.safeParse('completed').success).toBe(true);
      expect(schema.safeParse('cancelled').success).toBe(true);
    });

    it('should reject invalid campaign status values', () => {
      const schema = campaignStatusField();
      
      expect(schema.safeParse('pending').success).toBe(false);
      expect(schema.safeParse('archived').success).toBe(false);
    });
  });

  describe('Booking Status Field', () => {
    it('should accept all valid booking status values', () => {
      const schema = bookingStatusField();
      
      expect(schema.safeParse('pending').success).toBe(true);
      expect(schema.safeParse('confirmed').success).toBe(true);
      expect(schema.safeParse('in_progress').success).toBe(true);
      expect(schema.safeParse('completed').success).toBe(true);
      expect(schema.safeParse('cancelled').success).toBe(true);
      expect(schema.safeParse('no_show').success).toBe(true);
      expect(schema.safeParse('rescheduled').success).toBe(true);
    });

    it('should reject invalid booking status values', () => {
      const schema = bookingStatusField();
      
      expect(schema.safeParse('scheduled').success).toBe(false);
      expect(schema.safeParse('delayed').success).toBe(false);
    });
  });

  describe('Booking Type Field', () => {
    it('should accept all valid booking type values', () => {
      const schema = bookingTypeField();
      
      expect(schema.safeParse('consultation').success).toBe(true);
      expect(schema.safeParse('service').success).toBe(true);
      expect(schema.safeParse('follow_up').success).toBe(true);
      expect(schema.safeParse('demo').success).toBe(true);
      expect(schema.safeParse('meeting').success).toBe(true);
      expect(schema.safeParse('appointment').success).toBe(true);
    });

    it('should reject invalid booking type values', () => {
      const schema = bookingTypeField();
      
      expect(schema.safeParse('call').success).toBe(false);
      expect(schema.safeParse('support').success).toBe(false);
    });
  });

  describe('Invoice Status Field', () => {
    it('should accept all valid invoice status values', () => {
      const schema = invoiceStatusField();
      
      expect(schema.safeParse('draft').success).toBe(true);
      expect(schema.safeParse('sent').success).toBe(true);
      expect(schema.safeParse('paid').success).toBe(true);
      expect(schema.safeParse('overdue').success).toBe(true);
      expect(schema.safeParse('cancelled').success).toBe(true);
      expect(schema.safeParse('refunded').success).toBe(true);
      expect(schema.safeParse('partial').success).toBe(true);
    });

    it('should reject invalid invoice status values', () => {
      const schema = invoiceStatusField();
      
      expect(schema.safeParse('pending').success).toBe(false);
      expect(schema.safeParse('processing').success).toBe(false);
    });
  });

  describe('Subscription Status Field', () => {
    it('should accept all valid subscription status values', () => {
      const schema = subscriptionStatusField();
      
      expect(schema.safeParse('active').success).toBe(true);
      expect(schema.safeParse('trial').success).toBe(true);
      expect(schema.safeParse('past_due').success).toBe(true);
      expect(schema.safeParse('cancelled').success).toBe(true);
      expect(schema.safeParse('unpaid').success).toBe(true);
      expect(schema.safeParse('paused').success).toBe(true);
    });

    it('should reject invalid subscription status values', () => {
      const schema = subscriptionStatusField();
      
      expect(schema.safeParse('expired').success).toBe(false);
      expect(schema.safeParse('suspended').success).toBe(false);
    });
  });

  describe('Billing Cycle Field', () => {
    it('should accept all valid billing cycle values', () => {
      const schema = billingCycleField();
      
      expect(schema.safeParse('monthly').success).toBe(true);
      expect(schema.safeParse('quarterly').success).toBe(true);
      expect(schema.safeParse('annual').success).toBe(true);
    });

    it('should reject invalid billing cycle values', () => {
      const schema = billingCycleField();
      
      expect(schema.safeParse('weekly').success).toBe(false);
      expect(schema.safeParse('biannual').success).toBe(false);
    });
  });

  describe('Email Template Type Field', () => {
    it('should accept all valid email template type values', () => {
      const schema = emailTemplateTypeField();
      
      expect(schema.safeParse('welcome').success).toBe(true);
      expect(schema.safeParse('confirmation').success).toBe(true);
      expect(schema.safeParse('reminder').success).toBe(true);
      expect(schema.safeParse('follow_up').success).toBe(true);
      expect(schema.safeParse('newsletter').success).toBe(true);
      expect(schema.safeParse('promotional').success).toBe(true);
      expect(schema.safeParse('transactional').success).toBe(true);
      expect(schema.safeParse('alert').success).toBe(true);
    });

    it('should reject invalid email template type values', () => {
      const schema = emailTemplateTypeField();
      
      expect(schema.safeParse('marketing').success).toBe(false);
      expect(schema.safeParse('notification').success).toBe(false);
    });
  });

  describe('Form Type Field', () => {
    it('should accept all valid form type values', () => {
      const schema = formTypeField();
      
      expect(schema.safeParse('contact').success).toBe(true);
      expect(schema.safeParse('lead_capture').success).toBe(true);
      expect(schema.safeParse('survey').success).toBe(true);
      expect(schema.safeParse('feedback').success).toBe(true);
      expect(schema.safeParse('registration').success).toBe(true);
      expect(schema.safeParse('application').success).toBe(true);
      expect(schema.safeParse('quote_request').success).toBe(true);
    });

    it('should reject invalid form type values', () => {
      const schema = formTypeField();
      
      expect(schema.safeParse('inquiry').success).toBe(false);
      expect(schema.safeParse('support').success).toBe(false);
    });
  });

  describe('Webhook Event Field', () => {
    it('should accept all valid webhook event values', () => {
      const schema = webhookEventField();
      
      expect(schema.safeParse('lead.created').success).toBe(true);
      expect(schema.safeParse('lead.updated').success).toBe(true);
      expect(schema.safeParse('lead.deleted').success).toBe(true);
      expect(schema.safeParse('booking.created').success).toBe(true);
      expect(schema.safeParse('booking.updated').success).toBe(true);
      expect(schema.safeParse('booking.completed').success).toBe(true);
      expect(schema.safeParse('invoice.created').success).toBe(true);
      expect(schema.safeParse('invoice.paid').success).toBe(true);
      expect(schema.safeParse('user.created').success).toBe(true);
      expect(schema.safeParse('user.updated').success).toBe(true);
    });

    it('should reject invalid webhook event values', () => {
      const schema = webhookEventField();
      
      expect(schema.safeParse('lead.archived').success).toBe(false);
      expect(schema.safeParse('booking.cancelled').success).toBe(false);
    });
  });

  describe('Webhook Status Field', () => {
    it('should accept all valid webhook status values', () => {
      const schema = webhookStatusField();
      
      expect(schema.safeParse('active').success).toBe(true);
      expect(schema.safeParse('inactive').success).toBe(true);
      expect(schema.safeParse('failed').success).toBe(true);
    });

    it('should reject invalid webhook status values', () => {
      const schema = webhookStatusField();
      
      expect(schema.safeParse('pending').success).toBe(false);
      expect(schema.safeParse('disabled').success).toBe(false);
    });
  });

  describe('Sync Job Status Field', () => {
    it('should accept all valid sync job status values', () => {
      const schema = syncJobStatusField();
      
      expect(schema.safeParse('pending').success).toBe(true);
      expect(schema.safeParse('running').success).toBe(true);
      expect(schema.safeParse('completed').success).toBe(true);
      expect(schema.safeParse('failed').success).toBe(true);
      expect(schema.safeParse('cancelled').success).toBe(true);
      expect(schema.safeParse('retrying').success).toBe(true);
    });

    it('should reject invalid sync job status values', () => {
      const schema = syncJobStatusField();
      
      expect(schema.safeParse('scheduled').success).toBe(false);
      expect(schema.safeParse('paused').success).toBe(false);
    });
  });

  describe('Service Tier Field', () => {
    it('should accept all valid service tier values', () => {
      const schema = serviceTierField();
      
      expect(schema.safeParse('starter').success).toBe(true);
      expect(schema.safeParse('professional').success).toBe(true);
      expect(schema.safeParse('business').success).toBe(true);
      expect(schema.safeParse('enterprise').success).toBe(true);
      expect(schema.safeParse('custom').success).toBe(true);
    });

    it('should reject invalid service tier values', () => {
      const schema = serviceTierField();
      
      expect(schema.safeParse('free').success).toBe(false);
      expect(schema.safeParse('premium').success).toBe(false);
    });
  });

  describe('Permission Category Field', () => {
    it('should accept all valid permission category values', () => {
      const schema = permissionCategoryField();
      
      expect(schema.safeParse('tenant').success).toBe(true);
      expect(schema.safeParse('user').success).toBe(true);
      expect(schema.safeParse('lead').success).toBe(true);
      expect(schema.safeParse('campaign').success).toBe(true);
      expect(schema.safeParse('booking').success).toBe(true);
      expect(schema.safeParse('invoice').success).toBe(true);
      expect(schema.safeParse('analytics').success).toBe(true);
      expect(schema.safeParse('settings').success).toBe(true);
      expect(schema.safeParse('admin').success).toBe(true);
    });

    it('should reject invalid permission category values', () => {
      const schema = permissionCategoryField();
      
      expect(schema.safeParse('report').success).toBe(false);
      expect(schema.safeParse('integration').success).toBe(false);
    });
  });

  describe('Audit Action Field', () => {
    it('should accept all valid audit action values', () => {
      const schema = auditActionField();
      
      expect(schema.safeParse('create').success).toBe(true);
      expect(schema.safeParse('read').success).toBe(true);
      expect(schema.safeParse('update').success).toBe(true);
      expect(schema.safeParse('delete').success).toBe(true);
      expect(schema.safeParse('login').success).toBe(true);
      expect(schema.safeParse('logout').success).toBe(true);
      expect(schema.safeParse('export').success).toBe(true);
      expect(schema.safeParse('import').success).toBe(true);
      expect(schema.safeParse('sync').success).toBe(true);
      expect(schema.safeParse('approve').success).toBe(true);
      expect(schema.safeParse('reject').success).toBe(true);
    });

    it('should reject invalid audit action values', () => {
      const schema = auditActionField();
      
      expect(schema.safeParse('archive').success).toBe(false);
      expect(schema.safeParse('restore').success).toBe(false);
    });
  });

  describe('Report Type Field', () => {
    it('should accept all valid report type values', () => {
      const schema = reportTypeField();
      
      expect(schema.safeParse('leads').success).toBe(true);
      expect(schema.safeParse('campaigns').success).toBe(true);
      expect(schema.safeParse('bookings').success).toBe(true);
      expect(schema.safeParse('revenue').success).toBe(true);
      expect(schema.safeParse('users').success).toBe(true);
      expect(schema.safeParse('activity').success).toBe(true);
      expect(schema.safeParse('conversion').success).toBe(true);
      expect(schema.safeParse('retention').success).toBe(true);
    });

    it('should reject invalid report type values', () => {
      const schema = reportTypeField();
      
      expect(schema.safeParse('analytics').success).toBe(false);
      expect(schema.safeParse('performance').success).toBe(false);
    });
  });

  describe('Time Period Field', () => {
    it('should accept all valid time period values', () => {
      const schema = timePeriodField();
      
      expect(schema.safeParse('today').success).toBe(true);
      expect(schema.safeParse('yesterday').success).toBe(true);
      expect(schema.safeParse('this_week').success).toBe(true);
      expect(schema.safeParse('last_week').success).toBe(true);
      expect(schema.safeParse('this_month').success).toBe(true);
      expect(schema.safeParse('last_month').success).toBe(true);
      expect(schema.safeParse('this_quarter').success).toBe(true);
      expect(schema.safeParse('last_quarter').success).toBe(true);
      expect(schema.safeParse('this_year').success).toBe(true);
      expect(schema.safeParse('last_year').success).toBe(true);
      expect(schema.safeParse('custom').success).toBe(true);
    });

    it('should reject invalid time period values', () => {
      const schema = timePeriodField();
      
      expect(schema.safeParse('next_week').success).toBe(false);
      expect(schema.safeParse('all_time').success).toBe(false);
    });
  });

  describe('Export Format Field', () => {
    it('should accept all valid export format values', () => {
      const schema = exportFormatField();
      
      expect(schema.safeParse('csv').success).toBe(true);
      expect(schema.safeParse('xlsx').success).toBe(true);
      expect(schema.safeParse('json').success).toBe(true);
      expect(schema.safeParse('pdf').success).toBe(true);
    });

    it('should reject invalid export format values', () => {
      const schema = exportFormatField();
      
      expect(schema.safeParse('xml').success).toBe(false);
      expect(schema.safeParse('txt').success).toBe(false);
    });
  });

  describe('Notification Type Field', () => {
    it('should accept all valid notification type values', () => {
      const schema = notificationTypeField();
      
      expect(schema.safeParse('info').success).toBe(true);
      expect(schema.safeParse('success').success).toBe(true);
      expect(schema.safeParse('warning').success).toBe(true);
      expect(schema.safeParse('error').success).toBe(true);
      expect(schema.safeParse('alert').success).toBe(true);
    });

    it('should reject invalid notification type values', () => {
      const schema = notificationTypeField();
      
      expect(schema.safeParse('debug').success).toBe(false);
      expect(schema.safeParse('critical').success).toBe(false);
    });
  });

  describe('Consent Category Field', () => {
    it('should accept all valid consent category values', () => {
      const schema = consentCategoryField();
      
      expect(schema.safeParse('necessary').success).toBe(true);
      expect(schema.safeParse('analytics').success).toBe(true);
      expect(schema.safeParse('marketing').success).toBe(true);
      expect(schema.safeParse('preferences').success).toBe(true);
      expect(schema.safeParse('functional').success).toBe(true);
    });

    it('should reject invalid consent category values', () => {
      const schema = consentCategoryField();
      
      expect(schema.safeParse('optional').success).toBe(false);
      expect(schema.safeParse('social').success).toBe(false);
    });
  });

  describe('API Key Permission Field', () => {
    it('should accept all valid API key permission values', () => {
      const schema = apiKeyPermissionField();
      
      expect(schema.safeParse('read').success).toBe(true);
      expect(schema.safeParse('write').success).toBe(true);
      expect(schema.safeParse('admin').success).toBe(true);
      expect(schema.safeParse('webhooks').success).toBe(true);
      expect(schema.safeParse('reports').success).toBe(true);
    });

    it('should reject invalid API key permission values', () => {
      const schema = apiKeyPermissionField();
      
      expect(schema.safeParse('delete').success).toBe(false);
      expect(schema.safeParse('full').success).toBe(false);
    });
  });

  describe('Theme Mode Field', () => {
    it('should accept all valid theme mode values', () => {
      const schema = themeModeField();
      
      expect(schema.safeParse('light').success).toBe(true);
      expect(schema.safeParse('dark').success).toBe(true);
      expect(schema.safeParse('system').success).toBe(true);
    });

    it('should reject invalid theme mode values', () => {
      const schema = themeModeField();
      
      expect(schema.safeParse('auto').success).toBe(false);
      expect(schema.safeParse('custom').success).toBe(false);
    });
  });

  describe('Currency Field', () => {
    it('should accept all valid currency values', () => {
      const schema = currencyField();
      
      expect(schema.safeParse('USD').success).toBe(true);
      expect(schema.safeParse('EUR').success).toBe(true);
      expect(schema.safeParse('GBP').success).toBe(true);
      expect(schema.safeParse('CAD').success).toBe(true);
      expect(schema.safeParse('AUD').success).toBe(true);
      expect(schema.safeParse('JPY').success).toBe(true);
      expect(schema.safeParse('CHF').success).toBe(true);
      expect(schema.safeParse('SEK').success).toBe(true);
      expect(schema.safeParse('NOK').success).toBe(true);
      expect(schema.safeParse('DKK').success).toBe(true);
    });

    it('should reject invalid currency values', () => {
      const schema = currencyField();
      
      expect(schema.safeParse('INR').success).toBe(false);
      expect(schema.safeParse('CNY').success).toBe(false);
      expect(schema.safeParse('usd').success).toBe(false); // case sensitive
    });
  });

  describe('Language Field', () => {
    it('should accept all valid language values', () => {
      const schema = languageField();
      
      expect(schema.safeParse('en').success).toBe(true);
      expect(schema.safeParse('es').success).toBe(true);
      expect(schema.safeParse('fr').success).toBe(true);
      expect(schema.safeParse('de').success).toBe(true);
      expect(schema.safeParse('it').success).toBe(true);
      expect(schema.safeParse('pt').success).toBe(true);
      expect(schema.safeParse('nl').success).toBe(true);
      expect(schema.safeParse('sv').success).toBe(true);
      expect(schema.safeParse('da').success).toBe(true);
      expect(schema.safeParse('no').success).toBe(true);
    });

    it('should reject invalid language values', () => {
      const schema = languageField();
      
      expect(schema.safeParse('zh').success).toBe(false);
      expect(schema.safeParse('ja').success).toBe(false);
      expect(schema.safeParse('EN').success).toBe(false); // case sensitive
    });
  });

  describe('Timezone Field', () => {
    it('should accept all valid timezone values', () => {
      const schema = timezoneField();
      
      expect(schema.safeParse('UTC').success).toBe(true);
      expect(schema.safeParse('America/New_York').success).toBe(true);
      expect(schema.safeParse('America/Chicago').success).toBe(true);
      expect(schema.safeParse('America/Denver').success).toBe(true);
      expect(schema.safeParse('America/Los_Angeles').success).toBe(true);
      expect(schema.safeParse('Europe/London').success).toBe(true);
      expect(schema.safeParse('Europe/Paris').success).toBe(true);
      expect(schema.safeParse('Europe/Berlin').success).toBe(true);
      expect(schema.safeParse('Asia/Tokyo').success).toBe(true);
      expect(schema.safeParse('Australia/Sydney').success).toBe(true);
    });

    it('should reject invalid timezone values', () => {
      const schema = timezoneField();
      
      expect(schema.safeParse('America/Phoenix').success).toBe(false);
      expect(schema.safeParse('Asia/Shanghai').success).toBe(false);
      expect(schema.safeParse('utc').success).toBe(false); // case sensitive
    });
  });

  describe('File Type Field', () => {
    it('should accept all valid file type values', () => {
      const schema = fileTypeField();
      
      expect(schema.safeParse('image').success).toBe(true);
      expect(schema.safeParse('document').success).toBe(true);
      expect(schema.safeParse('spreadsheet').success).toBe(true);
      expect(schema.safeParse('presentation').success).toBe(true);
      expect(schema.safeParse('video').success).toBe(true);
      expect(schema.safeParse('audio').success).toBe(true);
      expect(schema.safeParse('archive').success).toBe(true);
      expect(schema.safeParse('other').success).toBe(true);
    });

    it('should reject invalid file type values', () => {
      const schema = fileTypeField();
      
      expect(schema.safeParse('code').success).toBe(false);
      expect(schema.safeParse('data').success).toBe(false);
    });
  });

  describe('Integration Status Field', () => {
    it('should accept all valid integration status values', () => {
      const schema = integrationStatusField();
      
      expect(schema.safeParse('connected').success).toBe(true);
      expect(schema.safeParse('disconnected').success).toBe(true);
      expect(schema.safeParse('error').success).toBe(true);
      expect(schema.safeParse('pending').success).toBe(true);
      expect(schema.safeParse('expired').success).toBe(true);
    });

    it('should reject invalid integration status values', () => {
      const schema = integrationStatusField();
      
      expect(schema.safeParse('active').success).toBe(false);
      expect(schema.safeParse('failed').success).toBe(false);
    });
  });

  describe('Case Sensitivity', () => {
    it('should reject uppercase values for case-sensitive enums', () => {
      const schema = leadStatusField();
      
      expect(schema.safeParse('NEW').success).toBe(false);
      expect(schema.safeParse('New').success).toBe(false);
    });

    it('should accept exact case matches', () => {
      const schema = leadStatusField();
      
      expect(schema.safeParse('new').success).toBe(true);
      expect(schema.safeParse('contacted').success).toBe(true);
    });
  });

  describe('Enum Field Type Safety', () => {
    it('should preserve literal types for type safety', () => {
      const schema = leadStatusField();
      const result = schema.safeParse('new');
      
      if (result.success) {
        // TypeScript should infer the exact literal type
        const status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'duplicate' | 'unsubscribed' = result.data;
        expect(status).toBe('new');
      }
    });
  });

  describe('Enum Field Error Messages', () => {
    it('should provide clear error messages for invalid values', () => {
      const schema = leadStatusField();
      const result = schema.safeParse('invalid');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });
  });
});

```

---

### tsup.config.ts

**Path:** `tsup.config.ts`

**Language:** TypeScript

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['@firm/types', 'zod'],
});

```

---

