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
