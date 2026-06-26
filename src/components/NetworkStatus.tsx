// ============================================================
// NetworkStatus — نمایش وضعیت اتصال به شبکه در پایین صفحه
// ============================================================

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, CloudOff } from 'lucide-react';
import { networkStatus } from '@/src/lib/networkStatus';

export default function NetworkStatus() {
  const [status, setStatus] = useState(networkStatus.getStatus());

  useEffect(() => {
    const unsub = networkStatus.subscribe(setStatus);
    return unsub;
  }, []);

  // Only show when there's an issue
  if (status.online && !status.apiFailing) return null;

  const message = !status.online
    ? 'اتصال اینترنت قطع شده است'
    : 'ارتباط با سرور با مشکل مواجه شده است';

  const IconComponent = !status.online ? WifiOff : CloudOff;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999]">
      <div className="flex items-center justify-center gap-2.5 py-2 px-4 bg-red-500/90 dark:bg-red-600/90 backdrop-blur-md text-white text-xs font-bold shadow-lg border-t border-red-400/50">
        <IconComponent className="w-4 h-4 shrink-0" />
        <span>{message}</span>
        <Wifi className="w-3.5 h-3.5 animate-pulse opacity-70" />
      </div>
    </div>
  );
}
