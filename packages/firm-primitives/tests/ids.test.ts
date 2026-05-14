import { describe, it, expect } from 'vitest';
import {
  asTenantId,
  asAgencyId,
  asSubAccountId,
  asPlatformId,
  asSessionId,
  asUserId,
  isTenantId,
  isAgencyId,
  isSubAccountId,
  isPlatformId,
  isSessionId,
  isUserId,
  extractId,
  type TenantId,
  type AgencyId,
  type SubAccountId,
  type PlatformId,
  type SessionId,
  type UserId,
  type PrimitiveId,
} from '../src/ids';

describe('Primitive ID Gatekeepers', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';
  const invalidUuid = 'invalid-uuid';

  describe('asTenantId', () => {
    it('should create TenantId from valid UUID', () => {
      const result = asTenantId(validUuid);
      expect(result).toBe(validUuid);
      expect(isTenantId(result)).toBe(true);
    });

    it('should throw error for invalid UUID', () => {
      expect(() => asTenantId(invalidUuid)).toThrow('Invalid TenantId');
    });
  });

  describe('asAgencyId', () => {
    it('should create AgencyId from valid UUID', () => {
      const result = asAgencyId(validUuid);
      expect(result).toBe(validUuid);
      expect(isAgencyId(result)).toBe(true);
    });

    it('should throw error for invalid UUID', () => {
      expect(() => asAgencyId(invalidUuid)).toThrow('Invalid AgencyId');
    });
  });

  describe('asSubAccountId', () => {
    it('should create SubAccountId from valid UUID', () => {
      const result = asSubAccountId(validUuid);
      expect(result).toBe(validUuid);
      expect(isSubAccountId(result)).toBe(true);
    });

    it('should throw error for invalid UUID', () => {
      expect(() => asSubAccountId(invalidUuid)).toThrow('Invalid SubAccountId');
    });
  });

  describe('asPlatformId', () => {
    it('should create PlatformId from valid UUID', () => {
      const result = asPlatformId(validUuid);
      expect(result).toBe(validUuid);
      expect(isPlatformId(result)).toBe(true);
    });

    it('should throw error for invalid UUID', () => {
      expect(() => asPlatformId(invalidUuid)).toThrow('Invalid PlatformId');
    });
  });

  describe('asSessionId', () => {
    it('should create SessionId from valid UUID', () => {
      const result = asSessionId(validUuid);
      expect(result).toBe(validUuid);
      expect(isSessionId(result)).toBe(true);
    });

    it('should throw error for invalid UUID', () => {
      expect(() => asSessionId(invalidUuid)).toThrow('Invalid SessionId');
    });
  });

  describe('asUserId', () => {
    it('should create UserId from valid UUID', () => {
      const result = asUserId(validUuid);
      expect(result).toBe(validUuid);
      expect(isUserId(result)).toBe(true);
    });

    it('should throw error for invalid UUID', () => {
      expect(() => asUserId(invalidUuid)).toThrow('Invalid UserId');
    });
  });

  describe('Type Guards', () => {
    it('should correctly identify valid UUIDs', () => {
      expect(isTenantId(validUuid)).toBe(true);
      expect(isAgencyId(validUuid)).toBe(true);
      expect(isSubAccountId(validUuid)).toBe(true);
      expect(isPlatformId(validUuid)).toBe(true);
      expect(isSessionId(validUuid)).toBe(true);
      expect(isUserId(validUuid)).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isTenantId(invalidUuid)).toBe(false);
      expect(isAgencyId(invalidUuid)).toBe(false);
      expect(isSubAccountId(invalidUuid)).toBe(false);
      expect(isPlatformId(invalidUuid)).toBe(false);
      expect(isSessionId(invalidUuid)).toBe(false);
      expect(isUserId(invalidUuid)).toBe(false);
    });

    it('should reject non-strings', () => {
      expect(isTenantId(123)).toBe(false);
      expect(isAgencyId(null)).toBe(false);
      expect(isSubAccountId(undefined)).toBe(false);
      expect(isPlatformId({})).toBe(false);
      expect(isSessionId([])).toBe(false);
      expect(isUserId(true)).toBe(false);
    });
  });

  describe('extractId', () => {
    it('should extract the string value from branded IDs', () => {
      const tenantId = asTenantId(validUuid);
      const userId = asUserId(validUuid);

      expect(extractId(tenantId)).toBe(validUuid);
      expect(extractId(userId)).toBe(validUuid);
    });
  });

  describe('Type Safety', () => {
    it('should enforce type safety at compile time', () => {
      const tenantId: TenantId = asTenantId(validUuid);
      const userId: UserId = asUserId(validUuid);

      // These should be assignable to PrimitiveId
      const primitiveIds: PrimitiveId[] = [tenantId, userId];

      expect(primitiveIds).toHaveLength(2);
    });
  });
});