// ============================================================
// FinancialManagement — امور مالی
// ============================================================

import { motion } from 'motion/react';
import { DollarSign } from 'lucide-react';

export default function FinancialManagement() {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white">امور مالی</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">مشاهده فاکتورها، تراکنش‌ها و شهریه</p>
          </div>
        </div>
        <div className="text-center py-12 text-gray-400">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">ماژول امور مالی</p>
          <p className="text-[11px] mt-1">این بخش در حال توسعه است و به زودی تکمیل می‌شود.</p>
        </div>
      </motion.div>
    </div>
  );
}
