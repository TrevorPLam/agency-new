/**
 * Consent categories defined for the Agency Platform.
 */
export const CONSENT_CATEGORIES = {
  /**
   * Essential cookies/data required for the site to function.
   * Always granted.
   */
  NECESSARY: 'necessary',

  /**
   * Analytics and performance monitoring.
   */
  ANALYTICS: 'analytics',

  /**
   * Marketing and advertisement personalization.
   */
  MARKETING: 'marketing',

  /**
   * Functional preferences (e.g. language, theme).
   */
  FUNCTIONAL: 'functional',
} as const;

export type ConsentCategory = (typeof CONSENT_CATEGORIES)[keyof typeof CONSENT_CATEGORIES];

/**
 * Purposes for each category.
 */
export const CONSENT_PURPOSES: Record<ConsentCategory, string> = {
  [CONSENT_CATEGORIES.NECESSARY]: 'Essential for security and basic functionality.',
  [CONSENT_CATEGORIES.ANALYTICS]: 'Used to understand how visitors interact with the website.',
  [CONSENT_CATEGORIES.MARKETING]: 'Used to deliver relevant advertisements and track campaign performance.',
  [CONSENT_CATEGORIES.FUNCTIONAL]: 'Used to remember user preferences and provide enhanced features.',
};

/**
 * Default consent state.
 * Necessary is always granted.
 */
export const DEFAULT_CONSENT: Record<ConsentCategory, boolean> = {
  [CONSENT_CATEGORIES.NECESSARY]: true,
  [CONSENT_CATEGORIES.ANALYTICS]: false,
  [CONSENT_CATEGORIES.MARKETING]: false,
  [CONSENT_CATEGORIES.FUNCTIONAL]: false,
};

/**
 * Consent forced by Global Privacy Control (GPC).
 * GPC forces analytics and marketing denial.
 */
export const GPC_FORCED_CONSENT: Partial<Record<ConsentCategory, boolean>> = {
  [CONSENT_CATEGORIES.ANALYTICS]: false,
  [CONSENT_CATEGORIES.MARKETING]: false,
};
