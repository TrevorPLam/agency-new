-- Enable Row Level Security (RLS) for tenant isolation
-- Migration: 0001_enable_rls_policies.sql
-- Purpose: Prevent cross-tenant data leaks by enforcing tenant isolation at database level

-- Create custom settings for tenant context
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_settings WHERE name = 'app.current_tenant_id') THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";';
    PERFORM set_config('app.current_tenant_id', '', true);
  END IF;
END $$;

-- Enable RLS on all tenant-scoped tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS tenant_isolation ON leads;
DROP POLICY IF EXISTS tenant_isolation ON lead_activities;
DROP POLICY IF EXISTS tenant_isolation ON forms;
DROP POLICY IF EXISTS tenant_isolation ON form_submissions;
DROP POLICY IF EXISTS tenant_isolation ON bookings;
DROP POLICY IF EXISTS tenant_isolation ON email_logs;
DROP POLICY IF EXISTS tenant_isolation ON audit_logs;
DROP POLICY IF EXISTS tenant_isolation ON crm_sync_jobs;
DROP POLICY IF EXISTS tenant_isolation ON api_keys;
DROP POLICY IF EXISTS tenant_isolation ON user_tenants;

-- Create tenant isolation policies
-- Users can only access data from their own tenant
CREATE POLICY tenant_isolation ON leads
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON lead_activities
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON forms
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON form_submissions
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON bookings
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON email_logs
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON audit_logs
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON crm_sync_jobs
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON api_keys
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON user_tenants
  FOR ALL TO authenticated
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Create indexes to support RLS performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_tenant_id_rls ON leads(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_activities_tenant_id_rls ON lead_activities(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_forms_tenant_id_rls ON forms(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_form_submissions_tenant_id_rls ON form_submissions(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_tenant_id_rls ON bookings(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_logs_tenant_id_rls ON email_logs(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_tenant_id_rls ON audit_logs(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_crm_sync_jobs_tenant_id_rls ON crm_sync_jobs(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_tenant_id_rls ON api_keys(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_tenants_tenant_id_rls ON user_tenants(tenant_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lead_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON forms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON form_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON crm_sync_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_tenants TO authenticated;

-- Create authenticated role if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
END $$;
