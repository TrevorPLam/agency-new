import { authenticator } from 'otplib';
import { randomBytes } from 'crypto';

/**
 * Generate a TOTP secret key using otplib.
 * @returns A base32 encoded secret key
 */
export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate a TOTP token for current time using otplib.
 * @param secret - Base32 encoded secret
 * @param timeStep - Time step in seconds (default: 30)
 * @param digits - Number of digits (default: 6)
 * @returns TOTP token as string
 */
export function generateTotpToken(
  secret: string,
  timeStep: number = 30,
  digits: number = 6
): string {
  // Configure otplib with the provided parameters
  authenticator.options = {
    window: timeStep,
    digits,
  };
  
  return authenticator.generate(secret);
}

/**
 * Verify a TOTP token using otplib.
 * @param secret - Base32 encoded secret
 * @param token - Token to verify
 * @param timeStep - Time step in seconds (default: 30)
 * @param window - Number of time steps to check before/after (default: 1)
 * @returns True if token is valid
 */
export function verifyTotpToken(
  secret: string,
  token: string,
  timeStep: number = 30,
  window: number = 1
): boolean {
  // Configure otplib with the provided parameters
  authenticator.options = {
    window,
    timeStep,
  };
  
  return authenticator.verify({
    token,
    secret,
  });
}
