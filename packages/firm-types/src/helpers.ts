/**
 * Helper types and utilities for Firm platform
 * Provides common utility types and transformation functions
 */

// DeepPartial type - makes all properties optional recursively
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

// RequiredDeep type - makes all properties required recursively
export type RequiredDeep<T> = {
  [P in keyof T]-?: T[P] extends (infer U)[]
    ? RequiredDeep<U>[]
    : T[P] extends object
    ? RequiredDeep<T[P]>
    : T[P];
};

// OptionalDeep type - makes all properties optional recursively (alias for DeepPartial)
export type OptionalDeep<T> = DeepPartial<T>;

// PickDeep type - pick properties recursively
export type PickDeep<T, K extends string> = T extends object
  ? {
      [P in keyof T as P extends K ? P : never]: T[P] extends object
        ? PickDeep<T[P], K>
        : T[P];
    }
  : T;

// OmitDeep type - omit properties recursively
export type OmitDeep<T, K extends string> = T extends object
  ? {
      [P in keyof T as P extends K ? never : P]: T[P] extends object
        ? OmitDeep<T[P], K>
        : T[P];
    }
  : T;

// NonNullableDeep type - removes null and undefined recursively
export type NonNullableDeep<T> = T extends null | undefined
  ? never
  : T extends (infer U)[]
  ? NonNullableDeep<U>[]
  : T extends object
  ? {
      [P in keyof T]: NonNullableDeep<T[P]>;
    }
  : T;

// Branded type helpers
export type Unbranded<T> = T extends string
  ? string
  : T extends number
  ? number
  : T extends boolean
  ? boolean
  : T;

export type BrandedToString<T> = T extends string ? string : never;

// Entity transformation types
export type CreateEntity<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: T['id'];
};

export type UpdateEntity<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

export type EntityWithId<T> = T & { id: string };

// Database helpers
export type DbEntity<T> = T & {
  _id?: string;
  _rev?: string;
};

export type WithoutId<T> = Omit<T, 'id'>;

export type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};

// Array helpers
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

export type ArrayToUnion<T> = T extends Array<infer U> ? U : never;

export type UnionToArray<T> = T extends infer U ? U[] : never;

// String helpers
export type Capitalize<T extends string> = T extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Rest}`
  : T;

export type Uncapitalize<T extends string> = T extends `${infer First}${infer Rest}`
  ? `${Lowercase<First>}${Rest}`
  : T;

export type CamelCase<T extends string> = T extends `${infer P1}_${infer P2}${infer P3}`
  ? `${P1}${Uppercase<P2>}${CamelCase<P3>}`
  : T;

export type SnakeCase<T extends string> = T extends `${infer C1}${infer C2}`
  ? C1 extends Uppercase<C1>
    ? `_${Lowercase<C1>}${SnakeCase<C2>}`
    : `${C1}${SnakeCase<C2>}`
  : T;

// Key transformation helpers
export type KeysToCamelCase<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K];
};

export type KeysToSnakeCase<T> = {
  [K in keyof T as SnakeCase<string & K>]: T[K];
};

export type KeysToPascalCase<T> = {
  [K in keyof T as Capitalize<CamelCase<string & K>>]: T[K];
};

// Validation helpers
export type ValidationResult<T = unknown> = {
  success: boolean;
  data?: T;
  errors?: string[];
};

export type ValidationRule<T> = {
  validate: (value: unknown) => ValidationResult<T>;
  message?: string;
};

export type ValidationSchema<T> = {
  [K in keyof T]: ValidationRule<T[K]>;
};

// Pagination helpers
export type PaginationParams = {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
};

// Cursor pagination helpers
export type CursorPaginationParams = {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
};

export type CursorPaginatedResult<T> = {
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
};

// Search helpers
export type SearchParams = {
  query?: string;
  fields?: string[];
  filters?: Record<string, unknown>;
  sort?: Array<{
    field: string;
    order: 'asc' | 'desc';
  }>;
  limit?: number;
  offset?: number;
};

export type SearchResult<T> = {
  item: T;
  score: number;
  highlights?: Record<string, string[]>;
};

// Event helpers
export type EventPayload<T = unknown> = {
  type: string;
  data: T;
  timestamp: Date;
  metadata?: Record<string, unknown>;
};

export type EventHandler<T = unknown> = (event: EventPayload<T>) => void | Promise<void>;

export type EventSubscriber<T = unknown> = {
  eventType: string;
  handler: EventHandler<T>;
  options?: {
    once?: boolean;
    priority?: number;
  };
};

// Cache helpers
export type CacheKey = string | number | symbol;

export type CacheOptions = {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  priority?: number; // Cache priority
};

export type CacheEntry<T> = {
  value: T;
  expiresAt?: Date;
  tags?: string[];
  priority?: number;
  accessCount?: number;
  lastAccessed?: Date;
};

// Configuration helpers
export type ConfigValue<T = unknown> = {
  value: T;
  source: 'default' | 'env' | 'file' | 'database';
  override?: boolean;
};

export type ConfigSchema<T = Record<string, unknown>> = {
  [K in keyof T]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    default?: T[K];
    validator?: (value: unknown) => boolean;
    description?: string;
  };
};

// Logging helpers
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
  requestId?: string;
  userId?: string;
  tenantId?: string;
};

export type Logger = {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, error?: Error, context?: Record<string, unknown>) => void;
  fatal: (message: string, error?: Error, context?: Record<string, unknown>) => void;
};

// Error handling helpers
export type ErrorContext = Record<string, unknown>;

export type ErrorDetails = {
  code: string;
  message: string;
  details?: ErrorContext;
  stack?: string;
  cause?: Error;
};

export type AppError = Error & {
  code: string;
  details?: ErrorContext;
  statusCode?: number;
  isOperational?: boolean;
};

// HTTP helpers
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type HttpHeaders = Record<string, string>;

export type HttpRequest<T = unknown> = {
  method: HttpMethod;
  url: string;
  headers?: HttpHeaders;
  body?: T;
  query?: Record<string, string | string[]>;
  timeout?: number;
};

export type HttpResponse<T = unknown> = {
  status: number;
  statusText: string;
  headers: HttpHeaders;
  body?: T;
  ok: boolean;
  redirected: boolean;
  url: string;
};

// Utility functions for type guards and transformations
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNullOrUndefined(value: unknown): value is null | undefined {
  return isNull(value) || isUndefined(value);
}

// Type assertion helpers
export function assertString(value: unknown): asserts value is string {
  if (!isString(value)) {
    throw new TypeError(`Expected string, got ${typeof value}`);
  }
}

export function assertNumber(value: unknown): asserts value is number {
  if (!isNumber(value)) {
    throw new TypeError(`Expected number, got ${typeof value}`);
  }
}

export function assertBoolean(value: unknown): asserts value is boolean {
  if (!isBoolean(value)) {
    throw new TypeError(`Expected boolean, got ${typeof value}`);
  }
}

export function assertObject(value: unknown): asserts value is Record<string, unknown> {
  if (!isObject(value)) {
    throw new TypeError(`Expected object, got ${typeof value}`);
  }
}

export function assertArray(value: unknown): asserts value is unknown[] {
  if (!isArray(value)) {
    throw new TypeError(`Expected array, got ${typeof value}`);
  }
}

export function assertDate(value: unknown): asserts value is Date {
  if (!isDate(value)) {
    throw new TypeError(`Expected Date, got ${typeof value}`);
  }
}

// Object transformation helpers
export function deepMerge<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

export function cloneDeep<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => cloneDeep(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = cloneDeep(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}
