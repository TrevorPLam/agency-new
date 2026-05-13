import { createHash } from 'crypto';

/**
 * Converts a string to a URL-friendly slug
 * - Converts to lowercase
 * - Replaces spaces and special characters with hyphens
 * - Removes consecutive hyphens
 * - Trims leading/trailing hyphens
 * @param text - The text to slugify
 * @param options - Configuration options
 * @returns The slugified string
 */
export function slugify(
  text: string,
  options: {
    maxLength?: number;
    separator?: string;
    lowercase?: boolean;
  } = {}
): string {
  const {
    maxLength = 100,
    separator = '-',
    lowercase = true
  } = options;

  let result = text;

  // Convert to lowercase if requested
  if (lowercase) {
    result = result.toLowerCase();
  }

  // Replace spaces, underscores, and multiple separators with single separator
  result = result
    .replace(/[^\w\s-]/gu, '') // Remove non-word chars except spaces and hyphens (Unicode-aware)
    .replace(/[\s_]+/gu, separator) // Replace spaces and underscores with separator (Unicode-aware)
    .replace(new RegExp(`${separator}+`, 'gu'), separator); // Replace multiple separators (Unicode-aware)

  // Remove leading/trailing separators
  result = result.replace(new RegExp(`^${separator}+|${separator}+$`, 'gu'), '');

  // Apply max length
  if (result.length > maxLength) {
    result = result.substring(0, maxLength);
    // Remove trailing separator if we cut in the middle
    result = result.replace(new RegExp(`${separator}+$`, 'u'), '');
  }

  return result;
}

/**
 * Hashes an IP address for pseudonymization using SHA-256
 * Uses a salt from environment variable to prevent rainbow table attacks
 * @param ip - The IP address to hash
 * @returns The hashed IP address as a hex string
 * @throws Error if IP_HASH_SALT environment variable is not set
 */
export function hashIp(ip: string): string {
  if (!ip || typeof ip !== 'string') {
    throw new Error('IP address must be a non-empty string');
  }

  // Basic IP validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    throw new Error('Invalid IP address format');
  }

  const salt = process.env['IP_HASH_SALT'];
  if (!salt) {
    throw new Error('IP_HASH_SALT environment variable must be set for IP hashing');
  }

  const hash = createHash('sha256');
  hash.update(ip);
  hash.update(salt);

  return hash.digest('hex');
}

/**
 * Generates a consistent hash for any string input
 * @param input - The string to hash
 * @param algorithm - Hash algorithm to use (default: sha256)
 * @returns The hash as a hex string
 */
export function hashString(
  input: string,
  algorithm: 'sha256' | 'sha512' | 'md5' = 'sha256'
): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  const hash = createHash(algorithm);
  hash.update(input);
  return hash.digest('hex');
}

/**
 * Truncates a string to a specified length with an ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns The truncated string
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalizes the first letter of a string
 * @param text - The text to capitalize
 * @returns The capitalized string
 */
export function capitalize(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Converts a string to camelCase
 * 
 * Acronym handling:
 * - Consecutive uppercase letters are treated as a single word (e.g., "XMLParser" -> "xmlParser")
 * - Single uppercase letters are capitalized (e.g., "aB" -> "aB")
 * - Separators (hyphens, underscores, spaces) trigger capitalization
 * 
 * @param text - The text to convert
 * @returns The camelCase string
 * @example
 * toCamelCase('hello-world') // 'helloWorld'
 * toCamelCase('XMLParser') // 'xmlParser'
 * toCamelCase('user_id') // 'userId'
 */
export function toCamelCase(text: string): string {
  return text
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

/**
 * Converts a string to PascalCase
 * 
 * Acronym handling:
 * - Consecutive uppercase letters are preserved (e.g., "XML" -> "XML")
 * - First character is always capitalized
 * - Separators (hyphens, underscores, spaces) trigger capitalization
 * 
 * @param text - The text to convert
 * @returns The PascalCase string
 * @example
 * toPascalCase('hello-world') // 'HelloWorld'
 * toPascalCase('XMLParser') // 'XMLParser'
 * toPascalCase('user_id') // 'UserId'
 */
export function toPascalCase(text: string): string {
  return text
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
    .replace(/^[a-z]/, char => char.toUpperCase());
}

/**
 * Converts a string to snake_case
 * 
 * Acronym handling:
 * - Consecutive uppercase letters are treated as a single word (e.g., "XMLParser" -> "xml_parser")
 * - All letters are lowercase
 * - CamelCase boundaries are converted to underscores
 * 
 * @param text - The text to convert
 * @returns The snake_case string
 * @example
 * toSnakeCase('helloWorld') // 'hello_world'
 * toSnakeCase('XMLParser') // 'xml_parser'
 * toSnakeCase('user-id') // 'user_id'
 */
export function toSnakeCase(text: string): string {
  return text
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('_');
}
