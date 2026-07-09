// ============================================================
// useStandby — قفل خودکار پس از عدم فعالیت کاربر (پایدار با localStorage)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { STANDBY_TIMEOUT, STANDBY_LOCKED_KEY } from '@/src/shared-constants';
import { loginApi } from '@/src/login';

export function useStandby(viewState: 'login' | 'authenticated') {
  // Restore persisted lock state on mount — survives page refresh
  const [isStandby, _setIsStandby] = useState(() =>
    localStorage.getItem(STANDBY_LOCKED_KEY) === 'true',
  );
  const lastActivityRef = useRef<number>(Date.now());
  const standbyCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep a ref to latest isStandby for interval callback (avoids stale closure)
  const isStandbyRef = useRef(isStandby);
  isStandbyRef.current = isStandby;

  // Custom setter that syncs to localStorage
  const setIsStandby = (value: boolean) => {
    _setIsStandby(value);
    if (value) {
      localStorage.setItem(STANDBY_LOCKED_KEY, 'true');
    } else {
      localStorage.removeItem(STANDBY_LOCKED_KEY);
    }
  };

  useEffect(() => {
    if (viewState !== 'authenticated') {
      // Only clear lock if user truly has no active session (logged out).
      // If user IS authenticated but viewState is still 'login' (page refresh),
      // keep the persisted lock — App.tsx will restore viewState momentarily.
      if (!loginApi.isAuthenticated()) {
        if (isStandbyRef.current) {
          setIsStandby(false);
        }
      }
      return;
    }

    // Reset activity timestamp on any user interaction
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      // If was in standby, do NOT auto-exit — must use password
    };

    // Don't reset isStandby here — the persisted lock from localStorage
    // should survive a page refresh. Only reset the activity timer.
    lastActivityRef.current = Date.now();

    // Periodic check: if inactive beyond timeout → enter standby
    standbyCheckIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= STANDBY_TIMEOUT && !isStandbyRef.current) {
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
