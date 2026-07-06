// ============================================================
// AuxiliaryTools — پنل ابزارهای کناری (اعلان‌ها، چت، راهنما، خروج)
// ============================================================

import { Bell, HelpCircle, MessageSquare, LogOut } from 'lucide-react';

interface AuxiliaryToolsProps {
  activePanel: string | null;
  onTogglePanel: (panel: string) => void;
  unreadNotifCount: number;
  onLogoutClick: () => void;
}

export default function AuxiliaryTools({
  activePanel,
  onTogglePanel,
  unreadNotifCount,
  onLogoutClick,
}: AuxiliaryToolsProps) {
  return (
    <div className="hidden lg:flex border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 flex-col justify-between items-center py-4 z-45">
      <div className="space-y-4 px-2">
        {/* Chat button */}
        <button
          onClick={() => onTogglePanel('chat')}
          className={`w-11 h-11 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center cursor-pointer relative ${
            activePanel === 'chat'
              ? 'bg-teal-600 text-white'
              : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-850'
          }`}
          title="چت پشتیبانی"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
        </button>

        {/* Notifications button */}
        <button
          onClick={() => onTogglePanel('notifications')}
          className={`w-11 h-11 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center cursor-pointer relative ${
            activePanel === 'notifications'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-850'
          }`}
          title="اعلان‌های سیستم"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifCount > 0 && (
            <span className="absolute -top-1 -left-1 font-bold bg-rose-500 text-white text-[9px] h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center">
              {unreadNotifCount}
            </span>
          )}
        </button>

        {/* Help button */}
        <button
          onClick={() => onTogglePanel('help')}
          className={`w-11 h-11 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center cursor-pointer relative ${
            activePanel === 'help'
              ? 'bg-amber-500 text-white'
              : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-850'
          }`}
          title="راهنمای کاربر"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Logout button */}
      <div className="px-2">
        <button
          onClick={onLogoutClick}
          className="w-11 h-11 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center justify-center cursor-pointer"
          title="خروج از حساب"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
