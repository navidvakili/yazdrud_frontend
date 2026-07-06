// ============================================================
// StudentManagement — مدیریت دانشجویان
// ============================================================

import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Users, Filter } from 'lucide-react';

export default function StudentManagement() {
  const [query, setQuery] = useState('');

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white">مدیریت دانشجویان</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">جستجو و مدیریت اطلاعات دانشجویان</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی دانشجو بر اساس نام، شماره دانشجویی یا کد ملی..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="text-center py-12 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">ماژول مدیریت دانشجویان</p>
          <p className="text-[11px] mt-1">این بخش در حال توسعه است و به زودی تکمیل می‌شود.</p>
        </div>
      </motion.div>
    </div>
  );
}
