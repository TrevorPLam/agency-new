/**
 * Firm Types - Core types and interfaces for Firm platform
 * 
 * This package provides:
 * - Branded ID types with runtime validation
 * - String literal unions for enums
 * - Entity interfaces following DDD patterns
 * - Adapter interfaces for external systems
 * - API envelope types
 * - Helper utilities and transformation types
 */

// Export all branded types
export * from './branded';

// Export all enums
export * from './enums';

// Export entity interfaces
export * from './entities';

// Export adapter interfaces with namespace to avoid conflicts
export * as Adapters from './adapters';

// Export API types with namespace to avoid conflicts
export * as Api from './api';

// Export helper utilities
export * from './helpers';
