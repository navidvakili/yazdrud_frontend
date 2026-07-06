// ============================================================
// useStandby — قفل خودکار پس از عدم فعالیت کاربر
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { STANDBY_TIMEOUT } from '@/src/shared-constants';
import { loginApi } from '@/src/login';

export function useStandby(viewState: 'login' | 'authenticated') {
  const [isStandby, setIsStandby] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const standbyCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (viewState !== 'authenticated') {
      // Not logged in — no standby tracking
      setIsStandby(false);
      return;
    }

    // Reset activity timestamp on any user interaction
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      // If was in standby, do NOT auto-exit — must use password
    };

    // Also reset activity when we start tracking (fresh login)
    lastActivityRef.current = Date.now();
    setIsStandby(false);

    // Periodic check: if inactive beyond timeout → enter standby
    standbyCheckIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= STANDBY_TIMEOUT && !isStandby) {
        setIsStandby(true);
      }
    }, 5000); // Check every 5 seconds

    // Bind activity events
    const events = ['mousedown', 'mousemove', 'keydown', 'click', 'touchstart', 'scroll', 'wheel'];
    events.forEach(ev => window.addEventListener(ev, updateActivity, { passive: true }));

    return () => {
      if (standbyCheckIntervalRef.current) {
        clearInterval(standbyCheckIntervalRef.current);
        standbyCheckIntervalRef.current = null;
      }
      events.forEach(ev => window.removeEventListener(ev, updateActivity));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewState]);

  const handleUnlock = async (password: string): Promise<boolean> => {
    const ok = await loginApi.verifyPassword(password);
    if (ok) {
      setIsStandby(false);
      lastActivityRef.current = Date.now();
    }
    return ok;
  };

  return { isStandby, setIsStandby, handleUnlock };
}
