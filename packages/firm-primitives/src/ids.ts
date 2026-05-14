/**
 * Branded type definitions for Firm platform primitives
 * Uses unique symbol branding to create type-safe identifiers
 * L0 package - zero domain knowledge, pure technical building blocks
 */

// Brand symbols for type safety
declare const TenantIdBrand: unique symbol;
declare const AgencyIdBrand: unique symbol;
declare const SubAccountIdBrand: unique symbol;
declare const PlatformIdBrand: unique symbol;
declare const SessionIdBrand: unique symbol;
declare const UserIdBrand: unique symbol;

// Branded type definitions
export type TenantId = string & { readonly [TenantIdBrand]: true };
export type AgencyId = string & { readonly [AgencyIdBrand]: true };
export type SubAccountId = string & { readonly [SubAccountIdBrand]: true };
export type PlatformId = string & { readonly [PlatformIdBrand]: true };
export type SessionId = string & { readonly [SessionIdBrand]: true };
export type UserId = string & { readonly [UserIdBrand]: true };

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID v4
 */
function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Gatekeeper factory functions for creating branded IDs
 * These validate the UUID format but keep the brand opaque
 */

export function asTenantId(value: string): TenantId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid TenantId: ${value}. Must be a valid UUID v4.`);
  }
  return value as TenantId;
}

export function asAgencyId(value: string): AgencyId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid AgencyId: ${value}. Must be a valid UUID v4.`);
  }
  return value as AgencyId;
}

export function asSubAccountId(value: string): SubAccountId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid SubAccountId: ${value}. Must be a valid UUID v4.`);
  }
  return value as SubAccountId;
}

export function asPlatformId(value: string): PlatformId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid PlatformId: ${value}. Must be a valid UUID v4.`);
  }
  return value as PlatformId;
}

export function asSessionId(value: string): SessionId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid SessionId: ${value}. Must be a valid UUID v4.`);
  }
  return value as SessionId;
}

export function asUserId(value: string): UserId {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid UserId: ${value}. Must be a valid UUID v4.`);
  }
  return value as UserId;
}

/**
 * Type guard functions for runtime checking
 */
export function isTenantId(value: unknown): value is TenantId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isAgencyId(value: unknown): value is AgencyId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isSubAccountId(value: unknown): value is SubAccountId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isPlatformId(value: unknown): value is PlatformId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isSessionId(value: unknown): value is SessionId {
  return typeof value === 'string' && isValidUuid(value);
}

export function isUserId(value: unknown): value is UserId {
  return typeof value === 'string' && isValidUuid(value);
}

/**
 * Helper function to extract the raw string value from a branded ID
 * This should be used sparingly - prefer keeping the branded type
 */
export function extractId<T extends string>(brandedId: T): string {
  return brandedId;
}

/**
 * Type for any primitive branded ID (useful for generic operations)
 */
export type PrimitiveId =
  | TenantId
  | AgencyId
  | SubAccountId
  | PlatformId
  | SessionId
  | UserId;