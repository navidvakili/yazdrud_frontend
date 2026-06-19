// ============================================================
// CourseCoursework — دروس و برنامه هفتگی
// ============================================================

import { motion } from 'motion/react';
import { BookMarked } from 'lucide-react';

export default function CourseCoursework() {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white">دروس و برنامه هفتگی</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">مشاهده برنامه درسی و واحدهای ثبت‌شده</p>
          </div>
        </div>
        <div className="text-center py-12 text-gray-400">
          <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">ماژول دروس و برنامه</p>
          <p className="text-[11px] mt-1">این بخش در حال توسعه است و به زودی تکمیل می‌شود.</p>
        </div>
      </motion.div>
    </div>
  );
}
