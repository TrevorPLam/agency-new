'use client';

import React, { 
  createContext, 
  useContext, 
  useState, 
  useMemo, 
  useCallback, 
  useEffect 
} from 'react';
import { 
  ConsentCategory, 
  CONSENT_CATEGORIES, 
  CONSENT_PURPOSES 
} from './categories';
import { ConsentManager, ConsentRecord } from './consent-manager';
import { IConsentUiState } from './ui-contract';

interface ConsentContextValue {
  manager: ConsentManager;
  record: ConsentRecord;
  ui: IConsentUiState;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export interface ConsentProviderProps {
  children: React.ReactNode;
  initialRecord?: ConsentRecord;
  onRecordChange?: (record: ConsentRecord) => void;
}

export const ConsentProvider: React.FC<ConsentProviderProps> = ({ 
  children, 
  initialRecord,
  onRecordChange 
}) => {
  const [manager] = useState(() => new ConsentManager());
  const [record, setRecord] = useState<ConsentRecord>(() => {
    if (initialRecord) {
      // Synchronously load if provided
      // manager.loadRecord is async but we can't await here easily without effect
      return initialRecord;
    }
    return manager.getRecord();
  });
  const [isUiVisible, setIsUiVisible] = useState(!initialRecord);

  // Load initial record into manager if provided
  useEffect(() => {
    if (initialRecord) {
      manager.loadRecord(initialRecord).then(() => {
        setRecord(manager.getRecord());
      });
    }
  }, [initialRecord, manager]);

  const updateConsent = useCallback(async (updates: Partial<Record<ConsentCategory, boolean>>) => {
    await manager.updateConsent(updates);
    const newRecord = manager.getRecord();
    setRecord(newRecord);
    onRecordChange?.(newRecord);
  }, [manager, onRecordChange]);

  const ui: IConsentUiState = useMemo(() => ({
    isVisible: isUiVisible,
    record,
    purposes: CONSENT_PURPOSES,
    grant: async (categories) => {
      const updates = categories.reduce((acc, cat) => ({ ...acc, [cat]: true }), {});
      await updateConsent(updates);
    },
    deny: async (categories) => {
      const updates = categories.reduce((acc, cat) => ({ ...acc, [cat]: false }), {});
      await updateConsent(updates);
    },
    grantAll: async () => {
      const updates = (Object.values(CONSENT_CATEGORIES) as ConsentCategory[]).reduce(
        (acc, cat) => ({ ...acc, [cat]: true }), 
        {}
      );
      await updateConsent(updates);
      setIsUiVisible(false);
    },
    denyAll: async () => {
      const updates = (Object.values(CONSENT_CATEGORIES) as ConsentCategory[]).reduce(
        (acc, cat) => ({ ...acc, [cat]: false }), 
        {}
      );
      await updateConsent(updates);
      setIsUiVisible(false);
    },
    close: () => setIsUiVisible(false),
  }), [isUiVisible, record, updateConsent]);

  const value = useMemo(() => ({
    manager,
    record,
    ui
  }), [manager, record, ui]);

  return (
    <ConsentContext.Provider value={value}>
      {children}
    </ConsentContext.Provider>
  );
};

/**
 * Hook to access the consent manager.
 */
export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
}

/**
 * Hook for structural render gating.
 */
export function useConsentGate(category: ConsentCategory) {
  const { manager } = useConsent();
  return manager.hasConsent(category);
}

/**
 * Hook for the consent UI banner.
 */
export function useConsentUi() {
  const { ui } = useConsent();
  return ui;
}
