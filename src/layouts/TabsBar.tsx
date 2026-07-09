// ============================================================
// TabsBar — نوار تب‌های بالای فضای کاری
// ============================================================

import { LayoutDashboard, X, Pin, PinOff, RefreshCw } from 'lucide-react';
import type { Tab } from '@/src/layouts/types';

interface TabsBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  setActiveTabId: (id: string | null) => void;
  handleRefreshTab: () => void;
  handleCloseTab: (id: string, e: React.MouseEvent) => void;
  pinnedMenus: string[];
  handlePinMenu: (menuId: string) => void;
  handleUnpinMenu: (menuId: string) => void;
}

export default function TabsBar({
  tabs, activeTabId, setActiveTabId, handleRefreshTab, handleCloseTab,
  pinnedMenus, handlePinMenu, handleUnpinMenu,
}: TabsBarProps) {
  return (
    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 select-none flex items-center gap-1.5 overflow-x-auto min-h-[46px]">

      {/* ===== RIGHT SIDE: همه تب‌ها (پیشخوان + تب‌های باز) ===== */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto touch-pan-x">
        {/* Dashboard tab */}
        <button
          onClick={() => setActiveTabId(null)}
          className={`px-3 py-1.5 rounded-xl border text-[11px] font-black cursor-pointer transition-all duration-205 flex items-center gap-1.5 shrink-0 ${
            activeTabId === null
              ? 'bg-teal-500 hover:bg-teal-700 text-white border-teal-500 shadow-sm font-black'
              : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 border-gray-200/60 dark:border-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>پیشخوان اصلی</span>
        </button>

        {/* Separator between dashboard and open tabs */}
        {tabs.length > 0 && (
          <div className="h-5 w-[1px] bg-gray-200 dark:bg-gray-750 shrink-0 mx-1.5"></div>
        )}

        {/* Open tabs */}
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-slate-100 hover:bg-slate-200 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20'
                  : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 border-gray-200/60 dark:border-gray-700 text-gray-650 dark:text-gray-400'
              }`}
            >
              <span>{tab.title}</span>
              <button
                onClick={(e) => handleCloseTab(tab.id, e)}
                className={`p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 shrink-0 cursor-pointer ${
                  isActive ? 'text-teal-700 dark:text-teal-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Separator between action buttons and tabs */}
      {(tabs.length > 0 && activeTabId) && (
        <div className="h-5 w-[1px] bg-gray-200 dark:bg-gray-750 shrink-0 mx-1.5"></div>
      )}

      {/* ===== LEFT SIDE: فقط دکمه‌های Pin و Refresh ===== */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Pin/Unpin button */}
        {tabs.length > 0 && activeTabId && (() => {
          const activeTab = tabs.find(t => t.id === activeTabId);
          const activeModuleType = activeTab?.moduleType || null;
          const isPinned = activeModuleType ? pinnedMenus.includes(activeModuleType) : false;
          const handleTogglePin = async () => {
            if (!activeModuleType) return;
            if (isPinned) {
              await handleUnpinMenu(activeModuleType);
            } else {
              await handlePinMenu(activeModuleType);
            }
          };
          return (
            <button
              onClick={handleTogglePin}
              className={`h-7 w-7 rounded-lg border shrink-0 cursor-pointer transition-all flex items-center justify-center ${
                isPinned
                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20'
                  : 'border-gray-200/60 dark:border-gray-700 bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
              title={isPinned ? 'لغو پین' : 'پین به داشبورد'}
            >
              {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
          );
        })()}

        {/* Refresh button */}
        {tabs.length > 0 && activeTabId && (
          <button
            onClick={handleRefreshTab}
            className="h-7 w-7 rounded-lg border border-gray-200/60 dark:border-gray-700 bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-all"
            title="رفرش تب فعال"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
