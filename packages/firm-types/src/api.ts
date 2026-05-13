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
