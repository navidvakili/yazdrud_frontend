// ============================================================
// FloatingPanels — پنل‌های شناور (اعلان‌ها، چت، راهنما)
// ============================================================

import { motion } from 'motion/react';
import {
  X,
  Bell,
  MessageSquare,
  HelpCircle,
  CheckCheck,
  Trash2,
  Send,
  Mail,
  Info,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import type { PortalNotification } from '@/src/shared-types';

interface FloatingPanelsProps {
  activePanel: string | null;
  onClose: () => void;
  notifications: PortalNotification[];
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
}

export default function FloatingPanels({
  activePanel,
  onClose,
  notifications,
  onMarkNotificationRead,
  onClearNotifications,
}: FloatingPanelsProps) {
  if (!activePanel) return null;

  const notifIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error': return <Info className="w-4 h-4 text-rose-500" />;
      default: return <Bell className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -320, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shadow-2xl z-50 flex flex-col"
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activePanel === 'notifications' && <Bell className="w-5 h-5 text-indigo-500" />}
          {activePanel === 'chat' && <MessageSquare className="w-5 h-5 text-teal-500" />}
          {activePanel === 'help' && <HelpCircle className="w-5 h-5 text-amber-500" />}
          <h3 className="text-sm font-black text-gray-900 dark:text-white">
            {activePanel === 'notifications' && 'اعلان‌های سیستم'}
            {activePanel === 'chat' && 'پشتیبانی آنلاین'}
            {activePanel === 'help' && 'راهنمای کاربر'}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activePanel === 'notifications' && (
          <div className="p-3 space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                اعلانی وجود ندارد
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onMarkNotificationRead(n.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    n.read
                      ? 'bg-gray-50 dark:bg-gray-850 opacity-60'
                      : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {notifIcon(n.type)}
                    <div className="flex-1 min-w-0">
                      <span className={`block text-[11px] ${n.read ? 'font-medium' : 'font-bold'} text-gray-900 dark:text-white`}>
                        {n.title}
                      </span>
                      <span className="block text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        {n.body}
                      </span>
                      <span className="block text-[9px] text-gray-400 dark:text-gray-500 mt-1.5">{n.date}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activePanel === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-4 space-y-4">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/40">
                  <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="bg-gray-50 dark:bg-gray-850 rounded-2xl rounded-tr-none p-3 max-w-[80%]">
                  <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">
                    سلام! به پشتیبانی آنلاین پرتال خوش آمدید. چطور می‌توانم به شما کمک کنم؟
                  </p>
                  <span className="block text-[8px] text-gray-400 mt-1">پشتیبان • لحظاتی پیش</span>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-gray-100 dark:border-gray-800">
              <div className="relative">
                <input
                  type="text"
                  placeholder="پیام خود را بنویسید..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <button className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-teal-600 hover:text-teal-700 cursor-pointer">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activePanel === 'help' && (
          <div className="p-4 space-y-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
              <p className="font-bold text-amber-700 dark:text-amber-300 mb-1">راهنمای سریع</p>
              <p>برای شروع کار، از منوی سمت راست گزینه مورد نظر خود را انتخاب کنید.</p>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white mb-1">🔍 جستجوی منو</p>
              <p>از نوار جستجوی بالای صفحه برای پیدا کردن سریع گزینه‌ها استفاده کنید.</p>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white mb-1">📌 تب‌های موازی</p>
              <p>می‌توانید چندین تب را همزمان باز کنید و بین آنها جابجا شوید.</p>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white mb-1">🌙 حالت تاریک</p>
              <p>با کلیک روی دکمه ماه/خورشید در نوار کناری، تم تاریک و روشن را تغییر دهید.</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
