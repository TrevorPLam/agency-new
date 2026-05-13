/**
 * Random data generators for testing
 */

/**
 * Generates a random UUID v4
 */
export function randomUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates a random email address
 */
export function randomEmail(): string {
  const domains = ['example.com', 'test.com', 'demo.org', 'fake.net'];
  const names = ['user', 'test', 'demo', 'admin', 'customer'];
  const name = names[Math.floor(Math.random() * names.length)];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${name}${num}@${domain}`;
}

/**
 * Generates a random string ID
 */
export function randomId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generates a random phone number
 */
export function randomPhone(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `+1 (${areaCode}) ${exchange}-${number}`;
}

/**
 * Generates a random date within a range
 */
export function randomDate(daysAgo = 30): Date {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

/**
 * Generates a random ISO datetime string
 */
export function randomDatetime(daysAgo = 30): string {
  return randomDate(daysAgo).toISOString();
}

/**
 * Generates a random number within a range
 */
export function randomNumber(min = 0, max = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random string of specified length
 */
export function randomString(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
