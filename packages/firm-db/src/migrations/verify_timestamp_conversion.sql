-- Verification Script: Check timestamp to timestamptz conversion
-- Description: This script verifies that all timestamp columns have been converted to timestamptz
-- Usage: Run this after the migration to verify the conversion was successful

-- Check for any remaining timestamp without timezone columns
DO $$
DECLARE
    remaining_columns RECORD;
    count_remaining INTEGER := 0;
    count_converted INTEGER := 0;
    table_name TEXT;
    column_name TEXT;
    data_type TEXT;
BEGIN
    RAISE NOTICE '=== TIMESTAMP CONVERSION VERIFICATION ===';
    RAISE NOTICE 'Checking for remaining timestamp without timezone columns...';
    
    -- Check for any remaining timestamp without timezone columns
    FOR remaining_columns IN 
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND data_type = 'timestamp without time zone'
        AND table_name IN (
            'audit_logs', 'impersonation_sessions', 'delegation_grants', 'delegation_usage_logs',
            'bookings', 'crm_sync_jobs', 'email_logs', 'forms', 'form_submissions',
            'leads', 'lead_activities', 'totp_secrets', 'backup_codes', 'mfa_sessions',
            'mfa_rate_limits', 'tenants', 'users', 'user_tenants', 'api_keys'
        )
        ORDER BY table_name, column_name
    LOOP
        count_remaining := count_remaining + 1;
        RAISE NOTICE 'FOUND: %.% - %', remaining_columns.table_name, remaining_columns.column_name, remaining_columns.data_type;
    END LOOP;
    
    -- Count converted columns
    SELECT COUNT(*) INTO count_converted
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND data_type = 'timestamp with time zone'
    AND table_name IN (
        'audit_logs', 'impersonation_sessions', 'delegation_grants', 'delegation_usage_logs',
        'bookings', 'crm_sync_jobs', 'email_logs', 'forms', 'form_submissions',
        'leads', 'lead_activities', 'totp_secrets', 'backup_codes', 'mfa_sessions',
        'mfa_rate_limits', 'tenants', 'users', 'user_tenants', 'api_keys'
    );
    
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION RESULTS ===';
    RAISE NOTICE 'Tables checked: 19';
    RAISE NOTICE 'Columns converted to timestamptz: %', count_converted;
    RAISE NOTICE 'Remaining timestamp without timezone: %', count_remaining;
    
    IF count_remaining = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All timestamp columns have been converted to timestamptz!';
    ELSE
        RAISE NOTICE '❌ FAILURE: % timestamp columns still need conversion', count_remaining;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== DETAILED CONVERSION SUMMARY ===';
    
    -- Show detailed breakdown by table
    FOR table_name IN 
        SELECT DISTINCT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name IN (
            'audit_logs', 'impersonation_sessions', 'delegation_grants', 'delegation_usage_logs',
            'bookings', 'crm_sync_jobs', 'email_logs', 'forms', 'form_submissions',
            'leads', 'lead_activities', 'totp_secrets', 'backup_codes', 'mfa_sessions',
            'mfa_rate_limits', 'tenants', 'users', 'user_tenants', 'api_keys'
        )
        ORDER BY table_name
    LOOP
        -- Count timestamptz columns in this table
        SELECT COUNT(*) INTO count_converted
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = table_name
        AND data_type = 'timestamp with time zone';
        
        -- Count remaining timestamp columns in this table
        SELECT COUNT(*) INTO count_remaining
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = table_name
        AND data_type = 'timestamp without time zone';
        
        IF count_converted > 0 OR count_remaining > 0 THEN
            RAISE NOTICE '%: % timestamptz, % timestamp', table_name, count_converted, count_remaining;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== SAMPLE DATA VERIFICATION ===';
    
    -- Sample data checks for critical tables
    BEGIN
        -- Check audit_logs
        IF EXISTS (SELECT 1 FROM audit_logs LIMIT 1) THEN
            RAISE NOTICE 'audit_logs: Sample created_at values';
            FOR remaining_columns IN 
                SELECT created_at::text as sample_value
                FROM audit_logs 
                LIMIT 3
            LOOP
                RAISE NOTICE '  - %', remaining_columns.sample_value;
            END LOOP;
        END IF;
        
        -- Check users
        IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
            RAISE NOTICE 'users: Sample created_at values';
            FOR remaining_columns IN 
                SELECT created_at::text as sample_value
                FROM users 
                LIMIT 3
            LOOP
                RAISE NOTICE '  - %', remaining_columns.sample_value;
            END LOOP;
        END IF;
        
        -- Check bookings
        IF EXISTS (SELECT 1 FROM bookings LIMIT 1) THEN
            RAISE NOTICE 'bookings: Sample start_time values';
            FOR remaining_columns IN 
                SELECT start_time::text as sample_value
                FROM bookings 
                LIMIT 3
            LOOP
                RAISE NOTICE '  - %', remaining_columns.sample_value;
            END LOOP;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Sample data check failed: %', SQLERRM;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== INDEX VERIFICATION ===';
    
    -- Check if indexes were recreated
    FOR remaining_columns IN 
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND tablename IN (
            'audit_logs', 'impersonation_sessions', 'delegation_grants', 'delegation_usage_logs',
            'bookings', 'crm_sync_jobs', 'email_logs', 'forms', 'form_submissions',
            'leads', 'lead_activities', 'totp_secrets', 'backup_codes', 'mfa_sessions',
            'mfa_rate_limits', 'tenants', 'users', 'user_tenants', 'api_keys'
        )
        AND indexname LIKE '%_created_at' OR indexname LIKE '%_time' OR indexname LIKE '%_at'
        ORDER BY tablename, indexname
    LOOP
        RAISE NOTICE 'Index found: %.%', remaining_columns.tablename, remaining_columns.indexname;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== TIMEZONE VERIFICATION ===';
    
    -- Check current timezone
    RAISE NOTICE 'Current session timezone: %', current_setting('timezone');
    
    -- Test timezone conversion with sample data
    BEGIN
        IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
            RAISE NOTICE 'Testing timezone conversion with user data:';
            FOR remaining_columns IN 
                SELECT 
                    created_at as original,
                    created_at AT TIME ZONE 'UTC' as utc_time,
                    created_at AT TIME ZONE 'America/New_York' as ny_time
                FROM users 
                LIMIT 2
            LOOP
                RAISE NOTICE '  Original: %', remaining_columns.original;
                RAISE NOTICE '  UTC: %', remaining_columns.utc_time;
                RAISE NOTICE '  New York: %', remaining_columns.ny_time;
                RAISE NOTICE '';
            END LOOP;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Timezone conversion test failed: %', SQLERRM;
    END;
    
    RAISE NOTICE '=== VERIFICATION COMPLETE ===';
END $$;
