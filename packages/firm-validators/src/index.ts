/**
 * Firm Validators - Zod schemas for Firm platform
 * 
 * This package provides:
 * - Common validation primitives and field validators
 * - Entity schemas with business rules validation
 * - Schema versioning (v1/v2) for breaking changes
 * - Migration utilities between schema versions
 * - Cross-field validation and transformation
 * - Compile-time type safety with satisfies checks
 */

// Export all common primitives
export * from './common';

// Export lead schemas (v1 and v2)
export * from './lead/v1';
export * from './lead/v2';

// Export entity schemas
export * from './tenant';
export * from './user';

// Re-export commonly used schemas for convenience
export {
  // Lead schemas
  leadSchemaV1,
  leadSchemaV1WithValidation,
} from './lead/v1';

export {
  leadSchemaV2,
  leadSchemaV2WithValidation,
} from './lead/v2';

export {
  // Tenant schemas
  tenantSchema,
  tenantSchemaWithValidation,
} from './tenant';

export {
  // User schemas
  userSchema,
  userSchemaWithValidation,
} from './user';

// Export validation functions
export {
  validateLeadV1,
  validateLeadV1WithValidation,
} from './lead/v1';

export {
  validateLeadV2,
  validateLeadV2WithValidation,
  migrateLeadV1ToV2,
} from './lead/v2';

export {
  validateTenant,
  validateTenantWithValidation,
} from './tenant';

export {
  validateUser,
  validateUserWithValidation,
} from './user';

// Export type assertions
export {
  LeadV1,
  LeadV1WithValidation,
} from './lead/v1';

export {
  LeadV2,
  LeadV2WithValidation,
} from './lead/v2';

export {
  TenantInput,
  TenantInputWithValidation,
} from './tenant';

export {
  UserInput,
  UserInputWithValidation,
} from './user';
