/**
 * Lead schema v1 - Initial version of lead validation
 * Provides comprehensive validation for lead data with cross-field validation
 */

import { z } from 'zod';
import type { Lead, LeadStatus, LeadSource, LeadScore, UserId, TenantId } from '@firm/types';
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
} from '../common';

// Lead Note schema
const leadNoteSchema = objectField({
  id: uuidField('Note ID'),
  content: textField('Content', 1, 2000),
  createdBy: userIdField(),
  createdAt: timestampField('Created at'),
  isPrivate: booleanField('Is private', false),
}, 'Lead note');

// Lead Activity schema
const leadActivitySchema = objectField({
  id: uuidField('Activity ID'),
  type: textField('Type', 1, 50),
  description: textField('Description', 1, 500),
  createdBy: userIdField(),
  createdAt: timestampField('Created at'),
  metadata: metadataField(),
}, 'Lead activity');

// Lead schema v1
export const leadSchemaV1 = objectField({
  id: leadIdField(),
  tenantId: tenantIdField(),
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  email: emailField('Email').optional(),
  phone: phoneField('Phone number').optional(),
  company: optionalTextField('Company', 100),
  jobTitle: optionalTextField('Job title', 100),
  status: enumField(['new', 'contacted', 'qualified', 'converted', 'lost', 'duplicate', 'unsubscribed'] as const, 'Status'),
  source: enumField(['website', 'referral', 'social', 'email', 'phone', 'form', 'api', 'import', 'manual'] as const, 'Source'),
  score: enumField(['hot', 'warm', 'cold'] as const, 'Score'),
  scoreValue: numberField('Score value', 0, 100).default(0),
  assignedTo: userIdField().optional(),
  tags: optionalArrayField(z.string(), 'Tags', 0, 20),
  customFields: customFieldsField(),
  lastContactAt: timestampField('Last contact at').optional(),
  notes: arrayField(leadNoteSchema, 'Notes', 0, 50),
  activities: arrayField(leadActivitySchema, 'Activities', 0, 100),
  metadata: metadataField(),
  createdAt: timestampField('Created at'),
  updatedAt: timestampField('Updated at'),
}, 'Lead');

// Cross-field validation for lead
export const leadSchemaV1WithValidation = leadSchemaV1
  .superRefine((data, ctx) => {
    // At least email or phone must be provided
    if (!data.email && !data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either email or phone number must be provided',
        path: ['email'],
      });
    }

    // Score validation based on status
    if (data.status === 'converted' && data.score !== 'hot') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Converted leads must have hot score',
        path: ['score'],
      });
    }

    // Assigned user must be active
    if (data.assignedTo && data.status === 'new') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'New leads should not be assigned to users',
        path: ['assignedTo'],
      });
    }
  })
  .transform((data) => {
    // Auto-calculate score based on available data
    if (data.scoreValue === 0) {
      let calculatedScore = 0;
      
      if (data.email) calculatedScore += 20;
      if (data.phone) calculatedScore += 15;
      if (data.company) calculatedScore += 25;
      if (data.jobTitle) calculatedScore += 10;
      
      if (calculatedScore >= 60) {
        data.score = 'hot';
      } else if (calculatedScore >= 30) {
        data.score = 'warm';
      } else {
        data.score = 'cold';
      }
      
      data.scoreValue = calculatedScore;
    }
    
    return data;
  });

// Type assertions
export type LeadV1 = z.infer<typeof leadSchemaV1>;
export type LeadV1WithValidation = z.infer<typeof leadSchemaV1WithValidation>;

// Runtime validation functions
export const validateLeadV1 = (data: unknown) => leadSchemaV1.safeParse(data);
export const validateLeadV1WithValidation = (data: unknown) => leadSchemaV1WithValidation.safeParse(data);

// Compile-time validation
export const leadSchemaV1Satisfies = leadSchemaV1 satisfies z.ZodType<Lead>;
