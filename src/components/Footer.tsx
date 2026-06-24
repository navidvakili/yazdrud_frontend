// ============================================================
// Footer — فوتر پایین پورتال
// ============================================================

import { User } from 'lucide-react';
import type { User as UserType } from '@/src/types';

interface FooterProps {
  user: UserType | null;
}

export default function Footer({ user }: FooterProps) {
  return (
    <footer className="h-7 bg-[#fcfcfd] dark:bg-[#111113] border-t border-gray-100 dark:border-white/5 flex items-center justify-between px-6 shrink-0 select-none transition-colors">
      <div className="flex items-center gap-4">
        <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold flex items-center gap-1.5 transition-colors">
          <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></span>
          وضعیت شبکه: فعال و بهینه (Online)
        </span>
        <a
          href="https://karanet.info"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-gray-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        >
          برنامه نویس و توسعه دهنده توسط شرکت فناوری اطلاعات
        </a>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[9px] text-gray-300 dark:text-slate-600 ">API: Connected</span>
        {user && (
          <span className="text-[9px] text-gray-300 dark:text-slate-600 flex items-center gap-1">
            <User className="w-3 h-3" />
            {user.fname} {user.lname}
          </span>
        )}
      </div>
    </footer>
  );
}
