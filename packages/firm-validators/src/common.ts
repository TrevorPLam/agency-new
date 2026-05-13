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
