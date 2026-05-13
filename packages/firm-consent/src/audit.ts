import { ConsentCategory } from './categories';

export interface ConsentAuditLog {
  timestamp: number;
  action: 'grant' | 'deny' | 'withdraw' | 'expire' | 'gpc_applied';
  categories: ConsentCategory[];
  source: 'user' | 'system' | 'gpc';
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for immutable audit logging.
 * Implementation will typically write to a database.
 */
export interface IConsentAuditLogger {
  log(entry: ConsentAuditLog): Promise<void>;
}

/**
 * Simple console logger for audit trails (default).
 */
export class ConsoleAuditLogger implements IConsentAuditLogger {
  async log(entry: ConsentAuditLog): Promise<void> {
    console.log('[CONSENT AUDIT]', JSON.stringify(entry));
  }
}
