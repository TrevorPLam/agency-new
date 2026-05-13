-- Rollback Migration: Convert timestamptz columns back to timestamp (without timezone)
-- Description: This rollback script converts all timestamptz columns back to timestamp
--              Use this only if you need to rollback the timezone migration
-- WARNING: This will lose timezone information and may cause data inconsistency

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

-- Drop indexes that reference timestamp columns
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

-- Convert timestamptz columns back to timestamp (without timezone)
-- Note: This will convert all times to the current session timezone (UTC)

-- audit_logs
ALTER TABLE audit_logs ALTER COLUMN created_at TYPE timestamp;

-- impersonation_sessions
ALTER TABLE impersonation_sessions ALTER COLUMN started_at TYPE timestamp;
ALTER TABLE impersonation_sessions ALTER COLUMN ends_at TYPE timestamp;
ALTER TABLE impersonation_sessions ALTER COLUMN ended_at TYPE timestamp;
ALTER TABLE impersonation_sessions ALTER COLUMN last_action_at TYPE timestamp;
ALTER TABLE impersonation_sessions ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE impersonation_sessions ALTER COLUMN updated_at TYPE timestamp;

-- delegation_grants
ALTER TABLE delegation_grants ALTER COLUMN granted_at TYPE timestamp;
ALTER TABLE delegation_grants ALTER COLUMN expires_at TYPE timestamp;
ALTER TABLE delegation_grants ALTER COLUMN revoked_at TYPE timestamp;
ALTER TABLE delegation_grants ALTER COLUMN last_used_at TYPE timestamp;
ALTER TABLE delegation_grants ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE delegation_grants ALTER COLUMN updated_at TYPE timestamp;

-- delegation_usage_logs
ALTER TABLE delegation_usage_logs ALTER COLUMN timestamp TYPE timestamp;

-- bookings
ALTER TABLE bookings ALTER COLUMN start_time TYPE timestamp;
ALTER TABLE bookings ALTER COLUMN end_time TYPE timestamp;
ALTER TABLE bookings ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE bookings ALTER COLUMN updated_at TYPE timestamp;
ALTER TABLE bookings ALTER COLUMN cancelled_at TYPE timestamp;
ALTER TABLE bookings ALTER COLUMN completed_at TYPE timestamp;

-- crm_sync_jobs
ALTER TABLE crm_sync_jobs ALTER COLUMN next_retry_at TYPE timestamp;
ALTER TABLE crm_sync_jobs ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE crm_sync_jobs ALTER COLUMN updated_at TYPE timestamp;
ALTER TABLE crm_sync_jobs ALTER COLUMN started_at TYPE timestamp;
ALTER TABLE crm_sync_jobs ALTER COLUMN completed_at TYPE timestamp;

-- email_logs
ALTER TABLE email_logs ALTER COLUMN delivered_at TYPE timestamp;
ALTER TABLE email_logs ALTER COLUMN opened_at TYPE timestamp;
ALTER TABLE email_logs ALTER COLUMN clicked_at TYPE timestamp;
ALTER TABLE email_logs ALTER COLUMN bounced_at TYPE timestamp;
ALTER TABLE email_logs ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE email_logs ALTER COLUMN updated_at TYPE timestamp;

-- forms
ALTER TABLE forms ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE forms ALTER COLUMN updated_at TYPE timestamp;
ALTER TABLE forms ALTER COLUMN deleted_at TYPE timestamp;

-- form_submissions
ALTER TABLE form_submissions ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE form_submissions ALTER COLUMN updated_at TYPE timestamp;

-- leads
ALTER TABLE leads ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE leads ALTER COLUMN updated_at TYPE timestamp;
ALTER TABLE leads ALTER COLUMN first_contacted_at TYPE timestamp;
ALTER TABLE leads ALTER COLUMN last_contacted_at TYPE timestamp;
ALTER TABLE leads ALTER COLUMN deleted_at TYPE timestamp;

-- lead_activities
ALTER TABLE lead_activities ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE lead_activities ALTER COLUMN updated_at TYPE timestamp;
ALTER TABLE lead_activities ALTER COLUMN scheduled_for TYPE timestamp;
ALTER TABLE lead_activities ALTER COLUMN completed_at TYPE timestamp;

-- totp_secrets
ALTER TABLE totp_secrets ALTER COLUMN activated_at TYPE timestamp;
ALTER TABLE totp_secrets ALTER COLUMN deactivated_at TYPE timestamp;
ALTER TABLE totp_secrets ALTER COLUMN last_used_at TYPE timestamp;
ALTER TABLE totp_secrets ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE totp_secrets ALTER COLUMN updated_at TYPE timestamp;

-- backup_codes
ALTER TABLE backup_codes ALTER COLUMN used_at TYPE timestamp;
ALTER TABLE backup_codes ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE backup_codes ALTER COLUMN expires_at TYPE timestamp;

-- mfa_sessions
ALTER TABLE mfa_sessions ALTER COLUMN verified_at TYPE timestamp;
ALTER TABLE mfa_sessions ALTER COLUMN trusted_device_expires_at TYPE timestamp;
ALTER TABLE mfa_sessions ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE mfa_sessions ALTER COLUMN updated_at TYPE timestamp;
ALTER TABLE mfa_sessions ALTER COLUMN expires_at TYPE timestamp;

-- mfa_rate_limits
ALTER TABLE mfa_rate_limits ALTER COLUMN last_attempt_at TYPE timestamp;
ALTER TABLE mfa_rate_limits ALTER COLUMN window_start_at TYPE timestamp;
ALTER TABLE mfa_rate_limits ALTER COLUMN blocked_until TYPE timestamp;
ALTER TABLE mfa_rate_limits ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE mfa_rate_limits ALTER COLUMN updated_at TYPE timestamp;

-- tenants
ALTER TABLE tenants ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE tenants ALTER COLUMN updated_at TYPE timestamp;
ALTER TABLE tenants ALTER COLUMN deleted_at TYPE timestamp;

-- users
ALTER TABLE users ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE users ALTER COLUMN updated_at TYPE timestamp;
ALTER TABLE users ALTER COLUMN last_login_at TYPE timestamp;
ALTER TABLE users ALTER COLUMN deleted_at TYPE timestamp;

-- user_tenants
ALTER TABLE user_tenants ALTER COLUMN invited_at TYPE timestamp;
ALTER TABLE user_tenants ALTER COLUMN joined_at TYPE timestamp;
ALTER TABLE user_tenants ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE user_tenants ALTER COLUMN updated_at TYPE timestamp;

-- api_keys
ALTER TABLE api_keys ALTER COLUMN expires_at TYPE timestamp;
ALTER TABLE api_keys ALTER COLUMN last_used_at TYPE timestamp;
ALTER TABLE api_keys ALTER COLUMN created_at TYPE timestamp;
ALTER TABLE api_keys ALTER COLUMN updated_at TYPE timestamp;

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

-- Add comments documenting the rollback
COMMENT ON COLUMN audit_logs.created_at IS 'Timestamp without timezone - rolled back from timestamptz';
COMMENT ON COLUMN impersonation_sessions.started_at IS 'Timestamp without timezone - rolled back from timestamptz';
COMMENT ON COLUMN impersonation_sessions.ends_at IS 'Timestamp without timezone - rolled back from timestamptz';
COMMENT ON COLUMN impersonation_sessions.ended_at IS 'Timestamp without timezone - rolled back from timestamptz';
COMMENT ON COLUMN impersonation_sessions.last_action_at IS 'Timestamp without timezone - rolled back from timestamptz';
COMMENT ON COLUMN impersonation_sessions.created_at IS 'Timestamp without timezone - rolled back from timestamptz';
COMMENT ON COLUMN impersonation_sessions.updated_at IS 'Timestamp without timezone - rolled back from timestamptz';

-- Add verification query to check rollback
DO $$
DECLARE
    table_count INTEGER;
    column_count INTEGER;
BEGIN
    -- Count tables with timestamp columns (without timezone)
    SELECT COUNT(DISTINCT table_name) INTO table_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND data_type = 'timestamp without time zone'
    AND table_name IN (
        'audit_logs', 'impersonation_sessions', 'delegation_grants', 'delegation_usage_logs',
        'bookings', 'crm_sync_jobs', 'email_logs', 'forms', 'form_submissions',
        'leads', 'lead_activities', 'totp_secrets', 'backup_codes', 'mfa_sessions',
        'mfa_rate_limits', 'tenants', 'users', 'user_tenants', 'api_keys'
    );
    
    -- Count total timestamp columns (without timezone)
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND data_type = 'timestamp without time zone'
    AND table_name IN (
        'audit_logs', 'impersonation_sessions', 'delegation_grants', 'delegation_usage_logs',
        'bookings', 'crm_sync_jobs', 'email_logs', 'forms', 'form_submissions',
        'leads', 'lead_activities', 'totp_secrets', 'backup_codes', 'mfa_sessions',
        'mfa_rate_limits', 'tenants', 'users', 'user_tenants', 'api_keys'
    );
    
    RAISE NOTICE 'Rollback completed: % tables with % timestamp columns converted back to timestamp without timezone', table_count, column_count;
    RAISE NOTICE 'WARNING: Timezone information has been lost. All timestamps are now in UTC timezone.';
END $$;
