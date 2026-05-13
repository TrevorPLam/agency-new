/**
 * Entity interfaces for Firm platform
 * Defines the core domain entities following DDD patterns
 */

import type {
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
} from './branded';

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
} from './enums';

// Base interfaces for common fields
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantScopedEntity extends BaseEntity {
  tenantId: TenantId;
}

export interface AuditableEntity extends TenantScopedEntity {
  createdBy: UserId;
  updatedBy: UserId;
}

// Tenant Entity
export interface Tenant extends BaseEntity {
  id: TenantId;
  name: string;
  slug: string;
  domain?: string;
  status: TenantStatus;
  serviceTier: ServiceTier;
  settings: TenantSettings;
  subscription?: Subscription;
  metadata: Record<string, unknown>;
}

export interface TenantSettings {
  timezone: Timezone;
  currency: Currency;
  language: Language;
  theme: ThemeMode;
  features: Record<string, boolean>;
  limits: TenantLimits;
  consent: ConsentSettings;
  integrations: Record<string, IntegrationStatus>;
}

export interface TenantLimits {
  users: number;
  leads: number;
  campaigns: number;
  bookings: number;
  storage: number; // in MB
  apiCalls: number; // per month
}

export interface ConsentSettings {
  requiredCategories: ConsentCategory[];
  defaultConsent: Record<ConsentCategory, boolean>;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
}

// User Entity
export interface User extends AuditableEntity {
  id: UserId;
  tenantId: TenantId;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  permissions: Permission[];
  lastLoginAt?: Date;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  avatar?: string;
  preferences: UserPreferences;
  metadata: Record<string, unknown>;
}

export interface UserRole {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  category: PermissionCategory;
  action: string;
  resource: string;
  conditions?: Record<string, unknown>;
}

export interface UserPreferences {
  timezone: Timezone;
  language: Language;
  theme: ThemeMode;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
}

export interface NotificationPreferences {
  email: Record<NotificationType, boolean>;
  push: Record<NotificationType, boolean>;
  sms: Record<NotificationType, boolean>;
}

export interface DashboardPreferences {
  layout: string;
  widgets: DashboardWidget[];
  defaultTimePeriod: TimePeriod;
}

export interface DashboardWidget {
  id: string;
  type: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
}

// Lead Entity
export interface Lead extends AuditableEntity {
  id: LeadId;
  tenantId: TenantId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status: LeadStatus;
  source: LeadSource;
  score: LeadScore;
  scoreValue: number;
  assignedTo?: UserId;
  tags: string[];
  customFields: Record<string, unknown>;
  lastContactAt?: Date;
  notes: LeadNote[];
  activities: LeadActivity[];
  metadata: Record<string, unknown>;
}

export interface LeadNote {
  id: string;
  content: string;
  createdBy: UserId;
  createdAt: Date;
  isPrivate: boolean;
}

export interface LeadActivity {
  id: string;
  type: string;
  description: string;
  createdBy: UserId;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

// Campaign Entity
export interface Campaign extends AuditableEntity {
  id: CampaignId;
  tenantId: TenantId;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  templateId?: EmailTemplateId;
  audience: CampaignAudience;
  schedule: CampaignSchedule;
  content: CampaignContent;
  performance: CampaignPerformance;
  metadata: Record<string, unknown>;
}

export interface CampaignAudience {
  totalRecipients: number;
  segments: string[];
  filters: Record<string, unknown>;
}

export interface CampaignSchedule {
  scheduledAt?: Date;
  sendImmediately: boolean;
  timezone: Timezone;
  recurrence?: {
    frequency: string;
    interval: number;
    endDate?: Date;
  };
}

export interface CampaignContent {
  subject?: string;
  body: string;
  attachments: CampaignAttachment[];
  variables: Record<string, string>;
}

export interface CampaignAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: FileType;
}

export interface CampaignPerformance {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  bounced: number;
  unsubscribed: number;
}

// Booking Entity
export interface Booking extends AuditableEntity {
  id: BookingId;
  tenantId: TenantId;
  leadId: LeadId;
  type: BookingType;
  status: BookingStatus;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: BookingLocation;
  attendees: BookingAttendee[];
  notes?: string;
  reminder: BookingReminder;
  metadata: Record<string, unknown>;
}

export interface BookingLocation {
  type: 'in_person' | 'virtual' | 'phone';
  address?: string;
  meetingUrl?: string;
  phoneNumber?: string;
}

export interface BookingAttendee {
  userId: UserId;
  email: string;
  name: string;
  status: 'accepted' | 'declined' | 'tentative' | 'no_response';
  isOptional: boolean;
}

export interface BookingReminder {
  enabled: boolean;
  minutesBefore: number[];
  method: 'email' | 'sms' | 'push';
}

// Invoice Entity
export interface Invoice extends AuditableEntity {
  id: InvoiceId;
  tenantId: TenantId;
  leadId?: LeadId;
  number: string;
  status: InvoiceStatus;
  currency: Currency;
  amount: number;
  tax: number;
  total: number;
  dueDate: Date;
  paidAt?: Date;
  items: InvoiceItem[];
  billingAddress: Address;
  shippingAddress?: Address;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  total: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Subscription Entity
export interface Subscription extends AuditableEntity {
  id: SubscriptionId;
  tenantId: TenantId;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: Currency;
  features: Record<string, boolean>;
  limits: TenantLimits;
  metadata: Record<string, unknown>;
}

// Email Template Entity
export interface EmailTemplate extends AuditableEntity {
  id: EmailTemplateId;
  tenantId: TenantId;
  name: string;
  description?: string;
  type: EmailTemplateType;
  subject: string;
  body: string;
  variables: EmailTemplateVariable[];
  isDefault: boolean;
  version: number;
  metadata: Record<string, unknown>;
}

export interface EmailTemplateVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

// Form Entity
export interface Form extends AuditableEntity {
  id: FormId;
  tenantId: TenantId;
  name: string;
  description?: string;
  type: FormType;
  fields: FormField[];
  settings: FormSettings;
  submissions: FormSubmission[];
  metadata: Record<string, unknown>;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[];
  validation?: FieldValidation;
  order: number;
}

export type FormFieldType = 
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'hidden';

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface FormSettings {
  submitButtonText: string;
  successMessage: string;
  redirectUrl?: string;
  sendNotifications: boolean;
  storeSubmissions: boolean;
  consentRequired: boolean;
}

export interface FormSubmission {
  id: string;
  formId: FormId;
  data: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  submittedAt: Date;
  leadId?: LeadId;
}

// Webhook Entity
export interface Webhook extends AuditableEntity {
  id: WebhookId;
  tenantId: TenantId;
  name: string;
  description?: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  status: WebhookStatus;
  retryPolicy: WebhookRetryPolicy;
  lastTriggeredAt?: Date;
  metadata: Record<string, unknown>;
}

export interface WebhookRetryPolicy {
  maxRetries: number;
  retryDelay: number; // in seconds
  backoffMultiplier: number;
}

// API Key Entity
export interface ApiKey extends AuditableEntity {
  id: ApiKeyId;
  tenantId: TenantId;
  name: string;
  keyHash: string;
  permissions: ApiKeyPermission[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  isActive: boolean;
  metadata: Record<string, unknown>;
}

// Session Entity
export interface Session extends BaseEntity {
  id: SessionId;
  userId: UserId;
  tenantId: TenantId;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  metadata: Record<string, unknown>;
}

// Audit Log Entity
export interface AuditLog extends BaseEntity {
  id: AuditLogId;
  tenantId: TenantId;
  userId?: UserId;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
}

// Sync Job Entity
export interface SyncJob extends AuditableEntity {
  id: SyncJobId;
  tenantId: TenantId;
  type: string;
  provider: string;
  status: SyncJobStatus;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

// Report Entity
export interface Report extends AuditableEntity {
  id: ReportId;
  tenantId: TenantId;
  name: string;
  description?: string;
  type: ReportType;
  filters: ReportFilter[];
  timePeriod: TimePeriod;
  customDateRange?: {
    startDate: Date;
    endDate: Date;
  };
  format: ExportFormat;
  schedule?: ReportSchedule;
  lastGeneratedAt?: Date;
  fileUrl?: string;
  metadata: Record<string, unknown>;
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: unknown;
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: string;
  recipients: string[];
  nextRunAt?: Date;
}
