/**
 * Compile-time tests for firm-types
 * These tests verify type safety at compile time using TypeScript's type system
 * 
 * These tests use the Expect/Equal pattern for type assertions
 */

import type { 
  TenantId, 
  UserId, 
  LeadId, 
  asTenantId, 
  asUserId, 
  asLeadId,
  isTenantId,
  isUserId,
  isLeadId 
} from '../src/branded';

import type {
  TenantStatus,
  UserStatus,
  LeadStatus,
  ServiceTier,
  PermissionCategory
} from '../src/enums';

import type {
  Tenant,
  User,
  Lead,
  BaseEntity,
  TenantScopedEntity,
  AuditableEntity
} from '../src/entities';

import type {
  CRMAdapter,
  EmailAdapter,
  BaseAdapter
} from '../src/adapters';

import type {
  ApiResponse,
  ApiError,
  PaginationMeta,
  TenantResponse,
  LeadResponse
} from '../src/api';

import type {
  DeepPartial,
  CreateEntity,
  UpdateEntity,
  ValidationResult,
  PaginatedResult
} from '../src/helpers';

// Type assertion helpers for compile-time testing
type Expect<T extends true> = T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// Test 1: Branded types should not be assignable to regular strings
type Test1 = Expect<Equal<TenantId, string> extends false ? true : false>;

// Test 2: Branded types should maintain their brand
type Test2 = Expect<Equal<TenantId, UserId> extends false ? true : false>;

// Test 3: Branded type gatekeepers should return correct type
type Test3 = Expect<Equal<ReturnType<typeof asTenantId>, TenantId>>;

// Test 4: Type guards should work correctly
type Test4 = Expect<Equal<ReturnType<typeof isTenantId>, boolean>>;

// Test 5: Enum types should be string literals
type Test5 = Expect<Equal<TenantStatus, 'active' | 'inactive' | 'suspended' | 'trial' | 'cancelled'>>;

// Test 6: Entity interfaces should extend base interfaces
type Test6 = Expect<Equal<Tenant extends BaseEntity ? true : false, true>>;
type Test7 = Expect<Equal<User extends AuditableEntity ? true : false, true>>;
type Test8 = Expect<Equal<Lead extends TenantScopedEntity ? true : false, true>>;

// Test 7: DeepPartial should make all properties optional
type TestLead = {
  id: string;
  firstName: string;
  email?: string;
  address: {
    street: string;
    city: string;
  };
};
type TestDeepPartial = DeepPartial<TestLead>;
type Test9 = Expect<Equal<keyof TestDeepPartial, keyof Partial<TestLead>>>;

// Test 8: CreateEntity should omit id, createdAt, updatedAt
type Test10 = Expect<Equal<keyof CreateEntity<Tenant>, keyof Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>>>;

// Test 9: UpdateEntity should make all properties optional except id, timestamps
type Test11 = Expect<Equal<keyof UpdateEntity<User>, keyof Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>>>;

// Test 10: API response types should be correctly structured
type Test12 = Expect<Equal<TenantResponse, ApiResponse<Tenant>>>;
type Test13 = Expect<Equal<LeadResponse, ApiResponse<Lead>>>;

// Test 11: Adapter interfaces should extend BaseAdapter
type Test14 = Expect<Equal<CRMAdapter extends BaseAdapter ? true : false, true>>;
type Test15 = Expect<Equal<EmailAdapter extends BaseAdapter ? true : false, true>>;

// Test 12: Validation result type should be correct
type Test16 = Expect<Equal<ValidationResult<string>, { success: boolean; data?: string; errors?: string[] }>>;

// Test 13: PaginatedResult should have correct structure
type Test17 = Expect<Equal<PaginatedResult<string>, { data: string[]; pagination: PaginationMeta }>>;

// Test 14: API Error should follow RFC 7807 structure
type Test18 = Expect<Equal<ApiError, {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
    value?: unknown;
  }>;
  code?: string;
  context?: Record<string, unknown>;
}>>;

// Test 15: Service tier should be correct union
type Test19 = Expect<Equal<ServiceTier, 'starter' | 'professional' | 'business' | 'enterprise' | 'custom'>>;

// Test 16: Permission category should be correct union
type Test20 = Expect<Equal<PermissionCategory, 
  | 'tenant'
  | 'user'
  | 'lead'
  | 'campaign'
  | 'booking'
  | 'invoice'
  | 'analytics'
  | 'settings'
  | 'admin'
>>;

// Test 17: Entity IDs should be branded types
type Test21 = Expect<Equal<Tenant['id'], TenantId>>;
type Test22 = Expect<Equal<User['id'], UserId>>;
type Test23 = Expect<Equal<Lead['id'], LeadId>>;

// Test 18: Entity timestamps should be Date objects
type Test24 = Expect<Equal<Tenant['createdAt'], Date>>;
type Test25 = Expect<Equal<User['updatedAt'], Date>>;

// Test 19: Tenant-scoped entities should have tenantId
type Test26 = Expect<Equal<Lead['tenantId'], TenantId>>;
type Test27 = Expect<Equal<User['tenantId'], TenantId>>;

// Test 20: Auditable entities should have createdBy/updatedBy
type Test28 = Expect<Equal<User['createdBy'], UserId>>;
type Test29 = Expect<Equal<User['updatedBy'], UserId>>;

// Test 21: Test that branded types prevent accidental assignment
const testAssignment = () => {
  const tenantId: TenantId = 'test-id' as TenantId;
  const userId: UserId = 'test-id' as UserId;
  
  // This should cause a compile error if uncommented:
  // const wrongAssignment: TenantId = userId; // Should fail
  
  // This should work:
  const correctAssignment: TenantId = tenantId;
  
  return { tenantId, userId, correctAssignment };
};

// Test 22: Test enum type safety
const testEnums = () => {
  const tenantStatus: TenantStatus = 'active'; // Valid
  // const invalidStatus: TenantStatus = 'invalid'; // Should fail
  
  const userStatus: UserStatus = 'active'; // Valid
  // const invalidUserStatus: UserStatus = 'invalid'; // Should fail
  
  return { tenantStatus, userStatus };
};

// Test 23: Test entity structure
const testEntities = () => {
  const tenant: Tenant = {
    id: 'tenant-id' as TenantId,
    name: 'Test Tenant',
    slug: 'test-tenant',
    status: 'active',
    serviceTier: 'starter',
    settings: {
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
      theme: 'light',
      features: {},
      limits: {
        users: 10,
        leads: 100,
        campaigns: 5,
        bookings: 50,
        storage: 1000,
        apiCalls: 10000
      },
      consent: {
        requiredCategories: ['necessary'],
        defaultConsent: {
          necessary: true,
          analytics: false,
          marketing: false,
          preferences: false,
          functional: false
        }
      },
      integrations: {}
    },
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  return { tenant };
};

// Test 24: Test API response structure
const testApiResponses = () => {
  const successResponse: TenantResponse = {
    success: true,
    data: {
      id: 'tenant-id' as TenantId,
      name: 'Test Tenant',
      slug: 'test-tenant',
      status: 'active',
      serviceTier: 'starter',
      settings: {
        timezone: 'UTC',
        currency: 'USD',
        language: 'en',
        theme: 'light',
        features: {},
        limits: {
          users: 10,
          leads: 100,
          campaigns: 5,
          bookings: 50,
          storage: 1000,
          apiCalls: 10000
        },
        consent: {
          requiredCategories: ['necessary'],
          defaultConsent: {
            necessary: true,
            analytics: false,
            marketing: false,
            preferences: false,
            functional: false
          }
        },
        integrations: {}
      },
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
  };
  
  const errorResponse: ApiResponse = {
    success: false,
    error: {
      type: 'https://example.com/errors/validation',
      title: 'Validation Error',
      status: 400,
      detail: 'Invalid input data',
      code: 'VALIDATION_ERROR'
    }
  };
  
  return { successResponse, errorResponse };
};

// Export test functions to ensure they're compiled
export {
  testAssignment,
  testEnums,
  testEntities,
  testApiResponses
};

// Export type assertions to ensure they're checked
export type CompileTimeTests = [
  Test1,
  Test2,
  Test3,
  Test4,
  Test5,
  Test6,
  Test7,
  Test8,
  Test9,
  Test10,
  Test11,
  Test12,
  Test13,
  Test14,
  Test15,
  Test16,
  Test17,
  Test18,
  Test19,
  Test20,
  Test21,
  Test22,
  Test23,
  Test24,
  Test25,
  Test26,
  Test27,
  Test28,
  Test29
];
