-- Migration: Convert all timestamp columns to timestamptz (timestamp with time zone)
-- Description: This migration converts all existing timestamp columns to timestamptz
--              assuming the existing data is in UTC timezone.
-- Reason: Prevent timezone ambiguity and off-by-hours errors in distributed systems

-- Set session timezone to UTC for consistent conversion
SET timezone = 'UTC';

-- Disable row-level security temporarily for migration
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE impersonation_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE delegation_grants DISABLE ROW LEVEL SECURITY;
ALTER TABLE delegation_usage_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sync_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE totp_secrets DISABLE ROW LEVEL SECURITY;
ALTER TABLE backup_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_rate_limits DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;

-- Drop indexes that reference timestamp columns (they will be recreated)
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS idx_impersonation_sessions_ends_at;
DROP INDEX IF EXISTS idx_impersonation_sessions_last_action_at;
DROP INDEX IF EXISTS idx_delegation_grants_expires_at;
DROP INDEX IF EXISTS idx_delegation_grants_last_used_at;
DROP INDEX IF EXISTS idx_delegation_usage_logs_timestamp;
DROP INDEX IF EXISTS idx_bookings_start_time;
DROP INDEX IF EXISTS idx_crm_sync_jobs_next_retry_at;
DROP INDEX IF EXISTS idx_crm_sync_jobs_created_at;
DROP INDEX IF EXISTS idx_email_logs_created_at;
DROP INDEX IF EXISTS idx_forms_created_at;
DROP INDEX IF EXISTS idx_form_submissions_created_at;
DROP INDEX IF EXISTS idx_leads_created_at;
DROP INDEX IF EXISTS idx_lead_activities_created_at;
DROP INDEX IF EXISTS idx_lead_activities_scheduled_for;
DROP INDEX IF EXISTS idx_totp_secrets_last_used_at;
DROP INDEX IF EXISTS idx_backup_codes_expires_at;
DROP INDEX IF EXISTS idx_mfa_sessions_expires_at;
DROP INDEX IF EXISTS idx_mfa_rate_limits_window_start;
DROP INDEX IF EXISTS idx_mfa_rate_limits_last_attempt_at;
DROP INDEX IF EXISTS idx_mfa_rate_limits_blocked_until;

-- Convert timestamp columns to timestamptz
-- Note: PostgreSQL automatically converts timestamp to timestamptz assuming current timezone (UTC)

-- audit_logs
ALTER TABLE audit_logs ALTER COLUMN created_at TYPE timestamptz;

-- impersonation_sessions
ALTER TABLE impersonation_sessions ALTER COLUMN started_at TYPE timestamptz;
ALTER TABLE impersonation_sessions ALTER COLUMN ends_at TYPE timestamptz;
ALTER TABLE impersonation_sessions ALTER COLUMN ended_at TYPE timestamptz;
ALTER TABLE impersonation_sessions ALTER COLUMN last_action_at TYPE timestamptz;
ALTER TABLE impersonation_sessions ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE impersonation_sessions ALTER COLUMN updated_at TYPE timestamptz;

-- delegation_grants
ALTER TABLE delegation_grants ALTER COLUMN granted_at TYPE timestamptz;
ALTER TABLE delegation_grants ALTER COLUMN expires_at TYPE timestamptz;
ALTER TABLE delegation_grants ALTER COLUMN revoked_at TYPE timestamptz;
ALTER TABLE delegation_grants ALTER COLUMN last_used_at TYPE timestamptz;
ALTER TABLE delegation_grants ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE delegation_grants ALTER COLUMN updated_at TYPE timestamptz;

-- delegation_usage_logs
ALTER TABLE delegation_usage_logs ALTER COLUMN timestamp TYPE timestamptz;

-- bookings
ALTER TABLE bookings ALTER COLUMN start_time TYPE timestamptz;
ALTER TABLE bookings ALTER COLUMN end_time TYPE timestamptz;
ALTER TABLE bookings ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE bookings ALTER COLUMN updated_at TYPE timestamptz;
ALTER TABLE bookings ALTER COLUMN cancelled_at TYPE timestamptz;
ALTER TABLE bookings ALTER COLUMN completed_at TYPE timestamptz;

-- crm_sync_jobs
ALTER TABLE crm_sync_jobs ALTER COLUMN next_retry_at TYPE timestamptz;
ALTER TABLE crm_sync_jobs ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE crm_sync_jobs ALTER COLUMN updated_at TYPE timestamptz;
ALTER TABLE crm_sync_jobs ALTER COLUMN started_at TYPE timestamptz;
ALTER TABLE crm_sync_jobs ALTER COLUMN completed_at TYPE timestamptz;

-- email_logs
ALTER TABLE email_logs ALTER COLUMN delivered_at TYPE timestamptz;
ALTER TABLE email_logs ALTER COLUMN opened_at TYPE timestamptz;
ALTER TABLE email_logs ALTER COLUMN clicked_at TYPE timestamptz;
ALTER TABLE email_logs ALTER COLUMN bounced_at TYPE timestamptz;
ALTER TABLE email_logs ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE email_logs ALTER COLUMN updated_at TYPE timestamptz;

-- forms
ALTER TABLE forms ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE forms ALTER COLUMN updated_at TYPE timestamptz;
ALTER TABLE forms ALTER COLUMN deleted_at TYPE timestamptz;

-- form_submissions
ALTER TABLE form_submissions ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE form_submissions ALTER COLUMN updated_at TYPE timestamptz;

-- leads
ALTER TABLE leads ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE leads ALTER COLUMN updated_at TYPE timestamptz;
ALTER TABLE leads ALTER COLUMN first_contacted_at TYPE timestamptz;
ALTER TABLE leads ALTER COLUMN last_contacted_at TYPE timestamptz;
ALTER TABLE leads ALTER COLUMN deleted_at TYPE timestamptz;

-- lead_activities
ALTER TABLE lead_activities ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE lead_activities ALTER COLUMN updated_at TYPE timestamptz;
ALTER TABLE lead_activities ALTER COLUMN scheduled_for TYPE timestamptz;
ALTER TABLE lead_activities ALTER COLUMN completed_at TYPE timestamptz;

-- totp_secrets
ALTER TABLE totp_secrets ALTER COLUMN activated_at TYPE timestamptz;
ALTER TABLE totp_secrets ALTER COLUMN deactivated_at TYPE timestamptz;
ALTER TABLE totp_secrets ALTER COLUMN last_used_at TYPE timestamptz;
ALTER TABLE totp_secrets ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE totp_secrets ALTER COLUMN updated_at TYPE timestamptz;

-- backup_codes
ALTER TABLE backup_codes ALTER COLUMN used_at TYPE timestamptz;
ALTER TABLE backup_codes ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE backup_codes ALTER COLUMN expires_at TYPE timestamptz;

-- mfa_sessions
ALTER TABLE mfa_sessions ALTER COLUMN verified_at TYPE timestamptz;
ALTER TABLE mfa_sessions ALTER COLUMN trusted_device_expires_at TYPE timestamptz;
ALTER TABLE mfa_sessions ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE mfa_sessions ALTER COLUMN updated_at TYPE timestamptz;
ALTER TABLE mfa_sessions ALTER COLUMN expires_at TYPE timestamptz;

-- mfa_rate_limits
ALTER TABLE mfa_rate_limits ALTER COLUMN last_attempt_at TYPE timestamptz;
ALTER TABLE mfa_rate_limits ALTER COLUMN window_start_at TYPE timestamptz;
ALTER TABLE mfa_rate_limits ALTER COLUMN blocked_until TYPE timestamptz;
ALTER TABLE mfa_rate_limits ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE mfa_rate_limits ALTER COLUMN updated_at TYPE timestamptz;

-- tenants
ALTER TABLE tenants ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE tenants ALTER COLUMN updated_at TYPE timestamptz;
ALTER TABLE tenants ALTER COLUMN deleted_at TYPE timestamptz;

-- users
ALTER TABLE users ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE users ALTER COLUMN updated_at TYPE timestamptz;
ALTER TABLE users ALTER COLUMN last_login_at TYPE timestamptz;
ALTER TABLE users ALTER COLUMN deleted_at TYPE timestamptz;

-- user_tenants
ALTER TABLE user_tenants ALTER COLUMN invited_at TYPE timestamptz;
ALTER TABLE user_tenants ALTER COLUMN joined_at TYPE timestamptz;
ALTER TABLE user_tenants ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE user_tenants ALTER COLUMN updated_at TYPE timestamptz;

-- api_keys
ALTER TABLE api_keys ALTER COLUMN expires_at TYPE timestamptz;
ALTER TABLE api_keys ALTER COLUMN last_used_at TYPE timestamptz;
ALTER TABLE api_keys ALTER COLUMN created_at TYPE timestamptz;
ALTER TABLE api_keys ALTER COLUMN updated_at TYPE timestamptz;

-- Recreate indexes
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_impersonation_sessions_ends_at ON impersonation_sessions(ends_at);
CREATE INDEX idx_impersonation_sessions_last_action_at ON impersonation_sessions(last_action_at);
CREATE INDEX idx_delegation_grants_expires_at ON delegation_grants(expires_at);
CREATE INDEX idx_delegation_grants_last_used_at ON delegation_grants(last_used_at);
CREATE INDEX idx_delegation_usage_logs_timestamp ON delegation_usage_logs(timestamp);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_crm_sync_jobs_next_retry_at ON crm_sync_jobs(next_retry_at);
CREATE INDEX idx_crm_sync_jobs_created_at ON crm_sync_jobs(created_at);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX idx_forms_created_at ON forms(created_at);
CREATE INDEX idx_form_submissions_created_at ON form_submissions(created_at);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_lead_activities_created_at ON lead_activities(created_at);
CREATE INDEX idx_lead_activities_scheduled_for ON lead_activities(scheduled_for);
CREATE INDEX idx_totp_secrets_last_used_at ON totp_secrets(last_used_at);
CREATE INDEX idx_backup_codes_expires_at ON backup_codes(expires_at);
CREATE INDEX idx_mfa_sessions_expires_at ON mfa_sessions(expires_at);
CREATE INDEX idx_mfa_rate_limits_window_start ON mfa_rate_limits(window_start_at);
CREATE INDEX idx_mfa_rate_limits_last_attempt_at ON mfa_rate_limits(last_attempt_at);
CREATE INDEX idx_mfa_rate_limits_blocked_until ON mfa_rate_limits(blocked_until);

-- Re-enable row-level security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegation_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegation_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE totp_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Add comments documenting the change
COMMENT ON COLUMN audit_logs.created_at IS 'Timestamp with timezone (UTC) - converted from timestamp without timezone';
COMMENT ON COLUMN impersonation_sessions.started_at IS 'Timestamp with timezone (UTC) - converted from timestamp without timezone';
COMMENT ON COLUMN impersonation_sessions.ends_at IS 'Timestamp with timezone (UTC) - converted from timestamp without timezone';
COMMENT ON COLUMN impersonation_sessions.ended_at IS 'Timestamp with timezone (UTC) - converted from timestamp without timezone';
COMMENT ON COLUMN impersonation_sessions.last_action_at IS 'Timestamp with timezone (UTC) - converted from timestamp without timezone';
COMMENT ON COLUMN impersonation_sessions.created_at IS 'Timestamp with timezone (UTC) - converted from timestamp without timezone';
COMMENT ON COLUMN impersonation_sessions.updated_at IS 'Timestamp with timezone (UTC) - converted from timestamp without timezone';

-- Add verification query to check conversion
DO $$
DECLARE
    table_count INTEGER;
    column_count INTEGER;
BEGIN
    -- Count tables with timestamp columns
    SELECT COUNT(DISTINCT table_name) INTO table_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND data_type = 'timestamp with time zone'
    AND table_name IN (
        'audit_logs', 'impersonation_sessions', 'delegation_grants', 'delegation_usage_logs',
        'bookings', 'crm_sync_jobs', 'email_logs', 'forms', 'form_submissions',
        'leads', 'lead_activities', 'totp_secrets', 'backup_codes', 'mfa_sessions',
        'mfa_rate_limits', 'tenants', 'users', 'user_tenants', 'api_keys'
    );
    
    -- Count total timestamp columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND data_type = 'timestamp with time zone'
    AND table_name IN (
        'audit_logs', 'impersonation_sessions', 'delegation_grants', 'delegation_usage_logs',
        'bookings', 'crm_sync_jobs', 'email_logs', 'forms', 'form_submissions',
        'leads', 'lead_activities', 'totp_secrets', 'backup_codes', 'mfa_sessions',
        'mfa_rate_limits', 'tenants', 'users', 'user_tenants', 'api_keys'
    );
    
    RAISE NOTICE 'Migration completed: % tables with % timestamp columns converted to timestamptz', table_count, column_count;
END $$;
