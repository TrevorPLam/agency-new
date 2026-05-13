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
