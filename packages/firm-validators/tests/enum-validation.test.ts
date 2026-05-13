import { describe, it, expect } from 'vitest';
import {
  enumField,
  tenantStatusField,
  userStatusField,
  leadStatusField,
  leadSourceField,
  leadScoreField,
  campaignTypeField,
  campaignStatusField,
  bookingStatusField,
  bookingTypeField,
  invoiceStatusField,
  subscriptionStatusField,
  billingCycleField,
  emailTemplateTypeField,
  formTypeField,
  webhookEventField,
  webhookStatusField,
  syncJobStatusField,
  serviceTierField,
  permissionCategoryField,
  auditActionField,
  reportTypeField,
  timePeriodField,
  exportFormatField,
  notificationTypeField,
  consentCategoryField,
  apiKeyPermissionField,
  themeModeField,
  currencyField,
  languageField,
  timezoneField,
  fileTypeField,
  integrationStatusField,
} from '../src/common';

describe('Enum Field Validation', () => {
  describe('Generic enumField', () => {
    it('should accept valid enum values', () => {
      const schema = enumField(['red', 'green', 'blue'] as const, 'Color');
      
      expect(schema.safeParse('red').success).toBe(true);
      expect(schema.safeParse('green').success).toBe(true);
      expect(schema.safeParse('blue').success).toBe(true);
    });

    it('should reject invalid enum values', () => {
      const schema = enumField(['red', 'green', 'blue'] as const, 'Color');
      
      expect(schema.safeParse('yellow').success).toBe(false);
      expect(schema.safeParse('purple').success).toBe(false);
      expect(schema.safeParse('').success).toBe(false);
    });

    it('should provide custom error message', () => {
      const schema = enumField(['red', 'green', 'blue'] as const, 'Color');
      const result = schema.safeParse('yellow');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Color is required');
      }
    });
  });

  describe('Tenant Status Field', () => {
    it('should accept all valid tenant status values', () => {
      const schema = tenantStatusField();
      
      expect(schema.safeParse('active').success).toBe(true);
      expect(schema.safeParse('inactive').success).toBe(true);
      expect(schema.safeParse('suspended').success).toBe(true);
      expect(schema.safeParse('trial').success).toBe(true);
      expect(schema.safeParse('cancelled').success).toBe(true);
    });

    it('should reject invalid tenant status values', () => {
      const schema = tenantStatusField();
      
      expect(schema.safeParse('pending').success).toBe(false);
      expect(schema.safeParse('deleted').success).toBe(false);
      expect(schema.safeParse('archived').success).toBe(false);
    });
  });

  describe('User Status Field', () => {
    it('should accept all valid user status values', () => {
      const schema = userStatusField();
      
      expect(schema.safeParse('active').success).toBe(true);
      expect(schema.safeParse('inactive').success).toBe(true);
      expect(schema.safeParse('suspended').success).toBe(true);
      expect(schema.safeParse('pending').success).toBe(true);
      expect(schema.safeParse('invited').success).toBe(true);
    });

    it('should reject invalid user status values', () => {
      const schema = userStatusField();
      
      expect(schema.safeParse('deleted').success).toBe(false);
      expect(schema.safeParse('banned').success).toBe(false);
    });
  });

  describe('Lead Status Field', () => {
    it('should accept all valid lead status values', () => {
      const schema = leadStatusField();
      
      expect(schema.safeParse('new').success).toBe(true);
      expect(schema.safeParse('contacted').success).toBe(true);
      expect(schema.safeParse('qualified').success).toBe(true);
      expect(schema.safeParse('converted').success).toBe(true);
      expect(schema.safeParse('lost').success).toBe(true);
      expect(schema.safeParse('duplicate').success).toBe(true);
      expect(schema.safeParse('unsubscribed').success).toBe(true);
    });

    it('should reject invalid lead status values', () => {
      const schema = leadStatusField();
      
      expect(schema.safeParse('pending').success).toBe(false);
      expect(schema.safeParse('archived').success).toBe(false);
    });
  });

  describe('Lead Source Field', () => {
    it('should accept all valid lead source values', () => {
      const schema = leadSourceField();
      
      expect(schema.safeParse('website').success).toBe(true);
      expect(schema.safeParse('referral').success).toBe(true);
      expect(schema.safeParse('social').success).toBe(true);
      expect(schema.safeParse('email').success).toBe(true);
      expect(schema.safeParse('phone').success).toBe(true);
      expect(schema.safeParse('form').success).toBe(true);
      expect(schema.safeParse('api').success).toBe(true);
      expect(schema.safeParse('import').success).toBe(true);
      expect(schema.safeParse('manual').success).toBe(true);
    });

    it('should reject invalid lead source values', () => {
      const schema = leadSourceField();
      
      expect(schema.safeParse('direct').success).toBe(false);
      expect(schema.safeParse('paid').success).toBe(false);
    });
  });

  describe('Lead Score Field', () => {
    it('should accept all valid lead score values', () => {
      const schema = leadScoreField();
      
      expect(schema.safeParse('hot').success).toBe(true);
      expect(schema.safeParse('warm').success).toBe(true);
      expect(schema.safeParse('cold').success).toBe(true);
    });

    it('should reject invalid lead score values', () => {
      const schema = leadScoreField();
      
      expect(schema.safeParse('medium').success).toBe(false);
      expect(schema.safeParse('high').success).toBe(false);
    });
  });

  describe('Campaign Type Field', () => {
    it('should accept all valid campaign type values', () => {
      const schema = campaignTypeField();
      
      expect(schema.safeParse('email').success).toBe(true);
      expect(schema.safeParse('sms').success).toBe(true);
      expect(schema.safeParse('social').success).toBe(true);
      expect(schema.safeParse('webinar').success).toBe(true);
      expect(schema.safeParse('event').success).toBe(true);
      expect(schema.safeParse('content').success).toBe(true);
      expect(schema.safeParse('retargeting').success).toBe(true);
    });

    it('should reject invalid campaign type values', () => {
      const schema = campaignTypeField();
      
      expect(schema.safeParse('display').success).toBe(false);
      expect(schema.safeParse('video').success).toBe(false);
    });
  });

  describe('Campaign Status Field', () => {
    it('should accept all valid campaign status values', () => {
      const schema = campaignStatusField();
      
      expect(schema.safeParse('draft').success).toBe(true);
      expect(schema.safeParse('scheduled').success).toBe(true);
      expect(schema.safeParse('active').success).toBe(true);
      expect(schema.safeParse('paused').success).toBe(true);
      expect(schema.safeParse('completed').success).toBe(true);
      expect(schema.safeParse('cancelled').success).toBe(true);
    });

    it('should reject invalid campaign status values', () => {
      const schema = campaignStatusField();
      
      expect(schema.safeParse('pending').success).toBe(false);
      expect(schema.safeParse('archived').success).toBe(false);
    });
  });

  describe('Booking Status Field', () => {
    it('should accept all valid booking status values', () => {
      const schema = bookingStatusField();
      
      expect(schema.safeParse('pending').success).toBe(true);
      expect(schema.safeParse('confirmed').success).toBe(true);
      expect(schema.safeParse('in_progress').success).toBe(true);
      expect(schema.safeParse('completed').success).toBe(true);
      expect(schema.safeParse('cancelled').success).toBe(true);
      expect(schema.safeParse('no_show').success).toBe(true);
      expect(schema.safeParse('rescheduled').success).toBe(true);
    });

    it('should reject invalid booking status values', () => {
      const schema = bookingStatusField();
      
      expect(schema.safeParse('scheduled').success).toBe(false);
      expect(schema.safeParse('delayed').success).toBe(false);
    });
  });

  describe('Booking Type Field', () => {
    it('should accept all valid booking type values', () => {
      const schema = bookingTypeField();
      
      expect(schema.safeParse('consultation').success).toBe(true);
      expect(schema.safeParse('service').success).toBe(true);
      expect(schema.safeParse('follow_up').success).toBe(true);
      expect(schema.safeParse('demo').success).toBe(true);
      expect(schema.safeParse('meeting').success).toBe(true);
      expect(schema.safeParse('appointment').success).toBe(true);
    });

    it('should reject invalid booking type values', () => {
      const schema = bookingTypeField();
      
      expect(schema.safeParse('call').success).toBe(false);
      expect(schema.safeParse('support').success).toBe(false);
    });
  });

  describe('Invoice Status Field', () => {
    it('should accept all valid invoice status values', () => {
      const schema = invoiceStatusField();
      
      expect(schema.safeParse('draft').success).toBe(true);
      expect(schema.safeParse('sent').success).toBe(true);
      expect(schema.safeParse('paid').success).toBe(true);
      expect(schema.safeParse('overdue').success).toBe(true);
      expect(schema.safeParse('cancelled').success).toBe(true);
      expect(schema.safeParse('refunded').success).toBe(true);
      expect(schema.safeParse('partial').success).toBe(true);
    });

    it('should reject invalid invoice status values', () => {
      const schema = invoiceStatusField();
      
      expect(schema.safeParse('pending').success).toBe(false);
      expect(schema.safeParse('processing').success).toBe(false);
    });
  });

  describe('Subscription Status Field', () => {
    it('should accept all valid subscription status values', () => {
      const schema = subscriptionStatusField();
      
      expect(schema.safeParse('active').success).toBe(true);
      expect(schema.safeParse('trial').success).toBe(true);
      expect(schema.safeParse('past_due').success).toBe(true);
      expect(schema.safeParse('cancelled').success).toBe(true);
      expect(schema.safeParse('unpaid').success).toBe(true);
      expect(schema.safeParse('paused').success).toBe(true);
    });

    it('should reject invalid subscription status values', () => {
      const schema = subscriptionStatusField();
      
      expect(schema.safeParse('expired').success).toBe(false);
      expect(schema.safeParse('suspended').success).toBe(false);
    });
  });

  describe('Billing Cycle Field', () => {
    it('should accept all valid billing cycle values', () => {
      const schema = billingCycleField();
      
      expect(schema.safeParse('monthly').success).toBe(true);
      expect(schema.safeParse('quarterly').success).toBe(true);
      expect(schema.safeParse('annual').success).toBe(true);
    });

    it('should reject invalid billing cycle values', () => {
      const schema = billingCycleField();
      
      expect(schema.safeParse('weekly').success).toBe(false);
      expect(schema.safeParse('biannual').success).toBe(false);
    });
  });

  describe('Email Template Type Field', () => {
    it('should accept all valid email template type values', () => {
      const schema = emailTemplateTypeField();
      
      expect(schema.safeParse('welcome').success).toBe(true);
      expect(schema.safeParse('confirmation').success).toBe(true);
      expect(schema.safeParse('reminder').success).toBe(true);
      expect(schema.safeParse('follow_up').success).toBe(true);
      expect(schema.safeParse('newsletter').success).toBe(true);
      expect(schema.safeParse('promotional').success).toBe(true);
      expect(schema.safeParse('transactional').success).toBe(true);
      expect(schema.safeParse('alert').success).toBe(true);
    });

    it('should reject invalid email template type values', () => {
      const schema = emailTemplateTypeField();
      
      expect(schema.safeParse('marketing').success).toBe(false);
      expect(schema.safeParse('notification').success).toBe(false);
    });
  });

  describe('Form Type Field', () => {
    it('should accept all valid form type values', () => {
      const schema = formTypeField();
      
      expect(schema.safeParse('contact').success).toBe(true);
      expect(schema.safeParse('lead_capture').success).toBe(true);
      expect(schema.safeParse('survey').success).toBe(true);
      expect(schema.safeParse('feedback').success).toBe(true);
      expect(schema.safeParse('registration').success).toBe(true);
      expect(schema.safeParse('application').success).toBe(true);
      expect(schema.safeParse('quote_request').success).toBe(true);
    });

    it('should reject invalid form type values', () => {
      const schema = formTypeField();
      
      expect(schema.safeParse('inquiry').success).toBe(false);
      expect(schema.safeParse('support').success).toBe(false);
    });
  });

  describe('Webhook Event Field', () => {
    it('should accept all valid webhook event values', () => {
      const schema = webhookEventField();
      
      expect(schema.safeParse('lead.created').success).toBe(true);
      expect(schema.safeParse('lead.updated').success).toBe(true);
      expect(schema.safeParse('lead.deleted').success).toBe(true);
      expect(schema.safeParse('booking.created').success).toBe(true);
      expect(schema.safeParse('booking.updated').success).toBe(true);
      expect(schema.safeParse('booking.completed').success).toBe(true);
      expect(schema.safeParse('invoice.created').success).toBe(true);
      expect(schema.safeParse('invoice.paid').success).toBe(true);
      expect(schema.safeParse('user.created').success).toBe(true);
      expect(schema.safeParse('user.updated').success).toBe(true);
    });

    it('should reject invalid webhook event values', () => {
      const schema = webhookEventField();
      
      expect(schema.safeParse('lead.archived').success).toBe(false);
      expect(schema.safeParse('booking.cancelled').success).toBe(false);
    });
  });

  describe('Webhook Status Field', () => {
    it('should accept all valid webhook status values', () => {
      const schema = webhookStatusField();
      
      expect(schema.safeParse('active').success).toBe(true);
      expect(schema.safeParse('inactive').success).toBe(true);
      expect(schema.safeParse('failed').success).toBe(true);
    });

    it('should reject invalid webhook status values', () => {
      const schema = webhookStatusField();
      
      expect(schema.safeParse('pending').success).toBe(false);
      expect(schema.safeParse('disabled').success).toBe(false);
    });
  });

  describe('Sync Job Status Field', () => {
    it('should accept all valid sync job status values', () => {
      const schema = syncJobStatusField();
      
      expect(schema.safeParse('pending').success).toBe(true);
      expect(schema.safeParse('running').success).toBe(true);
      expect(schema.safeParse('completed').success).toBe(true);
      expect(schema.safeParse('failed').success).toBe(true);
      expect(schema.safeParse('cancelled').success).toBe(true);
      expect(schema.safeParse('retrying').success).toBe(true);
    });

    it('should reject invalid sync job status values', () => {
      const schema = syncJobStatusField();
      
      expect(schema.safeParse('scheduled').success).toBe(false);
      expect(schema.safeParse('paused').success).toBe(false);
    });
  });

  describe('Service Tier Field', () => {
    it('should accept all valid service tier values', () => {
      const schema = serviceTierField();
      
      expect(schema.safeParse('starter').success).toBe(true);
      expect(schema.safeParse('professional').success).toBe(true);
      expect(schema.safeParse('business').success).toBe(true);
      expect(schema.safeParse('enterprise').success).toBe(true);
      expect(schema.safeParse('custom').success).toBe(true);
    });

    it('should reject invalid service tier values', () => {
      const schema = serviceTierField();
      
      expect(schema.safeParse('free').success).toBe(false);
      expect(schema.safeParse('premium').success).toBe(false);
    });
  });

  describe('Permission Category Field', () => {
    it('should accept all valid permission category values', () => {
      const schema = permissionCategoryField();
      
      expect(schema.safeParse('tenant').success).toBe(true);
      expect(schema.safeParse('user').success).toBe(true);
      expect(schema.safeParse('lead').success).toBe(true);
      expect(schema.safeParse('campaign').success).toBe(true);
      expect(schema.safeParse('booking').success).toBe(true);
      expect(schema.safeParse('invoice').success).toBe(true);
      expect(schema.safeParse('analytics').success).toBe(true);
      expect(schema.safeParse('settings').success).toBe(true);
      expect(schema.safeParse('admin').success).toBe(true);
    });

    it('should reject invalid permission category values', () => {
      const schema = permissionCategoryField();
      
      expect(schema.safeParse('report').success).toBe(false);
      expect(schema.safeParse('integration').success).toBe(false);
    });
  });

  describe('Audit Action Field', () => {
    it('should accept all valid audit action values', () => {
      const schema = auditActionField();
      
      expect(schema.safeParse('create').success).toBe(true);
      expect(schema.safeParse('read').success).toBe(true);
      expect(schema.safeParse('update').success).toBe(true);
      expect(schema.safeParse('delete').success).toBe(true);
      expect(schema.safeParse('login').success).toBe(true);
      expect(schema.safeParse('logout').success).toBe(true);
      expect(schema.safeParse('export').success).toBe(true);
      expect(schema.safeParse('import').success).toBe(true);
      expect(schema.safeParse('sync').success).toBe(true);
      expect(schema.safeParse('approve').success).toBe(true);
      expect(schema.safeParse('reject').success).toBe(true);
    });

    it('should reject invalid audit action values', () => {
      const schema = auditActionField();
      
      expect(schema.safeParse('archive').success).toBe(false);
      expect(schema.safeParse('restore').success).toBe(false);
    });
  });

  describe('Report Type Field', () => {
    it('should accept all valid report type values', () => {
      const schema = reportTypeField();
      
      expect(schema.safeParse('leads').success).toBe(true);
      expect(schema.safeParse('campaigns').success).toBe(true);
      expect(schema.safeParse('bookings').success).toBe(true);
      expect(schema.safeParse('revenue').success).toBe(true);
      expect(schema.safeParse('users').success).toBe(true);
      expect(schema.safeParse('activity').success).toBe(true);
      expect(schema.safeParse('conversion').success).toBe(true);
      expect(schema.safeParse('retention').success).toBe(true);
    });

    it('should reject invalid report type values', () => {
      const schema = reportTypeField();
      
      expect(schema.safeParse('analytics').success).toBe(false);
      expect(schema.safeParse('performance').success).toBe(false);
    });
  });

  describe('Time Period Field', () => {
    it('should accept all valid time period values', () => {
      const schema = timePeriodField();
      
      expect(schema.safeParse('today').success).toBe(true);
      expect(schema.safeParse('yesterday').success).toBe(true);
      expect(schema.safeParse('this_week').success).toBe(true);
      expect(schema.safeParse('last_week').success).toBe(true);
      expect(schema.safeParse('this_month').success).toBe(true);
      expect(schema.safeParse('last_month').success).toBe(true);
      expect(schema.safeParse('this_quarter').success).toBe(true);
      expect(schema.safeParse('last_quarter').success).toBe(true);
      expect(schema.safeParse('this_year').success).toBe(true);
      expect(schema.safeParse('last_year').success).toBe(true);
      expect(schema.safeParse('custom').success).toBe(true);
    });

    it('should reject invalid time period values', () => {
      const schema = timePeriodField();
      
      expect(schema.safeParse('next_week').success).toBe(false);
      expect(schema.safeParse('all_time').success).toBe(false);
    });
  });

  describe('Export Format Field', () => {
    it('should accept all valid export format values', () => {
      const schema = exportFormatField();
      
      expect(schema.safeParse('csv').success).toBe(true);
      expect(schema.safeParse('xlsx').success).toBe(true);
      expect(schema.safeParse('json').success).toBe(true);
      expect(schema.safeParse('pdf').success).toBe(true);
    });

    it('should reject invalid export format values', () => {
      const schema = exportFormatField();
      
      expect(schema.safeParse('xml').success).toBe(false);
      expect(schema.safeParse('txt').success).toBe(false);
    });
  });

  describe('Notification Type Field', () => {
    it('should accept all valid notification type values', () => {
      const schema = notificationTypeField();
      
      expect(schema.safeParse('info').success).toBe(true);
      expect(schema.safeParse('success').success).toBe(true);
      expect(schema.safeParse('warning').success).toBe(true);
      expect(schema.safeParse('error').success).toBe(true);
      expect(schema.safeParse('alert').success).toBe(true);
    });

    it('should reject invalid notification type values', () => {
      const schema = notificationTypeField();
      
      expect(schema.safeParse('debug').success).toBe(false);
      expect(schema.safeParse('critical').success).toBe(false);
    });
  });

  describe('Consent Category Field', () => {
    it('should accept all valid consent category values', () => {
      const schema = consentCategoryField();
      
      expect(schema.safeParse('necessary').success).toBe(true);
      expect(schema.safeParse('analytics').success).toBe(true);
      expect(schema.safeParse('marketing').success).toBe(true);
      expect(schema.safeParse('preferences').success).toBe(true);
      expect(schema.safeParse('functional').success).toBe(true);
    });

    it('should reject invalid consent category values', () => {
      const schema = consentCategoryField();
      
      expect(schema.safeParse('optional').success).toBe(false);
      expect(schema.safeParse('social').success).toBe(false);
    });
  });

  describe('API Key Permission Field', () => {
    it('should accept all valid API key permission values', () => {
      const schema = apiKeyPermissionField();
      
      expect(schema.safeParse('read').success).toBe(true);
      expect(schema.safeParse('write').success).toBe(true);
      expect(schema.safeParse('admin').success).toBe(true);
      expect(schema.safeParse('webhooks').success).toBe(true);
      expect(schema.safeParse('reports').success).toBe(true);
    });

    it('should reject invalid API key permission values', () => {
      const schema = apiKeyPermissionField();
      
      expect(schema.safeParse('delete').success).toBe(false);
      expect(schema.safeParse('full').success).toBe(false);
    });
  });

  describe('Theme Mode Field', () => {
    it('should accept all valid theme mode values', () => {
      const schema = themeModeField();
      
      expect(schema.safeParse('light').success).toBe(true);
      expect(schema.safeParse('dark').success).toBe(true);
      expect(schema.safeParse('system').success).toBe(true);
    });

    it('should reject invalid theme mode values', () => {
      const schema = themeModeField();
      
      expect(schema.safeParse('auto').success).toBe(false);
      expect(schema.safeParse('custom').success).toBe(false);
    });
  });

  describe('Currency Field', () => {
    it('should accept all valid currency values', () => {
      const schema = currencyField();
      
      expect(schema.safeParse('USD').success).toBe(true);
      expect(schema.safeParse('EUR').success).toBe(true);
      expect(schema.safeParse('GBP').success).toBe(true);
      expect(schema.safeParse('CAD').success).toBe(true);
      expect(schema.safeParse('AUD').success).toBe(true);
      expect(schema.safeParse('JPY').success).toBe(true);
      expect(schema.safeParse('CHF').success).toBe(true);
      expect(schema.safeParse('SEK').success).toBe(true);
      expect(schema.safeParse('NOK').success).toBe(true);
      expect(schema.safeParse('DKK').success).toBe(true);
    });

    it('should reject invalid currency values', () => {
      const schema = currencyField();
      
      expect(schema.safeParse('INR').success).toBe(false);
      expect(schema.safeParse('CNY').success).toBe(false);
      expect(schema.safeParse('usd').success).toBe(false); // case sensitive
    });
  });

  describe('Language Field', () => {
    it('should accept all valid language values', () => {
      const schema = languageField();
      
      expect(schema.safeParse('en').success).toBe(true);
      expect(schema.safeParse('es').success).toBe(true);
      expect(schema.safeParse('fr').success).toBe(true);
      expect(schema.safeParse('de').success).toBe(true);
      expect(schema.safeParse('it').success).toBe(true);
      expect(schema.safeParse('pt').success).toBe(true);
      expect(schema.safeParse('nl').success).toBe(true);
      expect(schema.safeParse('sv').success).toBe(true);
      expect(schema.safeParse('da').success).toBe(true);
      expect(schema.safeParse('no').success).toBe(true);
    });

    it('should reject invalid language values', () => {
      const schema = languageField();
      
      expect(schema.safeParse('zh').success).toBe(false);
      expect(schema.safeParse('ja').success).toBe(false);
      expect(schema.safeParse('EN').success).toBe(false); // case sensitive
    });
  });

  describe('Timezone Field', () => {
    it('should accept all valid timezone values', () => {
      const schema = timezoneField();
      
      expect(schema.safeParse('UTC').success).toBe(true);
      expect(schema.safeParse('America/New_York').success).toBe(true);
      expect(schema.safeParse('America/Chicago').success).toBe(true);
      expect(schema.safeParse('America/Denver').success).toBe(true);
      expect(schema.safeParse('America/Los_Angeles').success).toBe(true);
      expect(schema.safeParse('Europe/London').success).toBe(true);
      expect(schema.safeParse('Europe/Paris').success).toBe(true);
      expect(schema.safeParse('Europe/Berlin').success).toBe(true);
      expect(schema.safeParse('Asia/Tokyo').success).toBe(true);
      expect(schema.safeParse('Australia/Sydney').success).toBe(true);
    });

    it('should reject invalid timezone values', () => {
      const schema = timezoneField();
      
      expect(schema.safeParse('America/Phoenix').success).toBe(false);
      expect(schema.safeParse('Asia/Shanghai').success).toBe(false);
      expect(schema.safeParse('utc').success).toBe(false); // case sensitive
    });
  });

  describe('File Type Field', () => {
    it('should accept all valid file type values', () => {
      const schema = fileTypeField();
      
      expect(schema.safeParse('image').success).toBe(true);
      expect(schema.safeParse('document').success).toBe(true);
      expect(schema.safeParse('spreadsheet').success).toBe(true);
      expect(schema.safeParse('presentation').success).toBe(true);
      expect(schema.safeParse('video').success).toBe(true);
      expect(schema.safeParse('audio').success).toBe(true);
      expect(schema.safeParse('archive').success).toBe(true);
      expect(schema.safeParse('other').success).toBe(true);
    });

    it('should reject invalid file type values', () => {
      const schema = fileTypeField();
      
      expect(schema.safeParse('code').success).toBe(false);
      expect(schema.safeParse('data').success).toBe(false);
    });
  });

  describe('Integration Status Field', () => {
    it('should accept all valid integration status values', () => {
      const schema = integrationStatusField();
      
      expect(schema.safeParse('connected').success).toBe(true);
      expect(schema.safeParse('disconnected').success).toBe(true);
      expect(schema.safeParse('error').success).toBe(true);
      expect(schema.safeParse('pending').success).toBe(true);
      expect(schema.safeParse('expired').success).toBe(true);
    });

    it('should reject invalid integration status values', () => {
      const schema = integrationStatusField();
      
      expect(schema.safeParse('active').success).toBe(false);
      expect(schema.safeParse('failed').success).toBe(false);
    });
  });

  describe('Case Sensitivity', () => {
    it('should reject uppercase values for case-sensitive enums', () => {
      const schema = leadStatusField();
      
      expect(schema.safeParse('NEW').success).toBe(false);
      expect(schema.safeParse('New').success).toBe(false);
    });

    it('should accept exact case matches', () => {
      const schema = leadStatusField();
      
      expect(schema.safeParse('new').success).toBe(true);
      expect(schema.safeParse('contacted').success).toBe(true);
    });
  });

  describe('Enum Field Type Safety', () => {
    it('should preserve literal types for type safety', () => {
      const schema = leadStatusField();
      const result = schema.safeParse('new');
      
      if (result.success) {
        // TypeScript should infer the exact literal type
        const status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'duplicate' | 'unsubscribed' = result.data;
        expect(status).toBe('new');
      }
    });
  });

  describe('Enum Field Error Messages', () => {
    it('should provide clear error messages for invalid values', () => {
      const schema = leadStatusField();
      const result = schema.safeParse('invalid');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });
  });
});
