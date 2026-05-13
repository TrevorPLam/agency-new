import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { authEnv, authConfig } from '../auth';
import { useEnhancedTestIsolation, setupAuthEnvironment, expectSpecificError, expectAnyError } from './utils';
import {
  VALID_AUTH_SECRET,
  VALID_API_KEY_SECRET,
  VALID_AUTH_URL,
  VALID_LOCALHOST_AUTH_URL,
  VALID_APP_VERSION,
  INVALID_SHORT_SECRET,
  INVALID_HTTP_AUTH_URL,
  MAX_SESSION_TIMEOUT_HOURS,
  MIN_SESSION_TIMEOUT_HOURS,
  MAX_CONCURRENT_SESSIONS,
  MIN_CONCURRENT_SESSIONS,
  MAX_RATE_LIMIT_ATTEMPTS,
  MIN_RATE_LIMIT_ATTEMPTS,
  MAX_RATE_LIMIT_WINDOW_MINUTES,
  MIN_RATE_LIMIT_WINDOW_MINUTES,
  MAX_TOTP_ISSUER_LENGTH,
  DEFAULT_SESSION_TIMEOUT_HOURS,
  DEFAULT_MAX_CONCURRENT_SESSIONS,
  DEFAULT_MFA_ENABLED,
  DEFAULT_IMPERSONATION_ENABLED,
  DEFAULT_RATE_LIMIT_ATTEMPTS,
  DEFAULT_RATE_LIMIT_WINDOW_MINUTES,
  OAUTH_PROVIDERS,
  generateLongString,
  generateTooLongString,
  generateEdgeCaseData,
  ERROR_MESSAGES,
} from './constants';

describe('Auth Environment Validation', () => {
  useEnhancedTestIsolation();

  describe('Required Server Variables', () => {
    const setupRequiredVars = () => {
      setupAuthEnvironment({
        AUTH_SECRET: VALID_AUTH_SECRET,
        AUTH_URL: VALID_AUTH_URL,
        AUTH_API_KEY_SECRET: VALID_API_KEY_SECRET,
        NEXT_PUBLIC_AUTH_URL: VALID_AUTH_URL,
        NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
      });
    };

    it('should validate required AUTH_SECRET', () => {
      setupRequiredVars();
      expect(authEnv.AUTH_SECRET).toBe(VALID_AUTH_SECRET);
    });

    it('should throw error for short AUTH_SECRET', () => {
      setupRequiredVars();
      process.env.AUTH_SECRET = INVALID_SHORT_SECRET;
      expectSpecificError(
        () => authEnv.AUTH_SECRET,
        ERROR_MESSAGES.AUTH_SECRET_TOO_SHORT
      );
    });

    it('should throw error for missing AUTH_SECRET', () => {
      setupRequiredVars();
      delete process.env.AUTH_SECRET;
      expectAnyError(() => authEnv.AUTH_SECRET);
    });

    it('should validate required AUTH_URL', () => {
      setupRequiredVars();
      expect(authEnv.AUTH_URL).toBe(VALID_AUTH_URL);
    });

    it('should validate localhost AUTH_URL in development', () => {
      setupRequiredVars();
      process.env.NODE_ENV = 'development';
      process.env.AUTH_URL = VALID_LOCALHOST_AUTH_URL;
      process.env.NEXT_PUBLIC_AUTH_URL = VALID_LOCALHOST_AUTH_URL;
      expect(authEnv.AUTH_URL).toBe(VALID_LOCALHOST_AUTH_URL);
    });

    it('should throw error for HTTP AUTH_URL in production', () => {
      setupRequiredVars();
      process.env.NODE_ENV = 'production';
      process.env.AUTH_URL = INVALID_HTTP_AUTH_URL;
      process.env.NEXT_PUBLIC_AUTH_URL = INVALID_HTTP_AUTH_URL;
      expectSpecificError(
        () => authEnv.AUTH_URL,
        ERROR_MESSAGES.AUTH_URL_HTTPS_REQUIRED
      );
    });

    it('should validate required AUTH_API_KEY_SECRET', () => {
      setupRequiredVars();
      expect(authEnv.AUTH_API_KEY_SECRET).toBe(VALID_API_KEY_SECRET);
    });

    it('should throw error for short AUTH_API_KEY_SECRET', () => {
      setupRequiredVars();
      process.env.AUTH_API_KEY_SECRET = INVALID_SHORT_SECRET;
      expectSpecificError(
        () => authEnv.AUTH_API_KEY_SECRET,
        ERROR_MESSAGES.AUTH_API_KEY_SECRET_TOO_SHORT
      );
    });
  });

  describe('Required Client Variables', () => {
    const setupRequiredVars = () => {
      setupAuthEnvironment({
        AUTH_SECRET: VALID_AUTH_SECRET,
        AUTH_URL: VALID_AUTH_URL,
        AUTH_API_KEY_SECRET: VALID_API_KEY_SECRET,
        NEXT_PUBLIC_AUTH_URL: VALID_AUTH_URL,
        NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
      });
    };

    it('should validate required NEXT_PUBLIC_AUTH_URL', () => {
      setupRequiredVars();
      expect(authEnv.NEXT_PUBLIC_AUTH_URL).toBe(VALID_AUTH_URL);
    });

    it('should validate localhost NEXT_PUBLIC_AUTH_URL', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_AUTH_URL = VALID_LOCALHOST_AUTH_URL;
      expect(authEnv.NEXT_PUBLIC_AUTH_URL).toBe(VALID_LOCALHOST_AUTH_URL);
    });

    it('should throw error for missing NEXT_PUBLIC_AUTH_URL', () => {
      setupRequiredVars();
      delete process.env.NEXT_PUBLIC_AUTH_URL;
      expectAnyError(() => authEnv.NEXT_PUBLIC_AUTH_URL);
    });

    it('should validate required NEXT_PUBLIC_APP_VERSION', () => {
      setupRequiredVars();
      expect(authEnv.NEXT_PUBLIC_APP_VERSION).toBe(VALID_APP_VERSION);
    });

    it('should throw error for missing NEXT_PUBLIC_APP_VERSION', () => {
      setupRequiredVars();
      delete process.env.NEXT_PUBLIC_APP_VERSION;
      expectAnyError(() => authEnv.NEXT_PUBLIC_APP_VERSION);
    });
  });

  describe('Optional Variables', () => {
    const setupRequiredVars = () => {
      setupAuthEnvironment({
        AUTH_SECRET: VALID_AUTH_SECRET,
        AUTH_URL: VALID_AUTH_URL,
        AUTH_API_KEY_SECRET: VALID_API_KEY_SECRET,
        NEXT_PUBLIC_AUTH_URL: VALID_AUTH_URL,
        NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
      });
    };

    it('should use default session timeout when not provided', () => {
      setupRequiredVars();
      delete process.env.AUTH_SESSION_TIMEOUT_HOURS;
      expect(authEnv.AUTH_SESSION_TIMEOUT_HOURS).toBe(DEFAULT_SESSION_TIMEOUT_HOURS);
    });

    it('should validate custom session timeout', () => {
      setupRequiredVars();
      process.env.AUTH_SESSION_TIMEOUT_HOURS = '12';
      expect(authEnv.AUTH_SESSION_TIMEOUT_HOURS).toBe(12);
    });

    it('should throw error for session timeout above maximum', () => {
      setupRequiredVars();
      process.env.AUTH_SESSION_TIMEOUT_HOURS = (MAX_SESSION_TIMEOUT_HOURS + 1).toString();
      expectAnyError(() => authEnv.AUTH_SESSION_TIMEOUT_HOURS);
    });

    it('should use default max sessions when not provided', () => {
      setupRequiredVars();
      delete process.env.AUTH_MAX_CONCURRENT_SESSIONS;
      expect(authEnv.AUTH_MAX_CONCURRENT_SESSIONS).toBe(DEFAULT_MAX_CONCURRENT_SESSIONS);
    });

    it('should validate custom max sessions', () => {
      setupRequiredVars();
      process.env.AUTH_MAX_CONCURRENT_SESSIONS = '10';
      expect(authEnv.AUTH_MAX_CONCURRENT_SESSIONS).toBe(10);
    });

    it('should use default MFA setting when not provided', () => {
      setupRequiredVars();
      delete process.env.AUTH_MFA_ENABLED;
      expect(authEnv.AUTH_MFA_ENABLED).toBe(DEFAULT_MFA_ENABLED);
    });

    it('should validate MFA enabled', () => {
      setupRequiredVars();
      process.env.AUTH_MFA_ENABLED = 'true';
      expect(authEnv.AUTH_MFA_ENABLED).toBe(true);
    });

    it('should validate TOTP issuer when MFA is enabled', () => {
      setupRequiredVars();
      process.env.AUTH_MFA_ENABLED = 'true';
      process.env.AUTH_TOTP_ISSUER = 'MyApp';
      expect(authEnv.AUTH_TOTP_ISSUER).toBe('MyApp');
    });

    it('should validate OAuth providers', () => {
      setupRequiredVars();
      process.env.AUTH_GOOGLE_CLIENT_ID = 'google-client-id';
      process.env.AUTH_GOOGLE_CLIENT_SECRET = 'google-secret';
      process.env.AUTH_GITHUB_CLIENT_ID = 'github-client-id';
      process.env.AUTH_GITHUB_CLIENT_SECRET = 'github-secret';
      
      expect(authEnv.AUTH_GOOGLE_CLIENT_ID).toBe('google-client-id');
      expect(authEnv.AUTH_GOOGLE_CLIENT_SECRET).toBe('google-secret');
      expect(authEnv.AUTH_GITHUB_CLIENT_ID).toBe('github-client-id');
      expect(authEnv.AUTH_GITHUB_CLIENT_SECRET).toBe('github-secret');
    });

    it('should validate SAML configuration', () => {
      setupRequiredVars();
      process.env.AUTH_SAML_IDP_ENTITY_ID = 'https://idp.example.com';
      process.env.AUTH_SAML_IDP_SSO_URL = 'https://idp.example.com/sso';
      process.env.AUTH_SAML_IDP_CERTIFICATE = '-----BEGIN CERTIFICATE-----...';
      process.env.AUTH_SAML_SP_ENTITY_ID = 'https://sp.example.com';
      
      expect(authEnv.AUTH_SAML_IDP_ENTITY_ID).toBe('https://idp.example.com');
      expect(authEnv.AUTH_SAML_IDP_SSO_URL).toBe('https://idp.example.com/sso');
      expect(authEnv.AUTH_SAML_IDP_CERTIFICATE).toBe('-----BEGIN CERTIFICATE-----...');
      expect(authEnv.AUTH_SAML_SP_ENTITY_ID).toBe('https://sp.example.com');
    });

    it('should use default impersonation setting when not provided', () => {
      setupRequiredVars();
      delete process.env.AUTH_IMPERSONATION_ENABLED;
      expect(authEnv.AUTH_IMPERSONATION_ENABLED).toBe(DEFAULT_IMPERSONATION_ENABLED);
    });

    it('should validate impersonation enabled', () => {
      setupRequiredVars();
      process.env.AUTH_IMPERSONATION_ENABLED = 'true';
      expect(authEnv.AUTH_IMPERSONATION_ENABLED).toBe(true);
    });

    it('should use default rate limit settings when not provided', () => {
      setupRequiredVars();
      delete process.env.AUTH_RATE_LIMIT_ATTEMPTS;
      delete process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES;
      
      expect(authEnv.AUTH_RATE_LIMIT_ATTEMPTS).toBe(DEFAULT_RATE_LIMIT_ATTEMPTS);
      expect(authEnv.AUTH_RATE_LIMIT_WINDOW_MINUTES).toBe(DEFAULT_RATE_LIMIT_WINDOW_MINUTES);
    });

    it('should validate custom rate limit settings', () => {
      setupRequiredVars();
      process.env.AUTH_RATE_LIMIT_ATTEMPTS = '10';
      process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES = '5';
      
      expect(authEnv.AUTH_RATE_LIMIT_ATTEMPTS).toBe(10);
      expect(authEnv.AUTH_RATE_LIMIT_WINDOW_MINUTES).toBe(5);
    });

    it('should validate public MFA setting', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_AUTH_MFA_ENABLED = 'true';
      expect(authEnv.NEXT_PUBLIC_AUTH_MFA_ENABLED).toBe(true);
    });

    it('should validate public providers', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_AUTH_PROVIDERS = 'google,github,microsoft';
      expect(authEnv.NEXT_PUBLIC_AUTH_PROVIDERS).toEqual(['google', 'github', 'microsoft']);
    });

    it('should validate public impersonation setting', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_AUTH_IMPERSONATION_ENABLED = 'true';
      expect(authEnv.NEXT_PUBLIC_AUTH_IMPERSONATION_ENABLED).toBe(true);
    });
  });

  describe('Auth Config Object', () => {
    const setupRequiredVars = () => {
      setupAuthEnvironment({
        AUTH_SECRET: VALID_AUTH_SECRET,
        AUTH_URL: VALID_AUTH_URL,
        AUTH_API_KEY_SECRET: VALID_API_KEY_SECRET,
        NEXT_PUBLIC_AUTH_URL: VALID_AUTH_URL,
        NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
        AUTH_SESSION_TIMEOUT_HOURS: '12',
        AUTH_MFA_ENABLED: 'true',
        AUTH_TOTP_ISSUER: 'MyApp',
        AUTH_GOOGLE_CLIENT_ID: 'google-client-id',
        AUTH_GOOGLE_CLIENT_SECRET: 'google-secret',
        AUTH_IMPERSONATION_ENABLED: 'true',
        AUTH_RATE_LIMIT_ATTEMPTS: '10',
        AUTH_RATE_LIMIT_WINDOW_MINUTES: '5',
        NEXT_PUBLIC_AUTH_MFA_ENABLED: 'true',
        NEXT_PUBLIC_AUTH_PROVIDERS: 'google,github',
        NEXT_PUBLIC_AUTH_IMPERSONATION_ENABLED: 'true',
      });
    };

    it('should create correct auth config object', () => {
      setupRequiredVars();
      expect(authConfig).toEqual({
        secret: VALID_AUTH_SECRET,
        url: VALID_AUTH_URL,
        cookieSecret: undefined,
        sessionTimeoutHours: 12,
        maxConcurrentSessions: DEFAULT_MAX_CONCURRENT_SESSIONS,
        mfaEnabled: true,
        totpIssuer: 'MyApp',
        oauthProviders: {
          google: {
            clientId: 'google-client-id',
            clientSecret: 'google-secret',
          },
          github: {
            clientId: undefined,
            clientSecret: undefined,
          },
          microsoft: {
            clientId: undefined,
            clientSecret: undefined,
          },
        },
        samlConfig: {
          idpEntityId: undefined,
          idpSsoUrl: undefined,
          idpCertificate: undefined,
          spEntityId: undefined,
        },
        apiKeySecret: VALID_API_KEY_SECRET,
        impersonationEnabled: true,
        rateLimit: {
          attempts: 10,
          windowMinutes: 5,
        },
        publicUrl: VALID_AUTH_URL,
        publicProviders: ['google', 'github'],
        publicMfaEnabled: true,
        publicImpersonationEnabled: true,
      });
    });
  });

  describe('Edge Cases', () => {
    const setupRequiredVars = () => {
      setupAuthEnvironment({
        AUTH_SECRET: VALID_AUTH_SECRET,
        AUTH_URL: VALID_AUTH_URL,
        AUTH_API_KEY_SECRET: VALID_API_KEY_SECRET,
        NEXT_PUBLIC_AUTH_URL: VALID_AUTH_URL,
        NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
      });
    };

    it('should handle maximum session timeout', () => {
      setupRequiredVars();
      process.env.AUTH_SESSION_TIMEOUT_HOURS = MAX_SESSION_TIMEOUT_HOURS.toString();
      expect(authEnv.AUTH_SESSION_TIMEOUT_HOURS).toBe(MAX_SESSION_TIMEOUT_HOURS);
    });

    it('should handle minimum session timeout', () => {
      setupRequiredVars();
      process.env.AUTH_SESSION_TIMEOUT_HOURS = MIN_SESSION_TIMEOUT_HOURS.toString();
      expect(authEnv.AUTH_SESSION_TIMEOUT_HOURS).toBe(MIN_SESSION_TIMEOUT_HOURS);
    });

    it('should handle maximum concurrent sessions', () => {
      setupRequiredVars();
      process.env.AUTH_MAX_CONCURRENT_SESSIONS = MAX_CONCURRENT_SESSIONS.toString();
      expect(authEnv.AUTH_MAX_CONCURRENT_SESSIONS).toBe(MAX_CONCURRENT_SESSIONS);
    });

    it('should handle minimum concurrent sessions', () => {
      setupRequiredVars();
      process.env.AUTH_MAX_CONCURRENT_SESSIONS = MIN_CONCURRENT_SESSIONS.toString();
      expect(authEnv.AUTH_MAX_CONCURRENT_SESSIONS).toBe(MIN_CONCURRENT_SESSIONS);
    });

    it('should handle maximum rate limit attempts', () => {
      setupRequiredVars();
      process.env.AUTH_RATE_LIMIT_ATTEMPTS = MAX_RATE_LIMIT_ATTEMPTS.toString();
      expect(authEnv.AUTH_RATE_LIMIT_ATTEMPTS).toBe(MAX_RATE_LIMIT_ATTEMPTS);
    });

    it('should handle minimum rate limit attempts', () => {
      setupRequiredVars();
      process.env.AUTH_RATE_LIMIT_ATTEMPTS = MIN_RATE_LIMIT_ATTEMPTS.toString();
      expect(authEnv.AUTH_RATE_LIMIT_ATTEMPTS).toBe(MIN_RATE_LIMIT_ATTEMPTS);
    });

    it('should handle maximum rate limit window', () => {
      setupRequiredVars();
      process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES = MAX_RATE_LIMIT_WINDOW_MINUTES.toString();
      expect(authEnv.AUTH_RATE_LIMIT_WINDOW_MINUTES).toBe(MAX_RATE_LIMIT_WINDOW_MINUTES);
    });

    it('should handle minimum rate limit window', () => {
      setupRequiredVars();
      process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES = MIN_RATE_LIMIT_WINDOW_MINUTES.toString();
      expect(authEnv.AUTH_RATE_LIMIT_WINDOW_MINUTES).toBe(MIN_RATE_LIMIT_WINDOW_MINUTES);
    });

    it('should handle maximum TOTP issuer length', () => {
      setupRequiredVars();
      process.env.AUTH_MFA_ENABLED = 'true';
      process.env.AUTH_TOTP_ISSUER = generateLongString(MAX_TOTP_ISSUER_LENGTH);
      expect(authEnv.AUTH_TOTP_ISSUER).toBe(generateLongString(MAX_TOTP_ISSUER_LENGTH));
    });

    it('should reject TOTP issuer that exceeds maximum length', () => {
      setupRequiredVars();
      process.env.AUTH_MFA_ENABLED = 'true';
      process.env.AUTH_TOTP_ISSUER = generateTooLongString(MAX_TOTP_ISSUER_LENGTH);
      expectAnyError(() => authEnv.AUTH_TOTP_ISSUER);
    });

    it('should handle empty public providers', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_AUTH_PROVIDERS = '';
      expect(authEnv.NEXT_PUBLIC_AUTH_PROVIDERS).toEqual([]);
    });

    it('should handle single public provider', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_AUTH_PROVIDERS = 'google';
      expect(authEnv.NEXT_PUBLIC_AUTH_PROVIDERS).toEqual(['google']);
    });

    it('should reject invalid public provider', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_AUTH_PROVIDERS = 'invalid,google';
      expectAnyError(() => authEnv.NEXT_PUBLIC_AUTH_PROVIDERS);
    });

    // New edge case tests
    it('should handle unicode characters in TOTP issuer', () => {
      setupRequiredVars();
      process.env.AUTH_MFA_ENABLED = 'true';
      process.env.AUTH_TOTP_ISSUER = generateEdgeCaseData.unicodeString();
      // Should either accept or reject gracefully
      expect(() => authEnv.AUTH_TOTP_ISSUER).not.toThrow();
    });

    it('should handle special characters in OAuth client IDs', () => {
      setupRequiredVars();
      process.env.AUTH_GOOGLE_CLIENT_ID = generateEdgeCaseData.specialChars();
      expect(() => authEnv.AUTH_GOOGLE_CLIENT_ID).not.toThrow();
    });

    it('should handle boolean edge cases for MFA enabled', () => {
      setupRequiredVars();
      const truthyValues = generateEdgeCaseData.truthyStrings();
      truthyValues.forEach((value: string) => {
        process.env.AUTH_MFA_ENABLED = value;
        expect(authEnv.AUTH_MFA_ENABLED).toBe(true);
      });
    });

    it('should handle boolean edge cases for MFA disabled', () => {
      setupRequiredVars();
      const falsyValues = generateEdgeCaseData.falsyStrings();
      falsyValues.forEach((value: string) => {
        process.env.AUTH_MFA_ENABLED = value;
        expect(authEnv.AUTH_MFA_ENABLED).toBe(false);
      });
    });

    it('should reject SQL injection patterns in secrets', () => {
      setupRequiredVars();
      process.env.AUTH_SECRET = generateEdgeCaseData.sqlInjection();
      expectAnyError(() => authEnv.AUTH_SECRET);
    });

    it('should handle whitespace variants in environment variables', () => {
      setupRequiredVars();
      process.env.AUTH_TOTP_ISSUER = generateEdgeCaseData.whitespaceVariants();
      // Should trim whitespace or handle appropriately
      expect(() => authEnv.AUTH_TOTP_ISSUER).not.toThrow();
    });

    it('should handle empty string values for optional variables', () => {
      setupRequiredVars();
      process.env.AUTH_TOTP_ISSUER = generateEdgeCaseData.emptyString();
      expect(() => authEnv.AUTH_TOTP_ISSUER).not.toThrow();
    });
  });
});
