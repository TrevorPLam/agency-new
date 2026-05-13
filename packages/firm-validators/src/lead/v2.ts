/**
 * Lead schema v2 - Enhanced version with additional fields and validation
 * Extends v1 with new features: lead scoring, consent tracking, enrichment data
 */

import { z } from 'zod';
import type { Lead, LeadStatus, LeadSource, LeadScore, UserId, TenantId } from '@firm/types';
import { leadSchemaV1 } from './v1';
import {
  leadIdField,
  tenantIdField,
  userIdField,
  nameField,
  emailField,
  phoneField,
  textField,
  optionalTextField,
  enumField,
  arrayField,
  optionalArrayField,
  objectField,
  optionalObjectField,
  timestampField,
  metadataField,
  customFieldsField,
  numberField,
  booleanField,
} from '../common';

// Lead enrichment data schema
const leadEnrichmentSchema = objectField({
  source: optionalTextField('Enrichment source', 50),
  confidence: optionalNumberField('Confidence score', 0, 100),
  data: customFieldsField(),
  enrichedAt: optionalTimestampField('Enriched at'),
}, 'Lead enrichment');

// Lead consent tracking schema
const leadConsentSchema = objectField({
  email: booleanField('Email consent', false),
  sms: booleanField('SMS consent', false),
  phone: booleanField('Phone consent', false),
  marketing: booleanField('Marketing consent', false),
  analytics: booleanField('Analytics consent', false),
  consentDate: timestampField('Consent date'),
  ipAddress: optionalTextField('IP address', 45),
  userAgent: optionalTextField('User agent', 500),
  gpcSignal: booleanField('GPC signal', false),
}, 'Lead consent');

// Lead communication preferences schema
const leadPreferencesSchema = objectField({
  preferredChannel: enumField(['email', 'sms', 'phone', 'mail'] as const, 'Preferred channel'),
  timezone: enumField(['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney'] as const, 'Timezone'),
  language: enumField(['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'da', 'no'] as const, 'Language'),
  frequency: enumField(['immediate', 'daily', 'weekly', 'monthly', 'never'] as const, 'Communication frequency'),
  doNotCall: booleanField('Do not call', false),
  doNotEmail: booleanField('Do not email', false),
}, 'Lead preferences');

// Lead social media profiles schema
const socialProfileSchema = objectField({
  platform: enumField(['linkedin', 'twitter', 'facebook', 'instagram', 'website'] as const, 'Platform'),
  url: urlField('Profile URL'),
  username: optionalTextField('Username', 100),
  followers: optionalNumberField('Followers', 0),
  verified: booleanField('Verified', false),
}, 'Social profile');

// Lead v2 schema - extends v1 with new fields
export const leadSchemaV2 = leadSchemaV1
  .extend({
    // New fields in v2
    middleName: optionalTextField('Middle name', 50),
    suffix: optionalTextField('Suffix', 10),
    title: optionalTextField('Title', 20),
    website: urlField('Website').optional(),
    linkedinUrl: urlField('LinkedIn URL').optional(),
    industry: optionalTextField('Industry', 100),
    companySize: enumField(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] as const, 'Company size').optional(),
    annualRevenue: optionalNumberField('Annual revenue', 0),
    country: optionalTextField('Country', 2), // ISO 3166-1 alpha-2
    state: optionalTextField('State/Province', 100),
    city: optionalTextField('City', 100),
    postalCode: optionalTextField('Postal code', 20),
    description: optionalTextField('Description', 1000),
    
    // Consent and preferences
    consent: leadConsentSchema,
    preferences: leadPreferencesSchema,
    
    // Enrichment data
    enrichment: optionalObjectField(leadEnrichmentSchema, 'Enrichment'),
    
    // Social media profiles
    socialProfiles: optionalArrayField(socialProfileSchema, 'Social profiles', 0, 10),
    
    // Lead source details
    sourceDetails: customFieldsField(),
    utmSource: optionalTextField('UTM Source', 100),
    utmMedium: optionalTextField('UTM Medium', 100),
    utmCampaign: optionalTextField('UTM Campaign', 100),
    utmTerm: optionalTextField('UTM Term', 100),
    utmContent: optionalTextField('UTM Content', 100),
    
    // Lead scoring enhancements
    scoreFactors: optionalObjectField(
      objectField({
        email: numberField('Email score factor', 0, 50),
        phone: numberField('Phone score factor', 0, 50),
        company: numberField('Company score factor', 0, 50),
        jobTitle: numberField('Job title score factor', 0, 50),
        industry: numberField('Industry score factor', 0, 50),
        companySize: numberField('Company size score factor', 0, 50),
        revenue: numberField('Revenue score factor', 0, 50),
        website: numberField('Website score factor', 0, 50),
        socialProfiles: numberField('Social profiles score factor', 0, 50),
      }, 'Score factors'),
      'Score factors'
    ),
    
    // Activity tracking
    lastActivityAt: optionalTimestampField('Last activity at'),
    activityCount: optionalNumberField('Activity count', 0),
    conversionProbability: optionalNumberField('Conversion probability', 0, 100),
    
    // Data quality
    dataQuality: optionalObjectField(
      objectField({
        completeness: numberField('Completeness', 0, 100),
        accuracy: numberField('Accuracy', 0, 100),
        lastVerified: optionalTimestampField('Last verified'),
        verificationSource: optionalTextField('Verification source', 100),
      }, 'Data quality'),
      'Data quality'
    ),
  });

// Enhanced cross-field validation for v2
export const leadSchemaV2WithValidation = leadSchemaV2
  .superRefine((data, ctx) => {
    // Enhanced validation for v2
    
    // Consent validation
    if (data.consent) {
      const now = new Date();
      const consentDate = new Date(data.consent.consentDate);
      
      // Consent date cannot be in the future
      if (consentDate > now) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Consent date cannot be in the future',
          path: ['consent', 'consentDate'],
        });
      }
      
      // Consent date cannot be more than 2 years old
      const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
      if (consentDate < twoYearsAgo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Consent date is too old (must be within 2 years)',
          path: ['consent', 'consentDate'],
        });
      }
    }
    
    // Phone number validation for country
    if (data.phone && data.country) {
      // Basic validation - could be enhanced with country-specific rules
      if (data.country === 'US' && !data.phone.startsWith('+1')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'US phone numbers must start with +1',
          path: ['phone'],
        });
      }
    }
    
    // Website validation
    if (data.website && data.company) {
      // Check if website contains company name (basic validation)
      const websiteLower = data.website.toLowerCase();
      const companyLower = data.company.toLowerCase();
      if (!websiteLower.includes(companyLower) && websiteLower !== data.linkedinUrl) {
        // This is just a warning, not an error
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Website may not be related to company',
          path: ['website'],
        });
      }
    }
    
    // Score validation
    if (data.scoreValue !== undefined && data.scoreFactors) {
      // Recalculate score based on factors
      const calculatedScore = Object.values(data.scoreFactors).reduce((sum, factor) => sum + factor, 0);
      
      if (Math.abs(calculatedScore - data.scoreValue) > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Score value does not match calculated score from factors',
          path: ['scoreValue'],
        });
      }
    }
    
    // Data quality validation
    if (data.dataQuality) {
      const { completeness, accuracy } = data.dataQuality;
      
      if (completeness < 50) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Lead data completeness is too low',
          path: ['dataQuality', 'completeness'],
        });
      }
      
      if (accuracy < 70) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Lead data accuracy is too low',
          path: ['dataQuality', 'accuracy'],
        });
      }
    }
  })
  .transform((data) => {
    // Auto-calculate missing fields in v2
    
    // Calculate conversion probability based on score and other factors
    if (data.conversionProbability === undefined && data.scoreValue !== undefined) {
      let probability = 0;
      
      // Base probability from score
      if (data.score === 'hot') probability += 60;
      else if (data.score === 'warm') probability += 30;
      else if (data.score === 'cold') probability += 10;
      
      // Boost from consent
      if (data.consent?.email) probability += 15;
      if (data.consent?.phone) probability += 10;
      
      // Boost from data completeness
      if (data.dataQuality?.completeness) {
        probability += data.dataQuality.completeness * 0.2;
      }
      
      // Boost from enrichment
      if (data.enrichment) probability += 20;
      
      data.conversionProbability = Math.min(Math.round(probability), 100);
    }
    
    // Calculate data quality if missing
    if (data.dataQuality === undefined) {
      let completeness = 0;
      let totalFields = 0;
      let filledFields = 0;
      
      const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
      const optionalFields = ['company', 'jobTitle', 'website', 'industry'];
      
      requiredFields.forEach(field => {
        totalFields += 2; // Weight required fields higher
        if (data[field as keyof typeof data]) filledFields += 2;
      });
      
      optionalFields.forEach(field => {
        totalFields += 1;
        if (data[field as keyof typeof data]) filledFields += 1;
      });
      
      completeness = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
      
      data.dataQuality = {
        completeness,
        accuracy: 85, // Default accuracy
        lastVerified: new Date(),
        verificationSource: 'auto-calculation',
      };
    }
    
    return data;
  });

// Type assertions
export type LeadV2 = z.infer<typeof leadSchemaV2>;
export type LeadV2WithValidation = z.infer<typeof leadSchemaV2WithValidation>;

// Runtime validation functions
export const validateLeadV2 = (data: unknown) => leadSchemaV2.safeParse(data);
export const validateLeadV2WithValidation = (data: unknown) => leadSchemaV2WithValidation.safeParse(data);

// Migration function from v1 to v2
export const migrateLeadV1ToV2 = (leadV1: unknown) => {
  const v1Result = leadSchemaV1.safeParse(leadV1);
  if (!v1Result.success) {
    return v1Result;
  }
  
  const v1Data = v1Result.data;
  
  // Transform v1 data to v2 format
  const v2Data = {
    ...v1Data,
    // Add new v2 fields with defaults
    consent: {
      email: false,
      sms: false,
      phone: false,
      marketing: false,
      analytics: false,
      consentDate: new Date(),
      gpcSignal: false,
    },
    preferences: {
      preferredChannel: 'email' as const,
      timezone: 'UTC' as const,
      language: 'en' as const,
      frequency: 'weekly' as const,
      doNotCall: false,
      doNotEmail: false,
    },
    scoreFactors: {
      email: v1Data.email ? 20 : 0,
      phone: v1Data.phone ? 15 : 0,
      company: v1Data.company ? 25 : 0,
      jobTitle: v1Data.jobTitle ? 10 : 0,
      industry: 0,
      companySize: 0,
      revenue: 0,
      website: 0,
      socialProfiles: 0,
    },
    activityCount: 0,
    conversionProbability: v1Data.score === 'hot' ? 70 : v1Data.score === 'warm' ? 40 : 20,
  };
  
  return leadSchemaV2.safeParse(v2Data);
};

// Migration function from v2 to v1 (reverse migration)
export const migrateLeadV2ToV1 = (leadV2: unknown) => {
  const v2Result = leadSchemaV2.safeParse(leadV2);
  if (!v2Result.success) {
    return v2Result;
  }
  
  const v2Data = v2Result.data;
  
  // Transform v2 data back to v1 format
  // Only keep v1-compatible fields, discard v2-specific fields
  const v1Data = {
    // Core v1 fields
    id: v2Data.id,
    tenantId: v2Data.tenantId,
    userId: v2Data.userId,
    
    // Basic information
    firstName: v2Data.firstName,
    lastName: v2Data.lastName,
    email: v2Data.email,
    phone: v2Data.phone,
    company: v2Data.company,
    jobTitle: v2Data.jobTitle,
    
    // Lead management
    status: v2Data.status,
    source: v2Data.source,
    score: v2Data.score,
    scoreValue: v2Data.scoreValue,
    
    // Timestamps
    createdAt: v2Data.createdAt,
    updatedAt: v2Data.updatedAt,
    assignedAt: v2Data.assignedAt,
    lastContactedAt: v2Data.lastContactedAt,
    
    // Additional v1 fields
    notes: v2Data.notes,
    tags: v2Data.tags,
    metadata: v2Data.metadata,
    customFields: v2Data.customFields,
    
    // Optional v1 fields
    address: v2Data.address,
    leadOwner: v2Data.leadOwner,
    campaign: v2Data.campaign,
    expectedCloseDate: v2Data.expectedCloseDate,
    estimatedValue: v2Data.estimatedValue,
    actualValue: v2Data.actualValue,
    probability: v2Data.probability,
    nextFollowUpDate: v2Data.nextFollowUpDate,
    followUpNotes: v2Data.followUpNotes,
    conversionDate: v2Data.conversionDate,
    lostReason: v2Data.lostReason,
    duplicateOf: v2Data.duplicateOf,
    mergedAt: v2Data.mergedAt,
    archivedAt: v2Data.archivedAt,
    archivedReason: v2Data.archivedReason,
  };
  
  return leadSchemaV1.safeParse(v1Data);
};

// Compile-time validation
export const leadSchemaV2Satisfies = leadSchemaV2 satisfies z.ZodType<Lead>;
