/**
 * PostgreSQL Row Level Security Policies for Tenant Isolation
 * 
 * This file defines RLS policies to ensure strict tenant isolation
 * for all tenant-scoped tables in the Firm platform.
 */

import { sql } from 'drizzle-orm'

/**
 * Tenant isolation policy - ensures users can only access data from their tenant
 */
export const tenantIsolationPolicy = sql`
  CREATE POLICY tenant_isolation ON ${sql.identifier('table_name')}
    FOR ALL TO authenticated
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
`

/**
 * Enable RLS on a table
 */
export const enableRLS = sql`
  ALTER TABLE ${sql.identifier('table_name')} ENABLE ROW LEVEL SECURITY;
`

/**
 * Apply RLS to a specific table
 */
export const applyRLSPolicy = (tableName: string) => sql`
  -- Enable Row Level Security
  ALTER TABLE ${sql.identifier(tableName)} ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS tenant_isolation ON ${sql.identifier(tableName)};
  
  -- Create tenant isolation policy
  CREATE POLICY tenant_isolation ON ${sql.identifier(tableName)}
    FOR ALL TO authenticated
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
`

/**
 * List of all tenant-scoped tables that need RLS
 */
export const tenantScopedTables = [
  'leads',
  'lead_activities', 
  'forms',
  'form_submissions',
  'bookings',
  'email_logs',
  'audit_logs',
  'crm_sync_jobs',
  'api_keys',
  'user_tenants'
] as const
