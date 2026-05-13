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
