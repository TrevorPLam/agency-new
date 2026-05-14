/**
 * Branded type definitions for Firm platform
 * Uses unique symbol branding to create type-safe identifiers
 * Domain-level IDs only - L0 primitives moved to @firm/primitives
 */


// Brand symbols for type safety
declare const LeadIdBrand: unique symbol;
declare const CampaignIdBrand: unique symbol;
declare const BookingIdBrand: unique symbol;
declare const InvoiceIdBrand: unique symbol;
declare const SubscriptionIdBrand: unique symbol;
declare const EmailTemplateIdBrand: unique symbol;
declare const FormIdBrand: unique symbol;
declare const WebhookIdBrand: unique symbol;
declare const ApiKeyIdBrand: unique symbol;
declare const AuditLogIdBrand: unique symbol;
declare const SyncJobIdBrand: unique symbol;
declare const ReportIdBrand: unique symbol;

// Branded type definitions
export type LeadId = string & { readonly [LeadIdBrand]: true };
export type CampaignId = string & { readonly [CampaignIdBrand]: true };
export type BookingId = string & { readonly [BookingIdBrand]: true };
export type InvoiceId = string & { readonly [InvoiceIdBrand]: true };
export type SubscriptionId = string & { readonly [SubscriptionIdBrand]: true };
export type EmailTemplateId = string & { readonly [EmailTemplateIdBrand]: true };
export type FormId = string & { readonly [FormIdBrand]: true };
export type WebhookId = string & { readonly [WebhookIdBrand]: true };
export type ApiKeyId = string & { readonly [ApiKeyIdBrand]: true };
export type AuditLogId = string & { readonly [AuditLogIdBrand]: true };
export type SyncJobId = string & { readonly [SyncJobIdBrand]: true };
export type ReportId = string & { readonly [ReportIdBrand]: true };

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4
 */
function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Gatekeeper factory functions for creating branded IDs
 * These validate the UUID format but keep the brand opaque
 */

export function asLeadId(value: string): LeadId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid LeadId: ${value}. Must be a valid UUID v4.`);
  }
  return value as LeadId;
}

export function asCampaignId(value: string): CampaignId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid CampaignId: ${value}. Must be a valid UUID v4.`);
  }
  return value as CampaignId;
}

export function asBookingId(value: string): BookingId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid BookingId: ${value}. Must be a valid UUID v4.`);
  }
  return value as BookingId;
}

export function asInvoiceId(value: string): InvoiceId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid InvoiceId: ${value}. Must be a valid UUID v4.`);
  }
  return value as InvoiceId;
}

export function asSubscriptionId(value: string): SubscriptionId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid SubscriptionId: ${value}. Must be a valid UUID v4.`);
  }
  return value as SubscriptionId;
}

export function asEmailTemplateId(value: string): EmailTemplateId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid EmailTemplateId: ${value}. Must be a valid UUID v4.`);
  }
  return value as EmailTemplateId;
}

export function asFormId(value: string): FormId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid FormId: ${value}. Must be a valid UUID v4.`);
  }
  return value as FormId;
}

export function asWebhookId(value: string): WebhookId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid WebhookId: ${value}. Must be a valid UUID v4.`);
  }
  return value as WebhookId;
}

export function asApiKeyId(value: string): ApiKeyId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid ApiKeyId: ${value}. Must be a valid UUID v4.`);
  }
  return value as ApiKeyId;
}

export function asAuditLogId(value: string): AuditLogId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid AuditLogId: ${value}. Must be a valid UUID v4.`);
  }
  return value as AuditLogId;
}

export function asSyncJobId(value: string): SyncJobId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid SyncJobId: ${value}. Must be a valid UUID v4.`);
  }
  return value as SyncJobId;
}

export function asReportId(value: string): ReportId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid ReportId: ${value}. Must be a valid UUID v4.`);
  }
  return value as ReportId;
}

/**
 * Type guard functions for runtime checking
 */
export function isLeadId(value: unknown): value is LeadId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isCampaignId(value: unknown): value is CampaignId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isBookingId(value: unknown): value is BookingId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isInvoiceId(value: unknown): value is InvoiceId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isSubscriptionId(value: unknown): value is SubscriptionId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isEmailTemplateId(value: unknown): value is EmailTemplateId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isFormId(value: unknown): value is FormId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isWebhookId(value: unknown): value is WebhookId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isApiKeyId(value: unknown): value is ApiKeyId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isAuditLogId(value: unknown): value is AuditLogId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isSyncJobId(value: unknown): value is SyncJobId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isReportId(value: unknown): value is ReportId {
  return typeof value === 'string' && isValidUuid(value);
}

/**
 * Helper function to extract the raw string value from a branded ID
 * This should be used sparingly - prefer keeping the branded type
 */
export function extractId<T extends string>(brandedId: T): string {
  return brandedId;
}

/**
 * Type for any branded ID (useful for generic operations)
 */
export type BrandedId = 
  | LeadId
  | CampaignId
  | BookingId
  | InvoiceId
  | SubscriptionId
  | EmailTemplateId
  | FormId
  | WebhookId
  | ApiKeyId
  | AuditLogId
  | SyncJobId
  | ReportId;
