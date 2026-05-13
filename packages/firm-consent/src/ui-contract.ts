import { ConsentCategory, CONSENT_PURPOSES } from './categories';
import { ConsentRecord } from './consent-manager';

/**
 * Interface for the UI to interact with consent state.
 */
export interface IConsentUiState {
  /**
   * Whether the consent banner should be visible.
   */
  isVisible: boolean;

  /**
   * The current consent record.
   */
  record: ConsentRecord;

  /**
   * Purpose descriptions for each category.
   */
  purposes: Record<ConsentCategory, string>;

  /**
   * Grants consent for specific categories.
   */
  grant: (categories: ConsentCategory[]) => Promise<void>;

  /**
   * Denies consent for specific categories (withdraws).
   */
  deny: (categories: ConsentCategory[]) => Promise<void>;

  /**
   * Grants all categories.
   */
  grantAll: () => Promise<void>;

  /**
   * Denies all except necessary.
   */
  denyAll: () => Promise<void>;

  /**
   * Closes the banner without making changes (if allowed).
   */
  close: () => void;
}
