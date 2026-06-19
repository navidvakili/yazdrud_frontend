// ============================================================
// ThesisManagement — مدیریت پایان‌نامه‌ها
// ============================================================

import { motion } from 'motion/react';
import { FileText } from 'lucide-react';

interface ThesisManagementProps {
  userRole: string;
  initialView?: string;
}

export default function ThesisManagement({ userRole, initialView }: ThesisManagementProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white">مدیریت پایان‌نامه‌ها</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">ثبت و پیگیری پایان‌نامه و رساله</p>
          </div>
        </div>
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">ماژول پایان‌نامه‌ها</p>
          <p className="text-[11px] mt-1">این بخش در حال توسعه است و به زودی تکمیل می‌شود.</p>
        </div>
      </motion.div>
    </div>
  );
}
