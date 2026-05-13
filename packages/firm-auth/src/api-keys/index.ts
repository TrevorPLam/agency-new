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
