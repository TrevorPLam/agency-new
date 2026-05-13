/**
 * Deep freeze utility for complete immutability
 * 
 * Recursively freezes objects and arrays to ensure complete immutability.
 * Addresses H4 security vulnerability where shallow freeze left nested objects mutable.
 */

/**
 * Recursively freezes an object and all its nested properties
 */
export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Freeze arrays first, then their elements
  if (Array.isArray(obj)) {
    Object.freeze(obj); // Freeze the array itself
    for (const item of obj) {
      deepFreeze(item); // Recursively freeze each element
    }
    return obj;
  }

  // Freeze objects and their properties
  Object.freeze(obj); // Freeze the object itself
  
  // Get all property descriptors and recursively freeze values
  for (const key of Object.getOwnPropertyNames(obj)) {
    const value = (obj as Record<string, unknown>)[key];
    if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }

  // Also freeze symbol properties
  for (const symbol of Object.getOwnPropertySymbols(obj)) {
    const value = (obj as Record<symbol, unknown>)[symbol];
    if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }

  return obj;
}

/**
 * Type-safe wrapper for deep freezing session contexts
 */
export function createImmutableSession<T extends Record<string, unknown>>(session: T): T {
  return deepFreeze(session);
}
