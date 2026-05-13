/**
 * Tenant schema validation
 * Provides comprehensive validation for tenant data with business rules
 */

import { z } from 'zod';
import type { Tenant, TenantStatus, ServiceTier, Currency, Language, Timezone, ThemeMode } from '@firm/types';
import {
  tenantIdField,
  nameField,
  slugField,
  urlField,
  enumField,
  objectField,
  optionalObjectField,
  timestampField,
  metadataField,
  numberField,
  booleanField,
  optionalBooleanField,
  arrayField,
  optionalArrayField,
} from './common';

// Tenant limits schema
const tenantLimitsSchema = objectField({
  users: numberField('User limit', 1, 10000),
  leads: numberField('Lead limit', 10, 1000000),
  campaigns: numberField('Campaign limit', 1, 1000),
  bookings: numberField('Booking limit', 10, 100000),
  storage: numberField('Storage limit (MB)', 100, 1000000),
  apiCalls: numberField('API call limit', 100, 10000000),
}, 'Tenant limits');

// Consent settings schema
const consentSettingsSchema = objectField({
  requiredCategories: arrayField(
    enumField(['necessary', 'analytics', 'marketing', 'preferences', 'functional'] as const, 'Required categories'),
    'Required categories',
    1,
    5
  ),
  defaultConsent: objectField({
    necessary: booleanField('Necessary consent', true),
    analytics: booleanField('Analytics consent', false),
    marketing: booleanField('Marketing consent', false),
    preferences: booleanField('Preferences consent', false),
    functional: booleanField('Functional consent', false),
  }, 'Default consent'),
  privacyPolicyUrl: urlField('Privacy policy URL').optional(),
  termsOfServiceUrl: urlField('Terms of service URL').optional(),
}, 'Consent settings');

// Tenant settings schema
const tenantSettingsSchema = objectField({
  timezone: enumField(['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney'] as const, 'Timezone'),
  currency: enumField(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK'] as const, 'Currency'),
  language: enumField(['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'da', 'no'] as const, 'Language'),
  theme: enumField(['light', 'dark', 'system'] as const, 'Theme'),
  features: metadataField(), // Feature flags
  limits: tenantLimitsSchema,
  consent: consentSettingsSchema,
  integrations: metadataField(), // Integration status
}, 'Tenant settings');

// Tenant schema
export const tenantSchema = objectField({
  id: tenantIdField(),
  name: nameField('Tenant name'),
  slug: slugField('Tenant slug'),
  domain: urlField('Domain').optional(),
  status: enumField(['active', 'inactive', 'suspended', 'trial', 'cancelled'] as const, 'Status'),
  serviceTier: enumField(['starter', 'professional', 'business', 'enterprise', 'custom'] as const, 'Service tier'),
  settings: tenantSettingsSchema,
  metadata: metadataField(),
  createdAt: timestampField('Created at'),
  updatedAt: timestampField('Updated at'),
}, 'Tenant');

// Enhanced tenant schema with business validation
export const tenantSchemaWithValidation = tenantSchema
  .superRefine((data, ctx) => {
    // Business validation rules
    
    // Slug uniqueness check (would be handled at database level)
    if (data.slug.includes('www') || data.slug.includes('http')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Slug should not contain "www" or "http"',
        path: ['slug'],
      });
    }
    
    // Domain validation
    if (data.domain && data.slug) {
      // Domain should match or be related to slug
      const domainLower = data.domain.toLowerCase();
      const slugLower = data.slug.toLowerCase();
      
      if (!domainLower.includes(slugLower) && !slugLower.includes(domainLower.replace(/^(https?:\/\/)?(www\.)?/, ''))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Domain should be related to tenant slug',
          path: ['domain'],
        });
      }
    }
    
    // Service tier limits validation
    const tierLimits = {
      starter: { users: 5, leads: 1000, campaigns: 10, bookings: 100, storage: 1000, apiCalls: 10000 },
      professional: { users: 25, leads: 10000, campaigns: 50, bookings: 1000, storage: 10000, apiCalls: 100000 },
      business: { users: 100, leads: 100000, campaigns: 200, bookings: 10000, storage: 100000, apiCalls: 1000000 },
      enterprise: { users: 1000, leads: 1000000, campaigns: 1000, bookings: 100000, storage: 1000000, apiCalls: 10000000 },
      custom: { users: 10000, leads: 1000000, campaigns: 1000, bookings: 100000, storage: 1000000, apiCalls: 10000000 }
    };
    
    const limits = tierLimits[data.serviceTier];
    if (limits) {
      const settings = data.settings.limits;
      
      if (settings.users > limits.users) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `User limit exceeds ${data.serviceTier} tier maximum of ${limits.users}`,
          path: ['settings', 'limits', 'users'],
        });
      }
      
      if (settings.leads > limits.leads) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Lead limit exceeds ${data.serviceTier} tier maximum of ${limits.leads}`,
          path: ['settings', 'limits', 'leads'],
        });
      }
      
      if (settings.campaigns > limits.campaigns) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Campaign limit exceeds ${data.serviceTier} tier maximum of ${limits.campaigns}`,
          path: ['settings', 'limits', 'campaigns'],
        });
      }
      
      if (settings.bookings > limits.bookings) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Booking limit exceeds ${data.serviceTier} tier maximum of ${limits.bookings}`,
          path: ['settings', 'limits', 'bookings'],
        });
      }
      
      if (settings.storage > limits.storage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Storage limit exceeds ${data.serviceTier} tier maximum of ${limits.storage}MB`,
          path: ['settings', 'limits', 'storage'],
        });
      }
      
      if (settings.apiCalls > limits.apiCalls) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `API call limit exceeds ${data.serviceTier} tier maximum of ${limits.apiCalls}`,
          path: ['settings', 'limits', 'apiCalls'],
        });
      }
    }
    
    // Consent validation
    const { requiredCategories, defaultConsent } = data.settings.consent;
    
    // Required categories must include necessary
    if (!requiredCategories.includes('necessary')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required consent categories must include "necessary"',
        path: ['settings', 'consent', 'requiredCategories'],
      });
    }
    
    // Default consent for necessary must be true
    if (!defaultConsent.necessary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Default consent for "necessary" must be true',
        path: ['settings', 'consent', 'defaultConsent', 'necessary'],
      });
    }
    
    // If privacy policy is required, terms of service should also be provided
    if (data.settings.consent.privacyPolicyUrl && !data.settings.consent.termsOfServiceUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Terms of service URL is required when privacy policy URL is provided',
        path: ['settings', 'consent', 'termsOfServiceUrl'],
      });
    }
  })
  .transform((data) => {
    // Auto-derive tenant settings based on service tier
    
    // Set default limits if not provided
    const tierDefaults = {
      starter: { users: 5, leads: 1000, campaigns: 10, bookings: 100, storage: 1000, apiCalls: 10000 },
      professional: { users: 25, leads: 10000, campaigns: 50, bookings: 1000, storage: 10000, apiCalls: 100000 },
      business: { users: 100, leads: 100000, campaigns: 200, bookings: 10000, storage: 100000, apiCalls: 1000000 },
      enterprise: { users: 1000, leads: 1000000, campaigns: 1000, bookings: 100000, storage: 1000000, apiCalls: 10000000 }
    };
    
    if (data.serviceTier !== 'custom' && tierDefaults[data.serviceTier]) {
      const defaults = tierDefaults[data.serviceTier];
      const currentLimits = data.settings.limits;
      
      // Only set defaults if values are 0 or undefined
      if (currentLimits.users === 0) currentLimits.users = defaults.users;
      if (currentLimits.leads === 0) currentLimits.leads = defaults.leads;
      if (currentLimits.campaigns === 0) currentLimits.campaigns = defaults.campaigns;
      if (currentLimits.bookings === 0) currentLimits.bookings = defaults.bookings;
      if (currentLimits.storage === 0) currentLimits.storage = defaults.storage;
      if (currentLimits.apiCalls === 0) currentLimits.apiCalls = defaults.apiCalls;
    }
    
    return data;
  });

// Type assertions
export type TenantInput = z.infer<typeof tenantSchema>;
export type TenantInputWithValidation = z.infer<typeof tenantSchemaWithValidation>;

// Runtime validation functions
export const validateTenant = (data: unknown) => tenantSchema.safeParse(data);
export const validateTenantWithValidation = (data: unknown) => tenantSchemaWithValidation.safeParse(data);

// Compile-time validation
export const tenantSchemaSatisfies = tenantSchema satisfies z.ZodType<Tenant>;
