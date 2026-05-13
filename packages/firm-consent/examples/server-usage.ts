/**
 * Example usage of server-side consent resolution for GDPR compliance.
 * This demonstrates how to use the new server-side functions to make
 * consent decisions before rendering pages in SSR scenarios.
 */

import {
  getConsentFromHeaders,
  hasConsentFromHeaders,
  getConsentChoicesFromHeaders,
  isGpcEnabledFromHeaders,
  applyGpcOverrides,
  buildConsentCookieHeader,
  DEFAULT_CONSENT_COOKIE_NAME,
  ConsentHeaders
} from '../src/server';
import { ConsentManager } from '../src/consent-manager';
import { CONSENT_CATEGORIES } from '../src/categories';

/**
 * Example: Next.js middleware or server-side page logic
 */
export function shouldIncludeAnalytics(headers: ConsentHeaders): boolean {
  // Check if user has granted analytics consent
  const hasAnalyticsConsent = hasConsentFromHeaders(headers, CONSENT_CATEGORIES.ANALYTICS);
  
  // Apply GPC overrides if enabled
  if (isGpcEnabledFromHeaders(headers)) {
    return false; // GPC forces analytics to be disabled
  }
  
  return hasAnalyticsConsent;
}

/**
 * Example: Get all consent choices for conditional script loading
 */
export function getConsentForScriptLoading(headers: ConsentHeaders) {
  const choices = getConsentChoicesFromHeaders(headers);
  
  // Apply GPC overrides if enabled
  const finalChoices = applyGpcOverrides(choices, headers);
  
  return {
    canLoadAnalytics: finalChoices[CONSENT_CATEGORIES.ANALYTICS],
    canLoadMarketing: finalChoices[CONSENT_CATEGORIES.MARKETING],
    canLoadFunctional: finalChoices[CONSENT_CATEGORIES.FUNCTIONAL],
    canLoadNecessary: finalChoices[CONSENT_CATEGORIES.NECESSARY], // Always true
  };
}

/**
 * Example: Express.js middleware for consent checking
 */
export function consentMiddleware(req: any, res: any, next: any) {
  const headers: ConsentHeaders = {
    cookie: req.headers.cookie,
    'user-agent': req.headers['user-agent'],
    dnt: req.headers.dnt,
    'sec-gpc': req.headers['sec-gpc'],
  };

  // Store consent information in request object for later use
  req.consent = {
    record: getConsentFromHeaders(headers),
    choices: getConsentChoicesFromHeaders(headers),
    gpcEnabled: isGpcEnabledFromHeaders(headers),
  };

  next();
}

/**
 * Example: Generate HTML with conditional script inclusion
 */
export function generateHtmlWithScripts(headers: ConsentHeaders): string {
  const consent = getConsentForScriptLoading(headers);
  
  let scripts = '';
  
  // Always include necessary scripts
  scripts += '<script src="/js/necessary.js"></script>\n';
  
  // Conditionally include analytics scripts
  if (consent.canLoadAnalytics) {
    scripts += '<script src="/js/analytics.js"></script>\n';
    scripts += '<script>gtag("config", "GA_MEASUREMENT_ID");</script>\n';
  }
  
  // Conditionally include marketing scripts
  if (consent.canLoadMarketing) {
    scripts += '<script src="/js/marketing.js"></script>\n';
    scripts += '<script>fbq("init", "FACEBOOK_PIXEL_ID");</script>\n';
  }
  
  // Conditionally include functional scripts
  if (consent.canLoadFunctional) {
    scripts += '<script src="/js/functional.js"></script>\n';
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <title>GDPR Compliant Page</title>
</head>
<body>
  <h1>Welcome to our site</h1>
  <p>Your consent preferences have been respected.</p>
  
  ${scripts}
</body>
</html>`;
}

/**
 * Example: API endpoint to check consent status
 */
export function checkConsentEndpoint(headers: ConsentHeaders) {
  const consentRecord = getConsentFromHeaders(headers);
  const gpcEnabled = isGpcEnabledFromHeaders(headers);
  
  return {
    hasConsentRecord: !!consentRecord,
    consentRecord,
    gpcEnabled,
    lastUpdated: consentRecord?.updatedAt,
    expiresAt: consentRecord?.expiresAt,
    isExpired: consentRecord ? Date.now() > consentRecord.expiresAt : true,
  };
}

/**
 * Example: Custom cookie name usage
 */
export function checkConsentWithCustomCookie(headers: ConsentHeaders) {
  // Use a custom cookie name for multi-tenant scenarios
  const options = {
    cookieName: 'tenant_123_consent',
  };
  
  return getConsentFromHeaders(headers, options);
}

/**
 * Example: Comprehensive consent validation for SSR
 */
export function validateConsentForSSR(headers: ConsentHeaders) {
  const consentRecord = getConsentFromHeaders(headers);
  const gpcEnabled = isGpcEnabledFromHeaders(headers);
  
  // If no consent record exists, return default state
  if (!consentRecord) {
    return {
      valid: true,
      choices: {
        [CONSENT_CATEGORIES.NECESSARY]: true,
        [CONSENT_CATEGORIES.ANALYTICS]: false,
        [CONSENT_CATEGORIES.MARKETING]: false,
        [CONSENT_CATEGORIES.FUNCTIONAL]: false,
      },
      gpcApplied: gpcEnabled,
      source: 'default',
    };
  }
  
  // Apply GPC overrides if enabled
  const finalChoices = applyGpcOverrides(consentRecord.choices, headers);
  
  return {
    valid: true,
    choices: finalChoices,
    gpcApplied: gpcEnabled || consentRecord.gpcApplied,
    source: 'cookie',
    lastUpdated: consentRecord.updatedAt,
    expiresAt: consentRecord.expiresAt,
  };
}

/**
 * Example: Setting secure consent cookies in API routes
 */
export async function setConsentCookieExample(userChoices: { analytics: boolean; marketing: boolean; functional: boolean }) {
  // Create consent manager and update user choices
  const consentManager = new ConsentManager();
  await consentManager.updateConsent(userChoices, 'user');
  
  // Create signed cookie payload
  const secretKey = process.env.CONSENT_COOKIE_SECRET || 'your-secret-key';
  const signedPayload = consentManager.createSignedCookie(secretKey);
  
  // Build secure Set-Cookie header
  const cookieHeader = buildConsentCookieHeader(signedPayload, {
    maxAge: 365 * 24 * 60 * 60, // 1 year in seconds
    domain: '.example.com', // Optional: for subdomains
  });
  
  return cookieHeader;
}

/**
 * Example: Express.js route for consent management
 */
export function consentUpdateRoute(req: any, res: any) {
  const userChoices = req.body; // { analytics: true, marketing: false, functional: true }
  
  // Create consent manager
  const consentManager = new ConsentManager({
    headers: {
      'user-agent': req.headers['user-agent'],
      dnt: req.headers.dnt,
      'sec-gpc': req.headers['sec-gpc'],
    }
  });
  
  // Update consent choices
  consentManager.updateConsent(userChoices, 'user').then(() => {
    // Create signed cookie
    const secretKey = process.env.CONSENT_COOKIE_SECRET;
    if (!secretKey) {
      throw new Error('CONSENT_COOKIE_SECRET environment variable is required');
    }
    const signedPayload = consentManager.createSignedCookie(secretKey);
    
    // Build secure cookie header
    const cookieHeader = buildConsentCookieHeader(signedPayload);
    
    // Set the cookie
    res.setHeader('Set-Cookie', cookieHeader);
    res.json({ success: true, message: 'Consent preferences updated' });
  }).catch(error => {
    res.status(500).json({ success: false, error: 'Failed to update consent' });
  });
}

/**
 * Example: Generic API route for consent management
 */
export async function handleConsentUpdate(request: Request) {
  try {
    const userChoices = await request.json();
    
    // Create consent manager with request headers
    const consentManager = new ConsentManager({
      headers: {
        'user-agent': request.headers.get('user-agent') || undefined,
        dnt: request.headers.get('dnt') || undefined,
        'sec-gpc': request.headers.get('sec-gpc') || undefined,
      }
    });
    
    // Update consent choices
    await consentManager.updateConsent(userChoices, 'user');
    
    // Create signed cookie
    const secretKey = process.env.CONSENT_COOKIE_SECRET;
    if (!secretKey) {
      throw new Error('CONSENT_COOKIE_SECRET environment variable is required');
    }
    const signedPayload = consentManager.createSignedCookie(secretKey);
    
    // Build secure cookie header
    const cookieHeader = buildConsentCookieHeader(signedPayload, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
    });
    
    // Create response with secure cookie
    const response = Response.json({ 
      success: true, 
      message: 'Consent preferences updated',
      choices: consentManager.getRecord().choices
    });
    
    response.headers.set('Set-Cookie', cookieHeader);
    return response;
    
  } catch (error) {
    return Response.json(
      { success: false, error: 'Failed to update consent' },
      { status: 500 }
    );
  }
}
