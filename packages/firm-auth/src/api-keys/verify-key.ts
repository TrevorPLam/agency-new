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
