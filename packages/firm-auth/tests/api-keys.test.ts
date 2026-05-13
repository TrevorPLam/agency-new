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
