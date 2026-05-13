/**
 * API Key types for Firm Auth
 * 
 * Defines API key interfaces and related types.
 * API keys are stored as hashes and only shown once during creation.
 */

import type { UserId, TenantId, ApiKeyPermission } from '@firm/types';

export interface ApiKeyData {
  id: string;
  name: string;
  description?: string;
  keyHash: string; // Hashed API key (never stored in plain text)
  keyPrefix: string; // First few characters for identification
  permissions: ApiKeyPermission[];
  userId: UserId;
  tenantId: TenantId;
  expiresAt?: Date;
  lastUsedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  createdBy: UserId;
  usageCount: number;
  rateLimitPerHour?: number;
  allowedIpAddresses?: string[];
  allowedUserAgents?: string[];
}

export interface ApiKeyCreateOptions {
  name: string;
  description?: string;
  permissions: ApiKeyPermission[];
  expiresAt?: Date;
  rateLimitPerHour?: number;
  allowedIpAddresses?: string[];
  allowedUserAgents?: string[];
}

export interface ApiKeyCreateResult {
  apiKey: string; // The actual API key (only shown once)
  apiKeyData: Omit<ApiKeyData, 'keyHash'>; // API key data without hash
}

export interface ApiKeyVerificationResult {
  valid: boolean;
  apiKeyData?: ApiKeyData;
  error?: 'invalid_key' | 'expired_key' | 'inactive_key' | 'rate_limited' | 'ip_blocked' | 'user_agent_blocked';
  metadata?: {
    permissions: ApiKeyPermission[];
    userId: UserId;
    tenantId: TenantId;
    usageCount: number;
  };
}

export interface ApiKeyUpdateOptions {
  name?: string;
  description?: string;
  permissions?: ApiKeyPermission[];
  expiresAt?: Date;
  isActive?: boolean;
  rateLimitPerHour?: number;
  allowedIpAddresses?: string[];
  allowedUserAgents?: string[];
}

export interface ApiKeyUsageLog {
  id: string;
  apiKeyId: string;
  userId: UserId;
  tenantId: TenantId;
  ipAddress: string;
  userAgent?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
}

export interface ApiKeyMetrics {
  totalApiKeys: number;
  activeApiKeys: number;
  expiredApiKeys: number;
  usageToday: number;
  usageThisWeek: number;
  usageThisMonth: number;
  topUsedApiKeys: Array<{
    id: string;
    name: string;
    usageCount: number;
    lastUsedAt: Date;
  }>;
}
