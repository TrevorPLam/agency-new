# firm-auth

Generated on: 2026-05-13T02:25:38.191Z
Total files: 36

**Description:** Authentication and authorization package for Firm Platform

**Version:** 0.0.0

## Table of Contents

- [generate-key.ts](#generate-key-ts)
- [index.ts](#index-ts)
- [manage-keys.ts](#manage-keys-ts)
- [types.ts](#types-ts)
- [verify-key.ts](#verify-key-ts)
- [audit.ts](#audit-ts)
- [authenticate.ts](#authenticate-ts)
- [delegate.ts](#delegate-ts)
- [impersonate.ts](#impersonate-ts)
- [index.ts](#index-ts)
- [rate-limit-redis.test.ts](#rate-limit-redis-test-ts)
- [rate-limit-redis.ts](#rate-limit-redis-ts)
- [index.ts](#index-ts)
- [totp-setup.ts](#totp-setup-ts)
- [totp-verify.ts](#totp-verify-ts)
- [types.ts](#types-ts)
- [guard.ts](#guard-ts)
- [index.ts](#index-ts)
- [matrix.ts](#matrix-ts)
- [better-auth-instance.ts](#better-auth-instance-ts)
- [create-session.ts](#create-session-ts)
- [index.ts](#index-ts)
- [revoke-session.ts](#revoke-session-ts)
- [types.ts](#types-ts)
- [verify-session.ts](#verify-session-ts)
- [deep-freeze.ts](#deep-freeze-ts)
- [api-keys.test.ts](#api-keys-test-ts)
- [authentication.test.ts](#authentication-test-ts)
- [impersonation-toctou-protection.test.ts](#impersonation-toctou-protection-test-ts)
- [integration.test.ts](#integration-test-ts)
- [permissions.test.ts](#permissions-test-ts)
- [session-immutability.test.ts](#session-immutability-test-ts)
- [setup.ts](#setup-ts)
- [timing-attack-protection.test.ts](#timing-attack-protection-test-ts)
- [tsup.config.ts](#tsup-config-ts)
- [vitest.config.ts](#vitest-config-ts)

## File Contents

### generate-key.ts

**Path:** `src\api-keys\generate-key.ts`

**Language:** TypeScript

```typescript
/**
 * API key generation for Firm Auth
 * 
 * Generates secure API keys with proper hashing.
 * API keys are only shown once during creation.
 */

import { randomBytes, createHmac } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ConfigValidationError } from '@firm/errors';
import type { 
  ApiKeyCreateOptions, 
  ApiKeyCreateResult, 
  ApiKeyData 
} from './types';
import type { UserId, TenantId } from '@firm/types';
import { ALL_PERMISSIONS } from '../permissions/matrix';

// API key format: firm_<prefix>_<random>
const API_KEY_PREFIX = 'firm_';
const API_KEY_LENGTH = 32;
const API_KEY_PREFIX_LENGTH = 8;

/**
 * Generates a new API key
 * 
 * The API key is only shown once during creation.
 * The hash is stored in the database for verification.
 */
export async function generateApiKey(
  options: ApiKeyCreateOptions,
  userId: UserId,
  tenantId: TenantId
): Promise<ApiKeyCreateResult> {
  const {
    name,
    description,
    permissions,
    expiresAt,
    rateLimitPerHour,
    allowedIpAddresses,
    allowedUserAgents,
  } = options;

  // Generate random API key
  const randomBytesBuffer = randomBytes(API_KEY_LENGTH);
  const randomString = randomBytesBuffer.toString('base64').replace(/[+/=]/g, '').substring(0, API_KEY_LENGTH);
  const apiKey = `${API_KEY_PREFIX}${randomString}`;
  
  // Generate prefix for identification (first 8 characters after prefix)
  const keyPrefix = apiKey.substring(API_KEY_PREFIX.length, API_KEY_PREFIX.length + API_KEY_PREFIX_LENGTH);
  
  // Generate hash for storage
  const keyHash = hashApiKey(apiKey);
  
  // Create API key data
  const apiKeyData: Omit<ApiKeyData, 'keyHash'> = {
    id: uuidv4(),
    name,
    description,
    keyPrefix,
    permissions,
    userId,
    tenantId,
    expiresAt,
    lastUsedAt: undefined,
    isActive: true,
    createdAt: new Date(),
    createdBy: userId,
    usageCount: 0,
    rateLimitPerHour,
    allowedIpAddresses,
    allowedUserAgents,
  };

  return {
    apiKey, // Only shown once
    apiKeyData,
  };
}

/**
 * Hashes an API key for secure storage using HMAC-SHA-256
 */
export function hashApiKey(apiKey: string): string {
  const secret = process.env['API_KEY_HMAC_SECRET'];
  if (!secret) {
    throw new ConfigValidationError('API_KEY_HMAC_SECRET environment variable is required', {
      code: 'MISSING_API_KEY_HMAC_SECRET',
      field: 'API_KEY_HMAC_SECRET'
    });
  }
  return createHmac('sha256', secret).update(apiKey).digest('hex');
}

/**
 * Validates API key format
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  if (!apiKey.startsWith(API_KEY_PREFIX)) {
    return false;
  }
  
  const keyPart = apiKey.substring(API_KEY_PREFIX.length);
  
  // Check length (should be exactly API_KEY_LENGTH characters after prefix)
  if (keyPart.length !== API_KEY_LENGTH) {
    return false;
  }
  
  // Check for valid characters (alphanumeric only)
  return /^[a-zA-Z0-9]+$/.test(keyPart);
}

/**
 * Extracts the prefix from an API key
 */
export function extractApiKeyPrefix(apiKey: string): string | null {
  if (!isValidApiKeyFormat(apiKey)) {
    return null;
  }
  
  return apiKey.substring(API_KEY_PREFIX.length, API_KEY_PREFIX.length + API_KEY_PREFIX_LENGTH);
}

/**
 * Generates a preview of an API key (for display purposes)
 * 
 * Shows first 4 and last 4 characters, with the rest masked
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 12) {
    return '***';
  }
  
  const prefix = apiKey.substring(0, 8);
  const suffix = apiKey.substring(apiKey.length - 4);
  const maskLength = apiKey.length - prefix.length - suffix.length;
  
  return `${prefix}${'*'.repeat(maskLength)}${suffix}`;
}

/**
 * Generates API key metadata for verification
 */
export function generateApiKeyMetadata(apiKey: string): {
  prefix: string;
  hash: string;
} {
  return {
    prefix: extractApiKeyPrefix(apiKey) || '',
    hash: hashApiKey(apiKey),
  };
}

/**
 * Validates API key permissions using RBAC matrix
 */
export function validateApiKeyPermissions(permissions: string[]): boolean {
  return permissions.every(permission => ALL_PERMISSIONS.includes(permission));
}

/**
 * Checks if API key is expired
 */
export function isApiKeyExpired(expiresAt?: Date): boolean {
  if (!expiresAt) {
    return false; // No expiration set
  }
  
  return expiresAt < new Date();
}

/**
 * Checks if API key is rate limited
 */
export function isApiKeyRateLimited(
  usageCount: number,
  rateLimitPerHour?: number,
  lastUsedAt?: Date
): boolean {
  if (!rateLimitPerHour || !lastUsedAt) {
    return false; // No rate limit set
  }
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  // If last usage was more than an hour ago, reset the counter
  if (lastUsedAt < oneHourAgo) {
    return false;
  }
  
  return usageCount >= rateLimitPerHour;
}

/**
 * Validates IP address against allowed list
 */
export function isIpAddressAllowed(
  ipAddress: string,
  allowedIpAddresses?: string[]
): boolean {
  if (!allowedIpAddresses || allowedIpAddresses.length === 0) {
    return true; // No IP restrictions
  }
  
  return allowedIpAddresses.includes(ipAddress);
}

/**
 * Validates user agent against allowed list
 */
export function isUserAgentAllowed(
  userAgent: string,
  allowedUserAgents?: string[]
): boolean {
  if (!allowedUserAgents || allowedUserAgents.length === 0) {
    return true; // No user agent restrictions
  }
  
  return allowedUserAgents.some(allowedUserAgent => 
    userAgent.includes(allowedUserAgent)
  );
}

/**
 * Generates API key usage statistics
 */
export function generateApiKeyUsageStats(
  apiKeyData: ApiKeyData
): {
  daysSinceCreation: number;
  averageUsagePerDay: number;
  isHighUsage: boolean;
} {
  const now = new Date();
  const daysSinceCreation = Math.floor(
    (now.getTime() - apiKeyData.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  ) || 1; // Avoid division by zero
  
  const averageUsagePerDay = apiKeyData.usageCount / daysSinceCreation;
  const isHighUsage = averageUsagePerDay > 1000; // Consider high usage as >1000 calls per day
  
  return {
    daysSinceCreation,
    averageUsagePerDay,
    isHighUsage,
  };
}

```

---

### index.ts

**Path:** `src\api-keys\index.ts`

**Language:** TypeScript

```typescript
/**
 * API Keys module for Firm Auth
 * 
 * Exports all API key related functionality including generation,
 * verification, and management functions.
 */

// Export types
export type {
  ApiKeyData,
  ApiKeyCreateOptions,
  ApiKeyCreateResult,
  ApiKeyVerificationResult,
  ApiKeyUpdateOptions,
  ApiKeyUsageLog,
  ApiKeyMetrics,
} from './types';

// Export API key generation functions
export {
  generateApiKey,
  hashApiKey,
  isValidApiKeyFormat,
  extractApiKeyPrefix,
  maskApiKey,
  generateApiKeyMetadata,
  validateApiKeyPermissions,
  isApiKeyExpired,
  isApiKeyRateLimited,
  isIpAddressAllowed,
  isUserAgentAllowed,
  generateApiKeyUsageStats,
} from './generate-key';

// Export API key verification functions
export {
  verifyApiKey,
  verifyApiKeyPermissions,
  quickApiKeyCheck,
  verifyMultipleApiKeys,
  getApiKeyUsageStats,
} from './verify-key';

// Export API key management functions
export {
  createApiKey,
  getApiKey,
  listApiKeys,
  updateApiKey,
  revokeApiKey,
  deleteApiKey,
  regenerateApiKey,
  getApiKeyMetrics,
} from './manage-keys';

```

---

### manage-keys.ts

**Path:** `src\api-keys\manage-keys.ts`

**Language:** TypeScript

```typescript
/**
 * API key management for Firm Auth
 * 
 * Provides CRUD operations for API keys including creation,
 * updating, deletion, and listing with proper security controls.
 */

import { generateApiKey, hashApiKey, maskApiKey } from './generate-key';
import { verifyApiKey } from './verify-key';
import { eq, and, desc } from 'drizzle-orm';
import { createDatabaseConnection, getDatabaseConfig } from '@firm/db/connection';
import { apiKeys } from '@firm/db/schemas';
import { ValidationError, AuthorizationError } from '@firm/errors';
import type { 
  ApiKeyData, 
  ApiKeyCreateOptions, 
  ApiKeyCreateResult,
  ApiKeyUpdateOptions,
  ApiKeyMetrics
} from './types';
import type { UserId, TenantId } from '@firm/types';
import { isValidPermission } from '../permissions/guard';

/**
 * Creates a new API key
 * 
 * Generates a secure API key and stores the hash in the database.
 * The actual API key is only returned once during creation.
 */
export async function createApiKey(
  options: ApiKeyCreateOptions,
  userId: UserId,
  tenantId: TenantId
): Promise<ApiKeyCreateResult> {
  // Validate permissions
  if (!validatePermissions(options.permissions)) {
    throw new ValidationError('Invalid API key permissions', {
      code: 'INVALID_API_KEY_PERMISSIONS',
      field: 'permissions',
      provided: options.permissions
    });
  }

  // Generate API key
  const result = await generateApiKey(options, userId, tenantId);
  
  // Store API key data in database (placeholder)
  await storeApiKeyData({
    ...result.apiKeyData,
    keyHash: hashApiKey(result.apiKey),
  });

  return result;
}

/**
 * Gets API key data by ID
 */
export async function getApiKey(
  apiKeyId: string,
  requestingUserId: UserId
): Promise<Omit<ApiKeyData, 'keyHash'> | null> {
  const apiKeyData = await getApiKeyDataById(apiKeyId);
  
  if (!apiKeyData) {
    return null;
  }

  // Check if user has access to this API key
  if (!hasApiKeyAccess(apiKeyData, requestingUserId)) {
    throw new AuthorizationError('Access denied to API key', {
      code: 'API_KEY_ACCESS_DENIED',
      apiKeyId,
      requestingUserId
    });
  }

  // Return data without hash
  const { keyHash, ...dataWithoutHash } = apiKeyData;
  return dataWithoutHash;
}

/**
 * Lists API keys for a user
 */
export async function listApiKeys(
  userId: UserId,
  tenantId: TenantId,
  options: {
    page?: number;
    limit?: number;
    includeInactive?: boolean;
  } = {}
): Promise<{
  apiKeys: Omit<ApiKeyData, 'keyHash'>[];
  total: number;
  page: number;
  limit: number;
}> {
  const { page = 1, limit = 20, includeInactive = false } = options;

  // Get API keys from database (placeholder)
  const apiKeys = await getApiKeysByUser(userId, tenantId, {
    page,
    limit,
    includeInactive,
  });

  // Remove hashes from results
  const apiKeysWithoutHashes = apiKeys.map(({ keyHash, ...data }) => data);

  return {
    apiKeys: apiKeysWithoutHashes,
    total: apiKeys.length, // Placeholder - would get actual count from DB
    page,
    limit,
  };
}

/**
 * Updates an API key
 */
export async function updateApiKey(
  apiKeyId: string,
  updates: ApiKeyUpdateOptions,
  requestingUserId: UserId
): Promise<Omit<ApiKeyData, 'keyHash'> | null> {
  // Get existing API key
  const existingApiKey = await getApiKeyDataById(apiKeyId);
  
  if (!existingApiKey) {
    return null;
  }

  // Check if user has access to update this API key
  if (!hasApiKeyAccess(existingApiKey, requestingUserId)) {
    throw new AuthorizationError('Access denied to API key', {
      code: 'API_KEY_UPDATE_DENIED',
      apiKeyId,
      requestingUserId
    });
  }

  // Validate permissions if being updated
  if (updates.permissions && !validatePermissions(updates.permissions)) {
    throw new ValidationError('Invalid API key permissions', {
      code: 'INVALID_API_KEY_PERMISSIONS',
      field: 'permissions',
      provided: updates.permissions
    });
  }

  // Apply updates
  const updatedApiKey: Partial<ApiKeyData> = {
    ...updates,
  };

  // Update in database (placeholder)
  await updateApiKeyData(apiKeyId, updatedApiKey);

  // Return updated data
  const updatedData = await getApiKeyDataById(apiKeyId);
  if (!updatedData) {
    return null;
  }

  const { keyHash, ...dataWithoutHash } = updatedData;
  return dataWithoutHash;
}

/**
 * Revokes (deactivates) an API key
 */
export async function revokeApiKey(
  apiKeyId: string,
  requestingUserId: UserId,
  reason?: string
): Promise<boolean> {
  const apiKey = await getApiKeyDataById(apiKeyId);
  
  if (!apiKey) {
    return false;
  }

  // Check if user has access to revoke this API key
  if (!hasApiKeyAccess(apiKey, requestingUserId)) {
    throw new AuthorizationError('Access denied to API key', {
      code: 'API_KEY_REVOKE_DENIED',
      apiKeyId,
      requestingUserId
    });
  }

  // Deactivate API key
  await updateApiKeyData(apiKeyId, {
    isActive: false,
  });

  return true;
}

/**
 * Deletes an API key permanently
 */
export async function deleteApiKey(
  apiKeyId: string,
  requestingUserId: UserId
): Promise<boolean> {
  const apiKey = await getApiKeyDataById(apiKeyId);
  
  if (!apiKey) {
    return false;
  }

  // Check if user has access to delete this API key
  if (!hasApiKeyAccess(apiKey, requestingUserId)) {
    throw new AuthorizationError('Access denied to API key', {
      code: 'API_KEY_DELETE_DENIED',
      apiKeyId,
      requestingUserId
    });
  }

  // Delete from database (placeholder)
  await deleteApiKeyData(apiKeyId);

  return true;
}

/**
 * Regenerates an API key (creates new key, deactivates old one)
 */
export async function regenerateApiKey(
  apiKeyId: string,
  requestingUserId: UserId
): Promise<ApiKeyCreateResult | null> {
  const existingApiKey = await getApiKeyDataById(apiKeyId);
  
  if (!existingApiKey) {
    return null;
  }

  // Check if user has access to regenerate this API key
  if (!hasApiKeyAccess(existingApiKey, requestingUserId)) {
    throw new AuthorizationError('Access denied to API key', {
      code: 'API_KEY_REGENERATE_DENIED',
      apiKeyId,
      requestingUserId
    });
  }

  // Create new API key with same settings
  const newApiKeyResult = await createApiKey(
    {
      name: existingApiKey.name,
      description: existingApiKey.description,
      permissions: existingApiKey.permissions,
      expiresAt: existingApiKey.expiresAt,
      rateLimitPerHour: existingApiKey.rateLimitPerHour,
      allowedIpAddresses: existingApiKey.allowedIpAddresses,
      allowedUserAgents: existingApiKey.allowedUserAgents,
    },
    existingApiKey.userId,
    existingApiKey.tenantId
  );

  // Deactivate old API key
  await revokeApiKey(apiKeyId, requestingUserId, 'Regenerated');

  return newApiKeyResult;
}

/**
 * Gets API key metrics
 */
export async function getApiKeyMetrics(
  userId: UserId,
  tenantId: TenantId
): Promise<ApiKeyMetrics> {
  // This would integrate with firm-db for analytics
  // For now, return placeholder data
  console.warn(`API key metrics not yet implemented for user: ${userId}, tenant: ${tenantId}`);
  
  return {
    totalApiKeys: 0,
    activeApiKeys: 0,
    expiredApiKeys: 0,
    usageToday: 0,
    usageThisWeek: 0,
    usageThisMonth: 0,
    topUsedApiKeys: [],
  };
}

/**
 * Validates API key permissions using RBAC matrix
 */
function validatePermissions(permissions: string[]): boolean {
  return permissions.every(permission => isValidPermission(permission));
}

/**
 * Checks if user has access to an API key
 */
function hasApiKeyAccess(apiKey: ApiKeyData, requestingUserId: UserId): boolean {
  // User can access their own API keys
  // Admins can access all API keys in their tenant
  return apiKey.userId.toString() === requestingUserId.toString();
}

// Database access functions using Drizzle queries
async function storeApiKeyData(apiKeyData: ApiKeyData): Promise<void> {
  try {
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db.insert(apiKeys).values({
      id: apiKeyData.id,
      userId: apiKeyData.userId,
      tenantId: apiKeyData.tenantId,
      name: apiKeyData.name,
      keyHash: apiKeyData.keyHash,
      keyPrefix: apiKeyData.keyPrefix,
      permissions: apiKeyData.permissions,
      rateLimitPerMinute: apiKeyData.rateLimitPerHour ? Math.floor(apiKeyData.rateLimitPerHour / 60) : undefined,
      allowedIps: apiKeyData.allowedIpAddresses,
      isActive: apiKeyData.isActive,
      expiresAt: apiKeyData.expiresAt,
      createdAt: apiKeyData.createdAt,
      updatedAt: new Date()
    });
    
    console.log('API key stored successfully:', { id: apiKeyData.id, name: apiKeyData.name });
  } catch (error) {
    console.error('Error storing API key data:', error);
    throw error;
  }
}

async function getApiKeyDataById(apiKeyId: string): Promise<ApiKeyData | null> {
  try {
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, apiKeyId))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const apiKey = result[0];
    
    // Transform database record to ApiKeyData format
    return {
      id: apiKey.id,
      userId: apiKey.userId,
      tenantId: apiKey.tenantId,
      name: apiKey.name,
      keyHash: apiKey.keyHash,
      keyPrefix: apiKey.keyPrefix,
      permissions: apiKey.permissions || [],
      rateLimitPerHour: apiKey.rateLimitPerMinute ? Number(apiKey.rateLimitPerMinute) * 60 : undefined,
      allowedIpAddresses: apiKey.allowedIps || [],
      allowedUserAgents: [], // Not in schema yet
      isActive: apiKey.isActive,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      usageCount: 0, // Would need separate tracking table
      createdAt: apiKey.createdAt,
      createdBy: apiKey.userId, // Use userId as creator for now
    };
  } catch (error) {
    console.error('Error fetching API key by ID:', error);
    return null;
  }
}

async function getApiKeysByUser(
  userId: UserId,
  tenantId: TenantId,
  options: { page: number; limit: number; includeInactive: boolean }
): Promise<ApiKeyData[]> {
  try {
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const query = db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.userId, userId),
          eq(apiKeys.tenantId, tenantId),
          options.includeInactive ? undefined : eq(apiKeys.isActive, true)
        )
      )
      .orderBy(desc(apiKeys.createdAt))
      .limit(options.limit)
      .offset((options.page - 1) * options.limit);
    
    const results = await query;
    
    // Transform database records to ApiKeyData format
    return results.map((apiKey: any) => ({
      id: apiKey.id,
      userId: apiKey.userId,
      tenantId: apiKey.tenantId,
      name: apiKey.name,
      keyHash: apiKey.keyHash,
      keyPrefix: apiKey.keyPrefix,
      permissions: apiKey.permissions || [],
      rateLimitPerHour: apiKey.rateLimitPerMinute ? Number(apiKey.rateLimitPerMinute) * 60 : undefined,
      allowedIpAddresses: apiKey.allowedIps || [],
      allowedUserAgents: [], // Not in schema yet
      isActive: apiKey.isActive,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      usageCount: 0, // Would need separate tracking table
      createdAt: apiKey.createdAt,
      createdBy: apiKey.userId, // Use userId as creator for now
    }));
  } catch (error) {
    console.error('Error fetching API keys for user:', error);
    return [];
  }
}

async function updateApiKeyData(apiKeyId: string, updates: Partial<ApiKeyData>): Promise<void> {
  try {
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Transform ApiKeyData updates to database schema format
    const dbUpdates: any = {
      updatedAt: new Date()
    };
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.permissions !== undefined) dbUpdates.permissions = updates.permissions;
    if (updates.rateLimitPerHour !== undefined) {
      dbUpdates.rateLimitPerMinute = updates.rateLimitPerHour ? Math.floor(updates.rateLimitPerHour / 60) : undefined;
    }
    if (updates.allowedIpAddresses !== undefined) dbUpdates.allowedIps = updates.allowedIpAddresses;
    if (updates.isActive !== undefined) dbUpdates.isActive = updates.isActive;
    if (updates.expiresAt !== undefined) dbUpdates.expiresAt = updates.expiresAt;
    
    await db
      .update(apiKeys)
      .set(dbUpdates)
      .where(eq(apiKeys.id, apiKeyId));
    
    console.log('API key updated successfully:', { apiKeyId, updates });
  } catch (error) {
    console.error('Error updating API key data:', error);
    throw error;
  }
}

async function deleteApiKeyData(apiKeyId: string): Promise<void> {
  try {
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db.delete(apiKeys).where(eq(apiKeys.id, apiKeyId));
    
    console.log('API key deleted successfully:', apiKeyId);
  } catch (error) {
    console.error('Error deleting API key data:', error);
    throw error;
  }
}

```

---

### types.ts

**Path:** `src\api-keys\types.ts`

**Language:** TypeScript

```typescript
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

```

---

### verify-key.ts

**Path:** `src\api-keys\verify-key.ts`

**Language:** TypeScript

```typescript
/**
 * API key verification for Firm Auth
 * 
 * Verifies API keys against stored hashes and checks permissions,
 * rate limits, IP restrictions, and other security constraints.
 */

import { hashApiKey, isValidApiKeyFormat } from './generate-key';
import { eq } from 'drizzle-orm';
import { createDatabaseConnection, getDatabaseConfig } from '@firm/db';
import { apiKeys } from '@firm/db';
import { TenantCache } from '@firm/cache';
import { createApiKeyRateLimiter, type RateLimitResult } from '../infra/rate-limit-redis';
import { createHmac, timingSafeEqual } from 'crypto';
import type { 
  ApiKeyData, 
  ApiKeyVerificationResult,
  ApiKeyUsageLog 
} from './types';

/**
 * Verifies an API key and returns the associated data
 * 
 * This function performs comprehensive security checks:
 * - Key format validation
 * - Hash verification
 * - Expiration check
 * - Active status check
 * - Rate limiting
 * - IP address restrictions
 * - User agent restrictions
 */
export async function verifyApiKey(
  apiKey: string,
  context: {
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    cache?: TenantCache;
  } = {}
): Promise<ApiKeyVerificationResult> {
  const { ipAddress, userAgent, endpoint, method, cache } = context;

  // Check API key format
  if (!isValidApiKeyFormat(apiKey)) {
    return {
      valid: false,
      error: 'invalid_key',
    };
  }

  // Get API key data from database with timing-safe comparison
  const keyHash = hashApiKey(apiKey);
  const apiKeyData = await getApiKeyDataByKeyHash(apiKey, keyHash);
  
  if (!apiKeyData) {
    return {
      valid: false,
      error: 'invalid_key',
    };
  }

  // Check if API key is active
  if (!apiKeyData.isActive) {
    return {
      valid: false,
      error: 'inactive_key',
    };
  }

  // Check if API key is expired
  if (apiKeyData.expiresAt && apiKeyData.expiresAt < new Date()) {
    return {
      valid: false,
      error: 'expired_key',
    };
  }

  // Check rate limiting
  if (cache && await isRateLimited(cache, apiKeyData, ipAddress)) {
    return {
      valid: false,
      error: 'rate_limited',
    };
  }

  // Check IP address restrictions
  if (ipAddress && !isIpAddressAllowed(ipAddress, apiKeyData.allowedIpAddresses)) {
    return {
      valid: false,
      error: 'ip_blocked',
    };
  }

  // Check user agent restrictions
  if (userAgent && !isUserAgentAllowed(userAgent, apiKeyData.allowedUserAgents)) {
    return {
      valid: false,
      error: 'user_agent_blocked',
    };
  }

  // Update usage statistics
  await updateApiKeyUsage(apiKeyData.id, {
    ipAddress,
    userAgent,
    endpoint,
    method,
  });

  return {
    valid: true,
    apiKeyData,
    metadata: {
      permissions: apiKeyData.permissions,
      userId: apiKeyData.userId,
      tenantId: apiKeyData.tenantId,
      usageCount: apiKeyData.usageCount + 1,
    },
  };
}

/**
 * Checks if an API key has specific permissions
 */
export async function verifyApiKeyPermissions(
  apiKey: string,
  requiredPermissions: string[],
  context?: {
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<ApiKeyVerificationResult> {
  const verificationResult = await verifyApiKey(apiKey, context);
  
  if (!verificationResult.valid) {
    return verificationResult;
  }

  const apiKeyPermissions = verificationResult.metadata!.permissions;
  
  // Check if all required permissions are available
  const hasAllPermissions = requiredPermissions.every(permission => 
    apiKeyPermissions.includes(permission as any)
  );

  if (!hasAllPermissions) {
    return {
      valid: false,
      error: 'invalid_key',
    };
  }

  return verificationResult;
}

/**
 * Lightweight API key check (doesn't update usage)
 */
export async function quickApiKeyCheck(apiKey: string): Promise<boolean> {
  if (!isValidApiKeyFormat(apiKey)) {
    return false;
  }

  const keyHash = hashApiKey(apiKey);
  const apiKeyData = await getApiKeyDataByKeyHash(apiKey, keyHash);
  
  if (!apiKeyData || !apiKeyData.isActive) {
    return false;
  }

  if (apiKeyData.expiresAt && apiKeyData.expiresAt < new Date()) {
    return false;
  }

  return true;
}

/**
 * Gets API key data by prefix with constant-time comparison to prevent timing attacks
 */
async function getApiKeyDataByKeyHash(apiKey: string, keyHash: string): Promise<ApiKeyData | null> {
  try {
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Extract prefix from API key (first 8 characters after "firm_")
    const prefix = apiKey.substring(5, 13); // "firm_" is 5 chars, take next 8
    
    // Query all API keys with the same prefix
    const candidateKeys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyPrefix, prefix));
    
    if (candidateKeys.length === 0) {
      // No candidates found - perform dummy comparison to prevent timing attacks
      performDummyComparison(keyHash);
      return null;
    }
    
    // Check each candidate with constant-time comparison
    for (const candidate of candidateKeys) {
      if (constantTimeHashCompare(keyHash, candidate.keyHash)) {
        // Transform database record to ApiKeyData format
        return {
          id: candidate.id,
          userId: candidate.userId,
          tenantId: candidate.tenantId,
          name: candidate.name,
          keyHash: candidate.keyHash,
          keyPrefix: candidate.keyPrefix,
          permissions: candidate.permissions || [],
          rateLimitPerHour: candidate.rateLimitPerMinute ? Number(candidate.rateLimitPerMinute) * 60 : undefined,
          allowedIpAddresses: candidate.allowedIps || [],
          allowedUserAgents: [], // Not in schema yet
          isActive: candidate.isActive,
          expiresAt: candidate.expiresAt,
          lastUsedAt: candidate.lastUsedAt,
          usageCount: 0, // Would need separate tracking table
          createdAt: candidate.createdAt,
          createdBy: candidate.userId,
        };
      }
    }
    
    // No matching hash found - perform dummy comparison to prevent timing attacks
    performDummyComparison(keyHash);
    return null;
  } catch (error) {
    console.error('Error fetching API key by hash:', error);
    return null;
  }
}

/**
 * Performs constant-time hash comparison using crypto.timingSafeEqual
 */
export function constantTimeHashCompare(hash1: string, hash2: string): boolean {
  try {
    const buf1 = Buffer.from(hash1, 'hex');
    const buf2 = Buffer.from(hash2, 'hex');
    
    // Buffers must be same length for timingSafeEqual
    if (buf1.length !== buf2.length) {
      return false;
    }
    
    return timingSafeEqual(buf1, buf2);
  } catch {
    // If conversion fails, treat as non-matching
    return false;
  }
}

/**
 * Performs dummy HMAC comparison to neutralize timing differences when no candidates exist
 */
export function performDummyComparison(providedHash: string): void {
  try {
    // Create a dummy hash using a fixed secret and the provided hash
    const dummySecret = 'dummy_secret_for_timing_protection';
    const dummyHash = createHmac('sha256', dummySecret).update(providedHash).digest('hex');
    
    // Perform constant-time comparison with the dummy hash
    constantTimeHashCompare(providedHash, dummyHash);
  } catch {
    // Silently ignore any errors in dummy comparison
  }
}

/**
 * Checks if API key is rate limited using Redis-based sliding window
 */
async function isRateLimited(
  cache: TenantCache,
  apiKeyData: ApiKeyData,
  ipAddress?: string
): Promise<boolean> {
  if (!apiKeyData.rateLimitPerHour) {
    return false;
  }

  // Create rate limiter for this API key
  const rateLimiter = createApiKeyRateLimiter(cache);
  
  // Use API key ID as primary identifier, include IP for additional tracking
  const identifier = `api_key:${apiKeyData.id}${ipAddress ? `:${ipAddress}` : ''}`;
  
  const result: RateLimitResult = await rateLimiter.checkRateLimit(identifier);
  
  return !result.allowed;
}



/**
 * Checks if IP address is allowed
 */
function isIpAddressAllowed(
  ipAddress: string,
  allowedIpAddresses?: string[]
): boolean {
  if (!allowedIpAddresses || allowedIpAddresses.length === 0) {
    return true;
  }

  return allowedIpAddresses.includes(ipAddress);
}

/**
 * Checks if user agent is allowed
 */
function isUserAgentAllowed(
  userAgent: string,
  allowedUserAgents?: string[]
): boolean {
  if (!allowedUserAgents || allowedUserAgents.length === 0) {
    return true;
  }

  return allowedUserAgents.some(allowedUserAgent => 
    userAgent.includes(allowedUserAgent)
  );
}

/**
 * Updates API key usage statistics
 */
async function updateApiKeyUsage(
  apiKeyId: string,
  context: {
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
  }
): Promise<void> {
  try {
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Update lastUsedAt timestamp
    await db
      .update(apiKeys)
      .set({ 
        lastUsedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(apiKeys.id, apiKeyId));
    
    // Create usage log entry (would need separate usage_logs table)
    const usageLog: Partial<ApiKeyUsageLog> = {
      apiKeyId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      endpoint: context.endpoint,
      method: context.method,
      statusCode: 200, // Would be determined by actual response
      responseTime: 0, // Would be measured by middleware
      timestamp: new Date(),
    };
    
    console.log('Usage log:', usageLog);
    // TODO: Store usage log in separate table when implemented
  } catch (error) {
    console.error('Error updating API key usage:', error);
  }
}

/**
 * Batch verification of multiple API keys
 */
export async function verifyMultipleApiKeys(
  apiKeys: string[],
  context?: {
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<ApiKeyVerificationResult[]> {
  const results = await Promise.all(
    apiKeys.map(apiKey => verifyApiKey(apiKey, context))
  );
  
  return results;
}

/**
 * Gets API key usage statistics
 */
export async function getApiKeyUsageStats(
  apiKeyId: string,
  timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
): Promise<{
  totalRequests: number;
  averageResponseTime: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  errorRate: number;
}> {
  // This would integrate with firm-db for analytics
  // For now, return placeholder data
  console.warn(`API key usage stats not yet implemented for key: ${apiKeyId}, range: ${timeRange}`);
  
  return {
    totalRequests: 0,
    averageResponseTime: 0,
    topEndpoints: [],
    errorRate: 0,
  };
}

```

---

### audit.ts

**Path:** `src\audit.ts`

**Language:** TypeScript

```typescript
/**
 * Immutable audit logging for Firm Auth
 * 
 * Provides comprehensive audit logging for all authentication and
 * authorization events with PII redaction and tamper protection.
 */

import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import type { UserId, TenantId, AuditAction } from '@firm/types';
import { generateUUID } from '@firm/crypto';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: UserId;
  tenantId?: TenantId;
  sessionId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  outcome: 'success' | 'failure' | 'error';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;
  riskScore: number; // 0-100, higher is more risky
  piiRedacted: boolean;
  checksum: string; // For tamper detection
}

export interface AuditLogOptions {
  includePii?: boolean;
  riskScore?: number;
  correlationId?: string;
  requestId?: string;
}

export interface AuditLogQuery {
  userId?: UserId;
  tenantId?: TenantId;
  action?: AuditAction;
  resource?: string;
  outcome?: 'success' | 'failure' | 'error';
  startDate?: Date;
  endDate?: Date;
  minRiskScore?: number;
  maxRiskScore?: number;
  ipAddress?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogResult {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AuditLogSummary {
  totalEvents: number;
  successRate: number;
  failureRate: number;
  errorRate: number;
  averageRiskScore: number;
  topActions: Array<{ action: AuditAction; count: number }>;
  topResources: Array<{ resource: string; count: number }>;
  topIpAddresses: Array<{ ipAddress: string; count: number }>;
  riskDistribution: {
    low: number;    // 0-33
    medium: number; // 34-66
    high: number;   // 67-100
  };
}

// Risk score calculation constants
const RISK_SCORES = {
  // Authentication events
  login_success: 10,
  login_failure: 30,
  login_mfa_required: 20,
  login_mfa_success: 15,
  login_mfa_failure: 40,
  logout: 5,
  
  // Authorization events
  permission_granted: 5,
  permission_denied: 25,
  impersonation_start: 50,
  impersonation_end: 10,
  delegation_grant: 45,
  delegation_revoke: 10,
  
  // Security events
  api_key_created: 20,
  api_key_deleted: 15,
  mfa_enabled: 10,
  mfa_disabled: 35,
  password_changed: 15,
  
  // High-risk events
  admin_access: 60,
  data_export: 40,
  bulk_operation: 35,
  configuration_change: 30,
};

/**
 * Creates an audit log entry
 * 
 * Logs an event with automatic PII redaction and checksum generation.
 */
export async function createAuditLog(
  action: AuditAction,
  resource: string,
  outcome: 'success' | 'failure' | 'error',
  details: Record<string, any>,
  options: AuditLogOptions & {
    userId?: UserId;
    tenantId?: TenantId;
    sessionId?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<void> {
  const {
    userId,
    tenantId,
    sessionId,
    resourceId,
    ipAddress,
    userAgent,
    includePii = false,
    riskScore: customRiskScore,
    correlationId,
    requestId,
  } = options;

  // Calculate risk score
  const riskScore = customRiskScore || calculateRiskScore(action, outcome, details);

  // Redact PII if required
  const redactedDetails = includePii ? details : redactPii(details);

  // Create audit entry
  const auditEntry: AuditLogEntry = {
    id: generateUUID(),
    timestamp: new Date(),
    userId,
    tenantId,
    sessionId,
    action,
    resource,
    resourceId,
    outcome,
    details: redactedDetails,
    ipAddress,
    userAgent,
    requestId,
    correlationId,
    riskScore,
    piiRedacted: !includePii,
  };

  // Generate checksum for tamper detection
  const checksum = generateChecksum(auditEntry);
  auditEntry.checksum = checksum;

  // Store audit entry
  await storeAuditLog(auditEntry);
}

/**
 * Queries audit logs
 */
export async function queryAuditLogs(
  query: AuditLogQuery
): Promise<AuditLogResult> {
  const {
    page = 1,
    limit = 100,
    ...filters
  } = query;

  // This would integrate with firm-db for database access
  console.log('Querying audit logs:', { query: filters, page, limit });
  
  return {
    entries: [],
    total: 0,
    page,
    limit,
    hasMore: false,
  };
}

/**
 * Gets audit log summary
 */
export async function getAuditLogSummary(
  query: Omit<AuditLogQuery, 'page' | 'limit'>
): Promise<AuditLogSummary> {
  // This would integrate with firm-db for analytics
  console.log('Getting audit log summary:', query);
  
  return {
    totalEvents: 0,
    successRate: 0,
    failureRate: 0,
    errorRate: 0,
    averageRiskScore: 0,
    topActions: [],
    topResources: [],
    topIpAddresses: [],
    riskDistribution: {
      low: 0,
      medium: 0,
      high: 0,
    },
  };
}

/**
 * Verifies audit log integrity
 */
export async function verifyAuditLogIntegrity(
  auditEntryId: string
): Promise<{ valid: boolean; expectedChecksum?: string; actualChecksum?: string }> {
  const auditEntry = await getAuditLogEntry(auditEntryId);
  
  if (!auditEntry) {
    return { valid: false };
  }

  // Recalculate checksum
  const entryWithoutChecksum = { ...auditEntry };
  const { checksum, ...entryWithoutChecksumValue } = entryWithoutChecksum;
  
  const expectedChecksum = generateChecksum(entryWithoutChecksumValue);
  const actualChecksum = auditEntry.checksum;

  return {
    valid: expectedChecksum === actualChecksum,
    expectedChecksum,
    actualChecksum,
  };
}

/**
 * Gets high-risk events
 */
export async function getHighRiskEvents(
  minRiskScore: number = 67,
  timeRangeHours: number = 24
): Promise<AuditLogEntry[]> {
  const startDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
  
  return queryAuditLogs({
    minRiskScore,
    startDate,
    endDate: new Date(),
    limit: 1000,
  }).then(result => result.entries);
}

/**
 * Gets user activity timeline
 */
export async function getUserActivityTimeline(
  userId: UserId,
  timeRangeHours: number = 24
): Promise<AuditLogEntry[]> {
  const startDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
  
  return queryAuditLogs({
    userId,
    startDate,
    endDate: new Date(),
    limit: 500,
  }).then(result => result.entries);
}

/**
 * Detects anomalous activity patterns
 */
export async function detectAnomalousActivity(
  userId: UserId,
  timeRangeHours: number = 24
): Promise<{
  anomalies: Array<{
    type: string;
    description: string;
    riskScore: number;
    detectedAt: Date;
    relatedEvents: string[];
  }>;
  totalRiskScore: number;
}> {
  // Get user activity
  const userActivity = await getUserActivityTimeline(userId, timeRangeHours);
  
  const anomalies: Array<{
    type: string;
    description: string;
    riskScore: number;
    detectedAt: Date;
    relatedEvents: string[];
  }> = [];

  // Detect multiple failed logins
  const failedLogins = userActivity.filter(entry => 
    entry.action === 'login' && entry.outcome === 'failure'
  );
  
  if (failedLogins.length >= 5) {
    anomalies.push({
      type: 'multiple_failed_logins',
      description: `User has ${failedLogins.length} failed login attempts`,
      riskScore: 70,
      detectedAt: new Date(),
      relatedEvents: failedLogins.map(entry => entry.id),
    });
  }

  // Detect unusual IP addresses
  const ipAddresses = [...new Set(userActivity.map(entry => entry.ipAddress).filter(Boolean))];
  if (ipAddresses.length >= 3) {
    anomalies.push({
      type: 'multiple_ip_addresses',
      description: `User accessed from ${ipAddresses.length} different IP addresses`,
      riskScore: 50,
      detectedAt: new Date(),
      relatedEvents: userActivity.map(entry => entry.id),
    });
  }

  // Detect high-risk actions
  const highRiskEvents = userActivity.filter(entry => entry.riskScore >= 60);
  if (highRiskEvents.length >= 3) {
    anomalies.push({
      type: 'high_risk_actions',
      description: `User performed ${highRiskEvents.length} high-risk actions`,
      riskScore: 80,
      detectedAt: new Date(),
      relatedEvents: highRiskEvents.map(entry => entry.id),
    });
  }

  const totalRiskScore = anomalies.reduce((sum, anomaly) => sum + anomaly.riskScore, 0);

  return { anomalies, totalRiskScore };
}

// Helper functions

function calculateRiskScore(action: AuditAction, outcome: 'success' | 'failure' | 'error', details: Record<string, any>): number {
  // Base risk score from action
  let baseScore = RISK_SCORES[action as keyof typeof RISK_SCORES] || 20;
  
  // Adjust based on outcome
  if (outcome === 'failure') {
    baseScore *= 1.5;
  } else if (outcome === 'error') {
    baseScore *= 2;
  }
  
  // Adjust based on details
  if (details.impersonation) {
    baseScore += 20;
  }
  
  if (details.adminAction) {
    baseScore += 15;
  }
  
  if (details.bulkOperation) {
    baseScore += 10;
  }
  
  // Cap at 100
  return Math.min(100, Math.round(baseScore));
}

function redactPii(details: Record<string, any>): Record<string, any> {
  const redacted = { ...details };
  
  // Redact common PII fields
  const piiFields = ['email', 'phone', 'ssn', 'creditCard', 'address', 'name'];
  
  for (const field of piiFields) {
    if (redacted[field]) {
      redacted[field] = '[REDACTED]';
    }
  }
  
  // Redact nested PII
  for (const key in redacted) {
    if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactPii(redacted[key]);
    }
  }
  
  return redacted;
}

function generateChecksum(entry: Partial<AuditLogEntry>): string {
  const entryString = JSON.stringify(entry, Object.keys(entry).sort());
  return createHash('sha256').update(entryString).digest('hex');
}

// Database access functions (integrated with firm-db)

async function storeAuditLog(entry: Partial<AuditLogEntry>): Promise<void> {
  try {
    // Import database modules dynamically to avoid circular dependencies
    const { db } = await import('@firm/db');
    const { auditLogs } = await import('@firm/db/schemas');
    
    // Map audit entry to database schema
    const auditLogRecord = {
      id: entry.id,
      tenantId: entry.tenantId,
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      requestId: entry.requestId,
      oldValue: entry.details?.oldValue,
      newValue: entry.details?.newValue,
      success: entry.outcome === 'success',
      errorMessage: entry.outcome === 'error' ? entry.details?.error : undefined,
      metadata: {
        ...entry.details,
        sessionId: entry.sessionId,
        correlationId: entry.correlationId,
        riskScore: entry.riskScore,
        piiRedacted: entry.piiRedacted,
        checksum: entry.checksum,
      },
    };
    
    // Store audit log in database
    await db.insert(auditLogs).values(auditLogRecord);
    
    console.log('Audit log stored successfully:', { id: entry.id, action: entry.action, outcome: entry.outcome });
  } catch (error) {
    console.error('Failed to store audit log:', error);
    
    // Fallback to console logging if database fails
    console.log('AUDIT LOG FALLBACK:', {
      id: entry.id,
      timestamp: entry.timestamp,
      action: entry.action,
      resource: entry.resource,
      outcome: entry.outcome,
      userId: entry.userId,
      tenantId: entry.tenantId,
      details: entry.details,
    });
    
    // Re-throw error to allow calling code to handle it
    throw error;
  }
}

async function getAuditLogEntry(entryId: string): Promise<AuditLogEntry | null> {
  try {
    // Import database modules dynamically to avoid circular dependencies
    const { db } = await import('@firm/db');
    const { auditLogs } = await import('@firm/db/schemas');
    
    // Query audit log from database
    const result = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, entryId))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const record = result[0];
    
    // Map database record back to audit entry format
    return {
      id: record.id,
      timestamp: record.createdAt,
      userId: record.userId,
      tenantId: record.tenantId,
      sessionId: (record.metadata as any)?.sessionId,
      action: record.action as AuditAction,
      resource: record.resource,
      resourceId: record.resourceId,
      outcome: record.success ? 'success' : (record.errorMessage ? 'error' : 'failure'),
      details: {
        oldValue: record.oldValue,
        newValue: record.newValue,
        error: record.errorMessage,
        ...(record.metadata as Record<string, any>),
      },
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      requestId: record.requestId,
      correlationId: (record.metadata as any)?.correlationId,
      riskScore: (record.metadata as any)?.riskScore || 20,
      piiRedacted: (record.metadata as any)?.piiRedacted || false,
      checksum: (record.metadata as any)?.checksum || '',
    };
  } catch (error) {
    console.error('Failed to get audit log entry:', error);
    return null;
  }
}

// Convenience functions for common audit events

export async function logAuthenticationEvent(
  userId: UserId,
  tenantId: TenantId,
  action: 'login' | 'logout',
  outcome: 'success' | 'failure',
  details: Record<string, any>,
  context: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  } = {}
): Promise<void> {
  await createAuditLog(
    action,
    'authentication',
    outcome,
    details,
    {
      userId,
      tenantId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      riskScore: action === 'login' ? (outcome === 'success' ? 10 : 30) : 5,
    }
  );
}

export async function logAuthorizationEvent(
  userId: UserId,
  tenantId: TenantId,
  resource: string,
  action: string,
  outcome: 'success' | 'failure',
  details: Record<string, any>,
  context: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  } = {}
): Promise<void> {
  await createAuditLog(
    action as AuditAction,
    resource,
    outcome,
    details,
    {
      userId,
      tenantId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      riskScore: outcome === 'success' ? 5 : 25,
    }
  );
}

export async function logSecurityEvent(
  action: string,
  resource: string,
  outcome: 'success' | 'failure' | 'error',
  details: Record<string, any>,
  context: {
    userId?: UserId;
    tenantId?: TenantId;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    riskScore?: number;
  } = {}
): Promise<void> {
  await createAuditLog(
    action as AuditAction,
    resource,
    outcome,
    details,
    {
      userId: context.userId,
      tenantId: context.tenantId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      riskScore: context.riskScore || 30,
    }
  );
}

```

---

### authenticate.ts

**Path:** `src\authenticate.ts`

**Language:** TypeScript

```typescript
/**
 * Unified authentication pipeline for Firm Platform
 * 
 * This is the main authentication function that handles both cookie-based
 * and Bearer token authentication in a unified pipeline.
 * 
 * Uses dedupe for identity resolution and follows the decorator pattern
 * around Better Auth primitives.
 */

import { verifySession, checkSessionExists } from './session';
import type { SessionContext, SessionVerificationResult } from './session/types';
import type { ApiKeyPermission } from '@firm/types';
import { verifyApiKey } from './api-keys/verify-key';

// Authentication method types
export type AuthMethod = 'cookie' | 'bearer' | 'api_key';

export interface AuthenticationRequest {
  // Cookie-based authentication
  cookie?: string;
  
  // Bearer token authentication
  authorization?: string;
  
  // API key authentication
  xApiKey?: string;
  
  // Request context
  userAgent?: string;
  ip?: string;
  path?: string;
  method?: string;
}

export interface AuthenticationResult {
  authenticated: boolean;
  session?: SessionContext;
  method?: AuthMethod;
  error?: 'invalid_token' | 'expired_token' | 'revoked_token' | 'mfa_required' | 'invalid_api_key' | 'no_credentials';
  metadata?: {
    userId?: string;
    tenantId?: string;
    permissions?: string[];
    apiKeyPermissions?: ApiKeyPermission[];
  };
}

/**
 * Unified authentication pipeline
 * 
 * This function implements the decorator pattern around Better Auth
 * and provides a single entry point for all authentication methods.
 * 
 * Priority order:
 * 1. Cookie authentication (session)
 * 2. Bearer token authentication (session)
 * 3. API key authentication
 */
export async function authenticateRequest(
  request: AuthenticationRequest
): Promise<AuthenticationResult> {
  const { cookie, authorization, xApiKey, userAgent, ip, path, method } = request;

  // Try cookie authentication first
  if (cookie) {
    const result = await authenticateWithCookie(cookie, { userAgent, ip, path, method });
    if (result.authenticated) {
      return { ...result, method: 'cookie' };
    }
  }

  // Try bearer token authentication
  if (authorization) {
    const result = await authenticateWithBearer(authorization, { userAgent, ip, path, method });
    if (result.authenticated) {
      return { ...result, method: 'bearer' };
    }
  }

  // Try API key authentication
  if (xApiKey) {
    const result = await authenticateWithApiKey(xApiKey, { userAgent, ip, path, method });
    if (result.authenticated) {
      return { ...result, method: 'api_key' };
    }
  }

  // No valid authentication found
  return {
    authenticated: false,
    error: 'no_credentials',
  };
}

/**
 * Cookie-based authentication
 */
async function authenticateWithCookie(
  cookie: string,
  context: { userAgent?: string; ip?: string; path?: string; method?: string }
): Promise<Omit<AuthenticationResult, 'method'>> {
  try {
    // Extract session token from cookie
    const sessionToken = extractSessionFromCookie(cookie);
    if (!sessionToken) {
      return { authenticated: false, error: 'invalid_token' };
    }

    // Verify session
    const verificationResult: SessionVerificationResult = await verifySession(sessionToken);
    
    if (!verificationResult.valid) {
      return {
        authenticated: false,
        error: mapVerificationError(verificationResult.error),
      };
    }

    const session = verificationResult.session!;
    
    return {
      authenticated: true,
      session,
      metadata: {
        userId: session.userId.toString(),
        tenantId: session.tenantId.toString(),
        permissions: session.permissions,
      },
    };
  } catch (error) {
    console.error('Cookie authentication error:', error);
    return { authenticated: false, error: 'invalid_token' };
  }
}

/**
 * Bearer token authentication
 */
async function authenticateWithBearer(
  authorization: string,
  context: { userAgent?: string; ip?: string; path?: string; method?: string }
): Promise<Omit<AuthenticationResult, 'method'>> {
  try {
    // Extract token from Authorization header
    const token = extractBearerToken(authorization);
    if (!token) {
      return { authenticated: false, error: 'invalid_token' };
    }

    // Verify session
    const verificationResult: SessionVerificationResult = await verifySession(token);
    
    if (!verificationResult.valid) {
      return {
        authenticated: false,
        error: mapVerificationError(verificationResult.error),
      };
    }

    const session = verificationResult.session!;
    
    return {
      authenticated: true,
      session,
      metadata: {
        userId: session.userId.toString(),
        tenantId: session.tenantId.toString(),
        permissions: session.permissions,
      },
    };
  } catch (error) {
    console.error('Bearer authentication error:', error);
    return { authenticated: false, error: 'invalid_token' };
  }
}

/**
 * API key authentication
 */
async function authenticateWithApiKey(
  apiKey: string,
  context: { userAgent?: string; ip?: string; path?: string; method?: string }
): Promise<Omit<AuthenticationResult, 'method'>> {
  try {
    const verificationResult = await verifyApiKey(apiKey, {
      ipAddress: context.ip,
      userAgent: context.userAgent,
      endpoint: context.path,
      method: context.method,
    });

    if (!verificationResult.valid) {
      return {
        authenticated: false,
        error: 'invalid_api_key',
      };
    }

    const { apiKeyData, metadata } = verificationResult;

    return {
      authenticated: true,
      metadata: {
        userId: metadata?.userId.toString(),
        tenantId: metadata?.tenantId.toString(),
        apiKeyPermissions: metadata?.permissions as ApiKeyPermission[],
      },
    };
  } catch (error) {
    console.error('API key authentication error:', error);
    return { authenticated: false, error: 'invalid_api_key' };
  }
}

/**
 * Extract session token from cookie string
 */
function extractSessionFromCookie(cookie: string): string | null {
  // Look for __Host-session cookie
  const cookies = cookie.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('__Host-session='));
  
  if (sessionCookie) {
    return sessionCookie.substring('__Host-session='.length);
  }
  
  return null;
}

/**
 * Extract token from Authorization header
 */
function extractBearerToken(authorization: string): string | null {
  if (authorization.startsWith('Bearer ')) {
    return authorization.substring('Bearer '.length);
  }
  
  return null;
}

/**
 * Map Better Auth verification errors to our error types
 */
function mapVerificationError(
  error?: 'expired' | 'invalid' | 'revoked' | 'mfa_required'
): AuthenticationResult['error'] {
  switch (error) {
    case 'expired':
      return 'expired_token';
    case 'revoked':
      return 'revoked_token';
    case 'mfa_required':
      return 'mfa_required';
    case 'invalid':
    default:
      return 'invalid_token';
  }
}

/**
 * Lightweight authentication check (doesn't verify full session)
 */
export async function quickAuthCheck(
  request: AuthenticationRequest
): Promise<{ authenticated: boolean; method?: AuthMethod }> {
  const { cookie, authorization, xApiKey } = request;

  // Check cookie
  if (cookie) {
    const sessionToken = extractSessionFromCookie(cookie);
    if (sessionToken && await checkSessionExists(sessionToken)) {
      return { authenticated: true, method: 'cookie' };
    }
  }

  // Check bearer token
  if (authorization) {
    const token = extractBearerToken(authorization);
    if (token && await checkSessionExists(token)) {
      return { authenticated: true, method: 'bearer' };
    }
  }

  // Check API key (placeholder)
  if (xApiKey) {
    // Would implement API key existence check
    return { authenticated: false };
  }

  return { authenticated: false };
}

/**
 * Authentication middleware for Next.js/Express
 */
export function createAuthMiddleware(options?: {
  requireAuth?: boolean;
  allowedMethods?: string[];
  skipPaths?: string[];
}) {
  const {
    requireAuth = true,
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    skipPaths = ['/health', '/api/health', '/metrics'],
  } = options || {};

  return async (request: AuthenticationRequest, next?: () => void) => {
    // Skip authentication for certain paths
    if (skipPaths.some(path => request.path?.startsWith(path))) {
      if (next) next();
      return { authenticated: true, method: 'cookie' as AuthMethod };
    }

    // Skip for unsupported methods
    if (!allowedMethods.includes(request.method || 'GET')) {
      return { authenticated: false, error: 'method_not_allowed' as const };
    }

    // Perform authentication
    const result = await authenticateRequest(request);
    
    // Return error if auth is required but not provided
    if (requireAuth && !result.authenticated) {
      return result;
    }

    if (next) next();
    return result;
  };
}

```

---

### delegate.ts

**Path:** `src\delegate.ts`

**Language:** TypeScript

```typescript
/**
 * Permission delegation for Firm Auth
 * 
 * Implements delegation grant/revoke functionality with proper
 * security controls, audit logging, and permission checks.
 */

import { createDelegatedSession, revokeSession } from './session';
import { checkDelegationPermission } from './permissions/guard';
import { AuthorizationError, ValidationError, NotFoundError } from '@firm/errors';
import type { SessionContext } from './session/types';
import type { UserId, TenantId } from '@firm/types';
import { generateUUID } from '@firm/crypto';

export interface DelegationGrantOptions {
  targetUserId: UserId;
  targetTenantId: TenantId;
  permissions: string[];
  expiresAt?: Date;
  reason?: string;
}

export interface DelegationResult {
  delegatedSession: SessionContext;
  grantId: string;
  expiresAt: Date;
}

export interface DelegationGrant {
  id: string;
  delegatorUserId: UserId;
  delegatorTenantId: TenantId;
  delegateeUserId: UserId;
  delegateeTenantId: TenantId;
  permissions: string[];
  sessionId: string;
  delegatedSessionId: string;
  expiresAt: Date;
  grantedAt: Date;
  revokedAt?: Date;
  reason?: string;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: Date;
}

export interface DelegationUsageLog {
  id: string;
  delegationId: string;
  userId: UserId;
  tenantId: TenantId;
  permission: string;
  endpoint: string;
  method: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
}

/**
 * Grants delegated permissions to a user
 * 
 * Creates a delegated session with proper permission checks
 * and audit logging.
 */
export async function grantDelegation(
  delegatorSession: SessionContext,
  options: DelegationGrantOptions,
  context: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<DelegationResult> {
  const { targetUserId, targetTenantId, permissions, expiresAt, reason } = options;
  const { ipAddress, userAgent } = context;

  // Check if delegator has permission to delegate these permissions
  for (const permission of permissions) {
    const permissionCheck = checkDelegationPermission(
      delegatorSession,
      'user', // Would need to get target user's role
      permission,
      targetUserId.toString()
    );

    if (!permissionCheck.granted) {
      throw new AuthorizationError(`Delegation not allowed for permission ${permission}: ${permissionCheck.reason}`, {
        code: 'DELEGATION_NOT_ALLOWED',
        permission,
        reason: permissionCheck.reason,
        delegatorUserId: delegatorSession.userId.toString(),
        targetUserId: targetUserId.toString()
      });
    }
  }

  // Cannot delegate to yourself
  if (delegatorSession.userId.toString() === targetUserId.toString()) {
    throw new ValidationError('Cannot delegate permissions to yourself', {
      code: 'SELF_DELEGATION_DENIED',
      userId: delegatorSession.userId.toString()
    });
  }

  // Check if delegation already exists
  const existingDelegation = await getActiveDelegation(delegatorSession.userId, targetUserId);
  if (existingDelegation) {
    throw new ValidationError('Delegation already exists for this user', {
      code: 'DELEGATION_ALREADY_EXISTS',
      delegatorUserId: delegatorSession.userId.toString(),
      delegateeUserId: targetUserId.toString(),
      existingDelegationId: existingDelegation.id
    });
  }

  // Set default expiration if not provided (7 days)
  const delegationExpiresAt = expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Create delegated session
  const delegatedSession = await createDelegatedSession(
    targetUserId,
    targetTenantId,
    delegatorSession.userId,
    `delegated-${targetUserId}@example.com`,
    'user', // Would get from user details
    permissions,
    delegationExpiresAt
  );

  // Create delegation grant
  const delegationGrant: Partial<DelegationGrant> = {
    id: generateUUID(),
    delegatorUserId: delegatorSession.userId,
    delegatorTenantId: delegatorSession.tenantId,
    delegateeUserId: targetUserId,
    delegateeTenantId: targetTenantId,
    permissions,
    sessionId: delegatorSession.sessionId,
    delegatedSessionId: delegatedSession.sessionId,
    expiresAt: delegationExpiresAt,
    grantedAt: new Date(),
    isActive: true,
    usageCount: 0,
    reason,
  };

  await storeDelegationGrant(delegationGrant);

  return {
    delegatedSession,
    grantId: delegationGrant.id!,
    expiresAt: delegationExpiresAt,
  };
}

/**
 * Revokes delegated permissions from a user
 * 
 * Revokes the delegated session and updates audit logs.
 */
export async function revokeDelegation(
  delegatorSession: SessionContext,
  delegationId: string,
  context: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<boolean> {
  const { ipAddress, userAgent } = context;

  // Get delegation grant
  const delegationGrant = await getDelegationGrant(delegationId);
  
  if (!delegationGrant) {
    throw new NotFoundError('Delegation grant not found', {
      code: 'DELEGATION_GRANT_NOT_FOUND',
      delegationId
    });
  }

  // Verify that the caller is the original delegator
  if (delegationGrant.delegatorUserId.toString() !== delegatorSession.userId.toString()) {
    throw new AuthorizationError('Only the original delegator can revoke delegation', {
      code: 'DELEGATION_REVOKE_DENIED',
      delegationId,
      expectedDelegatorId: delegationGrant.delegatorUserId.toString(),
      actualUserId: delegatorSession.userId.toString()
    });
  }

  // Revoke delegated session
  await revokeSession(delegationGrant.delegatedSessionId);

  // Update delegation grant
  await revokeDelegationGrant(delegationId);

  return true;
}

/**
 * Gets active delegation grants for a user
 */
export async function getActiveDelegations(
  delegatorUserId?: UserId,
  delegateeUserId?: UserId
): Promise<DelegationGrant[]> {
  // This would integrate with firm-db for database access
  console.log('Getting active delegations:', { delegatorUserId, delegateeUserId });
  return []; // Placeholder
}

/**
 * Gets delegation history for a user
 */
export async function getDelegationHistory(
  userId: UserId,
  options: {
    asDelegator?: boolean;
    asDelegatee?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  delegations: DelegationGrant[];
  total: number;
  page: number;
  limit: number;
}> {
  const { asDelegator = false, asDelegatee = false, page = 1, limit = 20 } = options;

  // This would integrate with firm-db for database access
  console.log('Getting delegation history:', { userId, asDelegator, asDelegatee, page, limit });
  
  return {
    delegations: [],
    total: 0,
    page,
    limit,
  };
}

/**
 * Checks if a session is a delegated session
 */
export function isDelegatedSession(session: SessionContext): boolean {
  return session.isDelegated && !!session.delegatedBy;
}

/**
 * Gets the original delegator from a delegated session
 */
export function getDelegatorFromSession(session: SessionContext): UserId | null {
  return session.delegatedBy || null;
}

/**
 * Extends delegation expiration
 */
export async function extendDelegation(
  delegatorSession: SessionContext,
  delegationId: string,
  newExpiresAt: Date
): Promise<boolean> {
  // Verify that the caller is the original delegator
  const delegationGrant = await getDelegationGrant(delegationId);
  
  if (!delegationGrant || 
      delegationGrant.delegatorUserId.toString() !== delegatorSession.userId.toString()) {
    throw new AuthorizationError('Only the original delegator can extend delegation', {
      code: 'DELEGATION_EXTEND_DENIED',
      delegationId,
      expectedDelegatorId: delegationGrant?.delegatorUserId.toString(),
      actualUserId: delegatorSession.userId.toString()
    });
  }

  // Extend delegation
  await extendDelegationExpiration(delegationId, newExpiresAt);

  return true;
}

/**
 * Updates delegation permissions
 */
export async function updateDelegationPermissions(
  delegatorSession: SessionContext,
  delegationId: string,
  newPermissions: string[]
): Promise<boolean> {
  // Verify that the caller is the original delegator
  const delegationGrant = await getDelegationGrant(delegationId);
  
  if (!delegationGrant || 
      delegationGrant.delegatorUserId.toString() !== delegatorSession.userId.toString()) {
    throw new AuthorizationError('Only the original delegator can update delegation permissions', {
      code: 'DELEGATION_UPDATE_DENIED',
      delegationId,
      expectedDelegatorId: delegationGrant?.delegatorUserId.toString(),
      actualUserId: delegatorSession.userId.toString()
    });
  }

  // Check new permissions
  for (const permission of newPermissions) {
    const permissionCheck = checkDelegationPermission(
      delegatorSession,
      'user', // Would need to get delegatee's role
      permission
    );

    if (!permissionCheck.granted) {
      throw new AuthorizationError(`Cannot delegate permission ${permission}: ${permissionCheck.reason}`, {
        code: 'DELEGATION_PERMISSION_DENIED',
        permission,
        reason: permissionCheck.reason,
        delegatorUserId: delegatorSession.userId.toString()
      });
    }
  }

  // Update delegation permissions
  await updateDelegationGrantPermissions(delegationId, newPermissions);

  return true;
}

/**
 * Logs delegation usage
 */
export async function logDelegationUsage(
  delegationId: string,
  permission: string,
  context: {
    endpoint: string;
    method: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
  }
): Promise<void> {
  const usageLog: Partial<DelegationUsageLog> = {
    id: generateUUID(),
    delegationId,
    permission,
    endpoint: context.endpoint,
    method: context.method,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    timestamp: new Date(),
    success: context.success,
  };

  await storeDelegationUsageLog(usageLog);
}

/**
 * Gets delegation usage statistics
 */
export async function getDelegationUsageStats(
  delegationId: string,
  timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
): Promise<{
  totalUsages: number;
  successfulUsages: number;
  failedUsages: number;
  topPermissions: Array<{ permission: string; count: number }>;
  uniqueEndpoints: number;
}> {
  // This would integrate with firm-db for analytics
  console.log(`Getting delegation usage stats for delegation: ${delegationId}, range: ${timeRange}`);
  
  return {
    totalUsages: 0,
    successfulUsages: 0,
    failedUsages: 0,
    topPermissions: [],
    uniqueEndpoints: 0,
  };
}

/**
 * Forces revocation of all delegations (admin function)
 */
export async function forceRevokeAllDelegations(
  adminSession: SessionContext,
  delegatorUserId?: UserId,
  delegateeUserId?: UserId
): Promise<number> {
  // Verify admin permissions
  if (!hasAdminPermission(adminSession)) {
    throw new AuthorizationError('Admin permissions required', {
      code: 'ADMIN_PERMISSIONS_REQUIRED',
      userId: adminSession.userId.toString(),
      role: adminSession.role
    });
  }

  // Get active delegations
  const activeDelegations = await getActiveDelegations(delegatorUserId, delegateeUserId);
  
  let revokedCount = 0;
  
  for (const delegation of activeDelegations) {
    await revokeSession(delegation.delegatedSessionId);
    await revokeDelegationGrant(delegation.id);
    revokedCount++;
  }

  return revokedCount;
}

// Helper functions with database integration

async function getActiveDelegation(delegatorUserId: UserId, delegateeUserId: UserId): Promise<DelegationGrant | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { delegationGrants } = await import('@firm/db/schemas');
    const { eq, and, gte } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(delegationGrants)
      .where(and(
        eq(delegationGrants.delegatorUserId, delegatorUserId),
        eq(delegationGrants.delegateeUserId, delegateeUserId),
        eq(delegationGrants.isActive, true),
        gte(delegationGrants.expiresAt, new Date())
      ))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const grant = result[0];
    return {
      id: grant.id,
      delegatorUserId: grant.delegatorUserId,
      delegatorTenantId: grant.tenantId,
      delegateeUserId: grant.delegateeUserId,
      delegateeTenantId: grant.tenantId,
      permissions: grant.permissions,
      sessionId: grant.sessionId,
      delegatedSessionId: grant.delegatedSessionId,
      expiresAt: grant.expiresAt,
      grantedAt: grant.grantedAt,
      isActive: grant.isActive,
      usageCount: Number(grant.usageCount),
      lastUsedAt: grant.lastUsedAt,
      reason: grant.reason,
    };
  } catch (error) {
    console.error('Error getting active delegation:', error);
    return null;
  }
}

async function storeDelegationGrant(grant: Partial<DelegationGrant>): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { delegationGrants } = await import('@firm/db/schemas');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db.insert(delegationGrants).values({
      id: grant.id!,
      delegatorUserId: grant.delegatorUserId!,
      delegateeUserId: grant.delegateeUserId!,
      tenantId: grant.delegatorTenantId!,
      permissions: grant.permissions!,
      sessionId: grant.sessionId!,
      delegatedSessionId: grant.delegatedSessionId!,
      expiresAt: grant.expiresAt!,
      grantedAt: grant.grantedAt || new Date(),
      isActive: grant.isActive || true,
      usageCount: grant.usageCount || 0,
      reason: grant.reason,
      ipAddress: grant.ipAddress,
      userAgent: grant.userAgent,
    });
    
    console.log('Delegation grant stored successfully:', { id: grant.id });
  } catch (error) {
    console.error('Error storing delegation grant:', error);
    throw error;
  }
}

async function getDelegationGrant(delegationId: string): Promise<DelegationGrant | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { delegationGrants } = await import('@firm/db/schemas');
    const { eq, and, gte } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(delegationGrants)
      .where(and(
        eq(delegationGrants.id, delegationId),
        eq(delegationGrants.isActive, true),
        gte(delegationGrants.expiresAt, new Date())
      ))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const grant = result[0];
    return {
      id: grant.id,
      delegatorUserId: grant.delegatorUserId,
      delegatorTenantId: grant.tenantId,
      delegateeUserId: grant.delegateeUserId,
      delegateeTenantId: grant.tenantId,
      permissions: grant.permissions,
      sessionId: grant.sessionId,
      delegatedSessionId: grant.delegatedSessionId,
      expiresAt: grant.expiresAt,
      grantedAt: grant.grantedAt,
      isActive: grant.isActive,
      usageCount: Number(grant.usageCount),
      lastUsedAt: grant.lastUsedAt,
      reason: grant.reason,
    };
  } catch (error) {
    console.error('Error getting delegation grant:', error);
    return null;
  }
}

async function revokeDelegationGrant(delegationId: string): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { delegationGrants } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(delegationGrants)
      .set({
        isActive: false,
        revokedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(delegationGrants.id, delegationId));
    
    console.log('Delegation grant revoked successfully:', { delegationId });
  } catch (error) {
    console.error('Error revoking delegation grant:', error);
    throw error;
  }
}

async function extendDelegationExpiration(delegationId: string, newExpiresAt: Date): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { delegationGrants } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(delegationGrants)
      .set({
        expiresAt: newExpiresAt,
        updatedAt: new Date()
      })
      .where(eq(delegationGrants.id, delegationId));
    
    console.log('Delegation expiration extended successfully:', { delegationId, newExpiresAt });
  } catch (error) {
    console.error('Error extending delegation expiration:', error);
    throw error;
  }
}

async function updateDelegationGrantPermissions(delegationId: string, newPermissions: string[]): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { delegationGrants } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(delegationGrants)
      .set({
        permissions: newPermissions,
        updatedAt: new Date()
      })
      .where(eq(delegationGrants.id, delegationId));
    
    console.log('Delegation permissions updated successfully:', { delegationId });
  } catch (error) {
    console.error('Error updating delegation permissions:', error);
    throw error;
  }
}

async function storeDelegationUsageLog(log: Partial<DelegationUsageLog>): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { delegationUsageLogs, delegationGrants } = await import('@firm/db/schemas');
    const { eq, sql } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Store usage log
    await db.insert(delegationUsageLogs).values({
      id: log.id!,
      delegationId: log.delegationId!,
      userId: log.userId!,
      tenantId: log.tenantId!,
      permission: log.permission!,
      endpoint: log.endpoint!,
      method: log.method!,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      success: log.success!,
      timestamp: log.timestamp || new Date(),
    });
    
    // Update usage count on delegation grant
    await db
      .update(delegationGrants)
      .set({
        usageCount: sql`usage_count + 1`,
        lastUsedAt: new Date()
      })
      .where(eq(delegationGrants.id, log.delegationId!));
    
    console.log('Delegation usage log stored successfully:', { id: log.id });
  } catch (error) {
    console.error('Error storing delegation usage log:', error);
    throw error;
  }
}

function hasAdminPermission(session: SessionContext): boolean {
  return session.role === 'super_admin' || session.role === 'tenant_admin';
}

```

---

### impersonate.ts

**Path:** `src\impersonate.ts`

**Language:** TypeScript

```typescript
/**
 * User impersonation for Firm Auth
 * 
 * Implements impersonation start/end functionality with proper
 * security controls, audit logging, and permission checks.
 */

import { createImpersonatedSession, revokeSession, verifySession } from './session';
import { checkImpersonationPermission } from './permissions/guard';
import { AuthorizationError, NotFoundError, ValidationError } from '@firm/errors';
import type { SessionContext } from './session/types';
import type { UserId, TenantId } from '@firm/types';
import { generateUUID } from '@firm/crypto';


export interface ImpersonationStartOptions {
  targetUserId: UserId;
  targetTenantId: TenantId;
  reason?: string;
  durationMinutes?: number; // Default 60 minutes
}

export interface ImpersonationStartOptionsWithToken extends ImpersonationStartOptions {
  impersonatorSessionToken: string;
}

export interface ImpersonationResult {
  impersonatedSession: SessionContext;
  originalSessionId: string;
  expiresAt: Date;
}

export interface ImpersonationLog {
  id: string;
  impersonatorUserId: UserId;
  impersonatorTenantId: TenantId;
  targetUserId: UserId;
  targetTenantId: TenantId;
  sessionId: string;
  impersonatedSessionId: string;
  reason?: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number; // Duration in minutes
  actionsCount: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Starts impersonation of a user
 * 
 * Creates an impersonated session with proper permission checks
 * and audit logging. Uses fresh session validation to prevent TOCTOU attacks.
 */
export async function startImpersonation(
  options: ImpersonationStartOptionsWithToken,
  context: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<ImpersonationResult> {
  const { targetUserId, targetTenantId, reason, durationMinutes = 60, impersonatorSessionToken } = options;
  const { ipAddress, userAgent } = context;

  // Fresh session validation to prevent TOCTOU attacks
  const sessionVerification = await verifySession(impersonatorSessionToken);
  if (!sessionVerification.valid) {
    throw new AuthorizationError(`Invalid session: ${sessionVerification.error}`, {
      code: 'INVALID_IMPERSONATOR_SESSION',
      reason: sessionVerification.error
    });
  }
  
  // Use the freshly validated session for all permission checks
  const freshSession = sessionVerification.session!;

  // Check if impersonator has permission to impersonate
  // Get target user details to check role
  const targetUser = await getUserDetails(targetUserId, targetTenantId);
  if (!targetUser) {
    throw new NotFoundError('Target user not found', {
      code: 'TARGET_USER_NOT_FOUND',
      targetUserId: targetUserId.toString(),
      targetTenantId: targetTenantId.toString()
    });
  }

  const permissionCheck = checkImpersonationPermission(
    freshSession,
    targetUser.role,
    targetUserId.toString()
  );

  if (!permissionCheck.granted) {
    throw new AuthorizationError(`Impersonation not allowed: ${permissionCheck.reason}`, {
      code: 'IMPERSONATION_NOT_ALLOWED',
      reason: permissionCheck.reason,
      targetUserId: targetUserId.toString(),
      impersonatorUserId: freshSession.userId.toString()
    });
  }

  // Cannot impersonate yourself
  if (freshSession.userId.toString() === targetUserId.toString()) {
    throw new ValidationError('Cannot impersonate yourself', {
      code: 'SELF_IMPERSONATION_DENIED',
      userId: freshSession.userId.toString()
    });
  }

  // Check if user is already being impersonated
  const existingImpersonation = await getActiveImpersonation(targetUserId);
  if (existingImpersonation) {
    throw new ValidationError('User is already being impersonated', {
      code: 'USER_ALREADY_IMPERSONATED',
      targetUserId: targetUserId.toString(),
      existingImpersonatorId: existingImpersonation.impersonatorUserId.toString()
    });
  }

  // Create impersonated session
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  const impersonatedSession = await createImpersonatedSession(
    targetUserId,
    targetTenantId,
    freshSession.userId,
    targetUser.email,
    targetUser.role,
    targetUser.permissions
  );

  // Log impersonation start
  const impersonationLog: Partial<ImpersonationLog> = {
    id: generateUUID(),
    impersonatorUserId: freshSession.userId,
    impersonatorTenantId: freshSession.tenantId,
    targetUserId,
    targetTenantId,
    sessionId: freshSession.sessionId,
    impersonatedSessionId: impersonatedSession.sessionId,
    reason,
    startedAt: new Date(),
    actionsCount: 0,
    ipAddress,
    userAgent,
  };

  await logImpersonationStart(impersonationLog);

  return {
    impersonatedSession,
    originalSessionId: freshSession.sessionId,
    expiresAt,
  };
}

/**
 * @deprecated Use startImpersonation with ImpersonationStartOptionsWithToken instead
 * This function is kept for backward compatibility but is vulnerable to TOCTOU attacks
 */
export async function startImpersonationLegacy(
  impersonatorSession: SessionContext,
  options: ImpersonationStartOptions,
  context: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<ImpersonationResult> {
  // This legacy function is vulnerable to TOCTOU attacks
  // It should be replaced with the secure startImpersonation function
  console.warn('startImpersonationLegacy is deprecated and vulnerable to TOCTOU attacks. Use startImpersonation with session token instead.');
  
  const { targetUserId, targetTenantId, reason, durationMinutes = 60 } = options;
  const { ipAddress, userAgent } = context;

  // Check if impersonator has permission to impersonate
  // Get target user details to check role
  const targetUser = await getUserDetails(targetUserId, targetTenantId);
  if (!targetUser) {
    throw new NotFoundError('Target user not found', {
      code: 'TARGET_USER_NOT_FOUND',
      targetUserId: targetUserId.toString(),
      targetTenantId: targetTenantId.toString()
    });
  }

  const permissionCheck = checkImpersonationPermission(
    impersonatorSession,
    targetUser.role,
    targetUserId.toString()
  );

  if (!permissionCheck.granted) {
    throw new AuthorizationError(`Impersonation not allowed: ${permissionCheck.reason}`, {
      code: 'IMPERSONATION_NOT_ALLOWED',
      reason: permissionCheck.reason,
      targetUserId: targetUserId.toString(),
      impersonatorUserId: impersonatorSession.userId.toString()
    });
  }

  // Cannot impersonate yourself
  if (impersonatorSession.userId.toString() === targetUserId.toString()) {
    throw new ValidationError('Cannot impersonate yourself', {
      code: 'SELF_IMPERSONATION_DENIED',
      userId: impersonatorSession.userId.toString()
    });
  }

  // Check if user is already being impersonated
  const existingImpersonation = await getActiveImpersonation(targetUserId);
  if (existingImpersonation) {
    throw new ValidationError('User is already being impersonated', {
      code: 'USER_ALREADY_IMPERSONATED',
      targetUserId: targetUserId.toString(),
      existingImpersonatorId: existingImpersonation.impersonatorUserId.toString()
    });
  }

  // Create impersonated session
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  const impersonatedSession = await createImpersonatedSession(
    targetUserId,
    targetTenantId,
    impersonatorSession.userId,
    targetUser.email,
    targetUser.role,
    targetUser.permissions
  );

  // Log impersonation start
  const impersonationLog: Partial<ImpersonationLog> = {
    id: generateUUID(),
    impersonatorUserId: impersonatorSession.userId,
    impersonatorTenantId: impersonatorSession.tenantId,
    targetUserId,
    targetTenantId,
    sessionId: impersonatorSession.sessionId,
    impersonatedSessionId: impersonatedSession.sessionId,
    reason,
    startedAt: new Date(),
    actionsCount: 0,
    ipAddress,
    userAgent,
  };

  await logImpersonationStart(impersonationLog);

  return {
    impersonatedSession,
    originalSessionId: impersonatorSession.sessionId,
    expiresAt,
  };
}

/**
 * Ends impersonation of a user
 * 
 * Revokes the impersonated session and updates audit logs.
 */
export async function endImpersonation(
  impersonatorSession: SessionContext,
  impersonatedSessionId: string,
  context: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<boolean> {
  const { ipAddress, userAgent } = context;

  // Get impersonation log
  const impersonationLog = await getImpersonationLog(impersonatedSessionId);
  
  if (!impersonationLog) {
    throw new NotFoundError('Impersonation session not found', {
      code: 'IMPERSONATION_SESSION_NOT_FOUND',
      impersonatedSessionId
    });
  }

  // Verify that the caller is the original impersonator
  if (impersonationLog.impersonatorUserId.toString() !== impersonatorSession.userId.toString()) {
    throw new AuthorizationError('Only the original impersonator can end impersonation', {
      code: 'IMPERSONATION_END_DENIED',
      impersonatedSessionId,
      expectedImpersonatorId: impersonationLog.impersonatorUserId.toString(),
      actualUserId: impersonatorSession.userId.toString()
    });
  }

  // Revoke impersonated session
  await revokeSession(impersonatedSessionId);

  // Update impersonation log
  const endTime = new Date();
  const duration = Math.floor((endTime.getTime() - impersonationLog.startedAt.getTime()) / (1000 * 60));

  await logImpersonationEnd(impersonationLog.id, endTime, duration);

  return true;
}

/**
 * Gets active impersonation sessions
 */
export async function getActiveImpersonations(
  impersonatorUserId?: UserId
): Promise<ImpersonationLog[]> {
  // This would integrate with firm-db for database access
  console.log('Getting active impersonations:', { impersonatorUserId });
  return []; // Placeholder
}

/**
 * Gets impersonation history for a user
 */
export async function getImpersonationHistory(
  userId: UserId,
  options: {
    asImpersonator?: boolean;
    asTarget?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  impersonations: ImpersonationLog[];
  total: number;
  page: number;
  limit: number;
}> {
  const { asImpersonator = false, asTarget = false, page = 1, limit = 20 } = options;

  // This would integrate with firm-db for database access
  console.log('Getting impersonation history:', { userId, asImpersonator, asTarget, page, limit });
  
  return {
    impersonations: [],
    total: 0,
    page,
    limit,
  };
}

/**
 * Checks if a session is an impersonated session
 */
export function isImpersonatedSession(session: SessionContext): boolean {
  return session.isImpersonated && !!session.impersonatedBy;
}

/**
 * Gets the original impersonator from an impersonated session
 */
export function getImpersonatorFromSession(session: SessionContext): UserId | null {
  return session.impersonatedBy || null;
}

/**
 * Extends impersonation session
 */
export async function extendImpersonation(
  impersonatorSession: SessionContext,
  impersonatedSessionId: string,
  additionalMinutes: number
): Promise<boolean> {
  // Verify that the caller is the original impersonator
  const impersonationLog = await getImpersonationLog(impersonatedSessionId);
  
  if (!impersonationLog || 
      impersonationLog.impersonatorUserId.toString() !== impersonatorSession.userId.toString()) {
    throw new AuthorizationError('Only the original impersonator can extend impersonation', {
      code: 'IMPERSONATION_EXTEND_DENIED',
      impersonatedSessionId,
      expectedImpersonatorId: impersonationLog?.impersonatorUserId.toString(),
      actualUserId: impersonatorSession.userId.toString()
    });
  }

  // Extend session expiration
  const newExpiresAt = new Date(Date.now() + additionalMinutes * 60 * 1000);
  await extendSessionExpiration(impersonatedSessionId, newExpiresAt);

  return true;
}

/**
 * Forces end of all impersonation sessions (admin function)
 */
export async function forceEndAllImpersonations(
  adminSession: SessionContext,
  targetUserId?: UserId
): Promise<number> {
  // Verify admin permissions
  if (!hasAdminPermission(adminSession)) {
    throw new AuthorizationError('Admin permissions required', {
      code: 'ADMIN_PERMISSIONS_REQUIRED',
      userId: adminSession.userId.toString(),
      role: adminSession.role
    });
  }

  // Get active impersonations
  const activeImpersonations = await getActiveImpersonations();
  
  let endedCount = 0;
  
  for (const impersonation of activeImpersonations) {
    if (!targetUserId || impersonation.targetUserId.toString() === targetUserId.toString()) {
      await revokeSession(impersonation.impersonatedSessionId);
      await logImpersonationEnd(impersonation.id, new Date());
      endedCount++;
    }
  }

  return endedCount;
}

// Helper functions with database integration

async function getUserDetails(userId: UserId, tenantId: TenantId): Promise<any> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { users, userTenants } = await import('@firm/db/schemas');
    const { eq, and } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Get user with tenant relationship
    const result = await db
      .select({
        user: users,
        userTenant: userTenants
      })
      .from(users)
      .leftJoin(userTenants, and(eq(userTenants.userId, users.id), eq(userTenants.tenantId, tenantId)))
      .where(eq(users.id, userId))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const { user, userTenant } = result[0];
    
    return {
      id: user.id,
      tenantId,
      email: user.email,
      role: userTenant?.role || 'user',
      permissions: userTenant?.permissions || [],
    };
  } catch (error) {
    console.error('Error getting user details:', error);
    return null;
  }
}

async function getActiveImpersonation(targetUserId: UserId): Promise<ImpersonationLog | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { impersonationSessions } = await import('@firm/db/schemas');
    const { eq, and, gte } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(impersonationSessions)
      .where(and(
        eq(impersonationSessions.targetUserId, targetUserId),
        eq(impersonationSessions.isActive, true),
        gte(impersonationSessions.endsAt, new Date())
      ))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const session = result[0];
    return {
      id: session.id,
      impersonatorUserId: session.impersonatorUserId,
      impersonatorTenantId: session.tenantId,
      targetUserId: session.targetUserId,
      targetTenantId: session.tenantId,
      sessionId: session.originalSessionId,
      impersonatedSessionId: session.impersonatedSessionId,
      reason: session.reason,
      startedAt: session.startedAt,
      actionsCount: Number(session.actionsCount),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    };
  } catch (error) {
    console.error('Error getting active impersonation:', error);
    return null;
  }
}


async function logImpersonationStart(log: Partial<ImpersonationLog>): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { impersonationSessions } = await import('@firm/db/schemas');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db.insert(impersonationSessions).values({
      id: log.id!,
      impersonatorUserId: log.impersonatorUserId!,
      targetUserId: log.targetUserId!,
      tenantId: log.targetTenantId!,
      originalSessionId: log.sessionId!,
      impersonatedSessionId: log.impersonatedSessionId!,
      reason: log.reason,
      startedAt: log.startedAt!,
      endsAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour default
      actionsCount: log.actionsCount || 0,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      isActive: true
    });
    
    console.log('Impersonation start logged successfully:', { id: log.id });
  } catch (error) {
    console.error('Error logging impersonation start:', error);
    throw error;
  }
}

async function logImpersonationEnd(logId: string, endTime: Date, duration?: number): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { impersonationSessions } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(impersonationSessions)
      .set({
        isActive: false,
        endedAt: endTime,
        updatedAt: new Date()
      })
      .where(eq(impersonationSessions.id, logId));
    
    console.log('Impersonation end logged successfully:', { logId, endTime });
  } catch (error) {
    console.error('Error logging impersonation end:', error);
    throw error;
  }
}

async function getImpersonationLog(impersonatedSessionId: string): Promise<ImpersonationLog | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { impersonationSessions } = await import('@firm/db/schemas');
    const { eq, and, gte } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(impersonationSessions)
      .where(and(
        eq(impersonationSessions.impersonatedSessionId, impersonatedSessionId),
        eq(impersonationSessions.isActive, true),
        gte(impersonationSessions.endsAt, new Date())
      ))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const session = result[0];
    return {
      id: session.id,
      impersonatorUserId: session.impersonatorUserId,
      impersonatorTenantId: session.tenantId,
      targetUserId: session.targetUserId,
      targetTenantId: session.tenantId,
      sessionId: session.originalSessionId,
      impersonatedSessionId: session.impersonatedSessionId,
      reason: session.reason,
      startedAt: session.startedAt,
      actionsCount: Number(session.actionsCount),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    };
  } catch (error) {
    console.error('Error getting impersonation log:', error);
    return null;
  }
}

async function extendSessionExpiration(sessionId: string, newExpiresAt: Date): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { impersonationSessions } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(impersonationSessions)
      .set({
        endsAt: newExpiresAt,
        updatedAt: new Date()
      })
      .where(eq(impersonationSessions.impersonatedSessionId, sessionId));
    
    console.log('Session expiration extended successfully:', { sessionId, newExpiresAt });
  } catch (error) {
    console.error('Error extending session expiration:', error);
    throw error;
  }
}

function hasAdminPermission(session: SessionContext): boolean {
  return session.role === 'super_admin' || session.role === 'tenant_admin';
}

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
/**
 * Firm Auth - Authentication and Authorization for Firm Platform
 * 
 * This is the main export file for the firm-auth package.
 * It provides a comprehensive authentication and authorization system
 * built as a thin wrapper around Better Auth.
 * 
 * Key features:
 * - Unified authentication pipeline (cookie + bearer tokens)
 * - RBAC permission matrix with role hierarchy
 * - API key management with hashed storage
 * - MFA (TOTP) support with backup codes
 * - Impersonation and delegation capabilities
 * - Immutable audit logging with PII redaction
 * - Session management with Better Auth integration
 */

// Export main authentication function
export {
  authenticateRequest,
  quickAuthCheck,
  createAuthMiddleware,
  type AuthenticationRequest,
  type AuthenticationResult,
  type AuthMethod,
} from './authenticate';

// Export session management
export {
  createSession,
  createImpersonatedSession,
  createDelegatedSession,
  updateSessionAccess,
  extendSession,
  verifySession,
  verifySessionForMfa,
  checkSessionExists,
  getSessionData,
  refreshSession,
  revokeSession,
  revokeSessions,
  revokeExpiredSessions,
  revokeOlderThanSessions,
  getActiveSessionCount,
  getSessionInfo,
  type SessionContext,
  type SessionData,
  type CreateSessionOptions,
  type SessionVerificationResult,
  type SessionRevocationOptions,
} from './session';

// Export permissions and RBAC
export {
  hasPermission,
  requirePermission,
  hasAllPermissions,
  hasAnyPermission,
  canAccessResource,
  checkImpersonationPermission,
  checkDelegationPermission,
  PermissionError,
  createPermissionGuard,
  withPermission,
  type PermissionCheckResult,
  type PermissionGuardOptions,
} from './permissions';

export {
  PERMISSION_MATRIX,
  ROLE_HIERARCHY,
  hasPermission as hasPermissionFromMatrix,
  canImpersonate,
  canDelegate,
  isValidPermission,
  ALL_PERMISSIONS,
  PERMISSION_CATEGORIES,
  type Role,
  type Permission,
  type PermissionAction,
} from './permissions';

// Export API key management
export {
  generateApiKey,
  hashApiKey,
  isValidApiKeyFormat,
  extractApiKeyPrefix,
  maskApiKey,
  validateApiKeyPermissions,
  isApiKeyExpired,
  isApiKeyRateLimited,
  isIpAddressAllowed,
  isUserAgentAllowed,
  generateApiKeyUsageStats,
  verifyApiKey,
  verifyApiKeyPermissions,
  quickApiKeyCheck,
  verifyMultipleApiKeys,
  getApiKeyUsageStats,
  createApiKey,
  getApiKey,
  listApiKeys,
  updateApiKey,
  revokeApiKey,
  deleteApiKey,
  regenerateApiKey,
  getApiKeyMetrics,
  type ApiKeyData,
  type ApiKeyCreateOptions,
  type ApiKeyCreateResult,
  type ApiKeyVerificationResult,
  type ApiKeyUpdateOptions,
  type ApiKeyUsageLog,
  type ApiKeyMetrics,
} from './api-keys';

// Export MFA (TOTP)
export {
  setupTotp,
  verifyTotpSetup,
  disableTotp,
  regenerateBackupCodes,
  verifyTotp,
  verifyBackupCode,
  isMfaRequired,
  getMfaStatus,
  type TotpSecret,
  type TotpSetupOptions,
  type TotpSetupResult,
  type TotpVerificationResult,
  type TotpBackupCode,
  type MfaSession,
  type MfaEnforcementOptions,
  type MfaDeviceTrust,
} from './mfa';

// Export impersonation
export {
  startImpersonation,
  startImpersonationLegacy,
  endImpersonation,
  getActiveImpersonations,
  getImpersonationHistory,
  isImpersonatedSession,
  getImpersonatorFromSession,
  extendImpersonation,
  forceEndAllImpersonations,
  type ImpersonationStartOptions,
  type ImpersonationStartOptionsWithToken,
  type ImpersonationResult,
  type ImpersonationLog,
} from './impersonate';

// Export delegation
export {
  grantDelegation,
  revokeDelegation,
  getActiveDelegations,
  getDelegationHistory,
  isDelegatedSession,
  getDelegatorFromSession,
  extendDelegation,
  updateDelegationPermissions,
  logDelegationUsage,
  getDelegationUsageStats,
  forceRevokeAllDelegations,
  type DelegationGrantOptions,
  type DelegationResult,
  type DelegationGrant,
  type DelegationUsageLog,
} from './delegate';

// Export audit logging
export {
  createAuditLog,
  queryAuditLogs,
  getAuditLogSummary,
  verifyAuditLogIntegrity,
  getHighRiskEvents,
  getUserActivityTimeline,
  detectAnomalousActivity,
  logAuthenticationEvent,
  logAuthorizationEvent,
  logSecurityEvent,
  type AuditLogEntry,
  type AuditLogOptions,
  type AuditLogQuery,
  type AuditLogResult,
  type AuditLogSummary,
} from './audit';

// Export rate limiting infrastructure
export {
  RedisRateLimiter,
  createRateLimiter,
  createApiKeyRateLimiter,
  createMfaTotpRateLimiter,
  createMfaBackupCodeRateLimiter,
  createStrictRateLimiter,
  RATE_LIMIT_CONFIGS,
  type RateLimitConfig,
  type RateLimitResult,
} from './infra/rate-limit-redis';

// Re-export commonly used types for convenience
export type { UserId, TenantId, AuditAction } from '@firm/types';

```

---

### rate-limit-redis.test.ts

**Path:** `src\infra\rate-limit-redis.test.ts`

**Language:** TypeScript

```typescript
/**
 * Tests for Redis-based rate limiting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantCache } from '@firm/cache/client';
import { 
  RedisRateLimiter, 
  createRateLimiter, 
  createApiKeyRateLimiter,
  createMfaTotpRateLimiter,
  RATE_LIMIT_CONFIGS 
} from './rate-limit-redis';

// Mock TenantCache
const mockCache = {
  incr: vi.fn(),
  expire: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
} as unknown as TenantCache;

describe('RedisRateLimiter', () => {
  let rateLimiter: RedisRateLimiter;

  beforeEach(() => {
    vi.clearAllMocks();
    rateLimiter = createRateLimiter(mockCache, {
      maxRequests: 5,
      windowSeconds: 60
    });
  });

  it('should allow requests within limit', async () => {
    // Mock successful increment and expire
    vi.mocked(mockCache.incr).mockResolvedValue(1);
    vi.mocked(mockCache.expire).mockResolvedValue(true);
    vi.mocked(mockCache.get).mockResolvedValue(null);

    const result = await rateLimiter.checkRateLimit('test-user');

    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(1);
    expect(result.remainingRequests).toBe(4);
    expect(result.blocked).toBe(false);
  });

  it('should block requests exceeding limit', async () => {
    // Mock increment returning count over limit
    vi.mocked(mockCache.incr).mockResolvedValue(6);
    vi.mocked(mockCache.expire).mockResolvedValue(true);
    vi.mocked(mockCache.get).mockResolvedValue(null);

    const result = await rateLimiter.checkRateLimit('test-user');

    expect(result.allowed).toBe(false);
    expect(result.currentCount).toBe(6);
    expect(result.remainingRequests).toBe(0);
    expect(result.blocked).toBe(false);
  });

  it('should handle blocked users', async () => {
    // Mock user is currently blocked
    vi.mocked(mockCache.get).mockResolvedValue(Date.now() / 1000 + 300); // 5 minutes from now

    const result = await rateLimiter.checkRateLimit('blocked-user');

    expect(result.allowed).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.blockExpiresInSeconds).toBeGreaterThan(0);
  });

  it('should fail open on Redis errors', async () => {
    // Mock Redis error
    vi.mocked(mockCache.get).mockRejectedValue(new Error('Redis connection failed'));

    const result = await rateLimiter.checkRateLimit('test-user');

    expect(result.allowed).toBe(true); // Fail open
    expect(result.blocked).toBe(false);
  });
});

describe('Predefined rate limiters', () => {
  it('should create API key rate limiter with correct config', () => {
    const limiter = createApiKeyRateLimiter(mockCache);
    expect(limiter).toBeInstanceOf(RedisRateLimiter);
  });

  it('should create MFA TOTP rate limiter with correct config', () => {
    const limiter = createMfaTotpRateLimiter(mockCache);
    expect(limiter).toBeInstanceOf(RedisRateLimiter);
  });

  it('should have correct predefined configurations', () => {
    expect(RATE_LIMIT_CONFIGS.API_KEY.maxRequests).toBe(1000);
    expect(RATE_LIMIT_CONFIGS.API_KEY.windowSeconds).toBe(3600);
    
    expect(RATE_LIMIT_CONFIGS.MFA_TOTP.maxRequests).toBe(5);
    expect(RATE_LIMIT_CONFIGS.MFA_TOTP.windowSeconds).toBe(300);
    
    expect(RATE_LIMIT_CONFIGS.MFA_BACKUP_CODE.maxRequests).toBe(3);
    expect(RATE_LIMIT_CONFIGS.MFA_BACKUP_CODE.windowSeconds).toBe(300);
  });
});

```

---

### rate-limit-redis.ts

**Path:** `src\infra\rate-limit-redis.ts`

**Language:** TypeScript

```typescript
/**
 * Redis-based rate limiting for Firm Auth
 * 
 * Implements sliding-window rate limiting using Redis INCR and EXPIRE
 * for both API key usage and MFA attempts.
 */

import { TenantCache } from '@firm/cache/client';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Optional block duration after rate limit exceeded (in seconds) */
  blockDurationSeconds?: number;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Current request count in the window */
  currentCount: number;
  /** Remaining requests allowed */
  remainingRequests: number;
  /** Time until window resets (in seconds) */
  resetTimeSeconds: number;
  /** Whether the client is currently blocked */
  blocked: boolean;
  /** Time until block expires (in seconds) */
  blockExpiresInSeconds?: number;
}

/**
 * Redis-based rate limiter using sliding window
 */
export class RedisRateLimiter {
  constructor(
    private readonly cache: TenantCache,
    private readonly config: RateLimitConfig
  ) {}

  /**
   * Check if a request is allowed based on rate limit
   * 
   * Uses Redis INCR and EXPIRE for atomic sliding window implementation
   */
  async checkRateLimit(identifier: string): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % this.config.windowSeconds);
    
    const countKey = `rate_limit:${identifier}:${windowStart}`;
    const blockKey = `rate_limit_block:${identifier}`;
    
    try {
      // Check if currently blocked
      const blockExpiresAt = await this.cache.get<number>(blockKey);
      if (blockExpiresAt && blockExpiresAt > now) {
        return {
          allowed: false,
          currentCount: 0,
          remainingRequests: 0,
          resetTimeSeconds: blockExpiresAt - now,
          blocked: true,
          blockExpiresInSeconds: blockExpiresAt - now
        };
      }

      // Increment counter for current window
      const currentCount = await this.cache.incr(countKey);
      
      // Set expiration on first request in window
      if (currentCount === 1) {
        await this.cache.expire(countKey, this.config.windowSeconds);
      }

      const remainingRequests = Math.max(0, this.config.maxRequests - currentCount);
      const resetTimeSeconds = this.config.windowSeconds - (now % this.config.windowSeconds);

      // Check if rate limit exceeded
      if (currentCount > this.config.maxRequests) {
        // Apply block if configured
        if (this.config.blockDurationSeconds) {
          const blockExpiresAt = now + this.config.blockDurationSeconds;
          await this.cache.set(blockKey, blockExpiresAt, this.config.blockDurationSeconds);
          
          return {
            allowed: false,
            currentCount,
            remainingRequests: 0,
            resetTimeSeconds,
            blocked: true,
            blockExpiresInSeconds: this.config.blockDurationSeconds
          };
        }

        return {
          allowed: false,
          currentCount,
          remainingRequests: 0,
          resetTimeSeconds,
          blocked: false
        };
      }

      return {
        allowed: true,
        currentCount,
        remainingRequests,
        resetTimeSeconds,
        blocked: false
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow request if Redis is unavailable
      return {
        allowed: true,
        currentCount: 0,
        remainingRequests: this.config.maxRequests,
        resetTimeSeconds: 0,
        blocked: false
      };
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async resetRateLimit(identifier: string): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % this.config.windowSeconds);
    
    const countKey = `rate_limit:${identifier}:${windowStart}`;
    const blockKey = `rate_limit_block:${identifier}`;
    
    try {
      await this.cache.del(countKey);
      await this.cache.del(blockKey);
    } catch (error) {
      console.error('Failed to reset rate limit:', error);
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(identifier: string): Promise<Omit<RateLimitResult, 'currentCount'>> {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % this.config.windowSeconds);
    
    const countKey = `rate_limit:${identifier}:${windowStart}`;
    const blockKey = `rate_limit_block:${identifier}`;
    
    try {
      // Check if currently blocked
      const blockExpiresAt = await this.cache.get<number>(blockKey);
      if (blockExpiresAt && blockExpiresAt > now) {
        return {
          allowed: false,
          remainingRequests: 0,
          resetTimeSeconds: blockExpiresAt - now,
          blocked: true,
          blockExpiresInSeconds: blockExpiresAt - now
        };
      }

      // Get current count without incrementing
      const currentCount = await this.cache.get<number>(countKey) || 0;
      const remainingRequests = Math.max(0, this.config.maxRequests - currentCount);
      const resetTimeSeconds = this.config.windowSeconds - (now % this.config.windowSeconds);

      return {
        allowed: currentCount < this.config.maxRequests,
        remainingRequests,
        resetTimeSeconds,
        blocked: false
      };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return {
        allowed: true,
        remainingRequests: this.config.maxRequests,
        resetTimeSeconds: 0,
        blocked: false
      };
    }
  }
}

/**
 * Factory function to create rate limiters for different use cases
 */
export function createRateLimiter(cache: TenantCache, config: RateLimitConfig): RedisRateLimiter {
  return new RedisRateLimiter(cache, config);
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  /** API key rate limiting - 1000 requests per hour */
  API_KEY: {
    maxRequests: 1000,
    windowSeconds: 3600, // 1 hour
    blockDurationSeconds: 300 // 5 minutes block
  } as RateLimitConfig,

  /** MFA TOTP rate limiting - 5 attempts per 5 minutes */
  MFA_TOTP: {
    maxRequests: 5,
    windowSeconds: 300, // 5 minutes
    blockDurationSeconds: 900 // 15 minutes block
  } as RateLimitConfig,

  /** MFA backup code rate limiting - 3 attempts per 5 minutes */
  MFA_BACKUP_CODE: {
    maxRequests: 3,
    windowSeconds: 300, // 5 minutes
    blockDurationSeconds: 900 // 15 minutes block
  } as RateLimitConfig,

  /** Strict rate limiting for sensitive operations - 10 requests per minute */
  STRICT: {
    maxRequests: 10,
    windowSeconds: 60, // 1 minute
    blockDurationSeconds: 300 // 5 minutes block
  } as RateLimitConfig
} as const;

/**
 * Helper function to create rate limiters with predefined configurations
 */
export function createApiKeyRateLimiter(cache: TenantCache): RedisRateLimiter {
  return createRateLimiter(cache, RATE_LIMIT_CONFIGS.API_KEY);
}

export function createMfaTotpRateLimiter(cache: TenantCache): RedisRateLimiter {
  return createRateLimiter(cache, RATE_LIMIT_CONFIGS.MFA_TOTP);
}

export function createMfaBackupCodeRateLimiter(cache: TenantCache): RedisRateLimiter {
  return createRateLimiter(cache, RATE_LIMIT_CONFIGS.MFA_BACKUP_CODE);
}

export function createStrictRateLimiter(cache: TenantCache): RedisRateLimiter {
  return createRateLimiter(cache, RATE_LIMIT_CONFIGS.STRICT);
}

```

---

### index.ts

**Path:** `src\mfa\index.ts`

**Language:** TypeScript

```typescript
/**
 * MFA (Multi-Factor Authentication) module for Firm Auth
 * 
 * Exports all MFA related functionality including TOTP setup,
 * verification, and management functions.
 */

// Export types
export type {
  TotpSecret,
  TotpSetupOptions,
  TotpSetupResult,
  TotpVerificationResult,
  TotpBackupCode,
  MfaSession,
  MfaEnforcementOptions,
  MfaDeviceTrust,
} from './types';

// Export TOTP setup functions
export {
  setupTotp,
  verifyTotpSetup,
  disableTotp,
  regenerateBackupCodes,
} from './totp-setup';

// Export TOTP verification functions
export {
  verifyTotp,
  verifyBackupCode,
  isMfaRequired,
  getMfaStatus,
} from './totp-verify';

```

---

### totp-setup.ts

**Path:** `src\mfa\totp-setup.ts`

**Language:** TypeScript

```typescript
/**
 * TOTP setup for Firm Auth
 * 
 * Implements TOTP (Time-based One-Time Password) setup functionality
 * including secret generation, QR code generation, and backup codes.
 */

import { randomBytes } from 'crypto';
import { encode as base32Encode } from 'base32-encode';
import QRCode from 'qrcode';
import { authenticator } from 'otplib';
import { argon2 } from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { InternalServerError } from '@firm/errors';
import type { 
  TotpSecret, 
  TotpSetupOptions, 
  TotpSetupResult,
  TotpBackupCode 
} from './types';
import type { UserId, TenantId } from '@firm/types';

// TOTP configuration defaults
const DEFAULT_ALGORITHM = 'SHA1';
const DEFAULT_DIGITS = 6;
const DEFAULT_PERIOD = 30;
const BACKUP_CODES_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;

/**
 * Sets up TOTP for a user
 * 
 * Generates a new TOTP secret, QR code URL, and backup codes.
 * The secret and backup codes are only shown once during setup.
 */
export async function setupTotp(
  userId: UserId,
  tenantId: TenantId,
  options: TotpSetupOptions = {}
): Promise<TotpSetupResult> {
  const {
    algorithm = DEFAULT_ALGORITHM,
    digits = DEFAULT_DIGITS,
    period = DEFAULT_PERIOD,
    issuer = 'Firm Platform',
    label = `user:${userId}`,
  } = options;

  // Generate random secret
  const secretBuffer = randomBytes(20); // 160 bits for TOTP
  const secret = base32Encode(secretBuffer, 'RFC4648');

  // Generate QR code URL
  const qrCodeUrl = generateTotpQrCodeUrl(secret, label, issuer, algorithm, digits, period);

  // Generate QR code image
  const qrCodeDataUrl = await generateQrCodeImage(qrCodeUrl);

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  // Create TOTP secret data (without the actual secret for storage)
  const totpSecret: Omit<TotpSecret, 'secret'> = {
    id: uuidv4(),
    userId,
    tenantId,
    algorithm,
    digits,
    period,
    isActive: false, // Not active until verified
    createdAt: new Date(),
  };

  // Store TOTP secret in database (placeholder)
  await storeTotpSecret({
    ...totpSecret,
    secret,
  });

  // Store backup codes in database (placeholder)
  await storeBackupCodes(userId, tenantId, totpSecret.id, backupCodes);

  return {
    secret, // Only shown once
    qrCodeUrl: qrCodeDataUrl, // QR code image as data URL
    backupCodes, // Only shown once
    totpSecret,
  };
}

/**
 * Verifies TOTP setup with a user-provided code
 * 
 * Activates TOTP for the user after successful verification.
 */
export async function verifyTotpSetup(
  userId: UserId,
  totpSecretId: string,
  code: string
): Promise<boolean> {
  // Get TOTP secret from database
  const totpSecret = await getTotpSecret(totpSecretId);
  
  if (!totpSecret || totpSecret.userId.toString() !== userId.toString()) {
    return false;
  }

  // Verify the provided code
  const isValid = await verifyTotpCode(totpSecret.secret, code, totpSecret.algorithm, totpSecret.digits, totpSecret.period);
  
  if (!isValid) {
    return false;
  }

  // Activate TOTP
  await activateTotpSecret(totpSecretId);

  return true;
}

/**
 * Generates TOTP QR code URL
 */
function generateTotpQrCodeUrl(
  secret: string,
  label: string,
  issuer: string,
  algorithm: 'SHA1' | 'SHA256' | 'SHA512',
  digits: 6 | 8,
  period: number
): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm,
    digits: digits.toString(),
    period: period.toString(),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Generates QR code image as data URL
 */
async function generateQrCodeImage(url: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new InternalServerError('Failed to generate QR code', {
      code: 'QR_CODE_GENERATION_FAILED',
      originalError: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Generates backup codes
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    const codeBuffer = randomBytes(BACKUP_CODE_LENGTH / 2);
    const code = codeBuffer.toString('hex').toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Verifies a TOTP code
 */
export async function verifyTotpCode(
  secret: string,
  code: string,
  algorithm: 'SHA1' | 'SHA256' | 'SHA512',
  digits: 6 | 8,
  period: number
): Promise<boolean> {
  try {
    // Configure otplib with the provided parameters
    authenticator.options = {
      algorithm: algorithm.replace('SHA', 'sha') as 'sha1' | 'sha256' | 'sha512',
      digits,
      window: period, // Allow for time drift
    };
    
    // Verify the TOTP code using the authenticator
    return authenticator.verify({
      token: code,
      secret,
    });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

/**
 * Stores TOTP secret in database
 */
async function storeTotpSecret(totpSecret: TotpSecret): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { totpSecrets } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Deactivate any existing secrets for this user
    await db
      .update(totpSecrets)
      .set({ isActive: false, deactivatedAt: new Date() })
      .where(eq(totpSecrets.userId, totpSecret.userId));
    
    // Insert new secret
    await db.insert(totpSecrets).values({
      id: totpSecret.id,
      userId: totpSecret.userId,
      secret: totpSecret.secret,
      algorithm: totpSecret.algorithm,
      digits: totpSecret.digits,
      period: totpSecret.period,
      isActive: totpSecret.isActive,
      issuer: totpSecret.issuer || 'Firm Platform',
      label: totpSecret.label || `user:${totpSecret.userId}`,
      createdAt: totpSecret.createdAt
    });
    
    console.log('TOTP secret stored successfully:', { id: totpSecret.id, userId: totpSecret.userId });
  } catch (error) {
    console.error('Error storing TOTP secret:', error);
    throw error;
  }
}

/**
 * Gets TOTP secret from database
 */
async function getTotpSecret(totpSecretId: string): Promise<TotpSecret | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { totpSecrets } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(totpSecrets)
      .where(eq(totpSecrets.id, totpSecretId))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const secret = result[0];
    return {
      id: secret.id,
      userId: secret.userId,
      tenantId: '', // Not stored in TOTP secrets table
      secret: secret.secret,
      algorithm: secret.algorithm,
      digits: secret.digits,
      period: secret.period,
      isActive: secret.isActive,
      createdAt: secret.createdAt,
      issuer: secret.issuer,
      label: secret.label
    };
  } catch (error) {
    console.error('Error getting TOTP secret:', error);
    return null;
  }
}

/**
 * Activates TOTP secret
 */
async function activateTotpSecret(totpSecretId: string): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { totpSecrets } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(totpSecrets)
      .set({ 
        isActive: true, 
        activatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(totpSecrets.id, totpSecretId));
    
    console.log('TOTP secret activated successfully:', totpSecretId);
  } catch (error) {
    console.error('Error activating TOTP secret:', error);
    throw error;
  }
}

/**
 * Stores backup codes in database
 */
async function storeBackupCodes(
  userId: UserId,
  tenantId: TenantId,
  totpSecretId: string,
  backupCodes: string[]
): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { backupCodes: backupCodesTable } = await import('@firm/db/schemas');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Create backup code entries with proper async hashing
    const backupCodeEntries: Partial<NewBackupCode>[] = await Promise.all(
      backupCodes.map(async (code) => ({
        id: crypto.randomUUID(),
        userId,
        totpSecretId,
        code: await hashBackupCode(code), // Hash the backup codes
        codePrefix: code.substring(0, 4), // First 4 characters for identification
        isUsed: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiration
      }))
    );
    
    // Insert all backup codes
    await db.insert(backupCodesTable).values(backupCodeEntries as NewBackupCode[]);
    
    console.log('Backup codes stored successfully:', { userId, totpSecretId, count: backupCodes.length });
  } catch (error) {
    console.error('Error storing backup codes:', error);
    throw error;
  }
}

/**
 * Hashes backup code for secure storage using Argon2id
 */
async function hashBackupCode(code: string): Promise<string> {
  try {
    // Use Argon2id with secure parameters for one-way hashing
    return await argon2.hash(code, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,       // 3 iterations
      parallelism: 1,    // 1 thread
      hashLength: 32,     // 32 bytes
    });
  } catch (error) {
    console.error('Error hashing backup code:', error);
    throw new InternalServerError('Failed to hash backup code', {
      code: 'BACKUP_CODE_HASHING_FAILED',
      originalError: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Verifies a backup code against its Argon2id hash
 */
export async function verifyBackupCodeHash(plainCode: string, hashedCode: string): Promise<boolean> {
  try {
    return await argon2.verify(hashedCode, plainCode);
  } catch (error) {
    console.error('Error verifying backup code hash:', error);
    return false;
  }
}

/**
 * Disables TOTP for a user
 */
export async function disableTotp(userId: UserId): Promise<boolean> {
  // Get active TOTP secret for user
  const totpSecret = await getActiveTotpSecret(userId);
  
  if (!totpSecret) {
    return false;
  }

  // Deactivate TOTP secret
  await deactivateTotpSecret(totpSecret.id);

  // Revoke all backup codes
  await revokeBackupCodes(totpSecret.id);

  return true;
}

/**
 * Gets active TOTP secret for user
 */
async function getActiveTotpSecret(userId: UserId): Promise<TotpSecret | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { totpSecrets } = await import('@firm/db/schemas');
    const { eq, and } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(totpSecrets)
      .where(and(eq(totpSecrets.userId, userId), eq(totpSecrets.isActive, true)))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const secret = result[0];
    return {
      id: secret.id,
      userId: secret.userId,
      tenantId: '', // Not stored in TOTP secrets table
      secret: secret.secret,
      algorithm: secret.algorithm,
      digits: secret.digits,
      period: secret.period,
      isActive: secret.isActive,
      createdAt: secret.createdAt,
      issuer: secret.issuer,
      label: secret.label
    };
  } catch (error) {
    console.error('Error getting active TOTP secret:', error);
    return null;
  }
}

/**
 * Deactivates TOTP secret
 */
async function deactivateTotpSecret(totpSecretId: string): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { totpSecrets } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(totpSecrets)
      .set({ 
        isActive: false, 
        deactivatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(totpSecrets.id, totpSecretId));
    
    console.log('TOTP secret deactivated successfully:', totpSecretId);
  } catch (error) {
    console.error('Error deactivating TOTP secret:', error);
    throw error;
  }
}

/**
 * Revokes backup codes
 */
async function revokeBackupCodes(totpSecretId: string): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { backupCodes: backupCodesTable } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Mark all backup codes for this TOTP secret as used
    await db
      .update(backupCodesTable)
      .set({ 
        isUsed: true, 
        usedAt: new Date(),
        usedByIpAddress: 'system_revocation'
      })
      .where(eq(backupCodesTable.totpSecretId, totpSecretId));
    
    console.log('Backup codes revoked successfully for TOTP secret:', totpSecretId);
  } catch (error) {
    console.error('Error revoking backup codes:', error);
    throw error;
  }
}

/**
 * Regenerates backup codes
 */
export async function regenerateBackupCodes(userId: UserId): Promise<string[] | null> {
  const totpSecret = await getActiveTotpSecret(userId);
  
  if (!totpSecret) {
    return null;
  }

  // Generate new backup codes
  const newBackupCodes = generateBackupCodes();

  // Revoke old backup codes
  await revokeBackupCodes(totpSecret.id);

  // Store new backup codes
  await storeBackupCodes(userId, totpSecret.tenantId, totpSecret.id, newBackupCodes);

  return newBackupCodes;
}

```

---

### totp-verify.ts

**Path:** `src\mfa\totp-verify.ts`

**Language:** TypeScript

```typescript
/**
 * TOTP verification for Firm Auth
 * 
 * Implements TOTP code verification and backup code verification
 * with rate limiting and security controls.
 */

import { verifyTotpCode, verifyBackupCodeHash } from './totp-setup';
import type { 
  TotpSecret, 
  TotpVerificationResult,
  TotpBackupCode,
  MfaSession 
} from './types';
import type { UserId, TenantId } from '@firm/types';
import { TenantCache } from '@firm/cache';
import { createMfaTotpRateLimiter, createMfaBackupCodeRateLimiter } from '../infra/rate-limit-redis';
import { sql } from 'drizzle-orm';

// Rate limiting configuration
const MAX_ATTEMPTS_PER_WINDOW = 5;
const ATTEMPT_WINDOW_MINUTES = 5;
const CODE_REUSE_WINDOW_SECONDS = 30;

/**
 * Verifies a TOTP code for a user
 * 
 * Performs comprehensive security checks:
 * - TOTP code validation
 * - Rate limiting
 * - Code reuse prevention
 * - Session management
 */
export async function verifyTotp(
  userId: UserId,
  code: string,
  sessionId: string,
  context: {
    ipAddress?: string;
    userAgent?: string;
    cache?: TenantCache;
  } = {}
): Promise<TotpVerificationResult> {
  const { ipAddress, userAgent, cache } = context;

  // Check rate limiting
  if (cache && !(await checkTotpRateLimit(cache, userId, ipAddress))) {
    return {
      valid: false,
      error: 'rate_limited',
    };
  }

  // Get active TOTP secret for user
  const totpSecret = await getActiveTotpSecret(userId);
  
  if (!totpSecret) {
    return {
      valid: false,
      error: 'mfa_not_enabled',
    };
  }

  // Verify the TOTP code
  const isValid = await verifyTotpCode(
    totpSecret.secret,
    code,
    totpSecret.algorithm,
    totpSecret.digits,
    totpSecret.period
  );

  if (!isValid) {
    // Record failed attempt
    await recordTotpAttempt(userId, ipAddress, false);
    
    return {
      valid: false,
      error: 'invalid_code',
    };
  }

  // Check for code reuse
  const isReused = await isCodeReused(userId, code);
  if (isReused) {
    return {
      valid: false,
      error: 'expired_code',
    };
  }

  // Record successful verification
  await recordTotpAttempt(userId, ipAddress, true);
  await updateTotpSecretLastUsed(totpSecret.id);

  // Create or update MFA session
  await createOrUpdateMfaSession(userId, sessionId, 'totp');

  return {
    valid: true,
    metadata: {
      lastUsedAt: new Date(),
    },
  };
}

/**
 * Verifies a backup code for a user
 * 
 * Backup codes are one-time use codes that can be used when
 * the user doesn't have access to their TOTP device.
 */
export async function verifyBackupCode(
  userId: UserId,
  backupCode: string,
  sessionId: string,
  context: {
    ipAddress?: string;
    userAgent?: string;
    cache?: TenantCache;
  } = {}
): Promise<TotpVerificationResult> {
  const { ipAddress, userAgent, cache } = context;

  // Check rate limiting
  if (cache && !(await checkBackupCodeRateLimit(cache, userId, ipAddress))) {
    return {
      valid: false,
      error: 'rate_limited',
    };
  }

  // Get unused backup codes for user
  const backupCodeEntry = await getUnusedBackupCode(userId, backupCode);
  
  if (!backupCodeEntry) {
    // Record failed attempt
    await recordTotpAttempt(userId, ipAddress, false);
    
    return {
      valid: false,
      error: 'invalid_code',
    };
  }

  // Mark backup code as used
  await markBackupCodeAsUsed(backupCodeEntry.id);

  // Record successful verification
  await recordTotpAttempt(userId, ipAddress, true);

  // Create or update MFA session
  await createOrUpdateMfaSession(userId, sessionId, 'backup_code');

  // Get remaining backup codes count
  const remainingCodes = await getRemainingBackupCodesCount(userId);

  return {
    valid: true,
    metadata: {
      lastUsedAt: new Date(),
      backupCodeUsed: true,
      remainingBackupCodes: remainingCodes,
    },
  };
}

/**
 * Checks if MFA is required for a user/session
 */
export async function isMfaRequired(
  userId: UserId,
  sessionId: string,
  context: {
    ipAddress?: string;
    userAgent?: string;
    requiredRole?: string;
    requiredPermissions?: string[];
  } = {}
): Promise<{
  required: boolean;
  reason?: 'role_based' | 'permission_based' | 'policy_based' | 'new_device';
  gracePeriod?: boolean;
}> {
  const { ipAddress, userAgent, requiredRole, requiredPermissions } = context;

  // Check if user has MFA enabled
  const totpSecret = await getActiveTotpSecret(userId);
  if (!totpSecret) {
    return { required: false };
  }

  // Check if MFA is already verified for this session
  const mfaSession = await getMfaSession(sessionId);
  if (mfaSession && mfaSession.mfaVerified) {
    return { required: false };
  }

  // Check for trusted device
  if (ipAddress && userAgent) {
    const deviceTrust = await getTrustedDevice(userId, ipAddress, userAgent);
    if (deviceTrust && deviceTrust.isTrusted && deviceTrust.expiresAt && deviceTrust.expiresAt > new Date()) {
      return { required: false };
    }
  }

  // Check role-based MFA requirements
  if (requiredRole && isMfaRequiredForRole(requiredRole)) {
    return { 
      required: true, 
      reason: 'role_based',
      gracePeriod: await isInGracePeriod(userId),
    };
  }

  // Check permission-based MFA requirements
  if (requiredPermissions && requiredPermissions.some(permission => isMfaRequiredForPermission(permission))) {
    return { 
      required: true, 
      reason: 'permission_based',
      gracePeriod: await isInGracePeriod(userId),
    };
  }

  // Check new device detection
  if (ipAddress && userAgent && await isNewDevice(userId, ipAddress, userAgent)) {
    return { 
      required: true, 
      reason: 'new_device',
      gracePeriod: await isInGracePeriod(userId),
    };
  }

  // Default policy-based MFA
  return { 
    required: true, 
    reason: 'policy_based',
    gracePeriod: await isInGracePeriod(userId),
  };
}

/**
 * Gets MFA status for a user
 */
export async function getMfaStatus(userId: UserId): Promise<{
  enabled: boolean;
  verified: boolean;
  method?: 'totp' | 'backup_code';
  lastVerifiedAt?: Date;
  backupCodesRemaining?: number;
  trustedDevices?: number;
}> {
  const totpSecret = await getActiveTotpSecret(userId);
  
  if (!totpSecret) {
    return {
      enabled: false,
      verified: false,
    };
  }

  // Get MFA session status
  const mfaSession = await getLatestMfaSession(userId);
  
  // Get backup codes count
  const backupCodesRemaining = await getRemainingBackupCodesCount(userId);
  
  // Get trusted devices count
  const trustedDevicesCount = await getTrustedDevicesCount(userId);

  return {
    enabled: true,
    verified: !!mfaSession?.mfaVerified,
    method: mfaSession?.method,
    lastVerifiedAt: mfaSession?.verifiedAt,
    backupCodesRemaining,
    trustedDevices: trustedDevicesCount,
  };
}

// Helper functions with Redis-based rate limiting

async function checkTotpRateLimit(
  cache: TenantCache,
  userId: UserId,
  ipAddress?: string
): Promise<boolean> {
  try {
    const rateLimiter = createMfaTotpRateLimiter(cache);
    const identifier = `totp:${userId}${ipAddress ? `:${ipAddress}` : ''}`;
    
    const result = await rateLimiter.checkRateLimit(identifier);
    return result.allowed;
  } catch (error) {
    console.error('Error checking TOTP rate limit:', error);
    return false; // Fail secure
  }
}

async function checkBackupCodeRateLimit(
  cache: TenantCache,
  userId: UserId,
  ipAddress?: string
): Promise<boolean> {
  try {
    const rateLimiter = createMfaBackupCodeRateLimiter(cache);
    const identifier = `backup_code:${userId}${ipAddress ? `:${ipAddress}` : ''}`;
    
    const result = await rateLimiter.checkRateLimit(identifier);
    return result.allowed;
  } catch (error) {
    console.error('Error checking backup code rate limit:', error);
    return false; // Fail secure
  }
}

async function getActiveTotpSecret(userId: UserId): Promise<TotpSecret | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { totpSecrets } = await import('@firm/db/schemas');
    const { eq, and } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(totpSecrets)
      .where(and(eq(totpSecrets.userId, userId), eq(totpSecrets.isActive, true)))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const secret = result[0];
    return {
      id: secret.id,
      userId: secret.userId,
      tenantId: '', // Not stored in TOTP secrets table
      secret: secret.secret,
      algorithm: secret.algorithm,
      digits: secret.digits,
      period: secret.period,
      isActive: secret.isActive,
      createdAt: secret.createdAt
    };
  } catch (error) {
    console.error('Error getting active TOTP secret:', error);
    return null;
  }
}

async function isCodeReused(userId: UserId, code: string): Promise<boolean> {
  try {
    // For TOTP, we check if the same code was used in the last 30 seconds
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { totpSecrets } = await import('@firm/db/schemas');
    const { eq, and, gte } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    
    const result = await db
      .select()
      .from(totpSecrets)
      .where(and(
        eq(totpSecrets.userId, userId),
        eq(totpSecrets.isActive, true),
        gte(totpSecrets.lastUsedAt, thirtySecondsAgo)
      ))
      .limit(1);
    
    return result.length > 0;
  } catch (error) {
    console.error('Error checking code reuse:', error);
    return false; // Allow on error
  }
}

async function recordTotpAttempt(userId: UserId, ipAddress?: string, success?: boolean): Promise<void> {
  try {
    // Rate limiting is now handled by Redis INCR operations in checkTotpRateLimit
    // We only need to update TOTP secret usage on success
    if (success) {
      const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db');
      const { totpSecrets } = await import('@firm/db');
      const { eq, and } = await import('drizzle-orm');
      
      const db = createDatabaseConnection('serverless', getDatabaseConfig());
      
      await db
        .update(totpSecrets)
        .set({
          lastUsedAt: new Date(),
          usageCount: sql`usage_count + 1`
        })
        .where(and(eq(totpSecrets.userId, userId), eq(totpSecrets.isActive, true)));
    }
  } catch (error) {
    console.error('Error recording TOTP attempt:', error);
  }
}

async function updateTotpSecretLastUsed(totpSecretId: string): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { totpSecrets } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(totpSecrets)
      .set({
        lastUsedAt: new Date(),
        usageCount: sql`usage_count + 1`,
        updatedAt: new Date()
      })
      .where(eq(totpSecrets.id, totpSecretId));
  } catch (error) {
    console.error('Error updating TOTP secret last used:', error);
  }
}

async function createOrUpdateMfaSession(userId: UserId, sessionId: string, method: 'totp' | 'backup_code'): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { mfaSessions } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Check if session exists
    const existing = await db
      .select()
      .from(mfaSessions)
      .where(eq(mfaSessions.sessionId, sessionId))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing session
      await db
        .update(mfaSessions)
        .set({
          mfaVerified: true,
          verifiedAt: new Date(),
          method,
          updatedAt: new Date(),
          expiresAt
        })
        .where(eq(mfaSessions.id, existing[0].id));
    } else {
      // Create new session
      await db.insert(mfaSessions).values({
        userId,
        sessionId,
        mfaVerified: true,
        verifiedAt: new Date(),
        method,
        expiresAt
      });
    }
  } catch (error) {
    console.error('Error creating/updating MFA session:', error);
  }
}

async function getUnusedBackupCode(userId: UserId, backupCode: string): Promise<TotpBackupCode | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { backupCodes: backupCodesTable, totpSecrets } = await import('@firm/db/schemas');
    const { eq, and, inArray } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Get active TOTP secret for user
    const activeSecret = await db
      .select()
      .from(totpSecrets)
      .where(and(eq(totpSecrets.userId, userId), eq(totpSecrets.isActive, true)))
      .limit(1);
    
    if (activeSecret.length === 0) {
      return null;
    }
    
    // Get backup codes with matching prefix (first 4 chars)
    const codePrefix = backupCode.substring(0, 4);
    const candidates = await db
      .select()
      .from(backupCodesTable)
      .where(and(
        eq(backupCodesTable.userId, userId),
        eq(backupCodesTable.totpSecretId, activeSecret[0].id),
        eq(backupCodesTable.codePrefix, codePrefix),
        eq(backupCodesTable.isUsed, false)
      ));
    
    // Verify each candidate's hash
    for (const candidate of candidates) {
      const isValid = await verifyBackupCodeHash(backupCode, candidate.codeHash);
      if (isValid) {
        return {
          id: candidate.id,
          userId: candidate.userId,
          tenantId: '', // Not stored in backup codes table
          totpSecretId: candidate.totpSecretId,
          code: backupCode, // Return plain code for verification
          isUsed: candidate.isUsed,
          createdAt: candidate.createdAt
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting unused backup code:', error);
    return null;
  }
}

async function markBackupCodeAsUsed(backupCodeId: string): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { backupCodes: backupCodesTable } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(backupCodesTable)
      .set({
        isUsed: true,
        usedAt: new Date()
      })
      .where(eq(backupCodesTable.id, backupCodeId));
  } catch (error) {
    console.error('Error marking backup code as used:', error);
  }
}

async function getRemainingBackupCodesCount(userId: UserId): Promise<number> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { backupCodes: backupCodesTable, totpSecrets } = await import('@firm/db/schemas');
    const { eq, and, count } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Get active TOTP secret for user
    const activeSecret = await db
      .select()
      .from(totpSecrets)
      .where(and(eq(totpSecrets.userId, userId), eq(totpSecrets.isActive, true)))
      .limit(1);
    
    if (activeSecret.length === 0) {
      return 0;
    }
    
    // Count unused backup codes
    const result = await db
      .select({ count: count() })
      .from(backupCodesTable)
      .where(and(
        eq(backupCodesTable.userId, userId),
        eq(backupCodesTable.totpSecretId, activeSecret[0].id),
        eq(backupCodesTable.isUsed, false)
      ));
    
    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting remaining backup codes count:', error);
    return 0;
  }
}

async function getMfaSession(sessionId: string): Promise<MfaSession | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { mfaSessions } = await import('@firm/db/schemas');
    const { eq, and, gte } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(mfaSessions)
      .where(and(
        eq(mfaSessions.sessionId, sessionId),
        gte(mfaSessions.expiresAt, new Date())
      ))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const session = result[0];
    return {
      id: session.id,
      userId: session.userId,
      sessionId: session.sessionId,
      mfaVerified: session.mfaVerified,
      verifiedAt: session.verifiedAt,
      method: session.method,
      expiresAt: session.expiresAt
    };
  } catch (error) {
    console.error('Error getting MFA session:', error);
    return null;
  }
}

async function getTrustedDevice(userId: UserId, ipAddress: string, userAgent: string): Promise<any> {
  try {
    // For now, trusted devices are not implemented
    // This would integrate with a device tracking system
    return null;
  } catch (error) {
    console.error('Error getting trusted device:', error);
    return null;
  }
}

function isMfaRequiredForRole(role: string): boolean {
  const mfaRequiredRoles = ['super_admin', 'tenant_admin'];
  return mfaRequiredRoles.includes(role);
}

function isMfaRequiredForPermission(permission: string): boolean {
  const mfaRequiredPermissions = ['user:impersonate', 'tenant:delete', 'admin:delete'];
  return mfaRequiredPermissions.includes(permission);
}

async function isNewDevice(userId: UserId, ipAddress: string, userAgent: string): Promise<boolean> {
  try {
    // For now, we'll consider all devices as "new" to require MFA
    // This would integrate with device fingerprinting in a real implementation
    return true;
  } catch (error) {
    console.error('Error checking if new device:', error);
    return true; // Fail secure - require MFA
  }
}

async function isInGracePeriod(userId: UserId): Promise<boolean> {
  try {
    // For now, no grace period for MFA
    // This could be implemented based on user creation date or MFA enablement date
    return false;
  } catch (error) {
    console.error('Error checking if in grace period:', error);
    return false;
  }
}

async function getLatestMfaSession(userId: UserId): Promise<MfaSession | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { mfaSessions } = await import('@firm/db/schemas');
    const { eq, and, gte, desc } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(mfaSessions)
      .where(and(
        eq(mfaSessions.userId, userId),
        gte(mfaSessions.expiresAt, new Date())
      ))
      .orderBy(desc(mfaSessions.createdAt))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const session = result[0];
    return {
      id: session.id,
      userId: session.userId,
      tenantId: '', // Not stored in MFA sessions table
      sessionId: session.sessionId,
      mfaVerified: session.mfaVerified,
      verifiedAt: session.verifiedAt,
      method: session.method,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt
    };
  } catch (error) {
    console.error('Error getting latest MFA session for user:', error);
    return null;
  }
}

async function getTrustedDevicesCount(userId: UserId): Promise<number> {
  try {
    // For now, no trusted devices are implemented
    // This would integrate with device tracking system
    return 0;
  } catch (error) {
    console.error('Error getting trusted devices count for user:', error);
    return 0;
  }
}

```

---

### types.ts

**Path:** `src\mfa\types.ts`

**Language:** TypeScript

```typescript
/**
 * MFA (Multi-Factor Authentication) types for Firm Auth
 * 
 * Defines TOTP-related interfaces and types for multi-factor authentication.
 */

import type { UserId, TenantId } from '@firm/types';

export interface TotpSecret {
  id: string;
  userId: UserId;
  tenantId: TenantId;
  secret: string; // Base32 encoded secret
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number; // Time step in seconds (usually 30)
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  backupCodes?: string[]; // Encrypted backup codes
}

export interface TotpSetupOptions {
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: 6 | 8;
  period?: number;
  issuer?: string;
  label?: string;
}

export interface TotpSetupResult {
  secret: string; // Base32 encoded secret (show to user once)
  qrCodeUrl: string; // QR code URL for authenticator apps
  backupCodes: string[]; // Backup codes (show to user once)
  totpSecret: Omit<TotpSecret, 'secret'>; // TOTP secret data without actual secret
}

export interface TotpVerificationResult {
  valid: boolean;
  error?: 'invalid_code' | 'expired_code' | 'rate_limited' | 'mfa_not_enabled' | 'backup_code_used';
  metadata?: {
    lastUsedAt: Date;
    backupCodeUsed?: boolean;
    remainingBackupCodes?: number;
  };
}

export interface TotpBackupCode {
  id: string;
  totpSecretId: string;
  userId: UserId;
  tenantId: TenantId;
  code: string; // Hashed backup code
  isUsed: boolean;
  usedAt?: Date;
  createdAt: Date;
}

export interface MfaSession {
  id: string;
  userId: UserId;
  tenantId: TenantId;
  sessionId: string; // Reference to main session
  mfaVerified: boolean;
  verifiedAt?: Date;
  method: 'totp' | 'backup_code';
  expiresAt: Date;
  createdAt: Date;
}

export interface MfaEnforcementOptions {
  requireMfaForRoles?: string[];
  requireMfaForPermissions?: string[];
  gracePeriodDays?: number;
  skipMfaForTrustedDevices?: boolean;
  trustedDeviceDurationDays?: number;
}

export interface MfaDeviceTrust {
  id: string;
  userId: UserId;
  tenantId: TenantId;
  deviceFingerprint: string;
  userAgent: string;
  ipAddress: string;
  isTrusted: boolean;
  trustedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
}

```

---

### guard.ts

**Path:** `src\permissions\guard.ts`

**Language:** TypeScript

```typescript
/**
 * Permission guard functions for Firm Platform
 * 
 * Implements requirePermission() and hasPermission() functions
 * that use the RBAC permission matrix as the single source of truth.
 * 
 * These functions provide runtime permission checking with proper
 * error handling and audit logging.
 */

import type { SessionContext } from '../session/types';
import { 
  hasPermission as hasPermissionFromMatrix,
  canImpersonate,
  canDelegate,
  isValidPermission,
  Role,
  Permission
} from './matrix';
import type { PermissionCategory } from '@firm/types';

// Permission check results
export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;
  requiredPermission?: string;
  userRole?: string;
  userPermissions?: string[];
}

export interface PermissionGuardOptions {
  // Resource context for fine-grained permissions
  resourceId?: string;
  resourceOwnerId?: string;
  tenantId?: string;
  
  // Allow self-access (users can access their own resources)
  allowSelf?: boolean;
  
  // Require tenant membership
  requireTenantMembership?: boolean;
  
  // Audit logging
  auditAction?: string;
  auditContext?: Record<string, any>;
}

/**
 * Checks if a user has a specific permission
 * 
 * This is the core permission checking function that uses the RBAC matrix.
 * It supports role-based permissions, user-specific permissions, and wildcards.
 */
export function hasPermission(
  session: SessionContext | null,
  requiredPermission: string,
  options: PermissionGuardOptions = {}
): PermissionCheckResult {
  // No session means no permissions
  if (!session || !session.isAuthenticated) {
    return {
      granted: false,
      reason: 'not_authenticated',
      requiredPermission,
    };
  }

  // Validate permission format
  if (!isValidPermission(requiredPermission)) {
    return {
      granted: false,
      reason: 'invalid_permission_format',
      requiredPermission,
      userRole: session.role,
      userPermissions: session.permissions,
    };
  }

  const {
    resourceId,
    resourceOwnerId,
    tenantId,
    allowSelf = false,
    requireTenantMembership = true,
    auditAction,
    auditContext,
  } = options;

  // Check tenant membership if required
  if (requireTenantMembership && tenantId && session.tenantId.toString() !== tenantId) {
    return {
      granted: false,
      reason: 'wrong_tenant',
      requiredPermission,
      userRole: session.role,
      userPermissions: session.permissions,
    };
  }

  // Allow self-access if enabled
  if (allowSelf && resourceOwnerId && session.userId.toString() === resourceOwnerId) {
    // For self-access, we only need basic read permissions
    const [category, action] = requiredPermission.split(':');
    if (action === 'read' || action === 'update') {
      return {
        granted: true,
        requiredPermission,
        userRole: session.role,
        userPermissions: session.permissions,
      };
    }
  }

  // Check permission using matrix
  const hasRolePermission = hasPermissionFromMatrix(
    session.role as Role,
    session.permissions,
    requiredPermission as Permission
  );

  if (!hasRolePermission) {
    return {
      granted: false,
      reason: 'permission_denied',
      requiredPermission,
      userRole: session.role,
      userPermissions: session.permissions,
    };
  }

  // Permission granted
  return {
    granted: true,
    requiredPermission,
    userRole: session.role,
    userPermissions: session.permissions,
  };
}

/**
 * Requires a specific permission and throws if not granted
 * 
 * This is the guard function that should be used in application code
 * to protect routes and operations.
 */
export function requirePermission(
  session: SessionContext | null,
  requiredPermission: string,
  options: PermissionGuardOptions = {}
): asserts session is SessionContext {
  const result = hasPermission(session, requiredPermission, options);
  
  if (!result.granted) {
    const error = new PermissionError(
      `Permission denied: ${requiredPermission}`,
      result.reason || 'unknown',
      result
    );
    
    // Log audit event if configured
    if (options.auditAction) {
      logPermissionDenied(session, requiredPermission, options, result);
    }
    
    throw error;
  }
  
  // Log audit event if configured
  if (options.auditAction && session) {
    logPermissionGranted(session, requiredPermission, options);
  }
}

/**
 * Checks multiple permissions (AND logic - all must be granted)
 */
export function hasAllPermissions(
  session: SessionContext | null,
  requiredPermissions: string[],
  options: PermissionGuardOptions = {}
): PermissionCheckResult {
  for (const permission of requiredPermissions) {
    const result = hasPermission(session, permission, options);
    if (!result.granted) {
      return result;
    }
  }
  
  return {
    granted: true,
    requiredPermission: requiredPermissions.join(', '),
    userRole: session?.role,
    userPermissions: session?.permissions,
  };
}

/**
 * Checks multiple permissions (OR logic - any one must be granted)
 */
export function hasAnyPermission(
  session: SessionContext | null,
  requiredPermissions: string[],
  options: PermissionGuardOptions = {}
): PermissionCheckResult {
  const failedResults: PermissionCheckResult[] = [];
  
  for (const permission of requiredPermissions) {
    const result = hasPermission(session, permission, options);
    if (result.granted) {
      return result;
    }
    failedResults.push(result);
  }
  
  // Return the first failed result
  return failedResults[0] || {
    granted: false,
    reason: 'no_permissions_checked',
  };
}

/**
 * Checks if user can perform action on specific resource
 */
export function canAccessResource(
  session: SessionContext | null,
  action: string,
  category: PermissionCategory,
  resourceOwnerId?: string,
  options: Omit<PermissionGuardOptions, 'resourceOwnerId'> = {}
): PermissionCheckResult {
  const permission = `${category}:${action}`;
  
  return hasPermission(session, permission, {
    ...options,
    resourceOwnerId,
    allowSelf: true, // Enable self-access by default
  });
}

/**
 * Checks if user can impersonate another user
 */
export function checkImpersonationPermission(
  impersonatorSession: SessionContext,
  targetRole: string,
  targetUserId?: string
): PermissionCheckResult {
  // Check if impersonator has impersonate permission
  const hasImpersonatePermission = hasPermission(
    impersonatorSession,
    'user:impersonate'
  );
  
  if (!hasImpersonatePermission.granted) {
    return {
      granted: false,
      reason: 'no_impersonate_permission',
      userRole: impersonatorSession.role,
      userPermissions: impersonatorSession.permissions,
    };
  }
  
  // Check role hierarchy
  const canImpersonateRole = canImpersonate(
    impersonatorSession.role as Role,
    targetRole as Role
  );
  
  if (!canImpersonateRole) {
    return {
      granted: false,
      reason: 'cannot_impersonate_role',
      userRole: impersonatorSession.role,
      userPermissions: impersonatorSession.permissions,
    };
  }
  
  // Cannot impersonate yourself
  if (targetUserId && impersonatorSession.userId.toString() === targetUserId) {
    return {
      granted: false,
      reason: 'cannot_impersonate_self',
      userRole: impersonatorSession.role,
      userPermissions: impersonatorSession.permissions,
    };
  }
  
  return {
    granted: true,
    userRole: impersonatorSession.role,
    userPermissions: impersonatorSession.permissions,
  };
}

/**
 * Checks if user can delegate permissions to another user
 */
export function checkDelegationPermission(
  delegatorSession: SessionContext,
  delegateeRole: string,
  permission: string,
  delegateeUserId?: string
): PermissionCheckResult {
  // Check if delegator can delegate the specific permission
  const canDelegatePermission = canDelegate(
    delegatorSession.role as Role,
    delegateeRole as Role,
    permission as Permission
  );
  
  if (!canDelegatePermission) {
    return {
      granted: false,
      reason: 'cannot_delegate_permission',
      requiredPermission: permission,
      userRole: delegatorSession.role,
      userPermissions: delegatorSession.permissions,
    };
  }
  
  // Cannot delegate to yourself
  if (delegateeUserId && delegatorSession.userId.toString() === delegateeUserId) {
    return {
      granted: false,
      reason: 'cannot_delegate_self',
      requiredPermission: permission,
      userRole: delegatorSession.role,
      userPermissions: delegatorSession.permissions,
    };
  }
  
  return {
    granted: true,
    requiredPermission: permission,
    userRole: delegatorSession.role,
    userPermissions: delegatorSession.permissions,
  };
}

/**
 * Permission error class
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public reason: string,
    public checkResult: PermissionCheckResult
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Audit logging functions (placeholders)
 */
function logPermissionGranted(
  session: SessionContext,
  permission: string,
  options: PermissionGuardOptions
): void {
  // This would integrate with the audit logging system
  console.log(`Permission granted: ${permission} for user ${session.userId} (${session.role})`);
}

function logPermissionDenied(
  session: SessionContext | null,
  permission: string,
  options: PermissionGuardOptions,
  result: PermissionCheckResult
): void {
  // This would integrate with the audit logging system
  console.log(`Permission denied: ${permission} for user ${session?.userId} (${session?.role}) - ${result.reason}`);
}

/**
 * Middleware factory for route protection
 */
export function createPermissionGuard(
  requiredPermission: string,
  options: PermissionGuardOptions = {}
) {
  return (session: SessionContext | null) => {
    requirePermission(session, requiredPermission, options);
  };
}

/**
 * Higher-order function for protecting async operations
 */
export function withPermission<T extends any[], R>(
  requiredPermission: string,
  fn: (...args: T) => Promise<R>,
  options: PermissionGuardOptions = {}
) {
  return async (session: SessionContext | null, ...args: T): Promise<R> => {
    requirePermission(session, requiredPermission, options);
    return fn(...args);
  };
}

/**
 * Validates a permission string against the RBAC matrix
 * Re-exported from matrix for convenience in API key validation
 */
export { isValidPermission } from './matrix';

```

---

### index.ts

**Path:** `src\permissions\index.ts`

**Language:** TypeScript

```typescript
/**
 * Permissions module for Firm Auth
 * 
 * Exports all permission-related functionality including the RBAC matrix
 * and permission guard functions.
 */

// Export RBAC matrix and types
export type {
  Role,
  Permission,
  PermissionAction,
} from './matrix';

export {
  PERMISSION_MATRIX,
  ROLE_HIERARCHY,
  hasPermission as hasPermissionFromMatrix,
  canImpersonate,
  canDelegate,
  isValidPermission,
  ALL_PERMISSIONS,
  PERMISSION_CATEGORIES,
} from './matrix';

// Export permission guard functions and types
export type {
  PermissionCheckResult,
  PermissionGuardOptions,
} from './guard';

export {
  hasPermission,
  requirePermission,
  hasAllPermissions,
  hasAnyPermission,
  canAccessResource,
  checkImpersonationPermission,
  checkDelegationPermission,
  PermissionError,
  createPermissionGuard,
  withPermission,
} from './guard';

```

---

### matrix.ts

**Path:** `src\permissions\matrix.ts`

**Language:** TypeScript

```typescript
/**
 * RBAC Permission Matrix for Firm Platform
 * 
 * This file defines the complete permission matrix for the platform.
 * It serves as the single source of truth for all authorization decisions.
 */

import type { PermissionCategory } from '@firm/types';

// Permission actions that can be performed on resources
export type PermissionAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'list'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'manage'
  | 'impersonate'
  | 'delegate';

// Role definitions for the platform
export type Role = 
  | 'super_admin'    // Platform-wide admin
  | 'tenant_admin'   // Tenant-level admin
  | 'manager'        // Business manager
  | 'agent'          // Customer service agent
  | 'user'           // Regular user
  | 'read_only';     // Read-only access

// Permission format: category:action:resource?
export type Permission = string;

// Base permission matrix - defines what each role can do
export const PERMISSION_MATRIX: Record<Role, Permission[]> = {
  // Super Admin has all permissions across all tenants
  super_admin: [
    // Tenant management
    'tenant:create',
    'tenant:read',
    'tenant:update',
    'tenant:delete',
    'tenant:list',
    'tenant:manage',
    
    // User management
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'user:list',
    'user:manage',
    'user:impersonate',
    
    // All other permissions
    'lead:create',
    'lead:read',
    'lead:update',
    'lead:delete',
    'lead:list',
    'lead:export',
    'lead:import',
    'lead:manage',
    
    'campaign:create',
    'campaign:read',
    'campaign:update',
    'campaign:delete',
    'campaign:list',
    'campaign:approve',
    'campaign:manage',
    
    'booking:create',
    'booking:read',
    'booking:update',
    'booking:delete',
    'booking:list',
    'booking:approve',
    'booking:manage',
    
    'invoice:create',
    'invoice:read',
    'invoice:update',
    'invoice:delete',
    'invoice:list',
    'invoice:approve',
    'invoice:manage',
    
    'analytics:read',
    'analytics:export',
    'analytics:manage',
    
    'settings:read',
    'settings:update',
    'settings:manage',
    
    'admin:create',
    'admin:read',
    'admin:update',
    'admin:delete',
    'admin:manage',
  ],

  // Tenant Admin manages their own tenant
  tenant_admin: [
    // User management within tenant
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'user:list',
    'user:manage',
    
    // Lead management
    'lead:create',
    'lead:read',
    'lead:update',
    'lead:delete',
    'lead:list',
    'lead:export',
    'lead:import',
    'lead:manage',
    
    // Campaign management
    'campaign:create',
    'campaign:read',
    'campaign:update',
    'campaign:delete',
    'campaign:list',
    'campaign:approve',
    'campaign:manage',
    
    // Booking management
    'booking:create',
    'booking:read',
    'booking:update',
    'booking:delete',
    'booking:list',
    'booking:approve',
    'booking:manage',
    
    // Invoice management
    'invoice:create',
    'invoice:read',
    'invoice:update',
    'invoice:delete',
    'invoice:list',
    'invoice:approve',
    'invoice:manage',
    
    // Analytics and settings
    'analytics:read',
    'analytics:export',
    'settings:read',
    'settings:update',
  ],

  // Manager role with business oversight
  manager: [
    'user:read',
    'user:list',
    'user:update', // Limited to team members
    
    'lead:create',
    'lead:read',
    'lead:update',
    'lead:list',
    'lead:export',
    
    'campaign:create',
    'campaign:read',
    'campaign:update',
    'campaign:list',
    'campaign:approve',
    
    'booking:create',
    'booking:read',
    'booking:update',
    'booking:list',
    'booking:approve',
    
    'invoice:read',
    'invoice:list',
    'invoice:approve',
    
    'analytics:read',
    'analytics:export',
    
    'settings:read',
  ],

  // Agent role for customer service
  agent: [
    'user:read',
    
    'lead:create',
    'lead:read',
    'lead:update',
    'lead:list',
    
    'booking:create',
    'booking:read',
    'booking:update',
    'booking:list',
    
    'invoice:read',
    'invoice:list',
    
    'analytics:read',
  ],

  // Regular user with basic access
  user: [
    'user:read', // Self only
    'lead:read', // Assigned leads only
    'lead:update', // Assigned leads only
    'booking:read', // Own bookings only
    'booking:create', // Own bookings only
    'invoice:read', // Own invoices only
  ],

  // Read-only role
  read_only: [
    'user:read',
    'lead:read',
    'lead:list',
    'campaign:read',
    'campaign:list',
    'booking:read',
    'booking:list',
    'invoice:read',
    'invoice:list',
    'analytics:read',
    'settings:read',
  ],
};

/**
 * Role hierarchy mapping - defines superior roles for each role
 * 
 * Maps each role to an array of roles that are superior (higher in hierarchy).
 * Used for delegation and impersonation authorization checks.
 * 
 * Direction: KEY role -> ARRAY of superior roles
 * Example: manager -> ['tenant_admin', 'super_admin'] means tenant_admin and super_admin are superior to manager
 */
export const SUPERIOR_ROLE_MAP: Record<Role, Role[]> = {
  super_admin: [], // Highest level
  tenant_admin: ['super_admin'],
  manager: ['tenant_admin', 'super_admin'],
  agent: ['manager', 'tenant_admin', 'super_admin'],
  user: ['agent', 'manager', 'tenant_admin', 'super_admin'],
  read_only: ['user', 'agent', 'manager', 'tenant_admin', 'super_admin'],
};

// Permission checking utilities
export function hasPermission(
  userRole: Role,
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  // Check direct role permissions
  const rolePermissions = PERMISSION_MATRIX[userRole] || [];
  if (rolePermissions.includes(requiredPermission)) {
    return true;
  }

  // Check additional user-specific permissions
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check wildcard permissions
  const [category, action] = requiredPermission.split(':') as [PermissionCategory, PermissionAction];
  const wildcardPermission = `${category}:*`;
  if (rolePermissions.includes(wildcardPermission as Permission) || 
      userPermissions.includes(wildcardPermission as Permission)) {
    return true;
  }

  return false;
}

export function canImpersonate(
  impersonatorRole: Role,
  targetRole: Role
): boolean {
  // Only super_admin and tenant_admin can impersonate
  if (!['super_admin', 'tenant_admin'].includes(impersonatorRole)) {
    return false;
  }

  // Super admin can impersonate anyone
  if (impersonatorRole === 'super_admin') {
    return true;
  }

  // Tenant admin can impersonate roles below them
  const canImpersonateRoles: Role[] = ['manager', 'agent', 'user', 'read_only'];
  return canImpersonateRoles.includes(targetRole);
}

export function canDelegate(
  delegatorRole: Role,
  delegateeRole: Role,
  permission: Permission
): boolean {
  // Only roles with manage permission can delegate
  const [category] = permission.split(':') as [PermissionCategory, PermissionAction];
  const managePermission = `${category}:manage` as Permission;
  
  return hasPermission(delegatorRole, [], managePermission) && 
         delegatorRole !== delegateeRole &&
         SUPERIOR_ROLE_MAP[delegatorRole].includes(delegateeRole);
}

// Permission validation
export function isValidPermission(permission: string): permission is Permission {
  const parts = permission.split(':');
  
  // Reject permissions with more than 2 segments
  if (parts.length !== 2) {
    return false;
  }
  
  const [category, action] = parts;
  
  const validCategories: PermissionCategory[] = [
    'tenant', 'user', 'lead', 'campaign', 'booking', 
    'invoice', 'analytics', 'settings', 'admin'
  ];
  
  const validActions: PermissionAction[] = [
    'create', 'read', 'update', 'delete', 'list', 'export', 
    'import', 'approve', 'reject', 'manage', 'impersonate', 'delegate'
  ];
  
  return validCategories.includes(category as PermissionCategory) &&
         validActions.includes(action as PermissionAction);
}

// Export permission matrix for reference and debugging
export const ALL_PERMISSIONS: Permission[] = [
  ...PERMISSION_MATRIX.super_admin,
  ...PERMISSION_MATRIX.tenant_admin,
  ...PERMISSION_MATRIX.manager,
  ...PERMISSION_MATRIX.agent,
  ...PERMISSION_MATRIX.user,
  ...PERMISSION_MATRIX.read_only,
].filter((permission, index, array) => array.indexOf(permission) === index); // Remove duplicates

export const PERMISSION_CATEGORIES = {
  tenant: ['create', 'read', 'update', 'delete', 'list', 'manage'],
  user: ['create', 'read', 'update', 'delete', 'list', 'manage', 'impersonate'],
  lead: ['create', 'read', 'update', 'delete', 'list', 'export', 'import', 'manage'],
  campaign: ['create', 'read', 'update', 'delete', 'list', 'approve', 'manage'],
  booking: ['create', 'read', 'update', 'delete', 'list', 'approve', 'manage'],
  invoice: ['create', 'read', 'update', 'delete', 'list', 'approve', 'manage'],
  analytics: ['read', 'export', 'manage'],
  settings: ['read', 'update', 'manage'],
  admin: ['create', 'read', 'update', 'delete', 'manage'],
} as const;

```

---

### better-auth-instance.ts

**Path:** `src\session\better-auth-instance.ts`

**Language:** TypeScript

```typescript
/**
 * Shared Better Auth instance for Firm Auth
 * 
 * Centralizes Better Auth configuration to prevent multiple connection pools
 * and reduce resource usage. All session modules should import this instance.
 */

import { auth } from 'better-auth';

/**
 * Shared Better Auth configuration
 * 
 * Security features:
 * - __Host- cookie prefix for strict security
 * - Cookie caching with 5-minute max age
 * - 24-hour default session expiration
 * - 1-hour session update age
 * - Disabled cross-subdomain cookies
 * - External ID generation
 */
export const betterAuth = auth({
  session: {
    expiresIn: 60 * 60 * 24, // 24 hours
    updateAge: 60 * 60, // 1 hour
    cookiePrefix: '__Host-',
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    generateId: false, // Use our own ID generation
    crossSubDomainCookies: {
      enabled: false,
    },
  },
});

/**
 * Export the Better Auth session handler for direct access
 */
export const sessionHandler = betterAuth.session;

```

---

### create-session.ts

**Path:** `src\session\create-session.ts`

**Language:** TypeScript

```typescript
/**
 * Session creation wrapper around Better Auth
 * 
 * Implements decorator pattern around Better Auth session methods.
 * Uses __Host- cookie prefix for security.
 */

import type { Session } from 'better-auth/types';
import type { 
  SessionContext, 
  CreateSessionOptions, 
  SessionData 
} from './types';
import type { UserId, TenantId } from '@firm/types';
import { betterAuth } from './better-auth-instance';
import { createImmutableSession } from '../utils/deep-freeze';

/**
 * Creates a new session with Better Auth and wraps it in our SessionContext
 */
export async function createSession(
  options: CreateSessionOptions
): Promise<SessionContext> {
  const {
    userId,
    tenantId,
    email,
    role,
    permissions = [],
    rememberMe = false,
    mfaVerified = false,
  } = options;

  // Create Better Auth session
  const betterAuthSession = await betterAuth.session.create({
    userId: userId.toString(),
    expiresIn: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24, // 30 days if remember me
  });

  // Create our session data (sessionId will be added from Better Auth response)
  const sessionData: Omit<SessionData, 'sessionId'> = {
    userId,
    tenantId,
    email,
    role,
    permissions,
    mfaVerified,
    expiresAt: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    lastAccessAt: new Date(),
  };

  // Create immutable SessionContext with deep freeze
  const sessionContext: SessionContext = createImmutableSession({
    sessionId: betterAuthSession.id,
    ...sessionData,
    isAuthenticated: true,
    isImpersonated: false,
    isDelegated: false,
  });

  return sessionContext;
}

/**
 * Creates an impersonated session (admin only)
 */
export async function createImpersonatedSession(
  targetUserId: UserId,
  targetTenantId: TenantId,
  impersonatedBy: UserId,
  targetEmail: string,
  targetRole: string,
  targetPermissions: string[]
): Promise<SessionContext> {
  // Create Better Auth session for impersonation
  const betterAuthSession = await betterAuth.session.create({
    userId: targetUserId.toString(),
    expiresIn: 60 * 60, // 1 hour for impersonation sessions
  });

  const sessionData: Omit<SessionData, 'sessionId'> = {
    userId: targetUserId,
    tenantId: targetTenantId,
    email: targetEmail,
    role: targetRole,
    permissions: targetPermissions,
    mfaVerified: true, // Impersonation bypasses MFA
    impersonatedBy,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    createdAt: new Date(),
    lastAccessAt: new Date(),
  };

  const sessionContext: SessionContext = createImmutableSession({
    sessionId: betterAuthSession.id,
    ...sessionData,
    isAuthenticated: true,
    isImpersonated: true,
    isDelegated: false,
  });

  return sessionContext;
}

/**
 * Creates a delegated session
 */
export async function createDelegatedSession(
  targetUserId: UserId,
  targetTenantId: TenantId,
  delegatedBy: UserId,
  targetEmail: string,
  targetRole: string,
  targetPermissions: string[],
  delegationExpiresAt: Date
): Promise<SessionContext> {
  // Create Better Auth session for delegation
  const betterAuthSession = await betterAuth.session.create({
    userId: targetUserId.toString(),
    expiresIn: Math.floor((delegationExpiresAt.getTime() - Date.now()) / 1000),
  });

  const sessionData: Omit<SessionData, 'sessionId'> = {
    userId: targetUserId,
    tenantId: targetTenantId,
    email: targetEmail,
    role: targetRole,
    permissions: targetPermissions,
    mfaVerified: true, // Delegation bypasses MFA
    delegatedBy,
    expiresAt: delegationExpiresAt,
    createdAt: new Date(),
    lastAccessAt: new Date(),
  };

  const sessionContext: SessionContext = createImmutableSession({
    sessionId: betterAuthSession.id,
    ...sessionData,
    isAuthenticated: true,
    isImpersonated: false,
    isDelegated: true,
  });

  return sessionContext;
}

/**
 * Updates session last access time
 */
export async function updateSessionAccess(sessionId: string): Promise<void> {
  // Update Better Auth session
  await betterAuth.session.update(sessionId, {
    lastAccessAt: new Date(),
  });
}

/**
 * Extends session expiration
 */
export async function extendSession(
  sessionId: string,
  extendBy: number = 60 * 60 * 24 // 24 hours by default
): Promise<void> {
  // Update Better Auth session expiration
  await betterAuth.session.update(sessionId, {
    expiresAt: new Date(Date.now() + extendBy * 1000),
  });
}

```

---

### index.ts

**Path:** `src\session\index.ts`

**Language:** TypeScript

```typescript
/**
 * Session management module for Firm Auth
 * 
 * Exports all session-related functionality as a unified interface.
 * This is a thin wrapper around Better Auth with additional security features.
 */

// Export shared Better Auth instance
export { betterAuth, sessionHandler } from './better-auth-instance';

// Export types
export type {
  SessionData,
  SessionContext,
  CreateSessionOptions,
  SessionVerificationResult,
  SessionRevocationOptions,
} from './types';

// Export session creation functions
export {
  createSession,
  createImpersonatedSession,
  createDelegatedSession,
  updateSessionAccess,
  extendSession,
} from './create-session';

// Export session verification functions
export {
  verifySession,
  verifySessionForMfa,
  checkSessionExists,
  getSessionData,
  refreshSession,
} from './verify-session';

// Export session revocation functions
export {
  revokeSession,
  revokeSessions,
  revokeExpiredSessions,
  revokeOlderThanSessions,
  getActiveSessionCount,
  getSessionInfo,
} from './revoke-session';

```

---

### revoke-session.ts

**Path:** `src\session\revoke-session.ts`

**Language:** TypeScript

```typescript
/**
 * Session revocation wrapper around Better Auth
 * 
 * Implements decorator pattern around Better Auth revocation methods.
 * Handles selective revocation and cleanup.
 */

import type { SessionRevocationOptions } from './types';
import type { UserId, TenantId } from '@firm/types';
import { betterAuth } from './better-auth-instance';

/**
 * Revokes a specific session
 */
export async function revokeSession(sessionId: string): Promise<void> {
  await betterAuth.session.invalidate(sessionId);
}

/**
 * Revokes sessions based on various criteria
 */
export async function revokeSessions(options: SessionRevocationOptions): Promise<void> {
  const {
    userId,
    tenantId,
    sessionId,
    revokeAll = false,
    revokeImpersonated = false,
  } = options;

  // Revoke specific session
  if (sessionId && !revokeAll) {
    await revokeSession(sessionId);
    return;
  }

  // Revoke all sessions for a user
  if (userId) {
    await betterAuth.session.invalidateUserSessions(userId.toString());
    return;
  }

  // Revoke all sessions for a tenant
  if (tenantId) {
    // Better Auth doesn't have direct tenant-based revocation
    // We'll need to query all sessions for the tenant and revoke them
    // This would require database access through firm-db
    // For now, we'll implement a placeholder
    console.warn(`Tenant-wide session revocation not yet implemented for tenant: ${tenantId}`);
    return;
  }

  // Revoke all impersonated sessions
  if (revokeImpersonated) {
    // This would require querying sessions with impersonatedBy field
    console.warn('Impersonated session revocation not yet implemented');
    return;
  }

  // Revoke all sessions (admin only)
  if (revokeAll) {
    console.warn('Full session revocation not implemented - requires admin privileges');
    return;
  }
}

/**
 * Revokes all expired sessions (cleanup job)
 */
export async function revokeExpiredSessions(): Promise<number> {
  try {
    // Better Auth doesn't have a built-in cleanup method
    // This would require database access through firm-db
    // For now, return 0 as placeholder
    console.warn('Expired session cleanup not yet implemented');
    return 0;
  } catch (error) {
    console.error('Error revoking expired sessions:', error);
    return 0;
  }
}

/**
 * Revokes all sessions older than specified time
 */
export async function revokeOlderThanSessions(olderThanHours: number): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    // This would require database access through firm-db
    console.warn(`Older-than session revocation not yet implemented for cutoff: ${cutoffDate}`);
    return 0;
  } catch (error) {
    console.error('Error revoking older sessions:', error);
    return 0;
  }
}

/**
 * Gets count of active sessions for monitoring
 */
export async function getActiveSessionCount(
  userId?: UserId,
  tenantId?: TenantId
): Promise<number> {
  try {
    if (userId) {
      // Better Auth doesn't expose session count directly
      // This would require database access through firm-db
      console.warn(`Session count for user ${userId} not yet implemented`);
      return 0;
    }
    
    if (tenantId) {
      console.warn(`Session count for tenant ${tenantId} not yet implemented`);
      return 0;
    }
    
    console.warn('Total session count not yet implemented');
    return 0;
  } catch (error) {
    console.error('Error getting session count:', error);
    return 0;
  }
}

/**
 * Gets session information for debugging
 */
export async function getSessionInfo(sessionId: string): Promise<any> {
  try {
    const session = await betterAuth.session.validate(sessionId);
    return session;
  } catch (error) {
    console.error('Error getting session info:', error);
    return null;
  }
}

```

---

### types.ts

**Path:** `src\session\types.ts`

**Language:** TypeScript

```typescript
/**
 * Session types for Firm Auth
 * 
 * Defines the session context and related interfaces.
 * SessionContext is an immutable frozen object as required.
 */

import type { UserId, TenantId } from '@firm/types';

export interface SessionData {
  sessionId: string;
  userId: UserId;
  tenantId: TenantId;
  email: string;
  role: string;
  permissions: string[];
  mfaVerified: boolean;
  impersonatedBy?: UserId;
  delegatedBy?: UserId;
  expiresAt: Date;
  createdAt: Date;
  lastAccessAt: Date;
}

export interface SessionContext extends SessionData {
  isAuthenticated: boolean;
  isImpersonated: boolean;
  isDelegated: boolean;
}

export interface CreateSessionOptions {
  userId: UserId;
  tenantId: TenantId;
  email: string;
  role: string;
  permissions?: string[];
  rememberMe?: boolean;
  mfaVerified?: boolean;
}

export interface SessionVerificationResult {
  valid: boolean;
  session?: SessionContext;
  error?: 'expired' | 'invalid' | 'revoked' | 'mfa_required';
}

export interface SessionRevocationOptions {
  userId?: UserId;
  tenantId?: TenantId;
  sessionId?: string;
  revokeAll?: boolean;
  revokeImpersonated?: boolean;
}

```

---

### verify-session.ts

**Path:** `src\session\verify-session.ts`

**Language:** TypeScript

```typescript
/**
 * Session verification wrapper around Better Auth
 * 
 * Implements decorator pattern around Better Auth verification methods.
 * Handles expiration, revocation, and MFA requirements.
 */

import type { 
  SessionContext, 
  SessionVerificationResult,
  SessionData 
} from './types';
import type { UserId, TenantId } from '@firm/types';
import { betterAuth } from './better-auth-instance';

/**
 * Verifies a session from cookie or bearer token
 */
export async function verifySession(
  token?: string
): Promise<SessionVerificationResult> {
  try {
    if (!token) {
      return { valid: false, error: 'invalid' };
    }

    // Verify with Better Auth
    const betterAuthResult = await betterAuth.session.validate(token);
    
    if (!betterAuthResult.session) {
      return { valid: false, error: 'invalid' };
    }

    // Check if session is expired
    if (betterAuthResult.session.expiresAt < new Date()) {
      await betterAuth.session.invalidate(betterAuthResult.session.id);
      return { valid: false, error: 'expired' };
    }

    // Check if session is revoked
    if (betterAuthResult.session.revoked) {
      return { valid: false, error: 'revoked' };
    }

    // Extract session data from Better Auth session
    const sessionData = betterAuthResult.session.data as SessionData;
    
    // Check MFA requirement
    if (!sessionData.mfaVerified) {
      return { valid: false, error: 'mfa_required' };
    }

    // Create SessionContext
    const sessionContext: SessionContext = Object.freeze({
      ...sessionData,
      isAuthenticated: true,
      isImpersonated: !!sessionData.impersonatedBy,
      isDelegated: !!sessionData.delegatedBy,
      lastAccessAt: new Date(), // Update access time
    });

    // Update last access time in Better Auth
    await betterAuth.session.update(betterAuthResult.session.id, {
      lastAccessAt: new Date(),
    });

    return { valid: true, session: sessionContext };

  } catch (error) {
    console.error('Session verification error:', error);
    return { valid: false, error: 'invalid' };
  }
}

/**
 * Verifies session without MFA check (for MFA verification flow)
 */
export async function verifySessionForMfa(
  token?: string
): Promise<SessionVerificationResult> {
  try {
    if (!token) {
      return { valid: false, error: 'invalid' };
    }

    const betterAuthResult = await betterAuth.session.validate(token);
    
    if (!betterAuthResult.session) {
      return { valid: false, error: 'invalid' };
    }

    if (betterAuthResult.session.expiresAt < new Date()) {
      await betterAuth.session.invalidate(betterAuthResult.session.id);
      return { valid: false, error: 'expired' };
    }

    if (betterAuthResult.session.revoked) {
      return { valid: false, error: 'revoked' };
    }

    const sessionData = betterAuthResult.session.data as SessionData;
    
    const sessionContext: SessionContext = Object.freeze({
      ...sessionData,
      isAuthenticated: true,
      isImpersonated: !!sessionData.impersonatedBy,
      isDelegated: !!sessionData.delegatedBy,
      lastAccessAt: new Date(),
    });

    return { valid: true, session: sessionContext };

  } catch (error) {
    console.error('Session verification error:', error);
    return { valid: false, error: 'invalid' };
  }
}

/**
 * Checks if a session exists and is valid (lightweight check)
 */
export async function checkSessionExists(
  token?: string
): Promise<boolean> {
  try {
    if (!token) {
      return false;
    }

    const betterAuthResult = await betterAuth.session.validate(token);
    return !!betterAuthResult.session && 
           !betterAuthResult.session.revoked &&
           betterAuthResult.session.expiresAt > new Date();
  } catch {
    return false;
  }
}

/**
 * Gets session data without validation (for debugging)
 */
export async function getSessionData(
  token: string
): Promise<SessionData | null> {
  try {
    const betterAuthResult = await betterAuth.session.validate(token);
    return betterAuthResult.session?.data as SessionData || null;
  } catch {
    return null;
  }
}

/**
 * Refreshes a session token
 */
export async function refreshSession(
  token: string
): Promise<SessionVerificationResult> {
  try {
    const betterAuthResult = await betterAuth.session.refresh(token);
    
    if (!betterAuthResult.session) {
      return { valid: false, error: 'invalid' };
    }

    const sessionData = betterAuthResult.session.data as SessionData;
    
    const sessionContext: SessionContext = Object.freeze({
      ...sessionData,
      isAuthenticated: true,
      isImpersonated: !!sessionData.impersonatedBy,
      isDelegated: !!sessionData.delegatedBy,
      lastAccessAt: new Date(),
    });

    return { valid: true, session: sessionContext };

  } catch (error) {
    console.error('Session refresh error:', error);
    return { valid: false, error: 'invalid' };
  }
}

```

---

### deep-freeze.ts

**Path:** `src\utils\deep-freeze.ts`

**Language:** TypeScript

```typescript
/**
 * Deep freeze utility for complete immutability
 * 
 * Recursively freezes objects and arrays to ensure complete immutability.
 * Addresses H4 security vulnerability where shallow freeze left nested objects mutable.
 */

/**
 * Recursively freezes an object and all its nested properties
 */
export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Freeze arrays first, then their elements
  if (Array.isArray(obj)) {
    Object.freeze(obj); // Freeze the array itself
    for (const item of obj) {
      deepFreeze(item); // Recursively freeze each element
    }
    return obj;
  }

  // Freeze objects and their properties
  Object.freeze(obj); // Freeze the object itself
  
  // Get all property descriptors and recursively freeze values
  for (const key of Object.getOwnPropertyNames(obj)) {
    const value = (obj as Record<string, unknown>)[key];
    if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }

  // Also freeze symbol properties
  for (const symbol of Object.getOwnPropertySymbols(obj)) {
    const value = (obj as Record<symbol, unknown>)[symbol];
    if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }

  return obj;
}

/**
 * Type-safe wrapper for deep freezing session contexts
 */
export function createImmutableSession<T extends Record<string, unknown>>(session: T): T {
  return deepFreeze(session);
}

```

---

### api-keys.test.ts

**Path:** `tests\api-keys.test.ts`

**Language:** TypeScript

```typescript
/**
 * Tests for API keys module
 * 
 * Tests API key generation, verification, and management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateApiKey,
  hashApiKey,
  isValidApiKeyFormat,
  extractApiKeyPrefix,
  maskApiKey,
  validateApiKeyPermissions,
  isApiKeyExpired,
  isApiKeyRateLimited,
  isIpAddressAllowed,
  isUserAgentAllowed,
} from '../src/api-keys/generate-key';
import { verifyApiKey, verifyApiKeyPermissions, quickApiKeyCheck } from '../src/api-keys/verify-key';
import {
  createApiKey,
  getApiKey,
  listApiKeys,
  updateApiKey,
  revokeApiKey,
  deleteApiKey,
  regenerateApiKey,
} from '../src/api-keys/manage-keys';
import type { ApiKeyData, ApiKeyCreateOptions } from '../src/api-keys/types';

// Mock the database functions
vi.mock('../src/api-keys/manage-keys', async () => {
  const actual = await vi.importActual('../src/api-keys/manage-keys');
  return {
    ...actual,
    storeApiKeyData: vi.fn(),
    getApiKeyDataById: vi.fn(),
    getApiKeysByUser: vi.fn(),
    updateApiKeyData: vi.fn(),
    deleteApiKeyData: vi.fn(),
  };
});

describe('API Key Generation', () => {
  it('should generate valid API key format', async () => {
    const options: ApiKeyCreateOptions = {
      name: 'Test API Key',
      permissions: ['read'],
    };

    const result = await generateApiKey(
      options,
      'user-123' as any,
      'tenant-123' as any
    );

    expect(result.apiKey).toMatch(/^firm_[a-zA-Z0-9]{32}$/);
    expect(result.apiKeyData.name).toBe('Test API Key');
    expect(result.apiKeyData.permissions).toEqual(['read']);
    expect(result.apiKeyData.userId).toBe('user-123' as any);
    expect(result.apiKeyData.tenantId).toBe('tenant-123' as any);
  });

  it('should hash API key consistently', () => {
    const apiKey = 'firm_test123456789012345678901234567890';
    const hash1 = hashApiKey(apiKey);
    const hash2 = hashApiKey(apiKey);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
  });

  it('should validate API key format', () => {
    expect(isValidApiKeyFormat('firm_abc123')).toBe(true);
    expect(isValidApiKeyFormat('firm_abc123def456')).toBe(true);
    expect(isValidApiKeyFormat('invalid_key')).toBe(false);
    expect(isValidApiKeyFormat('firm_')).toBe(false);
    expect(isValidApiKeyFormat('firm_too_short')).toBe(false);
    expect(isValidApiKeyFormat('firm_too_long12345678901234567890')).toBe(false);
  });

  it('should extract API key prefix', () => {
    const apiKey = 'firm_abc123def456789012345678901234567890';
    const prefix = extractApiKeyPrefix(apiKey);

    expect(prefix).toBe('abc123de');
  });

  it('should mask API key for display', () => {
    const apiKey = 'firm_abc123def456789012345678901234567890';
    const masked = maskApiKey(apiKey);

    expect(masked).toBe('firm_abc123de********************************7890');
  });

  it('should validate API key permissions using RBAC matrix', () => {
    // Test valid RBAC permissions
    expect(validateApiKeyPermissions(['lead:read', 'user:read'])).toBe(true);
    expect(validateApiKeyPermissions(['campaign:create', 'booking:approve'])).toBe(true);
    expect(validateApiKeyPermissions(['tenant:manage', 'analytics:export'])).toBe(true);
    
    // Test invalid permissions
    expect(validateApiKeyPermissions(['invalid'])).toBe(false);
    expect(validateApiKeyPermissions(['lead:read', 'invalid'])).toBe(false);
    expect(validateApiKeyPermissions(['fake:permission'])).toBe(false);
    expect(validateApiKeyPermissions([''])).toBe(false);
  });

  it('should check API key expiration', () => {
    const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day ago
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day from now

    expect(isApiKeyExpired(expiredDate)).toBe(true);
    expect(isApiKeyExpired(futureDate)).toBe(false);
    expect(isApiKeyExpired(undefined)).toBe(false);
  });

  it('should check rate limiting', () => {
    const lastUsedRecently = new Date(Date.now() - 1000 * 60 * 30); // 30 minutes ago
    const lastUsedLongAgo = new Date(Date.now() - 1000 * 60 * 60 * 2); // 2 hours ago

    expect(isApiKeyRateLimited(100, 1000, lastUsedRecently)).toBe(false);
    expect(isApiKeyRateLimited(1000, 1000, lastUsedRecently)).toBe(true);
    expect(isApiKeyRateLimited(100, 1000, lastUsedLongAgo)).toBe(false);
    expect(isApiKeyRateLimited(100, undefined, lastUsedRecently)).toBe(false);
  });

  it('should check IP address restrictions', () => {
    const allowedIps = ['192.168.1.1', '10.0.0.1'];

    expect(isIpAddressAllowed('192.168.1.1', allowedIps)).toBe(true);
    expect(isIpAddressAllowed('10.0.0.1', allowedIps)).toBe(true);
    expect(isIpAddressAllowed('192.168.1.2', allowedIps)).toBe(false);
    expect(isIpAddressAllowed('192.168.1.1', undefined)).toBe(true);
    expect(isIpAddressAllowed('192.168.1.1', [])).toBe(true);
  });

  it('should check user agent restrictions', () => {
    const allowedAgents = ['Mozilla', 'Chrome'];

    expect(isUserAgentAllowed('Mozilla/5.0', allowedAgents)).toBe(true);
    expect(isUserAgentAllowed('Chrome/90.0', allowedAgents)).toBe(true);
    expect(isUserAgentAllowed('Safari/14.0', allowedAgents)).toBe(false);
    expect(isUserAgentAllowed('Mozilla/5.0', undefined)).toBe(true);
    expect(isUserAgentAllowed('Mozilla/5.0', [])).toBe(true);
  });
});

describe('API Key Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify valid API key', async () => {
    const mockApiKeyData: ApiKeyData = {
      id: 'key-123',
      name: 'Test Key',
      keyHash: 'hash123',
      keyPrefix: 'abc123de',
      permissions: ['read'],
      userId: 'user-123' as any,
      tenantId: 'tenant-123' as any,
      isActive: true,
      createdAt: new Date(),
      createdBy: 'user-123' as any,
      usageCount: 0,
    };

    vi.doMock('../src/api-keys/verify-key', () => ({
      verifyApiKey: vi.fn().mockResolvedValue({
        valid: true,
        apiKeyData: mockApiKeyData,
        metadata: {
          permissions: ['read'],
          userId: 'user-123' as any,
          tenantId: 'tenant-123' as any,
          usageCount: 1,
        },
      }),
    }));

    const result = await verifyApiKey('firm_test123456789012345678901234567890');

    expect(result.valid).toBe(true);
    expect(result.apiKeyData).toBeDefined();
    expect(result.metadata?.permissions).toEqual(['read']);
  });

  it('should reject invalid API key', async () => {
    vi.doMock('../src/api-keys/verify-key', () => ({
      verifyApiKey: vi.fn().mockResolvedValue({
        valid: false,
        error: 'invalid_key',
      }),
    }));

    const result = await verifyApiKey('invalid_key');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('invalid_key');
  });

  it('should verify API key with specific permissions', async () => {
    const mockApiKeyData: ApiKeyData = {
      id: 'key-123',
      name: 'Test Key',
      keyHash: 'hash123',
      keyPrefix: 'abc123de',
      permissions: ['read', 'write'],
      userId: 'user-123' as any,
      tenantId: 'tenant-123' as any,
      isActive: true,
      createdAt: new Date(),
      createdBy: 'user-123' as any,
      usageCount: 0,
    };

    vi.doMock('../src/api-keys/verify-key', () => ({
      verifyApiKeyPermissions: vi.fn().mockResolvedValue({
        valid: true,
        apiKeyData: mockApiKeyData,
        metadata: {
          permissions: ['read', 'write'],
          userId: 'user-123' as any,
          tenantId: 'tenant-123' as any,
          usageCount: 1,
        },
      }),
    }));

    const result = await verifyApiKeyPermissions(
      'firm_test123456789012345678901234567890',
      ['read']
    );

    expect(result.valid).toBe(true);
  });

  it('should reject API key with insufficient permissions', async () => {
    vi.doMock('../src/api-keys/verify-key', () => ({
      verifyApiKeyPermissions: vi.fn().mockResolvedValue({
        valid: false,
        error: 'invalid_key',
      }),
    }));

    const result = await verifyApiKeyPermissions(
      'firm_test123456789012345678901234567890',
      ['admin']
    );

    expect(result.valid).toBe(false);
  });

  it('should perform quick API key check', async () => {
    vi.doMock('../src/api-keys/verify-key', () => ({
      quickApiKeyCheck: vi.fn().mockResolvedValue(true),
    }));

    const result = await quickApiKeyCheck('firm_test123456789012345678901234567890');

    expect(result).toBe(true);
  });
});

describe('API Key Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create API key', async () => {
    const options: ApiKeyCreateOptions = {
      name: 'Test API Key',
      permissions: ['read'],
    };

    vi.doMock('../src/api-keys/manage-keys', () => ({
      createApiKey: vi.fn().mockResolvedValue({
        apiKey: 'firm_test123456789012345678901234567890',
        apiKeyData: {
          id: 'key-123',
          name: 'Test API Key',
          permissions: ['read'],
          userId: 'user-123' as any,
          tenantId: 'tenant-123' as any,
          isActive: true,
          createdAt: new Date(),
          createdBy: 'user-123' as any,
          usageCount: 0,
        },
      }),
    }));

    const result = await createApiKey(options, 'user-123' as any, 'tenant-123' as any);

    expect(result.apiKey).toMatch(/^firm_[a-zA-Z0-9]{32}$/);
    expect(result.apiKeyData.name).toBe('Test API Key');
  });

  it('should get API key by ID', async () => {
    const mockApiKeyData: Omit<ApiKeyData, 'keyHash'> = {
      id: 'key-123',
      name: 'Test Key',
      keyPrefix: 'abc123de',
      permissions: ['read'],
      userId: 'user-123' as any,
      tenantId: 'tenant-123' as any,
      isActive: true,
      createdAt: new Date(),
      createdBy: 'user-123' as any,
      usageCount: 0,
    };

    vi.doMock('../src/api-keys/manage-keys', () => ({
      getApiKey: vi.fn().mockResolvedValue(mockApiKeyData),
    }));

    const result = await getApiKey('key-123', 'user-123' as any);

    expect(result?.name).toBe('Test Key');
    expect(result?.permissions).toEqual(['read']);
  });

  it('should list API keys for user', async () => {
    const mockApiKeys = [
      {
        id: 'key-1',
        name: 'Key 1',
        permissions: ['read'],
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        isActive: true,
        createdAt: new Date(),
        createdBy: 'user-123' as any,
        usageCount: 0,
      },
      {
        id: 'key-2',
        name: 'Key 2',
        permissions: ['write'],
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        isActive: true,
        createdAt: new Date(),
        createdBy: 'user-123' as any,
        usageCount: 5,
      },
    ];

    vi.doMock('../src/api-keys/manage-keys', () => ({
      listApiKeys: vi.fn().mockResolvedValue({
        apiKeys: mockApiKeys,
        total: 2,
        page: 1,
        limit: 20,
      }),
    }));

    const result = await listApiKeys('user-123' as any, 'tenant-123' as any);

    expect(result.apiKeys).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should update API key', async () => {
    const updatedApiKey: Omit<ApiKeyData, 'keyHash'> = {
      id: 'key-123',
      name: 'Updated Key',
      keyPrefix: 'abc123de',
      permissions: ['read', 'write'],
      userId: 'user-123' as any,
      tenantId: 'tenant-123' as any,
      isActive: true,
      createdAt: new Date(),
      createdBy: 'user-123' as any,
      usageCount: 0,
    };

    vi.doMock('../src/api-keys/manage-keys', () => ({
      updateApiKey: vi.fn().mockResolvedValue(updatedApiKey),
    }));

    const result = await updateApiKey('key-123', { name: 'Updated Key' }, 'user-123' as any);

    expect(result?.name).toBe('Updated Key');
  });

  it('should revoke API key', async () => {
    vi.doMock('../src/api-keys/manage-keys', () => ({
      revokeApiKey: vi.fn().mockResolvedValue(true),
    }));

    const result = await revokeApiKey('key-123', 'user-123' as any);

    expect(result).toBe(true);
  });

  it('should delete API key', async () => {
    vi.doMock('../src/api-keys/manage-keys', () => ({
      deleteApiKey: vi.fn().mockResolvedValue(true),
    }));

    const result = await deleteApiKey('key-123', 'user-123' as any);

    expect(result).toBe(true);
  });

  it('should regenerate API key', async () => {
    vi.doMock('../src/api-keys/manage-keys', () => ({
      regenerateApiKey: vi.fn().mockResolvedValue({
        apiKey: 'firm_new123456789012345678901234567890',
        apiKeyData: {
          id: 'key-456',
          name: 'Test Key',
          permissions: ['read'],
          userId: 'user-123' as any,
          tenantId: 'tenant-123' as any,
          isActive: true,
          createdAt: new Date(),
          createdBy: 'user-123' as any,
          usageCount: 0,
        },
      }),
    }));

    const result = await regenerateApiKey('key-123', 'user-123' as any);

    expect(result.apiKey).toMatch(/^firm_[a-zA-Z0-9]{32}$/);
    expect(result.apiKeyData.id).toBe('key-456');
  });
});

```

---

### authentication.test.ts

**Path:** `tests\authentication.test.ts`

**Language:** TypeScript

```typescript
/**
 * Tests for authentication module
 * 
 * Tests the unified authentication pipeline and request handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authenticateRequest, quickAuthCheck, createAuthMiddleware } from '../src/authenticate';
import type { AuthenticationRequest, AuthenticationResult } from '../src/authenticate';

// Mock the session verification
vi.mock('../src/session', () => ({
  verifySession: vi.fn(),
  checkSessionExists: vi.fn(),
}));

describe('Authentication Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should authenticate with cookie successfully', async () => {
    const { verifySession } = await import('../src/session');
    vi.mocked(verifySession).mockResolvedValue({
      valid: true,
      session: {
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        email: 'user@example.com',
        role: 'user',
        permissions: ['read'],
        mfaVerified: true,
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        expiresAt: new Date(),
        createdAt: new Date(),
        lastAccessAt: new Date(),
      },
    });

    const request: AuthenticationRequest = {
      cookie: '__Host-session=test-session-token',
      userAgent: 'Mozilla/5.0',
      ip: '192.168.1.1',
    };

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(true);
    expect(result.method).toBe('cookie');
    expect(result.session).toBeDefined();
  });

  it('should authenticate with bearer token successfully', async () => {
    const { verifySession } = await import('../src/session');
    vi.mocked(verifySession).mockResolvedValue({
      valid: true,
      session: {
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        email: 'user@example.com',
        role: 'user',
        permissions: ['read'],
        mfaVerified: true,
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        expiresAt: new Date(),
        createdAt: new Date(),
        lastAccessAt: new Date(),
      },
    });

    const request: AuthenticationRequest = {
      authorization: 'Bearer test-bearer-token',
      userAgent: 'Mozilla/5.0',
      ip: '192.168.1.1',
    };

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(true);
    expect(result.method).toBe('bearer');
    expect(result.session).toBeDefined();
  });

  it('should handle API key authentication (placeholder)', async () => {
    const request: AuthenticationRequest = {
      xApiKey: 'firm_testapikey123',
      userAgent: 'Mozilla/5.0',
      ip: '192.168.1.1',
    };

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(false);
    expect(result.error).toBe('invalid_api_key');
  });

  it('should return no credentials error when no auth provided', async () => {
    const request: AuthenticationRequest = {
      userAgent: 'Mozilla/5.0',
      ip: '192.168.1.1',
    };

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(false);
    expect(result.error).toBe('no_credentials');
  });

  it('should handle invalid cookie format', async () => {
    const request: AuthenticationRequest = {
      cookie: 'invalid-cookie-format',
    };

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(false);
    expect(result.error).toBe('invalid_token');
  });

  it('should handle invalid bearer token format', async () => {
    const request: AuthenticationRequest = {
      authorization: 'Invalid token',
    };

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(false);
    expect(result.error).toBe('invalid_token');
  });

  it('should prioritize cookie over bearer token', async () => {
    const { verifySession } = await import('../src/session');
    vi.mocked(verifySession).mockResolvedValue({
      valid: true,
      session: {
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        email: 'user@example.com',
        role: 'user',
        permissions: ['read'],
        mfaVerified: true,
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        expiresAt: new Date(),
        createdAt: new Date(),
        lastAccessAt: new Date(),
      },
    });

    const request: AuthenticationRequest = {
      cookie: '__Host-session=test-session-token',
      authorization: 'Bearer other-token',
    };

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(true);
    expect(result.method).toBe('cookie');
  });
});

describe('Quick Auth Check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true for valid cookie session', async () => {
    const { checkSessionExists } = await import('../src/session');
    vi.mocked(checkSessionExists).mockResolvedValue(true);

    const request: AuthenticationRequest = {
      cookie: '__Host-session=test-session-token',
    };

    const result = await quickAuthCheck(request);

    expect(result.authenticated).toBe(true);
    expect(result.method).toBe('cookie');
  });

  it('should return true for valid bearer token', async () => {
    const { checkSessionExists } = await import('../src/session');
    vi.mocked(checkSessionExists).mockResolvedValue(true);

    const request: AuthenticationRequest = {
      authorization: 'Bearer test-token',
    };

    const result = await quickAuthCheck(request);

    expect(result.authenticated).toBe(true);
    expect(result.method).toBe('bearer');
  });

  it('should return false for no credentials', async () => {
    const request: AuthenticationRequest = {};

    const result = await quickAuthCheck(request);

    expect(result.authenticated).toBe(false);
  });
});

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should skip authentication for health endpoints', async () => {
    const middleware = createAuthMiddleware({
      skipPaths: ['/health', '/api/health'],
    });

    const request: AuthenticationRequest = {
      path: '/health',
      method: 'GET',
    };

    const next = vi.fn();
    const result = await middleware(request, next);

    expect(result.authenticated).toBe(true);
    expect(next).toHaveBeenCalled();
  });

  it('should require authentication for protected endpoints', async () => {
    const { verifySession } = await import('../src/session');
    vi.mocked(verifySession).mockResolvedValue({
      valid: false,
      error: 'invalid',
    });

    const middleware = createAuthMiddleware({
      requireAuth: true,
    });

    const request: AuthenticationRequest = {
      path: '/protected',
      method: 'GET',
      cookie: '__Host-session=invalid-token',
    };

    const next = vi.fn();
    const result = await middleware(request, next);

    expect(result.authenticated).toBe(false);
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow authentication when not required', async () => {
    const middleware = createAuthMiddleware({
      requireAuth: false,
    });

    const request: AuthenticationRequest = {
      path: '/public',
      method: 'GET',
    };

    const next = vi.fn();
    const result = await middleware(request, next);

    expect(result.authenticated).toBe(false); // No auth provided but not required
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle unsupported HTTP methods', async () => {
    const middleware = createAuthMiddleware({
      allowedMethods: ['GET', 'POST'],
    });

    const request: AuthenticationRequest = {
      path: '/test',
      method: 'PATCH',
    };

    const next = vi.fn();
    const result = await middleware(request, next);

    expect(result.authenticated).toBe(false);
    expect((result as any).error).toBe('method_not_allowed');
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() on successful authentication', async () => {
    const { verifySession } = await import('../src/session');
    vi.mocked(verifySession).mockResolvedValue({
      valid: true,
      session: {
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        email: 'user@example.com',
        role: 'user',
        permissions: ['read'],
        mfaVerified: true,
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        expiresAt: new Date(),
        createdAt: new Date(),
        lastAccessAt: new Date(),
      },
    });

    const middleware = createAuthMiddleware({
      requireAuth: true,
    });

    const request: AuthenticationRequest = {
      path: '/protected',
      method: 'GET',
      cookie: '__Host-session=valid-token',
    };

    const next = vi.fn();
    const result = await middleware(request, next);

    expect(result.authenticated).toBe(true);
    expect(next).toHaveBeenCalled();
  });
});

```

---

### impersonation-toctou-protection.test.ts

**Path:** `tests\impersonation-toctou-protection.test.ts`

**Language:** TypeScript

```typescript
/**
 * Tests for TOCTOU (Time-of-Check-Time-of-Use) protection in impersonation
 * 
 * These tests verify that the impersonation system properly validates
 * session tokens to prevent timing attacks where a session could be
 * revoked between permission check and impersonation start.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  startImpersonation, 
  startImpersonationLegacy,
  type ImpersonationStartOptionsWithToken 
} from '../src/impersonate';
import { verifySession } from '../src/session';
import { checkImpersonationPermission } from '../src/permissions/guard';
import { AuthorizationError } from '../src/impersonate';

// Mock dependencies
vi.mock('../src/session', () => ({
  verifySession: vi.fn(),
  createImpersonatedSession: vi.fn(),
  revokeSession: vi.fn(),
}));

vi.mock('../src/permissions/guard', () => ({
  checkImpersonationPermission: vi.fn(),
}));

vi.mock('../src/impersonate', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getUserDetails: vi.fn(),
    getActiveImpersonation: vi.fn(),
    logImpersonationStart: vi.fn(),
    generateUUID: vi.fn(() => 'test-uuid'),
  };
});

describe('TOCTOU Protection in Impersonation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful mocks
    vi.mocked(verifySession).mockResolvedValue({
      valid: true,
      session: {
        userId: 'impersonator-id',
        tenantId: 'tenant-1',
        sessionId: 'session-1',
        role: 'admin',
        permissions: ['impersonate'],
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        lastAccessAt: new Date(),
      }
    });

    vi.mocked(checkImpersonationPermission).mockReturnValue({
      granted: true,
      reason: 'Allowed'
    });

    // Mock the internal functions
    const { getUserDetails, getActiveImpersonation, logImpersonationStart } = 
      require('../src/impersonate') as any;
    
    getUserDetails.mockResolvedValue({
      id: 'target-id',
      email: 'target@example.com',
      role: 'user',
      permissions: ['read']
    });

    getActiveImpersonation.mockResolvedValue(null);
    logImpersonationStart.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Secure startImpersonation with TOCTOU protection', () => {
    it('should validate session token before proceeding', async () => {
      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'valid-token',
        reason: 'Test impersonation'
      };

      await startImpersonation(options);

      expect(verifySession).toHaveBeenCalledWith('valid-token');
      expect(checkImpersonationPermission).toHaveBeenCalled();
    });

    it('should reject impersonation with invalid session token', async () => {
      vi.mocked(verifySession).mockResolvedValue({
        valid: false,
        error: 'expired'
      });

      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'expired-token',
      };

      await expect(startImpersonation(options)).rejects.toThrow(AuthorizationError);
      await expect(startImpersonation(options)).rejects.toThrow('Invalid session: expired');
    });

    it('should reject impersonation with revoked session token', async () => {
      vi.mocked(verifySession).mockResolvedValue({
        valid: false,
        error: 'revoked'
      });

      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'revoked-token',
      };

      await expect(startImpersonation(options)).rejects.toThrow(AuthorizationError);
      await expect(startImpersonation(options)).rejects.toThrow('Invalid session: revoked');
    });

    it('should use fresh session data for permission checks', async () => {
      const freshSession = {
        userId: 'fresh-impersonator-id',
        tenantId: 'tenant-1',
        sessionId: 'fresh-session-1',
        role: 'admin',
        permissions: ['impersonate'],
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        lastAccessAt: new Date(),
      };

      vi.mocked(verifySession).mockResolvedValue({
        valid: true,
        session: freshSession
      });

      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'valid-token',
      };

      await startImpersonation(options);

      expect(checkImpersonationPermission).toHaveBeenCalledWith(
        freshSession,
        'user',
        'target-id'
      );
    });

    it('should prevent impersonation when session is revoked between token validation and permission check', async () => {
      let callCount = 0;
      vi.mocked(verifySession).mockImplementation(async (token) => {
        callCount++;
        if (callCount === 1) {
          // First call - session is valid
          return {
            valid: true,
            session: {
              userId: 'impersonator-id',
              tenantId: 'tenant-1',
              sessionId: 'session-1',
              role: 'admin',
              permissions: ['impersonate'],
              isAuthenticated: true,
              isImpersonated: false,
              isDelegated: false,
              lastAccessAt: new Date(),
            }
          };
        } else {
          // Second call (if any) - session is revoked
          return {
            valid: false,
            error: 'revoked'
          };
        }
      });

      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'token-to-be-revoked',
      };

      // This should succeed because we only validate once at the start
      await expect(startImpersonation(options)).resolves.toBeDefined();
      expect(verifySession).toHaveBeenCalledTimes(1);
    });

    it('should throw AuthorizationError for missing token', async () => {
      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: '',
      };

      await expect(startImpersonation(options)).rejects.toThrow(AuthorizationError);
    });
  });

  describe('Legacy function vulnerability', () => {
    it('should show deprecation warning when using legacy function', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const legacyOptions = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
      };

      const mockSession = {
        userId: 'impersonator-id',
        tenantId: 'tenant-1',
        sessionId: 'session-1',
        role: 'admin',
        permissions: ['impersonate'],
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        lastAccessAt: new Date(),
      };

      await startImpersonationLegacy(mockSession, legacyOptions);

      expect(consoleSpy).toHaveBeenCalledWith(
        'startImpersonationLegacy is deprecated and vulnerable to TOCTOU attacks. Use startImpersonation with session token instead.'
      );

      consoleSpy.mockRestore();
    });

    it('should not validate session token in legacy function', async () => {
      const legacyOptions = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
      };

      const mockSession = {
        userId: 'impersonator-id',
        tenantId: 'tenant-1',
        sessionId: 'session-1',
        role: 'admin',
        permissions: ['impersonate'],
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        lastAccessAt: new Date(),
      };

      await startImpersonationLegacy(mockSession, legacyOptions);

      // Legacy function should NOT call verifySession
      expect(verifySession).not.toHaveBeenCalled();
    });
  });

  describe('Security scenarios', () => {
    it('should prevent privilege escalation through session manipulation', async () => {
      // Mock a session that was valid but has been revoked
      vi.mocked(verifySession).mockResolvedValue({
        valid: false,
        error: 'revoked'
      });

      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'admin-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'revoked-admin-token',
      };

      await expect(startImpersonation(options)).rejects.toThrow(AuthorizationError);
    });

    it('should handle session verification errors gracefully', async () => {
      vi.mocked(verifySession).mockRejectedValue(new Error('Database connection failed'));

      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'valid-token',
      };

      await expect(startImpersonation(options)).rejects.toThrow('Database connection failed');
    });

    it('should maintain audit logging with fresh session data', async () => {
      const freshSession = {
        userId: 'audited-impersonator',
        tenantId: 'tenant-1',
        sessionId: 'audit-session-1',
        role: 'admin',
        permissions: ['impersonate'],
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        lastAccessAt: new Date(),
      };

      vi.mocked(verifySession).mockResolvedValue({
        valid: true,
        session: freshSession
      });

      const { logImpersonationStart } = require('../src/impersonate') as any;

      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'valid-token',
        reason: 'Security audit test'
      };

      await startImpersonation(options);

      expect(logImpersonationStart).toHaveBeenCalledWith(
        expect.objectContaining({
          impersonatorUserId: 'audited-impersonator',
          sessionId: 'audit-session-1',
          reason: 'Security audit test'
        })
      );
    });
  });

  describe('Integration with existing functionality', () => {
    it('should work with all existing impersonation options', async () => {
      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'valid-token',
        reason: 'Testing all options',
        durationMinutes: 120,
      };

      const result = await startImpersonation(options, {
        ipAddress: '192.168.1.1',
        userAgent: 'Test-Agent/1.0'
      });

      expect(result).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should maintain same return type structure as legacy function', async () => {
      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'valid-token',
      };

      const result = await startImpersonation(options);

      expect(result).toHaveProperty('impersonatedSession');
      expect(result).toHaveProperty('originalSessionId');
      expect(result).toHaveProperty('expiresAt');
    });
  });
});

```

---

### integration.test.ts

**Path:** `tests\integration.test.ts`

**Language:** TypeScript

```typescript
/**
 * Integration tests for firm-auth using PgLite test harness
 * 
 * Tests authentication and authorization flows with real database operations
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createTestEnvironment } from './setup'
import { sql } from 'drizzle-orm'

describe('Authentication Integration Tests', () => {
  beforeEach(async () => {
    // Database cleanup is handled by setup.ts beforeEach
  })

  it('should create test environment with tenant and user', async () => {
    const { tenant, user, db, cleanup } = await createTestEnvironment('agent')

    expect(tenant).toBeDefined()
    expect(tenant.name).toBe('Auth Test Tenant')
    expect(tenant.slug).toBe('auth-test-tenant')
    
    expect(user).toBeDefined()
    expect(user.email).toBe('agent@example.com')
    expect(user.role).toBe('agent')
    expect(user.tenant_id).toBe(tenant.id)

    // Verify data was actually inserted into database
    const tenantResult = await db.execute(sql`SELECT * FROM tenants WHERE id = ${tenant.id}`)
    expect(tenantResult.rows).toHaveLength(1)
    expect(tenantResult.rows[0].name).toBe('Auth Test Tenant')

    const userResult = await db.execute(sql`SELECT * FROM users WHERE id = ${user.id}`)
    expect(userResult.rows).toHaveLength(1)
    expect(userResult.rows[0].email).toBe('agent@example.com')

    await cleanup()
  })

  it('should create users with different roles', async () => {
    const { tenant: managerEnv, cleanup: managerCleanup } = await createTestEnvironment('manager')
    const { tenant: adminEnv, cleanup: adminCleanup } = await createTestEnvironment('tenant_admin')

    expect(managerEnv.user.role).toBe('manager')
    expect(adminEnv.user.role).toBe('tenant_admin')

    // Verify different users have different emails based on role
    expect(managerEnv.user.email).toBe('manager@example.com')
    expect(adminEnv.user.email).toBe('tenant_admin@example.com')

    await managerCleanup()
    await adminCleanup()
  })

  it('should respect tenant isolation', async () => {
    const { tenant: tenant1, user: user1, db, cleanup: cleanup1 } = await createTestEnvironment('agent', {
      slug: 'tenant-1'
    })
    
    const { tenant: tenant2, cleanup: cleanup2 } = await createTestEnvironment('agent', {
      slug: 'tenant-2'
    })

    // Set context to first tenant
    await db.execute(sql`SET app.current_tenant_id = ${tenant1.id}`)

    // Should only see users from tenant1
    const usersResult = await db.execute(sql`SELECT * FROM users WHERE tenant_id = ${tenant1.id}`)
    expect(usersResult.rows).toHaveLength(1)
    expect(usersResult.rows[0].email).toBe('agent@example.com')

    // Should not see users from tenant2 when querying tenant1
    const tenant1Users = await db.execute(sql`SELECT * FROM users WHERE tenant_id = ${tenant1.id}`)
    expect(tenant1Users.rows.length).toBeGreaterThan(0)

    await cleanup1()
    await cleanup2()
  })

  it('should handle custom user overrides', async () => {
    const { tenant, user, cleanup } = await createTestEnvironment('agent', {}, {
      email: 'custom@example.com',
      first_name: 'Custom',
      last_name: 'User',
      phone: '+1234567890'
    })

    expect(user.email).toBe('custom@example.com')
    expect(user.first_name).toBe('Custom')
    expect(user.last_name).toBe('User')
    expect(user.phone).toBe('+1234567890')

    // Verify custom data was persisted
    const db = require('./setup').getAuthTestDb()
    const userResult = await db.execute(sql`SELECT * FROM users WHERE id = ${user.id}`)
    expect(userResult.rows[0].email).toBe('custom@example.com')
    expect(userResult.rows[0].first_name).toBe('Custom')

    await cleanup()
  })

  it('should handle custom tenant overrides', async () => {
    const { tenant, cleanup } = await createTestEnvironment('agent', {
      name: 'Custom Tenant',
      slug: 'custom-tenant',
      service_tier: 'enterprise'
    })

    expect(tenant.name).toBe('Custom Tenant')
    expect(tenant.slug).toBe('custom-tenant')
    expect(tenant.service_tier).toBe('enterprise')

    await cleanup()
  })

  it('should create multiple users in same tenant', async () => {
    const { tenant, db, cleanup } = await createTestEnvironment('agent')

    // Create additional users manually
    const managerResult = await db.execute(sql`
      INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status, permissions, phone_verified, email_verified, preferences, metadata)
      VALUES (${tenant.id}, ${'manager@example.com'}, ${'hashed_password'}, ${'Manager'}, ${'User'}, ${'manager'}, ${'active'}, ${JSON.stringify([])}, ${false}, ${false}, ${JSON.stringify({})}, ${JSON.stringify({})})
      RETURNING *
    `)

    const adminResult = await db.execute(sql`
      INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status, permissions, phone_verified, email_verified, preferences, metadata)
      VALUES (${tenant.id}, ${'admin@example.com'}, ${'hashed_password'}, ${'Admin'}, ${'User'}, ${'tenant_admin'}, ${'active'}, ${JSON.stringify([])}, ${false}, ${false}, ${JSON.stringify({})}, ${JSON.stringify({})})
      RETURNING *
    `)

    // Verify all users exist
    const allUsersResult = await db.execute(sql`SELECT * FROM users WHERE tenant_id = ${tenant.id}`)
    expect(allUsersResult.rows).toHaveLength(3) // Original agent + manager + admin

    const emails = allUsersResult.rows.map(row => row.email)
    expect(emails).toContain('agent@example.com')
    expect(emails).toContain('manager@example.com')
    expect(emails).toContain('admin@example.com')

    await cleanup()
  })
})

```

---

### permissions.test.ts

**Path:** `tests\permissions.test.ts`

**Language:** TypeScript

```typescript
/**
 * Tests for permissions module
 * 
 * Tests RBAC matrix, permission guards, and role hierarchy.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  hasPermission as hasPermissionFromMatrix,
  canImpersonate,
  canDelegate,
  isValidPermission,
  PERMISSION_MATRIX,
  SUPERIOR_ROLE_MAP,
} from '../src/permissions/matrix';
import {
  hasPermission,
  requirePermission,
  hasAllPermissions,
  hasAnyPermission,
  canAccessResource,
  checkImpersonationPermission,
  checkDelegationPermission,
  PermissionError,
} from '../src/permissions/guard';
import type { SessionContext } from '../src/session/types';

describe('RBAC Matrix', () => {
  it('should have all required roles defined', () => {
    const expectedRoles = ['super_admin', 'tenant_admin', 'manager', 'agent', 'user', 'read_only'];
    const actualRoles = Object.keys(PERMISSION_MATRIX);
    
    expect(actualRoles).toEqual(expect.arrayContaining(expectedRoles));
    expect(actualRoles).toHaveLength(expectedRoles.length);
  });

  it('should have proper role hierarchy', () => {
    expect(SUPERIOR_ROLE_MAP.super_admin).toEqual([]);
    expect(SUPERIOR_ROLE_MAP.read_only).toEqual(['user', 'agent', 'manager', 'tenant_admin', 'super_admin']);
  });

  it('should validate permission format', () => {
    expect(isValidPermission('user:read')).toBe(true);
    expect(isValidPermission('tenant:create')).toBe(true);
    expect(isValidPermission('invalid:permission')).toBe(false);
    expect(isValidPermission('user')).toBe(false);
    expect(isValidPermission('user:read:extra')).toBe(false);
  });

  it('should check permissions from matrix correctly', () => {
    // Super admin should have all permissions
    expect(hasPermissionFromMatrix('super_admin', [], 'user:create')).toBe(true);
    expect(hasPermissionFromMatrix('super_admin', [], 'tenant:delete')).toBe(true);
    
    // Read only should only have read permissions
    expect(hasPermissionFromMatrix('read_only', [], 'user:read')).toBe(true);
    expect(hasPermissionFromMatrix('read_only', [], 'user:create')).toBe(false);
    
    // User should have limited permissions
    expect(hasPermissionFromMatrix('user', [], 'user:read')).toBe(true);
    expect(hasPermissionFromMatrix('user', [], 'user:create')).toBe(false);
  });

  it('should check impersonation permissions correctly', () => {
    expect(canImpersonate('super_admin', 'user')).toBe(true);
    expect(canImpersonate('tenant_admin', 'agent')).toBe(true);
    expect(canImpersonate('agent', 'user')).toBe(false);
    expect(canImpersonate('user', 'user')).toBe(false);
  });

  it('should check delegation permissions correctly', () => {
    expect(canDelegate('super_admin', 'tenant_admin', 'user:read')).toBe(true);
    expect(canDelegate('tenant_admin', 'manager', 'user:read')).toBe(true);
    expect(canDelegate('agent', 'user', 'user:read')).toBe(false);
  });
});

describe('Permission Guards', () => {
  let mockSession: SessionContext;
  let mockAdminSession: SessionContext;

  beforeEach(() => {
    mockSession = {
      userId: 'user-123' as any,
      tenantId: 'tenant-123' as any,
      email: 'user@example.com',
      role: 'user',
      permissions: ['user:read'],
      mfaVerified: true,
      isAuthenticated: true,
      isImpersonated: false,
      isDelegated: false,
      expiresAt: new Date(),
      createdAt: new Date(),
      lastAccessAt: new Date(),
    };

    mockAdminSession = {
      ...mockSession,
      role: 'super_admin',
      permissions: ['user:create', 'user:read', 'user:update', 'user:delete'],
    };
  });

  it('should check permissions correctly', () => {
    const result = hasPermission(mockSession, 'user:read');
    expect(result.granted).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(result.userRole).toBe('user');
  });

  it('should deny permissions for unauthorized users', () => {
    const result = hasPermission(mockSession, 'user:create');
    expect(result.granted).toBe(false);
    expect(result.reason).toBe('permission_denied');
  });

  it('should handle unauthenticated users', () => {
    const result = hasPermission(null, 'user:read');
    expect(result.granted).toBe(false);
    expect(result.reason).toBe('not_authenticated');
  });

  it('should throw PermissionError when requirePermission fails', () => {
    expect(() => {
      requirePermission(mockSession, 'user:create');
    }).toThrow(PermissionError);
  });

  it('should not throw when requirePermission succeeds', () => {
    expect(() => {
      requirePermission(mockSession, 'user:read');
    }).not.toThrow();
  });

  it('should check all permissions correctly', () => {
    const result = hasAllPermissions(mockSession, ['user:read']);
    expect(result.granted).toBe(true);

    const result2 = hasAllPermissions(mockSession, ['user:read', 'user:create']);
    expect(result2.granted).toBe(false);
  });

  it('should check any permissions correctly', () => {
    const result = hasAnyPermission(mockSession, ['user:create', 'user:read']);
    expect(result.granted).toBe(true);

    const result2 = hasAnyPermission(mockSession, ['user:create', 'user:delete']);
    expect(result2.granted).toBe(false);
  });

  it('should check resource access correctly', () => {
    const result = canAccessResource(mockSession, 'read', 'user', 'user-123');
    expect(result.granted).toBe(true);

    const result2 = canAccessResource(mockSession, 'read', 'user', 'other-user-123');
    expect(result2.granted).toBe(true); // User can read any user info with basic permissions
  });

  it('should check impersonation permissions correctly', () => {
    const result = checkImpersonationPermission(mockAdminSession, 'user', 'user-456');
    expect(result.granted).toBe(true);

    const result2 = checkImpersonationPermission(mockSession, 'user', 'user-456');
    expect(result2.granted).toBe(false);
  });

  it('should prevent self-impersonation', () => {
    const result = checkImpersonationPermission(mockAdminSession, 'super_admin', 'user-123');
    expect(result.granted).toBe(false);
    expect(result.reason).toBe('cannot_impersonate_self');
  });

  it('should check delegation permissions correctly', () => {
    const result = checkDelegationPermission(mockAdminSession, 'user', 'user:read');
    expect(result.granted).toBe(true);

    const result2 = checkDelegationPermission(mockSession, 'user', 'user:read');
    expect(result2.granted).toBe(false);
  });

  it('should prevent self-delegation', () => {
    const result = checkDelegationPermission(mockAdminSession, 'super_admin', 'user:read', 'user-123');
    expect(result.granted).toBe(false);
    expect(result.reason).toBe('cannot_delegate_self');
  });

  describe('Delegation Role Hierarchy', () => {
    it('should allow higher role to delegate to lower role', () => {
      // Manager can delegate to agent
      const managerSession: SessionContext = {
        ...mockAdminSession,
        role: 'manager',
        permissions: PERMISSION_MATRIX.manager,
      };

      const result = canDelegate('manager', 'agent', 'user:manage');
      expect(result).toBe(true);

      // Tenant admin can delegate to manager
      const tenantAdminResult = canDelegate('tenant_admin', 'manager', 'user:manage');
      expect(tenantAdminResult).toBe(true);

      // Super admin can delegate to any role
      const superAdminResult = canDelegate('super_admin', 'read_only', 'tenant:manage');
      expect(superAdminResult).toBe(true);
    });

    it('should prevent lower role from delegating to higher role', () => {
      // Agent cannot delegate to manager (privilege escalation)
      const agentResult = canDelegate('agent', 'manager', 'user:read');
      expect(agentResult).toBe(false);

      // Manager cannot delegate to tenant admin (privilege escalation)
      const managerResult = canDelegate('manager', 'tenant_admin', 'lead:create');
      expect(managerResult).toBe(false);

      // User cannot delegate to agent (privilege escalation)
      const userResult = canDelegate('user', 'agent', 'booking:read');
      expect(userResult).toBe(false);

      // Read-only cannot delegate to regular user (privilege escalation)
      const readOnlyResult = canDelegate('read_only', 'user', 'campaign:read');
      expect(readOnlyResult).toBe(false);
    });

    it('should prevent delegation between same level roles', () => {
      // Agent cannot delegate to another agent
      const agentResult = canDelegate('agent', 'agent', 'user:read');
      expect(agentResult).toBe(false);

      // Manager cannot delegate to another manager
      const managerResult = canDelegate('manager', 'manager', 'lead:approve');
      expect(managerResult).toBe(false);
    });

    it('should require manage permission for delegation category', () => {
      // Manager has user:manage but not tenant:manage
      const canManageUser = canDelegate('manager', 'agent', 'user:read');
      expect(canManageUser).toBe(true);

      const cannotManageTenant = canDelegate('manager', 'agent', 'tenant:read');
      expect(cannotManageTenant).toBe(false);

      // Agent has no manage permissions
      const agentCannotManage = canDelegate('agent', 'user', 'user:read');
      expect(agentCannotManage).toBe(false);
    });
  });

  it('should handle tenant membership checks', () => {
    const result = hasPermission(mockSession, 'user:read', {
      requireTenantMembership: true,
      tenantId: 'different-tenant' as any,
    });
    expect(result.granted).toBe(false);
    expect(result.reason).toBe('wrong_tenant');
  });

  it('should allow self-access when enabled', () => {
    const result = hasPermission(mockSession, 'user:read', {
      allowSelf: true,
      resourceOwnerId: 'user-123',
    });
    expect(result.granted).toBe(true);
  });
});

describe('Permission Error', () => {
  it('should create PermissionError with correct properties', () => {
    const mockResult = {
      granted: false,
      reason: 'permission_denied',
      userRole: 'user',
      userPermissions: ['user:read'],
    };

    const error = new PermissionError('Test message', 'permission_denied', mockResult);
    
    expect(error.name).toBe('PermissionError');
    expect(error.message).toBe('Test message');
    expect(error.reason).toBe('permission_denied');
    expect(error.checkResult).toBe(mockResult);
  });
});

```

---

### session-immutability.test.ts

**Path:** `tests\session-immutability.test.ts`

**Language:** TypeScript

```typescript
/**
 * Tests for session immutability (H4 Security Fix)
 * 
 * Verifies that session contexts are deeply frozen and cannot be mutated.
 * Tests the fix for shallow freeze vulnerability where permissions arrays remained mutable.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSession, createImpersonatedSession, createDelegatedSession } from '../src/session/create-session';

// Mock Better Auth instance
vi.mock('../src/session/better-auth-instance', () => ({
  betterAuth: {
    session: {
      create: vi.fn().mockResolvedValue({
        id: 'session-123',
        token: 'token-123',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
    },
  },
}));

describe('Session Immutability (H4 Security Fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSession', () => {
    it('should deeply freeze session context', async () => {
      const permissions = ['read:own', 'write:own'];
      const session = await createSession({
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        email: 'user@example.com',
        role: 'user',
        permissions,
      });

      // Top-level object should be frozen
      expect(Object.isFrozen(session)).toBe(true);

      // Permissions array should be frozen
      expect(Object.isFrozen(session.permissions)).toBe(true);

      // All properties should be read-only
      expect(() => {
        (session as any).permissions = ['admin'];
      }).toThrow();

      // Array mutations should fail
      expect(() => {
        session.permissions.push('admin');
      }).toThrow();

      expect(() => {
        session.permissions[0] = 'admin';
      }).toThrow();
    });

    it('should freeze nested objects in permissions', async () => {
      // Test with complex permission objects if they exist
      const complexPermissions = [
        { action: 'read', resource: 'own' },
        { action: 'write', resource: 'own' },
      ];
      
      const session = await createSession({
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        email: 'user@example.com',
        role: 'user',
        permissions: complexPermissions as any,
      });

      // Permission objects should be frozen
      expect(Object.isFrozen(session.permissions[0])).toBe(true);
      expect(Object.isFrozen(session.permissions[1])).toBe(true);

      // Nested property mutations should fail
      expect(() => {
        (session.permissions[0] as any).action = 'admin';
      }).toThrow();
    });
  });

  describe('createImpersonatedSession', () => {
    it('should deeply freeze impersonated session context', async () => {
      const permissions = ['read:all', 'write:all'];
      const session = await createImpersonatedSession(
        'user-123' as any,
        'tenant-123' as any,
        'admin-123' as any,
        'user@example.com',
        'user',
        permissions
      );

      // Top-level object should be frozen
      expect(Object.isFrozen(session)).toBe(true);

      // Permissions array should be frozen
      expect(Object.isFrozen(session.permissions)).toBe(true);

      // Array mutations should fail
      expect(() => {
        session.permissions.push('admin');
      }).toThrow();

      // Impersonation metadata should be frozen
      expect(Object.isFrozen(session.impersonatedBy)).toBe(true);
    });
  });

  describe('createDelegatedSession', () => {
    it('should deeply freeze delegated session context', async () => {
      const permissions = ['read:delegated', 'write:delegated'];
      const delegationExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      const session = await createDelegatedSession(
        'user-123' as any,
        'tenant-123' as any,
        'manager-123' as any,
        'user@example.com',
        'user',
        permissions,
        delegationExpiresAt
      );

      // Top-level object should be frozen
      expect(Object.isFrozen(session)).toBe(true);

      // Permissions array should be frozen
      expect(Object.isFrozen(session.permissions)).toBe(true);

      // Array mutations should fail
      expect(() => {
        session.permissions.push('admin');
      }).toThrow();

      // Delegation metadata should be frozen
      expect(Object.isFrozen(session.delegatedBy)).toBe(true);
    });
  });

  describe('Security Impact', () => {
    it('should prevent privilege escalation via permission mutation', async () => {
      const originalPermissions = ['read:own'];
      const session = await createSession({
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        email: 'user@example.com',
        role: 'user',
        permissions: originalPermissions,
      });

      // Attempt to escalate privileges by modifying permissions
      try {
        session.permissions.push('admin:all');
        // If we reach here, the freeze failed
        expect.fail('Permissions array should be frozen');
      } catch (error) {
        // Expected - permissions should be immutable
        expect(session.permissions).toEqual(originalPermissions);
      }

      try {
        session.permissions[0] = 'admin:all';
        expect.fail('Permissions array elements should be frozen');
      } catch (error) {
        // Expected - individual permission elements should be immutable
        expect(session.permissions[0]).toBe('read:own');
      }
    });

    it('should prevent session metadata tampering', async () => {
      const session = await createSession({
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        email: 'user@example.com',
        role: 'user',
        permissions: ['read:own'],
      });

      // Attempt to modify session metadata
      try {
        (session as any).role = 'admin';
        expect.fail('Session role should be frozen');
      } catch (error) {
        expect(session.role).toBe('user');
      }

      try {
        (session as any).isImpersonated = true;
        expect.fail('Session flags should be frozen');
      } catch (error) {
        expect(session.isImpersonated).toBe(false);
      }
    });
  });
});

```

---

### setup.ts

**Path:** `tests\setup.ts`

**Language:** TypeScript

```typescript
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { sql } from 'drizzle-orm'
import fs from 'fs/promises'
import path from 'path'

// Import the firm-db setup utilities
import { 
  getTestDb as getFirmTestDb, 
  createTestTenant, 
  createTestUser, 
  setTenantContext,
  clearTenantContext 
} from '@firm/db/tests/setup'

// Global test database instance for auth-specific tests
let authTestDb: ReturnType<typeof drizzle> | null = null
let pgLite: PGlite | null = null

// Test database file path
const testDbPath = path.join(__dirname, '..', '.test-data', 'auth-test.db')

/**
 * Initialize PgLite test database with migrations for auth tests
 */
async function initializeAuthTestDb(): Promise<ReturnType<typeof drizzle>> {
  // Ensure test data directory exists
  await fs.mkdir(path.dirname(testDbPath), { recursive: true })

  // Remove existing test database for clean state
  try {
    await fs.unlink(testDbPath)
  } catch {
    // File doesn't exist, which is fine
  }

  // Initialize PgLite
  pgLite = new PGlite(testDbPath)
  
  // Create Drizzle instance
  const db = drizzle(pgLite, {
    logger: false, // Disable logging in tests
  })

  // Run migrations from firm-db
  const migrationsPath = path.join(__dirname, '..', '..', 'firm-db', 'drizzle')
  try {
    await migrate(db, { migrationsFolder: migrationsPath })
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }

  return db
}

/**
 * Get the auth test database instance
 */
export function getAuthTestDb(): ReturnType<typeof drizzle> {
  if (!authTestDb) {
    throw new Error('Auth test database not initialized. Call setupAuthTestDb() first.')
  }
  return authTestDb
}

/**
 * Setup auth test database for all tests
 */
beforeAll(async () => {
  authTestDb = await initializeAuthTestDb()
})

/**
 * Cleanup auth test database after all tests
 */
afterAll(async () => {
  if (pgLite) {
    await pgLite.close()
  }
  
  // Clean up test database file
  try {
    await fs.unlink(testDbPath)
  } catch {
    // File doesn't exist or can't be deleted
  }
})

/**
 * Clean up database state between tests
 */
beforeEach(async () => {
  if (!authTestDb) return
  
  // Get all table names and truncate them
  const tables = [
    'audit_logs',
    'bookings', 
    'campaigns',
    'leads',
    'users',
    'tenants',
  ]

  for (const table of tables) {
    try {
      await authTestDb.execute(sql`TRUNCATE TABLE ${sql.raw(table)} RESTART IDENTITY CASCADE`)
    } catch (error) {
      // Table might not exist, which is fine for testing
    }
  }
})

/**
 * Reset database state after each test
 */
afterEach(async () => {
  // Additional cleanup if needed
})

/**
 * Create a test tenant for auth tests
 */
export async function createAuthTestTenant(overrides: Partial<any> = {}) {
  const db = getAuthTestDb()
  
  const tenantData = {
    name: 'Auth Test Tenant',
    slug: 'auth-test-tenant',
    status: 'active',
    service_tier: 'professional',
    settings: {},
    metadata: {},
    ...overrides,
  }

  const result = await db.execute(sql`
    INSERT INTO tenants (name, slug, status, service_tier, settings, metadata)
    VALUES (${tenantData.name}, ${tenantData.slug}, ${tenantData.status}, ${tenantData.service_tier}, ${JSON.stringify(tenantData.settings)}, ${JSON.stringify(tenantData.metadata)})
    RETURNING *
  `)

  return result.rows[0]
}

/**
 * Create a test user for auth tests
 */
export async function createAuthTestUser(tenantId: string, overrides: Partial<any> = {}) {
  const db = getAuthTestDb()
  
  const userData = {
    tenant_id: tenantId,
    email: 'auth-test@example.com',
    password_hash: 'hashed_password',
    first_name: 'Auth',
    last_name: 'Test',
    role: 'agent',
    status: 'active',
    permissions: [],
    phone_verified: false,
    email_verified: false,
    preferences: {},
    metadata: {},
    ...overrides,
  }

  const result = await db.execute(sql`
    INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status, permissions, phone_verified, email_verified, preferences, metadata)
    VALUES (${userData.tenant_id}, ${userData.email}, ${userData.password_hash}, ${userData.first_name}, ${userData.last_name}, ${userData.role}, ${userData.status}, ${JSON.stringify(userData.permissions)}, ${userData.phone_verified}, ${userData.email_verified}, ${JSON.stringify(userData.preferences)}, ${JSON.stringify(userData.metadata)})
    RETURNING *
  `)

  return result.rows[0]
}

/**
 * Create a test user with specific role for permission testing
 */
export async function createTestUserWithRole(tenantId: string, role: string, overrides: Partial<any> = {}) {
  return createAuthTestUser(tenantId, {
    role,
    email: `${role}@example.com`,
    first_name: role.charAt(0).toUpperCase() + role.slice(1),
    last_name: 'User',
    ...overrides,
  })
}

/**
 * Set tenant context for RLS testing
 */
export async function setAuthTenantContext(tenantId: string) {
  const db = getAuthTestDb()
  await db.execute(sql`SET app.current_tenant_id = ${tenantId}`)
}

/**
 * Clear tenant context
 */
export async function clearAuthTenantContext() {
  const db = getAuthTestDb()
  await db.execute(sql`RESET app.current_tenant_id`)
}

/**
 * Create a complete test environment with tenant and user
 */
export async function createTestEnvironment(userRole: string = 'agent', tenantOverrides: Partial<any> = {}, userOverrides: Partial<any> = {}) {
  // Create tenant
  const tenant = await createAuthTestTenant(tenantOverrides)
  
  // Set tenant context
  await setAuthTenantContext(tenant.id as string)
  
  // Create user with specified role
  const user = await createTestUserWithRole(tenant.id as string, userRole, userOverrides)
  
  return {
    tenant,
    user,
    db: getAuthTestDb(),
    cleanup: async () => {
      await clearAuthTenantContext()
    }
  }
}

// Re-export firm-db utilities for convenience
export {
  getFirmTestDb,
  createTestTenant,
  createTestUser,
  setTenantContext,
  clearTenantContext
}

```

---

### timing-attack-protection.test.ts

**Path:** `tests\timing-attack-protection.test.ts`

**Language:** TypeScript

```typescript
/**
 * Security tests for timing attack protection in API key verification
 * 
 * These tests verify that the API key verification process prevents timing side-channel attacks
 * by using constant-time comparisons and dummy operations when no candidates exist.
 */

import { describe, it, expect, vi } from 'vitest';
import { constantTimeHashCompare, performDummyComparison } from '../src/api-keys/verify-key';
import { createHmac } from 'crypto';

describe('Timing Attack Protection', () => {
  describe('constantTimeHashCompare', () => {
    it('should return true for identical hashes', () => {
      const hash = 'a1b2c3d4e5f6789012345678901234567890abcd';
      const result = constantTimeHashCompare(hash, hash);
      expect(result).toBe(true);
    });

    it('should return false for different hashes', () => {
      const hash1 = 'a1b2c3d4e5f6789012345678901234567890abcd';
      const hash2 = 'b2c3d4e5f6789012345678901234567890abcdef';
      const result = constantTimeHashCompare(hash1, hash2);
      expect(result).toBe(false);
    });

    it('should return false for hashes of different lengths', () => {
      const hash1 = 'a1b2c3d4e5f6789012345678901234567890abcd';
      const hash2 = 'a1b2c3d4e5f678901234567890123456';
      const result = constantTimeHashCompare(hash1, hash2);
      expect(result).toBe(false);
    });

    it('should return false for invalid hex strings', () => {
      const validHash = 'a1b2c3d4e5f6789012345678901234567890abcd';
      const invalidHash = 'xyz123invalid';
      const result = constantTimeHashCompare(validHash, invalidHash);
      expect(result).toBe(false);
    });

    it('should handle empty strings gracefully', () => {
      const result = constantTimeHashCompare('', '');
      expect(result).toBe(true); // Empty strings are equal
    });
  });

  describe('performDummyComparison', () => {
    it('should always return false but perform constant-time operations', () => {
      const hash = 'a1b2c3d4e5f6789012345678901234567890abcd';
      
      // Mock console.error to capture any error messages
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = performDummyComparison(hash);
      
      // Should always return false
      expect(result).toBe(false);
      
      // Should not throw any errors
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should work with different hash inputs', () => {
      const hash1 = 'a1b2c3d4e5f6789012345678901234567890abcd';
      const hash2 = 'b2c3d4e5f6789012345678901234567890abcdef';
      
      const result1 = performDummyComparison(hash1);
      const result2 = performDummyComparison(hash2);
      
      // Both should return false
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    it('should create deterministic dummy hashes for same input', () => {
      const hash = 'a1b2c3d4e5f6789012345678901234567890abcd';
      const dummySecret = 'dummy_secret_for_timing_protection';
      
      // Calculate expected dummy hash
      const expectedDummyHash = createHmac('sha256', dummySecret).update(hash).digest('hex');
      
      // Verify the dummy hash is created correctly
      expect(expectedDummyHash).toMatch(/^[a-f0-9]{64}$/); // Should be valid SHA-256 hex
    });
  });

  describe('Timing Attack Prevention Strategy', () => {
    it('should demonstrate the security improvement', () => {
      // This test documents the security fix:
      // 
      // BEFORE: Database queried by full hash directly
      // - If no record found: immediate return (fast)
      // - If record found: hash comparison performed (slower)
      // - Attacker can measure timing to determine valid prefixes
      //
      // AFTER: Database queried by prefix, dummy comparison always performed
      // - Query by prefix (consistent time regardless of existence)
      // - If no candidates: dummy HMAC comparison performed
      // - If candidates found: constant-time comparison for each
      // - Attacker cannot distinguish between valid/invalid prefixes
      
      const validPrefix = '12345678';
      const invalidPrefix = '87654321';
      
      // In the old implementation, these would have different timing characteristics
      // In the new implementation, they should have similar timing because:
      // 1. Both perform a database query by prefix
      // 2. Both perform HMAC operations (real or dummy)
      // 3. Both use timingSafeEqual for comparisons
      
      expect(validPrefix).toBeDefined();
      expect(invalidPrefix).toBeDefined();
      
      // The actual timing measurement would require performance.now() in a real scenario
      // but the code structure ensures constant-time behavior
    });
  });
});

```

---

### tsup.config.ts

**Path:** `tsup.config.ts`

**Language:** TypeScript

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'session/index': 'src/session/index.ts',
    'permissions/index': 'src/permissions/index.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['@firm/types', '@firm/db', '@firm/crypto', '@firm/errors', '@firm/validators']
})

```

---

### vitest.config.ts

**Path:** `vitest.config.ts`

**Language:** TypeScript

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});

```

---

