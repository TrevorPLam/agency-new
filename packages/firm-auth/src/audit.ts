/**
 * Immutable audit logging for Firm Auth
 * 
 * Provides comprehensive audit logging for all authentication and
 * authorization events with PII redaction and tamper protection.
 */

import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import type { UserId, TenantId, AuditAction } from '@firm/types';
import { generateUUID } from '@firm/crypto';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: UserId;
  tenantId?: TenantId;
  sessionId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  outcome: 'success' | 'failure' | 'error';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;
  riskScore: number; // 0-100, higher is more risky
  piiRedacted: boolean;
  checksum: string; // For tamper detection
}

export interface AuditLogOptions {
  includePii?: boolean;
  riskScore?: number;
  correlationId?: string;
  requestId?: string;
}

export interface AuditLogQuery {
  userId?: UserId;
  tenantId?: TenantId;
  action?: AuditAction;
  resource?: string;
  outcome?: 'success' | 'failure' | 'error';
  startDate?: Date;
  endDate?: Date;
  minRiskScore?: number;
  maxRiskScore?: number;
  ipAddress?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogResult {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AuditLogSummary {
  totalEvents: number;
  successRate: number;
  failureRate: number;
  errorRate: number;
  averageRiskScore: number;
  topActions: Array<{ action: AuditAction; count: number }>;
  topResources: Array<{ resource: string; count: number }>;
  topIpAddresses: Array<{ ipAddress: string; count: number }>;
  riskDistribution: {
    low: number;    // 0-33
    medium: number; // 34-66
    high: number;   // 67-100
  };
}

// Risk score calculation constants
const RISK_SCORES = {
  // Authentication events
  login_success: 10,
  login_failure: 30,
  login_mfa_required: 20,
  login_mfa_success: 15,
  login_mfa_failure: 40,
  logout: 5,
  
  // Authorization events
  permission_granted: 5,
  permission_denied: 25,
  impersonation_start: 50,
  impersonation_end: 10,
  delegation_grant: 45,
  delegation_revoke: 10,
  
  // Security events
  api_key_created: 20,
  api_key_deleted: 15,
  mfa_enabled: 10,
  mfa_disabled: 35,
  password_changed: 15,
  
  // High-risk events
  admin_access: 60,
  data_export: 40,
  bulk_operation: 35,
  configuration_change: 30,
};

/**
 * Creates an audit log entry
 * 
 * Logs an event with automatic PII redaction and checksum generation.
 */
export async function createAuditLog(
  action: AuditAction,
  resource: string,
  outcome: 'success' | 'failure' | 'error',
  details: Record<string, any>,
  options: AuditLogOptions & {
    userId?: UserId;
    tenantId?: TenantId;
    sessionId?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<void> {
  const {
    userId,
    tenantId,
    sessionId,
    resourceId,
    ipAddress,
    userAgent,
    includePii = false,
    riskScore: customRiskScore,
    correlationId,
    requestId,
  } = options;

  // Calculate risk score
  const riskScore = customRiskScore || calculateRiskScore(action, outcome, details);

  // Redact PII if required
  const redactedDetails = includePii ? details : redactPii(details);

  // Create audit entry
  const auditEntry: AuditLogEntry = {
    id: generateUUID(),
    timestamp: new Date(),
    userId,
    tenantId,
    sessionId,
    action,
    resource,
    resourceId,
    outcome,
    details: redactedDetails,
    ipAddress,
    userAgent,
    requestId,
    correlationId,
    riskScore,
    piiRedacted: !includePii,
  };

  // Generate checksum for tamper detection
  const checksum = generateChecksum(auditEntry);
  auditEntry.checksum = checksum;

  // Store audit entry
  await storeAuditLog(auditEntry);
}

/**
 * Queries audit logs
 */
export async function queryAuditLogs(
  query: AuditLogQuery
): Promise<AuditLogResult> {
  const {
    page = 1,
    limit = 100,
    ...filters
  } = query;

  // This would integrate with firm-db for database access
  console.log('Querying audit logs:', { query: filters, page, limit });
  
  return {
    entries: [],
    total: 0,
    page,
    limit,
    hasMore: false,
  };
}

/**
 * Gets audit log summary
 */
export async function getAuditLogSummary(
  query: Omit<AuditLogQuery, 'page' | 'limit'>
): Promise<AuditLogSummary> {
  // This would integrate with firm-db for analytics
  console.log('Getting audit log summary:', query);
  
  return {
    totalEvents: 0,
    successRate: 0,
    failureRate: 0,
    errorRate: 0,
    averageRiskScore: 0,
    topActions: [],
    topResources: [],
    topIpAddresses: [],
    riskDistribution: {
      low: 0,
      medium: 0,
      high: 0,
    },
  };
}

/**
 * Verifies audit log integrity
 */
export async function verifyAuditLogIntegrity(
  auditEntryId: string
): Promise<{ valid: boolean; expectedChecksum?: string; actualChecksum?: string }> {
  const auditEntry = await getAuditLogEntry(auditEntryId);
  
  if (!auditEntry) {
    return { valid: false };
  }

  // Recalculate checksum
  const entryWithoutChecksum = { ...auditEntry };
  const { checksum, ...entryWithoutChecksumValue } = entryWithoutChecksum;
  
  const expectedChecksum = generateChecksum(entryWithoutChecksumValue);
  const actualChecksum = auditEntry.checksum;

  return {
    valid: expectedChecksum === actualChecksum,
    expectedChecksum,
    actualChecksum,
  };
}

/**
 * Gets high-risk events
 */
export async function getHighRiskEvents(
  minRiskScore: number = 67,
  timeRangeHours: number = 24
): Promise<AuditLogEntry[]> {
  const startDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
  
  return queryAuditLogs({
    minRiskScore,
    startDate,
    endDate: new Date(),
    limit: 1000,
  }).then(result => result.entries);
}

/**
 * Gets user activity timeline
 */
export async function getUserActivityTimeline(
  userId: UserId,
  timeRangeHours: number = 24
): Promise<AuditLogEntry[]> {
  const startDate = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);
  
  return queryAuditLogs({
    userId,
    startDate,
    endDate: new Date(),
    limit: 500,
  }).then(result => result.entries);
}

/**
 * Detects anomalous activity patterns
 */
export async function detectAnomalousActivity(
  userId: UserId,
  timeRangeHours: number = 24
): Promise<{
  anomalies: Array<{
    type: string;
    description: string;
    riskScore: number;
    detectedAt: Date;
    relatedEvents: string[];
  }>;
  totalRiskScore: number;
}> {
  // Get user activity
  const userActivity = await getUserActivityTimeline(userId, timeRangeHours);
  
  const anomalies: Array<{
    type: string;
    description: string;
    riskScore: number;
    detectedAt: Date;
    relatedEvents: string[];
  }> = [];

  // Detect multiple failed logins
  const failedLogins = userActivity.filter(entry => 
    entry.action === 'login' && entry.outcome === 'failure'
  );
  
  if (failedLogins.length >= 5) {
    anomalies.push({
      type: 'multiple_failed_logins',
      description: `User has ${failedLogins.length} failed login attempts`,
      riskScore: 70,
      detectedAt: new Date(),
      relatedEvents: failedLogins.map(entry => entry.id),
    });
  }

  // Detect unusual IP addresses
  const ipAddresses = [...new Set(userActivity.map(entry => entry.ipAddress).filter(Boolean))];
  if (ipAddresses.length >= 3) {
    anomalies.push({
      type: 'multiple_ip_addresses',
      description: `User accessed from ${ipAddresses.length} different IP addresses`,
      riskScore: 50,
      detectedAt: new Date(),
      relatedEvents: userActivity.map(entry => entry.id),
    });
  }

  // Detect high-risk actions
  const highRiskEvents = userActivity.filter(entry => entry.riskScore >= 60);
  if (highRiskEvents.length >= 3) {
    anomalies.push({
      type: 'high_risk_actions',
      description: `User performed ${highRiskEvents.length} high-risk actions`,
      riskScore: 80,
      detectedAt: new Date(),
      relatedEvents: highRiskEvents.map(entry => entry.id),
    });
  }

  const totalRiskScore = anomalies.reduce((sum, anomaly) => sum + anomaly.riskScore, 0);

  return { anomalies, totalRiskScore };
}

// Helper functions

function calculateRiskScore(action: AuditAction, outcome: 'success' | 'failure' | 'error', details: Record<string, any>): number {
  // Base risk score from action
  let baseScore = RISK_SCORES[action as keyof typeof RISK_SCORES] || 20;
  
  // Adjust based on outcome
  if (outcome === 'failure') {
    baseScore *= 1.5;
  } else if (outcome === 'error') {
    baseScore *= 2;
  }
  
  // Adjust based on details
  if (details.impersonation) {
    baseScore += 20;
  }
  
  if (details.adminAction) {
    baseScore += 15;
  }
  
  if (details.bulkOperation) {
    baseScore += 10;
  }
  
  // Cap at 100
  return Math.min(100, Math.round(baseScore));
}

function redactPii(details: Record<string, any>): Record<string, any> {
  const redacted = { ...details };
  
  // Redact common PII fields
  const piiFields = ['email', 'phone', 'ssn', 'creditCard', 'address', 'name'];
  
  for (const field of piiFields) {
    if (redacted[field]) {
      redacted[field] = '[REDACTED]';
    }
  }
  
  // Redact nested PII
  for (const key in redacted) {
    if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactPii(redacted[key]);
    }
  }
  
  return redacted;
}

function generateChecksum(entry: Partial<AuditLogEntry>): string {
  const entryString = JSON.stringify(entry, Object.keys(entry).sort());
  return createHash('sha256').update(entryString).digest('hex');
}

// Database access functions (integrated with firm-db)

async function storeAuditLog(entry: Partial<AuditLogEntry>): Promise<void> {
  try {
    // Import database modules dynamically to avoid circular dependencies
    const { db } = await import('@firm/db');
    const { auditLogs } = await import('@firm/db/schemas');
    
    // Map audit entry to database schema
    const auditLogRecord = {
      id: entry.id,
      tenantId: entry.tenantId,
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      requestId: entry.requestId,
      oldValue: entry.details?.oldValue,
      newValue: entry.details?.newValue,
      success: entry.outcome === 'success',
      errorMessage: entry.outcome === 'error' ? entry.details?.error : undefined,
      metadata: {
        ...entry.details,
        sessionId: entry.sessionId,
        correlationId: entry.correlationId,
        riskScore: entry.riskScore,
        piiRedacted: entry.piiRedacted,
        checksum: entry.checksum,
      },
    };
    
    // Store audit log in database
    await db.insert(auditLogs).values(auditLogRecord);
    
    console.log('Audit log stored successfully:', { id: entry.id, action: entry.action, outcome: entry.outcome });
  } catch (error) {
    console.error('Failed to store audit log:', error);
    
    // Fallback to console logging if database fails
    console.log('AUDIT LOG FALLBACK:', {
      id: entry.id,
      timestamp: entry.timestamp,
      action: entry.action,
      resource: entry.resource,
      outcome: entry.outcome,
      userId: entry.userId,
      tenantId: entry.tenantId,
      details: entry.details,
    });
    
    // Re-throw error to allow calling code to handle it
    throw error;
  }
}

async function getAuditLogEntry(entryId: string): Promise<AuditLogEntry | null> {
  try {
    // Import database modules dynamically to avoid circular dependencies
    const { db } = await import('@firm/db');
    const { auditLogs } = await import('@firm/db/schemas');
    
    // Query audit log from database
    const result = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, entryId))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const record = result[0];
    
    // Map database record back to audit entry format
    return {
      id: record.id,
      timestamp: record.createdAt,
      userId: record.userId,
      tenantId: record.tenantId,
      sessionId: (record.metadata as any)?.sessionId,
      action: record.action as AuditAction,
      resource: record.resource,
      resourceId: record.resourceId,
      outcome: record.success ? 'success' : (record.errorMessage ? 'error' : 'failure'),
      details: {
        oldValue: record.oldValue,
        newValue: record.newValue,
        error: record.errorMessage,
        ...(record.metadata as Record<string, any>),
      },
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
      requestId: record.requestId,
      correlationId: (record.metadata as any)?.correlationId,
      riskScore: (record.metadata as any)?.riskScore || 20,
      piiRedacted: (record.metadata as any)?.piiRedacted || false,
      checksum: (record.metadata as any)?.checksum || '',
    };
  } catch (error) {
    console.error('Failed to get audit log entry:', error);
    return null;
  }
}

// Convenience functions for common audit events

export async function logAuthenticationEvent(
  userId: UserId,
  tenantId: TenantId,
  action: 'login' | 'logout',
  outcome: 'success' | 'failure',
  details: Record<string, any>,
  context: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  } = {}
): Promise<void> {
  await createAuditLog(
    action,
    'authentication',
    outcome,
    details,
    {
      userId,
      tenantId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      riskScore: action === 'login' ? (outcome === 'success' ? 10 : 30) : 5,
    }
  );
}

export async function logAuthorizationEvent(
  userId: UserId,
  tenantId: TenantId,
  resource: string,
  action: string,
  outcome: 'success' | 'failure',
  details: Record<string, any>,
  context: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  } = {}
): Promise<void> {
  await createAuditLog(
    action as AuditAction,
    resource,
    outcome,
    details,
    {
      userId,
      tenantId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      riskScore: outcome === 'success' ? 5 : 25,
    }
  );
}

export async function logSecurityEvent(
  action: string,
  resource: string,
  outcome: 'success' | 'failure' | 'error',
  details: Record<string, any>,
  context: {
    userId?: UserId;
    tenantId?: TenantId;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    riskScore?: number;
  } = {}
): Promise<void> {
  await createAuditLog(
    action as AuditAction,
    resource,
    outcome,
    details,
    {
      userId: context.userId,
      tenantId: context.tenantId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      riskScore: context.riskScore || 30,
    }
  );
}
