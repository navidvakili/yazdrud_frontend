// ============================================================
// LogoutModal — مودال تأیید خروج از حساب
// ============================================================

import { LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LogoutModalProps {
  showLogoutModal: boolean;
  setShowLogoutModal: (show: boolean) => void;
  handleLogout: () => void;
}

export default function LogoutModal({ showLogoutModal, setShowLogoutModal, handleLogout }: LogoutModalProps) {
  return (
    <AnimatePresence>
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="p-6 max-w-sm w-full bg-white dark:bg-gray-900 border border-red-500/15 rounded-3xl text-center space-y-4"
          >
            <div className="inline-flex p-3 rounded-full bg-red-100 text-rose-600 dark:bg-rose-950/20">
              <LogOut className="w-10 h-10" />
            </div>
            <h4 className="text-sm font-black text-gray-900 dark:text-white">
              خروج از حساب کاربری
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-sans font-medium">
              آیا مایل به خروج از حساب کاربری نرم‌افزار یکپارچهٔ آموزشی <span className="text-teal-600 dark:text-teal-400">نیکا</span> هستید؟
            </p>

            <div className="pt-3 border-t border-red-500/10 dark:border-red-500/5 space-y-2">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-black transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 inline-block ml-1 -mt-0.5" />
                بله، خارج شو
              </button>
            </div>

            <button
              onClick={() => setShowLogoutModal(false)}
              className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs cursor-pointer"
            >
              انصراف (بازگشت)
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
