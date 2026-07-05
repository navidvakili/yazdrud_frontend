// ============================================================
// useToast — Toast notification hook
// ============================================================

import { useState, useCallback } from 'react';
import type { ToastMessage } from '../types';

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  return { toast, showToast };
}
