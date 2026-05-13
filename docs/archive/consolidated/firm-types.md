# firm-types

Generated on: 2026-05-13T02:25:38.718Z
Total files: 9

**Description:** Core types and interfaces for the Firm platform

**Version:** 1.0.0

## Table of Contents

- [adapters.ts](#adapters-ts)
- [api.ts](#api-ts)
- [branded.ts](#branded-ts)
- [entities.ts](#entities-ts)
- [enums.ts](#enums-ts)
- [helpers.ts](#helpers-ts)
- [index.ts](#index-ts)
- [compile-time.test.ts](#compile-time-test-ts)
- [tsup.config.ts](#tsup-config-ts)

## File Contents

### adapters.ts

**Path:** `src\adapters.ts`

**Language:** TypeScript

```typescript
/**
 * Adapter interfaces for external system integrations
 * Defines the contract for all external adapters following the adapter pattern
 */

import type { Lead, Campaign, Booking, Invoice, User, Tenant } from './entities';
import type { LeadId, CampaignId, BookingId, InvoiceId, TenantId } from './branded';

// Base adapter interface
export interface BaseAdapter {
  readonly name: string;
  readonly version: string;
  readonly config: Record<string, unknown>;
  initialize(): Promise<void>;
  healthCheck(): Promise<AdapterHealthStatus>;
  disconnect(): Promise<void>;
}

export interface AdapterHealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  lastChecked: Date;
  metadata?: Record<string, unknown>;
}

// CRM Adapter Interface
export interface CRMAdapter extends BaseAdapter {
  // Lead operations
  createLead(data: CreateLeadRequest): Promise<CRMLeadResponse>;
  updateLead(id: string, data: UpdateLeadRequest): Promise<CRMLeadResponse>;
  getLead(id: string): Promise<CRMLeadResponse>;
  deleteLead(id: string): Promise<void>;
  searchLeads(query: SearchLeadsQuery): Promise<CRMLeadSearchResponse>;
  
  // Contact operations
  createContact(data: CreateContactRequest): Promise<CRMContactResponse>;
  updateContact(id: string, data: UpdateContactRequest): Promise<CRMContactResponse>;
  getContact(id: string): Promise<CRMContactResponse>;
  
  // Sync operations
  syncLeads(options?: SyncOptions): Promise<SyncResult>;
  getSyncStatus(): Promise<SyncStatus>;
  
  // Webhook operations
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
  processWebhook(event: CRMWebhookEvent): Promise<WebhookProcessResult>;
}

export interface CreateLeadRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export interface UpdateLeadRequest extends Partial<CreateLeadRequest> {
  status?: string;
  assignedTo?: string;
  notes?: string;
}

export interface CRMLeadResponse {
  id: string;
  externalId: string;
  data: Partial<Lead>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
}

export interface UpdateContactRequest extends Partial<CreateContactRequest> {}

export interface CRMContactResponse {
  id: string;
  externalId: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchLeadsQuery {
  limit?: number;
  offset?: number;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CRMLeadSearchResponse {
  leads: CRMLeadResponse[];
  total: number;
  hasMore: boolean;
}

export interface SyncOptions {
  since?: Date;
  limit?: number;
  batchSize?: number;
}

export interface SyncResult {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: SyncError[];
  startedAt: Date;
  completedAt: Date;
}

export interface SyncError {
  id: string;
  externalId?: string;
  error: string;
  retryable: boolean;
  timestamp: Date;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  progress?: number;
  errors: number;
}

export interface CRMWebhookEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
  signature: string;
}

export interface WebhookProcessResult {
  success: boolean;
  processed: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Email Adapter Interface
export interface EmailAdapter extends BaseAdapter {
  sendEmail(data: SendEmailRequest): Promise<EmailResponse>;
  sendTemplateEmail(data: SendTemplateEmailRequest): Promise<EmailResponse>;
  getEmailStatus(id: string): Promise<EmailStatusResponse>;
  trackEvent(data: EmailEventRequest): Promise<void>;
  getTemplates(): Promise<EmailTemplate[]>;
}

export interface SendEmailRequest {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface SendTemplateEmailRequest extends Omit<SendEmailRequest, 'subject' | 'html' | 'text'> {
  templateId: string;
  templateData: Record<string, unknown>;
}

export interface EmailResponse {
  id: string;
  messageId: string;
  status: EmailDeliveryStatus;
  sentAt: Date;
  metadata?: Record<string, unknown>;
}

export interface EmailStatusResponse {
  id: string;
  status: EmailDeliveryStatus;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  complaints?: number;
  metadata?: Record<string, unknown>;
}

export interface EmailAttachment {
  filename: string;
  content: string | ArrayBuffer | Uint8Array;
  contentType: string;
}

export interface EmailEventRequest {
  emailId: string;
  event: EmailEventType;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type EmailDeliveryStatus = 
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'rejected'
  | 'failed';

export type EmailEventType = 
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'unsubscribed'
  | 'rejected';

// Analytics Adapter Interface
export interface AnalyticsAdapter extends BaseAdapter {
  trackEvent(data: TrackEventRequest): Promise<void>;
  trackPageView(data: PageViewRequest): Promise<void>;
  trackConversion(data: ConversionRequest): Promise<void>;
  getMetrics(query: MetricsQuery): Promise<MetricsResponse>;
  createReport(data: CreateReportRequest): Promise<AnalyticsReport>;
}

export interface TrackEventRequest {
  event: string;
  userId?: string;
  sessionId?: string;
  properties: Record<string, unknown>;
  timestamp: Date;
  context?: EventContext;
}

export interface PageViewRequest {
  url: string;
  title?: string;
  referrer?: string;
  userId?: string;
  sessionId?: string;
  properties: Record<string, unknown>;
  timestamp: Date;
  context?: EventContext;
}

export interface ConversionRequest {
  event: string;
  value?: number;
  currency?: string;
  userId?: string;
  sessionId?: string;
  properties: Record<string, unknown>;
  timestamp: Date;
  context?: EventContext;
}

export interface EventContext {
  userAgent?: string;
  ip?: string;
  locale?: string;
  timezone?: string;
  screen?: {
    width: number;
    height: number;
  };
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

export interface MetricsQuery {
  startDate: Date;
  endDate: Date;
  metrics: string[];
  dimensions?: string[];
  filters?: Record<string, unknown>;
  limit?: number;
}

export interface MetricsResponse {
  data: MetricsRow[];
  totalRows: number;
  hasMore: boolean;
  query: MetricsQuery;
}

export interface MetricsRow {
  dimensions: Record<string, string>;
  metrics: Record<string, number>;
  timestamp?: Date;
}

export interface CreateReportRequest {
  name: string;
  description?: string;
  query: MetricsQuery;
  schedule?: ReportSchedule;
  format: 'json' | 'csv' | 'xlsx';
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  timezone: string;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  query: MetricsQuery;
  format: string;
  schedule?: ReportSchedule;
  lastGeneratedAt?: Date;
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Booking/Calendar Adapter Interface
export interface BookingAdapter extends BaseAdapter {
  createEvent(data: CreateEventRequest): Promise<BookingEventResponse>;
  updateEvent(id: string, data: UpdateEventRequest): Promise<BookingEventResponse>;
  getEvent(id: string): Promise<BookingEventResponse>;
  deleteEvent(id: string): Promise<void>;
  listEvents(query: ListEventsQuery): Promise<BookingEventsResponse>;
  getAvailability(query: AvailabilityQuery): Promise<AvailabilityResponse>;
  syncEvents(options?: SyncOptions): Promise<SyncResult>;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: EventAttendee[];
  location?: EventLocation;
  reminders?: EventReminder[];
  metadata?: Record<string, unknown>;
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  status?: string;
}

export interface BookingEventResponse {
  id: string;
  externalId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: string;
  attendees: EventAttendee[];
  location?: EventLocation;
  reminders: EventReminder[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface EventAttendee {
  email: string;
  name?: string;
  status: 'accepted' | 'declined' | 'tentative' | 'no_response';
  isOptional: boolean;
}

export interface EventLocation {
  type: 'in_person' | 'virtual' | 'phone';
  address?: string;
  meetingUrl?: string;
  phoneNumber?: string;
}

export interface EventReminder {
  method: 'email' | 'sms' | 'push';
  minutesBefore: number;
}

export interface ListEventsQuery {
  startDate: Date;
  endDate: Date;
  limit?: number;
  offset?: number;
  filters?: Record<string, unknown>;
}

export interface BookingEventsResponse {
  events: BookingEventResponse[];
  total: number;
  hasMore: boolean;
}

export interface AvailabilityQuery {
  startDate: Date;
  endDate: Date;
  duration: number; // in minutes
  attendees?: string[];
  timezone: string;
}

export interface AvailabilityResponse {
  availableSlots: TimeSlot[];
  timezone: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

// AI Adapter Interface
export interface AIAdapter extends BaseAdapter {
  generateText(data: GenerateTextRequest): Promise<GenerateTextResponse>;
  generateEmbedding(data: GenerateEmbeddingRequest): Promise<GenerateEmbeddingResponse>;
  classifyText(data: ClassifyTextRequest): Promise<ClassifyTextResponse>;
  extractEntities(data: ExtractEntitiesRequest): Promise<ExtractEntitiesResponse>;
  summarizeText(data: SummarizeTextRequest): Promise<SummarizeTextResponse>;
}

export interface GenerateTextRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  context?: string[];
  metadata?: Record<string, unknown>;
}

export interface GenerateTextResponse {
  text: string;
  usage: TokenUsage;
  model: string;
  finishReason: string;
  metadata?: Record<string, unknown>;
}

export interface GenerateEmbeddingRequest {
  text: string;
  model?: string;
  metadata?: Record<string, unknown>;
}

export interface GenerateEmbeddingResponse {
  embedding: number[];
  model: string;
  usage: TokenUsage;
}

export interface ClassifyTextRequest {
  text: string;
  categories: string[];
  model?: string;
  metadata?: Record<string, unknown>;
}

export interface ClassifyTextResponse {
  category: string;
  confidence: number;
  scores: Record<string, number>;
  model: string;
}

export interface ExtractEntitiesRequest {
  text: string;
  entityTypes: string[];
  model?: string;
  metadata?: Record<string, unknown>;
}

export interface ExtractEntitiesResponse {
  entities: ExtractedEntity[];
  model: string;
}

export interface ExtractedEntity {
  text: string;
  type: string;
  confidence: number;
  start: number;
  end: number;
  metadata?: Record<string, unknown>;
}

export interface SummarizeTextRequest {
  text: string;
  maxLength?: number;
  style?: 'bullet' | 'paragraph' | 'headline';
  model?: string;
  metadata?: Record<string, unknown>;
}

export interface SummarizeTextResponse {
  summary: string;
  model: string;
  usage: TokenUsage;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Storage Adapter Interface
export interface StorageAdapter extends BaseAdapter {
  uploadFile(data: UploadFileRequest): Promise<StorageFileResponse>;
  downloadFile(id: string): Promise<ArrayBuffer | Uint8Array>;
  deleteFile(id: string): Promise<void>;
  getFileMetadata(id: string): Promise<StorageFileResponse>;
  listFiles(query: ListFilesQuery): Promise<StorageFilesResponse>;
  generatePresignedUrl(data: PresignedUrlRequest): Promise<PresignedUrlResponse>;
}

export interface UploadFileRequest {
  filename: string;
  content: ArrayBuffer | Uint8Array;
  contentType: string;
  metadata?: Record<string, unknown>;
  path?: string;
}

export interface StorageFileResponse {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url?: string;
  path: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListFilesQuery {
  prefix?: string;
  limit?: number;
  offset?: number;
  filters?: Record<string, unknown>;
}

export interface StorageFilesResponse {
  files: StorageFileResponse[];
  total: number;
  hasMore: boolean;
}

export interface PresignedUrlRequest {
  filename: string;
  method: 'GET' | 'PUT' | 'DELETE';
  expiresIn?: number; // seconds
  contentType?: string;
  metadata?: Record<string, unknown>;
}

export interface PresignedUrlResponse {
  url: string;
  method: string;
  expiresAt: Date;
  headers?: Record<string, string>;
}

```

---

### api.ts

**Path:** `src\api.ts`

**Language:** TypeScript

```typescript
/**
 * API envelope types for Firm platform
 * Defines standard request/response envelopes and error shapes
 */

import type { 
  TenantId, 
  UserId, 
  LeadId, 
  CampaignId, 
  BookingId, 
  InvoiceId,
  SubscriptionId 
} from './branded';

import type { 
  Tenant, 
  User, 
  Lead, 
  Campaign, 
  Booking, 
  Invoice,
  Subscription 
} from './entities';

// Base API Response Envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
  pagination?: PaginationMeta;
}

// Standard API Error Shape (RFC 7807)
export interface ApiError {
  type: string; // URI identifying the error type
  title: string; // Human-readable error title
  status: number; // HTTP status code
  detail?: string; // Human-readable error details
  instance?: string; // URI identifying the specific occurrence
  errors?: ValidationError[]; // Field-level validation errors
  code?: string; // Application-specific error code
  context?: Record<string, unknown>; // Additional error context
}

export interface ValidationError {
  field: string; // Field path (dot notation for nested)
  message: string; // Validation error message
  code?: string; // Validation error code
  value?: unknown; // The invalid value
}

// Response Metadata
export interface ResponseMeta {
  requestId: string;
  timestamp: string; // ISO 8601
  version: string; // API version
  tenantId?: TenantId;
  userId?: UserId;
  executionTime?: number; // milliseconds
  warnings?: string[];
}

// Pagination Metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

// Request Envelopes
export interface ApiRequest<T = unknown> {
  data?: T;
  meta?: RequestMeta;
}

export interface RequestMeta {
  requestId?: string;
  version?: string; // API version
  tenantId?: TenantId;
  userId?: UserId;
  userAgent?: string;
  ip?: string;
}

// Specific API Response Types
export type TenantResponse = ApiResponse<Tenant>;
export type TenantsResponse = ApiResponse<Tenant[]> & { pagination: PaginationMeta };
export type CreateUserResponse = ApiResponse<User>;
export type UpdateUserResponse = ApiResponse<User>;
export type UsersResponse = ApiResponse<User[]> & { pagination: PaginationMeta };
export type LeadResponse = ApiResponse<Lead>;
export type LeadsResponse = ApiResponse<Lead[]> & { pagination: PaginationMeta };
export type CampaignResponse = ApiResponse<Campaign>;
export type CampaignsResponse = ApiResponse<Campaign[]> & { pagination: PaginationMeta };
export type BookingResponse = ApiResponse<Booking>;
export type BookingsResponse = ApiResponse<Booking[]> & { pagination: PaginationMeta };
export type InvoiceResponse = ApiResponse<Invoice>;
export type InvoicesResponse = ApiResponse<Invoice[]> & { pagination: PaginationMeta };
export type SubscriptionResponse = ApiResponse<Subscription>;
export type SubscriptionsResponse = ApiResponse<Subscription[]> & { pagination: PaginationMeta };

// Request Types
export interface CreateTenantRequest {
  name: string;
  slug: string;
  domain?: string;
  serviceTier: string;
  settings?: Partial<Tenant['settings']>;
}

export interface UpdateTenantRequest {
  name?: string;
  domain?: string;
  status?: string;
  settings?: Partial<Tenant['settings']>;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions?: string[];
  phone?: string;
  preferences?: Partial<User['preferences']>;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: string;
  permissions?: string[];
  phone?: string;
  status?: string;
  preferences?: Partial<User['preferences']>;
}

export interface CreateLeadRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export interface UpdateLeadRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status?: string;
  source?: string;
  score?: string;
  assignedTo?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  type: string;
  templateId?: string;
  audience: {
    segments: string[];
    filters: Record<string, unknown>;
  };
  schedule: {
    scheduledAt?: string;
    sendImmediately: boolean;
    timezone: string;
  };
  content: {
    subject?: string;
    body: string;
    variables: Record<string, string>;
  };
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  status?: string;
  content?: {
    subject?: string;
    body: string;
    variables: Record<string, string>;
  };
}

export interface CreateBookingRequest {
  leadId: LeadId;
  type: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: {
    type: 'in_person' | 'virtual' | 'phone';
    address?: string;
    meetingUrl?: string;
    phoneNumber?: string;
  };
  attendees?: Array<{
    userId: UserId;
    email: string;
    name: string;
    isOptional: boolean;
  }>;
  reminder?: {
    enabled: boolean;
    minutesBefore: number[];
    method: 'email' | 'sms' | 'push';
  };
}

export interface UpdateBookingRequest {
  type?: string;
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  location?: {
    type: 'in_person' | 'virtual' | 'phone';
    address?: string;
    meetingUrl?: string;
    phoneNumber?: string;
  };
  notes?: string;
}

export interface CreateInvoiceRequest {
  leadId?: LeadId;
  currency: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    tax: number;
  }>;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  notes?: string;
}

export interface UpdateInvoiceRequest {
  status?: string;
  dueDate?: string;
  items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    tax: number;
  }>;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  notes?: string;
}

export interface CreateSubscriptionRequest {
  planId: string;
  billingCycle: string;
  currency: string;
  features?: Record<string, boolean>;
}

export interface UpdateSubscriptionRequest {
  planId?: string;
  billingCycle?: string;
  status?: string;
  features?: Record<string, boolean>;
  cancelAtPeriodEnd?: boolean;
}

// Query Parameters
export interface ListQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  cursor?: string;
  search?: string;
  filters?: Record<string, unknown>;
}

export interface TenantListQuery extends ListQuery {
  status?: string;
  serviceTier?: string;
}

export interface UserListQuery extends ListQuery {
  status?: string;
  role?: string;
}

export interface LeadListQuery extends ListQuery {
  status?: string;
  source?: string;
  score?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CampaignListQuery extends ListQuery {
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface BookingListQuery extends ListQuery {
  status?: string;
  type?: string;
  leadId?: LeadId;
  dateFrom?: string;
  dateTo?: string;
}

export interface InvoiceListQuery extends ListQuery {
  status?: string;
  leadId?: LeadId;
  dateFrom?: string;
  dateTo?: string;
  dueFrom?: string;
  dueTo?: string;
}

export interface SubscriptionListQuery extends ListQuery {
  status?: string;
  billingCycle?: string;
}

// Bulk Operations
export interface BulkOperationRequest<T> {
  items: T[];
  options?: {
    continueOnError?: boolean;
    validateOnly?: boolean;
  };
}

export interface BulkOperationResponse<T> {
  results: BulkOperationResult<T>[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    skipped: number;
  };
}

export interface BulkOperationResult<T> {
  item: T;
  success: boolean;
  data?: T;
  error?: ApiError;
}

// Search and Filter Types
export interface SearchRequest {
  query: string;
  fields?: string[];
  filters?: Record<string, unknown>;
  sort?: Array<{
    field: string;
    order: 'asc' | 'desc';
  }>;
  limit?: number;
  offset?: number;
}

export interface SearchResponse<T> {
  results: SearchResult<T>[];
  total: number;
  took: number; // milliseconds
  suggestions?: string[];
}

export interface SearchResult<T> {
  item: T;
  score: number;
  highlights?: Record<string, string[]>;
}

// Export/Import Types
export interface ExportRequest {
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  filters?: Record<string, unknown>;
  fields?: string[];
  options?: {
    includeHeaders?: boolean;
    dateFormat?: string;
    timezone?: string;
  };
}

export interface ExportResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface ImportRequest {
  format: 'csv' | 'xlsx' | 'json';
  file: {
    name: string;
    size: number;
    type: string;
  };
  options?: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    validateOnly?: boolean;
    mapping?: Record<string, string>;
  };
}

export interface ImportResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: {
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
  };
  createdAt: string;
  completedAt?: string;
  error?: string;
  results?: ImportResult[];
}

export interface ImportResult {
  row: number;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  warnings?: string[];
}

// Webhook Types
export interface WebhookRequest {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  signature: string;
  tenantId: TenantId;
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number; // milliseconds
  message?: string;
  details?: Record<string, unknown>;
}

// Metrics Types
export interface MetricsRequest {
  metrics: string[];
  startDate: string;
  endDate: string;
  granularity?: 'minute' | 'hour' | 'day' | 'week' | 'month';
  filters?: Record<string, unknown>;
  groupBy?: string[];
}

export interface MetricsResponse {
  data: MetricsDataPoint[];
  summary: Record<string, number>;
  period: {
    start: string;
    end: string;
    granularity: string;
  };
}

export interface MetricsDataPoint {
  timestamp: string;
  values: Record<string, number>;
  dimensions?: Record<string, string>;
}

// File Upload Types
export interface FileUploadRequest {
  file: {
    name: string;
    type: string;
    size: number;
  };
  purpose?: 'avatar' | 'document' | 'attachment' | 'import' | 'export';
  metadata?: Record<string, unknown>;
}

export interface FileUploadResponse {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  metadata?: Record<string, unknown>;
  uploadedAt: string;
}

```

---

### branded.ts

**Path:** `src\branded.ts`

**Language:** TypeScript

```typescript
/**
 * Branded type definitions for Firm platform
 * Uses unique symbol branding to create type-safe identifiers
 */


// Brand symbols for type safety
declare const TenantIdBrand: unique symbol;
declare const UserIdBrand: unique symbol;
declare const LeadIdBrand: unique symbol;
declare const CampaignIdBrand: unique symbol;
declare const BookingIdBrand: unique symbol;
declare const InvoiceIdBrand: unique symbol;
declare const SubscriptionIdBrand: unique symbol;
declare const EmailTemplateIdBrand: unique symbol;
declare const FormIdBrand: unique symbol;
declare const WebhookIdBrand: unique symbol;
declare const ApiKeyIdBrand: unique symbol;
declare const SessionIdBrand: unique symbol;
declare const AuditLogIdBrand: unique symbol;
declare const SyncJobIdBrand: unique symbol;
declare const ReportIdBrand: unique symbol;

// Branded type definitions
export type TenantId = string & { readonly [TenantIdBrand]: true };
export type UserId = string & { readonly [UserIdBrand]: true };
export type LeadId = string & { readonly [LeadIdBrand]: true };
export type CampaignId = string & { readonly [CampaignIdBrand]: true };
export type BookingId = string & { readonly [BookingIdBrand]: true };
export type InvoiceId = string & { readonly [InvoiceIdBrand]: true };
export type SubscriptionId = string & { readonly [SubscriptionIdBrand]: true };
export type EmailTemplateId = string & { readonly [EmailTemplateIdBrand]: true };
export type FormId = string & { readonly [FormIdBrand]: true };
export type WebhookId = string & { readonly [WebhookIdBrand]: true };
export type ApiKeyId = string & { readonly [ApiKeyIdBrand]: true };
export type SessionId = string & { readonly [SessionIdBrand]: true };
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

export function asTenantId(value: string): TenantId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid TenantId: ${value}. Must be a valid UUID v4.`);
  }
  return value as TenantId;
}

export function asUserId(value: string): UserId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid UserId: ${value}. Must be a valid UUID v4.`);
  }
  return value as UserId;
}

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

export function asSessionId(value: string): SessionId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid SessionId: ${value}. Must be a valid UUID v4.`);
  }
  return value as SessionId;
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
export function isTenantId(value: unknown): value is TenantId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isUserId(value: unknown): value is UserId {
  return typeof value === 'string' && isValidUuid(value);
}

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

export function isSessionId(value: unknown): value is SessionId {
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
  | TenantId
  | UserId
  | LeadId
  | CampaignId
  | BookingId
  | InvoiceId
  | SubscriptionId
  | EmailTemplateId
  | FormId
  | WebhookId
  | ApiKeyId
  | SessionId
  | AuditLogId
  | SyncJobId
  | ReportId;

```

---

### entities.ts

**Path:** `src\entities.ts`

**Language:** TypeScript

```typescript
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

```

---

### enums.ts

**Path:** `src\enums.ts`

**Language:** TypeScript

```typescript
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

```

---

### helpers.ts

**Path:** `src\helpers.ts`

**Language:** TypeScript

```typescript
/**
 * Helper types and utilities for Firm platform
 * Provides common utility types and transformation functions
 */

// DeepPartial type - makes all properties optional recursively
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

// RequiredDeep type - makes all properties required recursively
export type RequiredDeep<T> = {
  [P in keyof T]-?: T[P] extends (infer U)[]
    ? RequiredDeep<U>[]
    : T[P] extends object
    ? RequiredDeep<T[P]>
    : T[P];
};

// OptionalDeep type - makes all properties optional recursively (alias for DeepPartial)
export type OptionalDeep<T> = DeepPartial<T>;

// PickDeep type - pick properties recursively
export type PickDeep<T, K extends string> = T extends object
  ? {
      [P in keyof T as P extends K ? P : never]: T[P] extends object
        ? PickDeep<T[P], K>
        : T[P];
    }
  : T;

// OmitDeep type - omit properties recursively
export type OmitDeep<T, K extends string> = T extends object
  ? {
      [P in keyof T as P extends K ? never : P]: T[P] extends object
        ? OmitDeep<T[P], K>
        : T[P];
    }
  : T;

// NonNullableDeep type - removes null and undefined recursively
export type NonNullableDeep<T> = T extends null | undefined
  ? never
  : T extends (infer U)[]
  ? NonNullableDeep<U>[]
  : T extends object
  ? {
      [P in keyof T]: NonNullableDeep<T[P]>;
    }
  : T;

// Branded type helpers
export type Unbranded<T> = T extends string
  ? string
  : T extends number
  ? number
  : T extends boolean
  ? boolean
  : T;

export type BrandedToString<T> = T extends string ? string : never;

// Entity transformation types
export type CreateEntity<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: T['id'];
};

export type UpdateEntity<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

export type EntityWithId<T> = T & { id: string };

// Database helpers
export type DbEntity<T> = T & {
  _id?: string;
  _rev?: string;
};

export type WithoutId<T> = Omit<T, 'id'>;

export type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};

// Array helpers
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

export type ArrayToUnion<T> = T extends Array<infer U> ? U : never;

export type UnionToArray<T> = T extends infer U ? U[] : never;

// String helpers
export type Capitalize<T extends string> = T extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Rest}`
  : T;

export type Uncapitalize<T extends string> = T extends `${infer First}${infer Rest}`
  ? `${Lowercase<First>}${Rest}`
  : T;

export type CamelCase<T extends string> = T extends `${infer P1}_${infer P2}${infer P3}`
  ? `${P1}${Uppercase<P2>}${CamelCase<P3>}`
  : T;

export type SnakeCase<T extends string> = T extends `${infer C1}${infer C2}`
  ? C1 extends Uppercase<C1>
    ? `_${Lowercase<C1>}${SnakeCase<C2>}`
    : `${C1}${SnakeCase<C2>}`
  : T;

// Key transformation helpers
export type KeysToCamelCase<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K];
};

export type KeysToSnakeCase<T> = {
  [K in keyof T as SnakeCase<string & K>]: T[K];
};

export type KeysToPascalCase<T> = {
  [K in keyof T as Capitalize<CamelCase<string & K>>]: T[K];
};

// Validation helpers
export type ValidationResult<T = unknown> = {
  success: boolean;
  data?: T;
  errors?: string[];
};

export type ValidationRule<T> = {
  validate: (value: unknown) => ValidationResult<T>;
  message?: string;
};

export type ValidationSchema<T> = {
  [K in keyof T]: ValidationRule<T[K]>;
};

// Pagination helpers
export type PaginationParams = {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
};

// Cursor pagination helpers
export type CursorPaginationParams = {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
};

export type CursorPaginatedResult<T> = {
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
};

// Search helpers
export type SearchParams = {
  query?: string;
  fields?: string[];
  filters?: Record<string, unknown>;
  sort?: Array<{
    field: string;
    order: 'asc' | 'desc';
  }>;
  limit?: number;
  offset?: number;
};

export type SearchResult<T> = {
  item: T;
  score: number;
  highlights?: Record<string, string[]>;
};

// Event helpers
export type EventPayload<T = unknown> = {
  type: string;
  data: T;
  timestamp: Date;
  metadata?: Record<string, unknown>;
};

export type EventHandler<T = unknown> = (event: EventPayload<T>) => void | Promise<void>;

export type EventSubscriber<T = unknown> = {
  eventType: string;
  handler: EventHandler<T>;
  options?: {
    once?: boolean;
    priority?: number;
  };
};

// Cache helpers
export type CacheKey = string | number | symbol;

export type CacheOptions = {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  priority?: number; // Cache priority
};

export type CacheEntry<T> = {
  value: T;
  expiresAt?: Date;
  tags?: string[];
  priority?: number;
  accessCount?: number;
  lastAccessed?: Date;
};

// Configuration helpers
export type ConfigValue<T = unknown> = {
  value: T;
  source: 'default' | 'env' | 'file' | 'database';
  override?: boolean;
};

export type ConfigSchema<T = Record<string, unknown>> = {
  [K in keyof T]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    default?: T[K];
    validator?: (value: unknown) => boolean;
    description?: string;
  };
};

// Logging helpers
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
  requestId?: string;
  userId?: string;
  tenantId?: string;
};

export type Logger = {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, error?: Error, context?: Record<string, unknown>) => void;
  fatal: (message: string, error?: Error, context?: Record<string, unknown>) => void;
};

// Error handling helpers
export type ErrorContext = Record<string, unknown>;

export type ErrorDetails = {
  code: string;
  message: string;
  details?: ErrorContext;
  stack?: string;
  cause?: Error;
};

export type AppError = Error & {
  code: string;
  details?: ErrorContext;
  statusCode?: number;
  isOperational?: boolean;
};

// HTTP helpers
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type HttpHeaders = Record<string, string>;

export type HttpRequest<T = unknown> = {
  method: HttpMethod;
  url: string;
  headers?: HttpHeaders;
  body?: T;
  query?: Record<string, string | string[]>;
  timeout?: number;
};

export type HttpResponse<T = unknown> = {
  status: number;
  statusText: string;
  headers: HttpHeaders;
  body?: T;
  ok: boolean;
  redirected: boolean;
  url: string;
};

// Utility functions for type guards and transformations
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNullOrUndefined(value: unknown): value is null | undefined {
  return isNull(value) || isUndefined(value);
}

// Type assertion helpers
export function assertString(value: unknown): asserts value is string {
  if (!isString(value)) {
    throw new TypeError(`Expected string, got ${typeof value}`);
  }
}

export function assertNumber(value: unknown): asserts value is number {
  if (!isNumber(value)) {
    throw new TypeError(`Expected number, got ${typeof value}`);
  }
}

export function assertBoolean(value: unknown): asserts value is boolean {
  if (!isBoolean(value)) {
    throw new TypeError(`Expected boolean, got ${typeof value}`);
  }
}

export function assertObject(value: unknown): asserts value is Record<string, unknown> {
  if (!isObject(value)) {
    throw new TypeError(`Expected object, got ${typeof value}`);
  }
}

export function assertArray(value: unknown): asserts value is unknown[] {
  if (!isArray(value)) {
    throw new TypeError(`Expected array, got ${typeof value}`);
  }
}

export function assertDate(value: unknown): asserts value is Date {
  if (!isDate(value)) {
    throw new TypeError(`Expected Date, got ${typeof value}`);
  }
}

// Object transformation helpers
export function deepMerge<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

export function cloneDeep<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => cloneDeep(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = cloneDeep(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
/**
 * Firm Types - Core types and interfaces for Firm platform
 * 
 * This package provides:
 * - Branded ID types with runtime validation
 * - String literal unions for enums
 * - Entity interfaces following DDD patterns
 * - Adapter interfaces for external systems
 * - API envelope types
 * - Helper utilities and transformation types
 */

// Export all branded types
export * from './branded';

// Export all enums
export * from './enums';

// Export entity interfaces
export * from './entities';

// Export adapter interfaces with namespace to avoid conflicts
export * as Adapters from './adapters';

// Export API types with namespace to avoid conflicts
export * as Api from './api';

// Export helper utilities
export * from './helpers';

```

---

### compile-time.test.ts

**Path:** `tests\compile-time.test.ts`

**Language:** TypeScript

```typescript
/**
 * Compile-time tests for firm-types
 * These tests verify type safety at compile time using TypeScript's type system
 * 
 * These tests use the Expect/Equal pattern for type assertions
 */

import type { 
  TenantId, 
  UserId, 
  LeadId, 
  asTenantId, 
  asUserId, 
  asLeadId,
  isTenantId,
  isUserId,
  isLeadId 
} from '../src/branded';

import type {
  TenantStatus,
  UserStatus,
  LeadStatus,
  ServiceTier,
  PermissionCategory
} from '../src/enums';

import type {
  Tenant,
  User,
  Lead,
  BaseEntity,
  TenantScopedEntity,
  AuditableEntity
} from '../src/entities';

import type {
  CRMAdapter,
  EmailAdapter,
  BaseAdapter
} from '../src/adapters';

import type {
  ApiResponse,
  ApiError,
  PaginationMeta,
  TenantResponse,
  LeadResponse
} from '../src/api';

import type {
  DeepPartial,
  CreateEntity,
  UpdateEntity,
  ValidationResult,
  PaginatedResult
} from '../src/helpers';

// Type assertion helpers for compile-time testing
type Expect<T extends true> = T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// Test 1: Branded types should not be assignable to regular strings
type Test1 = Expect<Equal<TenantId, string> extends false ? true : false>;

// Test 2: Branded types should maintain their brand
type Test2 = Expect<Equal<TenantId, UserId> extends false ? true : false>;

// Test 3: Branded type gatekeepers should return correct type
type Test3 = Expect<Equal<ReturnType<typeof asTenantId>, TenantId>>;

// Test 4: Type guards should work correctly
type Test4 = Expect<Equal<ReturnType<typeof isTenantId>, boolean>>;

// Test 5: Enum types should be string literals
type Test5 = Expect<Equal<TenantStatus, 'active' | 'inactive' | 'suspended' | 'trial' | 'cancelled'>>;

// Test 6: Entity interfaces should extend base interfaces
type Test6 = Expect<Equal<Tenant extends BaseEntity ? true : false, true>>;
type Test7 = Expect<Equal<User extends AuditableEntity ? true : false, true>>;
type Test8 = Expect<Equal<Lead extends TenantScopedEntity ? true : false, true>>;

// Test 7: DeepPartial should make all properties optional
type TestLead = {
  id: string;
  firstName: string;
  email?: string;
  address: {
    street: string;
    city: string;
  };
};
type TestDeepPartial = DeepPartial<TestLead>;
type Test9 = Expect<Equal<keyof TestDeepPartial, keyof Partial<TestLead>>>;

// Test 8: CreateEntity should omit id, createdAt, updatedAt
type Test10 = Expect<Equal<keyof CreateEntity<Tenant>, keyof Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>>>;

// Test 9: UpdateEntity should make all properties optional except id, timestamps
type Test11 = Expect<Equal<keyof UpdateEntity<User>, keyof Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>>>;

// Test 10: API response types should be correctly structured
type Test12 = Expect<Equal<TenantResponse, ApiResponse<Tenant>>>;
type Test13 = Expect<Equal<LeadResponse, ApiResponse<Lead>>>;

// Test 11: Adapter interfaces should extend BaseAdapter
type Test14 = Expect<Equal<CRMAdapter extends BaseAdapter ? true : false, true>>;
type Test15 = Expect<Equal<EmailAdapter extends BaseAdapter ? true : false, true>>;

// Test 12: Validation result type should be correct
type Test16 = Expect<Equal<ValidationResult<string>, { success: boolean; data?: string; errors?: string[] }>>;

// Test 13: PaginatedResult should have correct structure
type Test17 = Expect<Equal<PaginatedResult<string>, { data: string[]; pagination: PaginationMeta }>>;

// Test 14: API Error should follow RFC 7807 structure
type Test18 = Expect<Equal<ApiError, {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
    value?: unknown;
  }>;
  code?: string;
  context?: Record<string, unknown>;
}>>;

// Test 15: Service tier should be correct union
type Test19 = Expect<Equal<ServiceTier, 'starter' | 'professional' | 'business' | 'enterprise' | 'custom'>>;

// Test 16: Permission category should be correct union
type Test20 = Expect<Equal<PermissionCategory, 
  | 'tenant'
  | 'user'
  | 'lead'
  | 'campaign'
  | 'booking'
  | 'invoice'
  | 'analytics'
  | 'settings'
  | 'admin'
>>;

// Test 17: Entity IDs should be branded types
type Test21 = Expect<Equal<Tenant['id'], TenantId>>;
type Test22 = Expect<Equal<User['id'], UserId>>;
type Test23 = Expect<Equal<Lead['id'], LeadId>>;

// Test 18: Entity timestamps should be Date objects
type Test24 = Expect<Equal<Tenant['createdAt'], Date>>;
type Test25 = Expect<Equal<User['updatedAt'], Date>>;

// Test 19: Tenant-scoped entities should have tenantId
type Test26 = Expect<Equal<Lead['tenantId'], TenantId>>;
type Test27 = Expect<Equal<User['tenantId'], TenantId>>;

// Test 20: Auditable entities should have createdBy/updatedBy
type Test28 = Expect<Equal<User['createdBy'], UserId>>;
type Test29 = Expect<Equal<User['updatedBy'], UserId>>;

// Test 21: Test that branded types prevent accidental assignment
const testAssignment = () => {
  const tenantId: TenantId = 'test-id' as TenantId;
  const userId: UserId = 'test-id' as UserId;
  
  // This should cause a compile error if uncommented:
  // const wrongAssignment: TenantId = userId; // Should fail
  
  // This should work:
  const correctAssignment: TenantId = tenantId;
  
  return { tenantId, userId, correctAssignment };
};

// Test 22: Test enum type safety
const testEnums = () => {
  const tenantStatus: TenantStatus = 'active'; // Valid
  // const invalidStatus: TenantStatus = 'invalid'; // Should fail
  
  const userStatus: UserStatus = 'active'; // Valid
  // const invalidUserStatus: UserStatus = 'invalid'; // Should fail
  
  return { tenantStatus, userStatus };
};

// Test 23: Test entity structure
const testEntities = () => {
  const tenant: Tenant = {
    id: 'tenant-id' as TenantId,
    name: 'Test Tenant',
    slug: 'test-tenant',
    status: 'active',
    serviceTier: 'starter',
    settings: {
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
      theme: 'light',
      features: {},
      limits: {
        users: 10,
        leads: 100,
        campaigns: 5,
        bookings: 50,
        storage: 1000,
        apiCalls: 10000
      },
      consent: {
        requiredCategories: ['necessary'],
        defaultConsent: {
          necessary: true,
          analytics: false,
          marketing: false,
          preferences: false,
          functional: false
        }
      },
      integrations: {}
    },
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  return { tenant };
};

// Test 24: Test API response structure
const testApiResponses = () => {
  const successResponse: TenantResponse = {
    success: true,
    data: {
      id: 'tenant-id' as TenantId,
      name: 'Test Tenant',
      slug: 'test-tenant',
      status: 'active',
      serviceTier: 'starter',
      settings: {
        timezone: 'UTC',
        currency: 'USD',
        language: 'en',
        theme: 'light',
        features: {},
        limits: {
          users: 10,
          leads: 100,
          campaigns: 5,
          bookings: 50,
          storage: 1000,
          apiCalls: 10000
        },
        consent: {
          requiredCategories: ['necessary'],
          defaultConsent: {
            necessary: true,
            analytics: false,
            marketing: false,
            preferences: false,
            functional: false
          }
        },
        integrations: {}
      },
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
  };
  
  const errorResponse: ApiResponse = {
    success: false,
    error: {
      type: 'https://example.com/errors/validation',
      title: 'Validation Error',
      status: 400,
      detail: 'Invalid input data',
      code: 'VALIDATION_ERROR'
    }
  };
  
  return { successResponse, errorResponse };
};

// Export test functions to ensure they're compiled
export {
  testAssignment,
  testEnums,
  testEntities,
  testApiResponses
};

// Export type assertions to ensure they're checked
export type CompileTimeTests = [
  Test1,
  Test2,
  Test3,
  Test4,
  Test5,
  Test6,
  Test7,
  Test8,
  Test9,
  Test10,
  Test11,
  Test12,
  Test13,
  Test14,
  Test15,
  Test16,
  Test17,
  Test18,
  Test19,
  Test20,
  Test21,
  Test22,
  Test23,
  Test24,
  Test25,
  Test26,
  Test27,
  Test28,
  Test29
];

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
  external: ['@firm/utils'],
});

```

---

