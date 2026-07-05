// ============================================================
// ThemeToggle — دکمه تغییر تم
// ============================================================

import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="w-11 h-11 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850 flex items-center justify-center transition-all cursor-pointer"
      title={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
