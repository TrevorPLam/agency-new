# Timestamp to Timestamptz Migration

## Overview

This migration converts all `timestamp` columns (without timezone) to `timestamptz` (timestamp with timezone) to prevent timezone ambiguity and potential off-by-hours errors in distributed systems.

## Problem Statement

All Drizzle columns were using `timestamp` which maps to PostgreSQL `timestamp without time zone`. This does not store timezone information, leading to ambiguity and potential off-by-hours errors in a distributed system.

## Solution

- **Schema Changes**: Updated all schema files to use `timestamp('...', { withTimezone: true })`
- **Database Migration**: SQL script to convert existing columns to `timestamptz` assuming UTC
- **Verification**: Script to verify the conversion was successful

## Files Modified

### Schema Files
- `packages/firm-db/src/schemas/audit-logs.ts`
- `packages/firm-db/src/schemas/auth-sessions.ts`
- `packages/firm-db/src/schemas/bookings.ts`
- `packages/firm-db/src/schemas/crm-sync-jobs.ts`
- `packages/firm-db/src/schemas/email.ts`
- `packages/firm-db/src/schemas/forms.ts`
- `packages/firm-db/src/schemas/leads.ts`
- `packages/firm-db/src/schemas/mfa.ts`
- `packages/firm-db/src/schemas/tenants.ts`
- `packages/firm-db/src/schemas/users.ts`

### Migration Files
- `001_convert_timestamps_to_timestamptz.sql` - Main migration script
- `001_rollback_timestamps_to_timestamp.sql` - Rollback script
- `verify_timestamp_conversion.sql` - Verification script

## Migration Process

### 1. Pre-Migration Checklist

- [ ] Backup the database
- [ ] Schedule maintenance window
- [ ] Notify all development teams
- [ ] Test migration on staging environment

### 2. Run Migration

```bash
# Run the main migration
psql -d your_database -f 001_convert_timestamps_to_timestamptz.sql
```

### 3. Verify Migration

```bash
# Run verification script
psql -d your_database -f verify_timestamp_conversion.sql
```

### 4. Post-Migration

- [ ] Update application code to handle timezone-aware timestamps
- [ ] Test all timestamp-related functionality
- [ ] Monitor for timezone-related issues
- [ ] Update documentation

## Impact Analysis

### Affected Tables (19 total)
1. `audit_logs` - 1 timestamp column
2. `impersonation_sessions` - 6 timestamp columns
3. `delegation_grants` - 6 timestamp columns
4. `delegation_usage_logs` - 1 timestamp column
5. `bookings` - 6 timestamp columns
6. `crm_sync_jobs` - 5 timestamp columns
7. `email_logs` - 6 timestamp columns
8. `forms` - 3 timestamp columns
9. `form_submissions` - 2 timestamp columns
10. `leads` - 5 timestamp columns
11. `lead_activities` - 4 timestamp columns
12. `totp_secrets` - 5 timestamp columns
13. `backup_codes` - 3 timestamp columns
14. `mfa_sessions` - 5 timestamp columns
15. `mfa_rate_limits` - 5 timestamp columns
16. `tenants` - 3 timestamp columns
17. `users` - 4 timestamp columns
18. `user_tenants` - 4 timestamp columns
19. `api_keys` - 4 timestamp columns

**Total: 73 timestamp columns converted**

### Application Impact

#### JavaScript/TypeScript Applications
- Date objects will now include timezone information
- JSON serialization will include timezone offsets
- Date parsing may need to account for timezone

#### API Responses
- Timestamps will be returned as ISO 8601 strings with timezone
- Example: `2024-01-01T12:00:00Z` instead of `2024-01-01T12:00:00`

#### Database Queries
- Comparison operations now work across timezones
- `AT TIME ZONE` clause available for timezone conversion
- Index performance may be slightly affected

## Rollback Plan

If issues arise, you can rollback using:

```bash
# Run rollback script (WARNING: This loses timezone information)
psql -d your_database -f 001_rollback_timestamps_to_timestamp.sql
```

**⚠️ Warning**: Rollback will lose timezone information and may cause data inconsistency.

## Testing Recommendations

### Unit Tests
- Test timestamp creation and retrieval
- Test timezone conversion functions
- Test date serialization/deserialization

### Integration Tests
- Test API endpoints with timestamp fields
- Test cross-timezone functionality
- Test database query performance

### Performance Tests
- Monitor query performance with indexed timestamp columns
- Test bulk operations with timezone-aware timestamps

## Best Practices

### Application Code
1. Always work with UTC timestamps in the backend
2. Convert to local timezone only in the UI layer
3. Use timezone-aware libraries (moment-timezone, date-fns-tz)
4. Validate timezone information in API inputs

### Database Operations
1. Use `AT TIME ZONE` for timezone conversions
2. Store all timestamps in UTC when possible
3. Consider timezone in query optimization
4. Use appropriate indexes for timezone-aware queries

### Monitoring
1. Monitor for timezone-related errors
2. Track timestamp conversion performance
3. Log timezone mismatches
4. Set up alerts for timestamp anomalies

## Troubleshooting

### Common Issues

#### "timezone" Error
```
ERROR: timezone "UTC" is not recognized
```
**Solution**: Ensure PostgreSQL timezone configuration is correct

#### Index Performance
Queries on timestamp columns may be slower after migration.
**Solution**: Consider functional indexes or timezone-specific indexes

#### Application Errors
Applications may fail to parse timezone-aware timestamps.
**Solution**: Update date parsing logic to handle timezone information

### Verification Commands

```sql
-- Check column types
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND data_type LIKE '%timestamp%'
ORDER BY table_name, column_name;

-- Check sample data
SELECT created_at::text FROM users LIMIT 5;

-- Test timezone conversion
SELECT created_at AT TIME ZONE 'UTC' FROM users LIMIT 1;
```

## Support

For questions or issues with this migration:
1. Check the verification script output
2. Review PostgreSQL documentation for timestamptz
3. Consult with the database team
4. Check application logs for timezone-related errors

## Migration History

- **2024-01-XX**: Initial migration created
- **2024-01-XX**: Schema files updated
- **2024-01-XX**: Migration scripts created
- **2024-01-XX**: Verification script added
- **2024-01-XX**: Documentation completed
