/**
 * String literal unions for Firm platform enums
 * Uses string unions instead of TypeScript enums for better type safety
 */

// Tenant and User Statuses
export type TenantStatus = 'active' | 'inactive' | 'suspended' | 'trial' | 'cancelled';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'invited';

// Lead Statuses and Sources
export type LeadStatus = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'converted'
  | 'lost'
  | 'duplicate'
  | 'unsubscribed';

export type LeadSource = 
  | 'website'
  | 'referral'
  | 'social'
  | 'email'
  | 'phone'
  | 'form'
  | 'api'
  | 'import'
  | 'manual';

export type LeadScore = 'hot' | 'warm' | 'cold';

// Campaign Types and Statuses
export type CampaignType = 
  | 'email'
  | 'sms'
  | 'social'
  | 'webinar'
  | 'event'
  | 'content'
  | 'retargeting';

export type CampaignStatus = 
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

// Booking Statuses
export type BookingStatus = 
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export type BookingType = 
  | 'consultation'
  | 'service'
  | 'follow_up'
  | 'demo'
  | 'meeting'
  | 'appointment';

// Invoice and Subscription Statuses
export type InvoiceStatus = 
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded'
  | 'partial';

export type SubscriptionStatus = 
  | 'active'
  | 'trial'
  | 'past_due'
  | 'cancelled'
  | 'unpaid'
  | 'paused';

export type BillingCycle = 'monthly' | 'quarterly' | 'annual';

// Email Template Types
export type EmailTemplateType = 
  | 'welcome'
  | 'confirmation'
  | 'reminder'
  | 'follow_up'
  | 'newsletter'
  | 'promotional'
  | 'transactional'
  | 'alert';

// Form Types
export type FormType = 
  | 'contact'
  | 'lead_capture'
  | 'survey'
  | 'feedback'
  | 'registration'
  | 'application'
  | 'quote_request';

// Webhook Events and Statuses
export type WebhookEvent = 
  | 'lead.created'
  | 'lead.updated'
  | 'lead.deleted'
  | 'booking.created'
  | 'booking.updated'
  | 'booking.completed'
  | 'invoice.created'
  | 'invoice.paid'
  | 'user.created'
  | 'user.updated';

export type WebhookStatus = 'active' | 'inactive' | 'failed';

// Sync Job Statuses
export type SyncJobStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

// Service Tiers
export type ServiceTier = 
  | 'starter'
  | 'professional'
  | 'business'
  | 'enterprise'
  | 'custom';

// Permission Categories
export type PermissionCategory = 
  | 'tenant'
  | 'user'
  | 'lead'
  | 'campaign'
  | 'booking'
  | 'invoice'
  | 'analytics'
  | 'settings'
  | 'admin';

// Audit Log Actions
export type AuditAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'sync'
  | 'approve'
  | 'reject';

// Report Types
export type ReportType = 
  | 'leads'
  | 'campaigns'
  | 'bookings'
  | 'revenue'
  | 'users'
  | 'activity'
  | 'conversion'
  | 'retention';

// Time Periods
export type TimePeriod = 
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'custom';

// Data Export Formats
export type ExportFormat = 'csv' | 'xlsx' | 'json' | 'pdf';

// Notification Types
export type NotificationType = 
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'alert';

// Consent Categories
export type ConsentCategory = 
  | 'necessary'
  | 'analytics'
  | 'marketing'
  | 'preferences'
  | 'functional';

// API Key Permissions
export type ApiKeyPermission = 
  | 'read'
  | 'write'
  | 'admin'
  | 'webhooks'
  | 'reports';

// Theme Modes
export type ThemeMode = 'light' | 'dark' | 'system';

// Currency Codes (common ones)
export type Currency = 
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'CAD'
  | 'AUD'
  | 'JPY'
  | 'CHF'
  | 'SEK'
  | 'NOK'
  | 'DKK';

// Language Codes
export type Language = 
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'pt'
  | 'nl'
  | 'sv'
  | 'da'
  | 'no';

// Timezones (major ones)
export type Timezone = 
  | 'UTC'
  | 'America/New_York'
  | 'America/Chicago'
  | 'America/Denver'
  | 'America/Los_Angeles'
  | 'Europe/London'
  | 'Europe/Paris'
  | 'Europe/Berlin'
  | 'Asia/Tokyo'
  | 'Australia/Sydney';

// File Types
export type FileType = 
  | 'image'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'video'
  | 'audio'
  | 'archive'
  | 'other';

// Integration Status
export type IntegrationStatus = 
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'pending'
  | 'expired';
