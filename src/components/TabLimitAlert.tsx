// ============================================================
// TabLimitAlert — مودال هشدار محدودیت تعداد تب‌ها
// ============================================================

import { AlertTriangle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MAX_TABS } from '@/src/lib/constants';

interface TabLimitAlertProps {
  showLimitAlert: boolean;
  setShowLimitAlert: (show: boolean) => void;
  handleClearAllTabs: () => void;
  confirmClearActive: boolean;
  setConfirmClearActive: (active: boolean) => void;
}

export default function TabLimitAlert({
  showLimitAlert, setShowLimitAlert, handleClearAllTabs,
  confirmClearActive, setConfirmClearActive,
}: TabLimitAlertProps) {
  return (
    <AnimatePresence>
      {showLimitAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="p-6 max-w-sm w-full bg-white dark:bg-gray-900 border border-red-500/15 rounded-3xl text-center space-y-4"
          >
            <div className="inline-flex p-3 rounded-full bg-red-100 text-rose-600 dark:bg-rose-950/20">
              <AlertTriangle className="w-10 h-10 animate-bounce" />
            </div>
            <h4 className="text-sm font-black text-gray-900 dark:text-white">
              ظرفیت تب‌های مرکز کار پر شده است!
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-sans font-medium">
              نرم‌افزار یکپارچهٔ آموزشی نیکا (ویژه دانشگاه علم و هنر) حداکثر مجهز به <strong>{MAX_TABS} تب باز همزمان</strong> را مجاز می‌شناسد. لطفاً جهت باز کردن بخش جدید علمی، ابتدا یکی از تب‌های غیرضروری را به کمک کلید ضربدر ببندید.
            </p>

            <div className="pt-3 border-t border-red-500/10 dark:border-red-500/5 space-y-2">
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold leading-relaxed">
                ⚠️ هشدار: در صورت نیاز به بازنشانی کلِ فضای کار، می‌توانید تمامی تب‌های باز خود را فِرِش و تصفیه نمایید.
              </p>
              <button
                onClick={handleClearAllTabs}
                className={`w-full py-2.5 px-3 rounded-xl border text-[11px] font-black transition-all cursor-pointer ${confirmClearActive
                    ? 'bg-red-600 border-red-600 text-white animate-pulse'
                    : 'border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20'
                  }`}
              >
                <Trash2 className="w-3.5 h-3.5 inline-block ml-1 -mt-0.5" />
                {confirmClearActive ? 'بله، تایید نهایی و پاک‌سازی کامل' : 'بستن و پاکسازی کل تب‌های فعال'}
              </button>
              {confirmClearActive && (
                <p className="text-[9px] text-rose-500 dark:text-rose-400 font-bold animate-pulse">
                  با کلیک مجدد، کل تب‌های جاری شما بسته خواهند شد!
                </p>
              )}
            </div>

            <button
              onClick={() => {
                setShowLimitAlert(false);
                setConfirmClearActive(false);
              }}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer"
            >
              متوجه شدم (بازگشت)
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
