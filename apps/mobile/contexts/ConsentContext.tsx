/**
 * ConsentContext
 *
 * Fetches and caches the user's consent status from the backend.
 * Exposes helpers to accept / revoke consent and a boolean `hasConsent`.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  getMe,
  acceptConsent as acceptConsentApi,
  revokeConsent as revokeConsentApi,
  type MeResponse,
} from '@komuchi/shared';
import { useAuth } from './AuthContext';

interface ConsentContextValue {
  /** True while fetching /api/me */
  loading: boolean;
  /** True when consent has been accepted and not revoked */
  hasConsent: boolean;
  /** Raw consent timestamps */
  consentAcceptedAt: string | null;
  consentRevokedAt: string | null;
  /** Accept consent (calls backend) */
  accept: () => Promise<void>;
  /** Revoke consent (calls backend) */
  revoke: () => Promise<void>;
  /** Re-fetch consent status */
  refresh: () => Promise<void>;
}

const ConsentContext = createContext<ConsentContextValue>({
  loading: true,
  hasConsent: false,
  consentAcceptedAt: null,
  consentRevokedAt: null,
  accept: async () => {},
  revoke: async () => {},
  refresh: async () => {},
});

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [consentAcceptedAt, setConsentAcceptedAt] = useState<string | null>(null);
  const [consentRevokedAt, setConsentRevokedAt] = useState<string | null>(null);

  const hasConsent = !!consentAcceptedAt && !consentRevokedAt;

  const fetchConsent = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const me: MeResponse = await getMe(user.uid);
      setConsentAcceptedAt(me.consentAcceptedAt);
      setConsentRevokedAt(me.consentRevokedAt);
    } catch (err) {
      console.warn('Failed to fetch /api/me:', err);
      // Default to no consent if fetch fails
      setConsentAcceptedAt(null);
      setConsentRevokedAt(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConsent();
  }, [fetchConsent]);

  const accept = useCallback(async () => {
    if (!user) return;
    const res = await acceptConsentApi(user.uid);
    setConsentAcceptedAt(res.consentAcceptedAt);
    setConsentRevokedAt(res.consentRevokedAt);
  }, [user]);

  const revoke = useCallback(async () => {
    if (!user) return;
    const res = await revokeConsentApi(user.uid);
    setConsentAcceptedAt(res.consentAcceptedAt);
    setConsentRevokedAt(res.consentRevokedAt);
  }, [user]);

  return (
    <ConsentContext.Provider
      value={{
        loading,
        hasConsent,
        consentAcceptedAt,
        consentRevokedAt,
        accept,
        revoke,
        refresh: fetchConsent,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  return useContext(ConsentContext);
}
