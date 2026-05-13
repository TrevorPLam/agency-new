import { pgTable, uuid, text, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

/**
 * TOTP secrets table - Stores TOTP configuration for users
 * 
 * This table stores TOTP secrets with proper versioning and activation status.
 * Multiple secrets can exist but only one is active per user.
 */
export const totpSecrets = pgTable('totp_secrets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // TOTP configuration
  secret: text('secret').notNull(), // Base32 encoded secret
  algorithm: text('algorithm').notNull().$type<'SHA1' | 'SHA256' | 'SHA512'>(),
  digits: text('digits').notNull().$type<6 | 8>(),
  period: text('period').notNull().$type<number>(),
  
  // Status
  isActive: boolean('is_active').notNull().default(false),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
  
  // Usage tracking
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  usageCount: text('usage_count').notNull().default(0),
  
  // Metadata
  issuer: text('issuer').default('Firm Platform'),
  label: text('label'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  userIdIdx: index('idx_totp_secrets_user_id').on(table.userId),
  isActiveIdx: index('idx_totp_secrets_is_active').on(table.isActive),
  uniqueActiveSecret: index('idx_totp_secrets_unique_active').on(table.userId, table.isActive).unique()
}))

export type TotpSecret = typeof totpSecrets.$inferSelect
export type NewTotpSecret = typeof totpSecrets.$inferInsert

/**
 * Backup codes table - Stores hashed backup codes for MFA
 * 
 * This table stores backup codes as Argon2 hashes with proper tracking.
 * Each code is single-use and tied to a specific TOTP secret.
 */
export const backupCodes = pgTable('backup_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  totpSecretId: uuid('totp_secret_id').notNull().references(() => totpSecrets.id, { onDelete: 'cascade' }),
  
  // Backup code data
  codeHash: text('code_hash').notNull(), // Argon2 hash of the backup code
  codePrefix: text('code_prefix').notNull(), // First 4 characters for identification
  
  // Status
  isUsed: boolean('is_used').notNull().default(false),
  usedAt: timestamp('used_at', { withTimezone: true }),
  usedByIpAddress: text('used_by_ip_address'),
  usedByUserAgent: text('used_by_user_agent'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }) // Optional expiration
}, (table) => ({
  userIdIdx: index('idx_backup_codes_user_id').on(table.userId),
  totpSecretIdIdx: index('idx_backup_codes_totp_secret_id').on(table.totpSecretId),
  isUsedIdx: index('idx_backup_codes_is_used').on(table.isUsed),
  codePrefixIdx: index('idx_backup_codes_code_prefix').on(table.codePrefix)
}))

export type BackupCode = typeof backupCodes.$inferSelect
export type NewBackupCode = typeof backupCodes.$inferInsert

/**
 * MFA sessions table - Tracks MFA verification sessions
 * 
 * This table tracks MFA verification status for user sessions.
 * Used to determine if MFA is required and already verified.
 */
export const mfaSessions = pgTable('mfa_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(), // Application session ID
  
  // MFA verification status
  mfaVerified: boolean('mfa_verified').notNull().default(false),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  method: text('method').$type<'totp' | 'backup_code'>(),
  
  // Context
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  // Device trust
  isTrustedDevice: boolean('is_trusted_device').notNull().default(false),
  trustedDeviceExpiresAt: timestamp('trusted_device_expires_at', { withTimezone: true }),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true })
}, (table) => ({
  userIdIdx: index('idx_mfa_sessions_user_id').on(table.userId),
  sessionIdIdx: index('idx_mfa_sessions_session_id').on(table.sessionId),
  mfaVerifiedIdx: index('idx_mfa_sessions_mfa_verified').on(table.mfaVerified),
  expiresAtIdx: index('idx_mfa_sessions_expires_at').on(table.expiresAt)
}))

export type MfaSession = typeof mfaSessions.$inferSelect
export type NewMfaSession = typeof mfaSessions.$inferInsert

/**
 * MFA rate limiting table - Prevents brute force attacks
 * 
 * This table tracks MFA attempts for rate limiting purposes.
 */
export const mfaRateLimits = pgTable('mfa_rate_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Rate limiting context
  identifier: text('identifier').notNull(), // IP address or other identifier
  identifierType: text('identifier_type').notNull().$type<'ip_address' | 'user_agent' | 'session_id'>(),
  
  // Attempt tracking
  attemptCount: text('attempt_count').notNull().default(0),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
  
  // Window management
  windowStartAt: timestamp('window_start_at', { withTimezone: true }).notNull().defaultNow(),
  windowDurationMinutes: text('window_duration_minutes').notNull().default(5),
  
  // Status
  isBlocked: boolean('is_blocked').notNull().default(false),
  blockedUntil: timestamp('blocked_until', { withTimezone: true }),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  userIdIdx: index('idx_mfa_rate_limits_user_id').on(table.userId),
  identifierIdx: index('idx_mfa_rate_limits_identifier').on(table.identifier),
  identifierTypeIdx: index('idx_mfa_rate_limits_identifier_type').on(table.identifierType),
  isBlockedIdx: index('idx_mfa_rate_limits_is_blocked').on(table.isBlocked),
  windowStartIdx: index('idx_mfa_rate_limits_window_start').on(table.windowStartAt)
}))

export type MfaRateLimit = typeof mfaRateLimits.$inferSelect
export type NewMfaRateLimit = typeof mfaRateLimits.$inferInsert

/**
 * Relations
 */
export const totpSecretsRelations = relations(totpSecrets, ({ one, many }) => ({
  user: one(users, {
    fields: [totpSecrets.userId],
    references: [users.id]
  }),
  backupCodes: many(backupCodes)
}))

export const backupCodesRelations = relations(backupCodes, ({ one }) => ({
  user: one(users, {
    fields: [backupCodes.userId],
    references: [users.id]
  }),
  totpSecret: one(totpSecrets, {
    fields: [backupCodes.totpSecretId],
    references: [totpSecrets.id]
  })
}))

export const mfaSessionsRelations = relations(mfaSessions, ({ one }) => ({
  user: one(users, {
    fields: [mfaSessions.userId],
    references: [users.id]
  })
}))

export const mfaRateLimitsRelations = relations(mfaRateLimits, ({ one }) => ({
  user: one(users, {
    fields: [mfaRateLimits.userId],
    references: [users.id]
  })
}))
