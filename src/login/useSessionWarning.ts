// ============================================================
// useSessionWarning — Hook برای مدیریت هشدار نشست موازی
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { loginApi } from './api';

interface WarningInfo {
  id: number;
  ip_address: string | null;
  user_agent: string | null;
  browser_fingerprint: string | null;
}

/**
 * Poll for pending session warnings and provide a responder.
 * @param enabled - Whether polling is active (e.g., user is authenticated)
 */
export function useSessionWarning(enabled: boolean) {
  const [pendingWarning, setPendingWarning] = useState<WarningInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for pending warnings
  useEffect(() => {
    if (!enabled) {
      setPendingWarning(null);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    pollRef.current = setInterval(async () => {
      try {
        const warnings = await loginApi.getPendingWarnings();
        if (warnings && warnings.length > 0) {
          const w = warnings[0];
          setPendingWarning({
            id: w.id,
            ip_address: w.ip_address,
            user_agent: w.user_agent,
            browser_fingerprint: w.browser_fingerprint,
          });
        }
      } catch {
        // Ignore polling errors
      }
    }, 5000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [enabled]);

  // Respond to a warning
  const respondToWarning = useCallback(async (warningId: number, status: 'accepted' | 'rejected') => {
    setIsLoading(true);
    try {
      await loginApi.respondToWarning(warningId, status);
      setPendingWarning(null);
    } catch {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { pendingWarning, setPendingWarning, isLoading, respondToWarning };
}
