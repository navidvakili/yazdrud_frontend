// ============================================================
// Network Observer — ردیابی وضعیت اتصال به سرور
// ============================================================

type Listener = (status: { online: boolean; apiFailing: boolean }) => void;

let listeners: Listener[] = [];
let online = typeof navigator !== 'undefined' ? navigator.onLine : true;
let apiFailing = false;
let apiFailTimer: ReturnType<typeof setTimeout> | null = null;

function notify() {
  const status = { online, apiFailing };
  listeners.forEach(l => l(status));
}

// Browser online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    online = true;
    notify();
  });
  window.addEventListener('offline', () => {
    online = false;
    notify();
  });
}

export const networkObserver = {
  /** Subscribe to network status changes. Returns unsubscribe function. */
  subscribe(fn: Listener) {
    listeners.push(fn);
    // Immediately call with current state
    fn({ online, apiFailing });
    return () => {
      listeners = listeners.filter(l => l !== fn);
    };
  },

  /** Report an API call failure due to network issues */
  reportApiFailure() {
    apiFailing = true;
    notify();
    // Auto-reset after 10 seconds (will be cleared if a success comes in)
    if (apiFailTimer) clearTimeout(apiFailTimer);
    apiFailTimer = setTimeout(() => {
      apiFailing = false;
      notify();
    }, 10000);
  },

  /** Report a successful API call (clears failure state) */
  reportApiSuccess() {
    if (apiFailing) {
      apiFailing = false;
      if (apiFailTimer) clearTimeout(apiFailTimer);
      notify();
    }
  },

  /** Get current status synchronously */
  getStatus() {
    return { online, apiFailing };
  },
};
