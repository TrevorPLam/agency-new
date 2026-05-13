/**
 * Deeply merges two objects, creating a new object
 * Arrays are replaced (not concatenated)
 * Primitive values are overridden by the right-hand value
 * @param target - The target object to merge into
 * @param source - The source object to merge from
 * @returns A new merged object
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        isPlainObject(sourceValue) &&
        targetValue !== undefined &&
        isPlainObject(targetValue)
      ) {
        // Both are plain objects, merge recursively
        (result as any)[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      } else {
        // Override with source value (including arrays, primitives, null, undefined)
        (result as any)[key] = sourceValue;
      }
    }
  }

  return result;
}

/**
 * Checks if a value is a plain object (not null, not array, not Date, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  // Check if it's a plain object (not array, date, regex, etc.)
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Merges multiple objects from left to right
 * @param objects - Array of objects to merge
 * @returns A new merged object
 */
export function deepMergeMany<T extends Record<string, unknown>>(
  ...objects: Partial<T>[]
): T {
  if (objects.length === 0) {
    return {} as T;
  }
  
  const [first, ...rest] = objects;
  return rest.reduce(
    (acc, obj) => deepMerge(acc, obj),
    first as unknown as T
  );
}

/**
 * Safely merges objects with type safety for partial updates
 * @param target - The target object
 * @param updates - Partial updates to apply
 * @returns A new object with updates applied
 */
export function applyUpdates<T extends Record<string, unknown>>(
  target: T,
  updates: Partial<T>
): T {
  return deepMerge(target, updates);
}
