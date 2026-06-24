// ============================================================
// Sidebar — نوار کناری شامل منوهای دسته‌بندی و زیرمنوها
// ============================================================

import { useState } from 'react';
import { Search, ChevronLeft, Plus } from 'lucide-react';
import type { Tab } from '@/src/types';
import type { MenuCategory } from '@/src/lib/menuConfig';

interface SidebarProps {
  menuCategories: MenuCategory[];
  selectedMainCat: string | null;
  setSelectedMainCat: (key: string | null) => void;
  navLoading: boolean;
  handleOpenTab: (id: string, title: string, iconName: string, forceNewInstance?: boolean) => void;
  tabs: Tab[];
  activeTabId: string | null;
}

export default function Sidebar({
  menuCategories, selectedMainCat, setSelectedMainCat, navLoading,
  handleOpenTab, tabs, activeTabId,
}: SidebarProps) {
  const [drawerSubmenuFilter, setDrawerSubmenuFilter] = useState('');
  const filteredCategories = menuCategories;

  return (
    <div className="border-l border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 flex h-full z-45">
      {/* Narrow bar */}
      <div className="w-24 flex flex-col justify-between items-center py-4 border-l border-gray-50 dark:border-gray-850 shrink-0 select-none h-full overflow-y-auto custom-scrollbar">
        <div className="w-full px-1 flex flex-col items-center">
          {navLoading && filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center gap-2 pt-6">
              <div className="w-5 h-5 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
              <span className="text-[9px] text-gray-400">بارگذاری...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <span className="text-[9px] text-gray-400 pt-6 text-center px-1">منویی یافت نشد</span>
          ) : (
            filteredCategories.map((cat) => {
              const isSelected = selectedMainCat === cat.key;
              const CatIcon = cat.icon;
              const hasSubmenus = cat.submenus.length > 0;
              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    if (hasSubmenus) {
                      setSelectedMainCat(isSelected ? null : cat.key);
                    } else if (cat.targetId) {
                      setSelectedMainCat(null);
                      handleOpenTab(cat.targetId, cat.title, cat.iconName || 'Folder');
                    }
                  }}
                  className={`w-20 h-18 rounded-xl transition-all duration-300 hover:scale-105 flex flex-col gap-1.5 items-center justify-center cursor-pointer p-1.5 ${
                    isSelected
                      ? 'bg-teal-500 text-white shadow-md shadow-teal-500/10'
                      : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850'
                  }`}
                >
                  <CatIcon className="w-5 h-5 shrink-0" />
                  <span className="text-[9px] font-black leading-none text-center block whitespace-normal break-words max-w-[72px]">
                    {cat.title}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Submenu drawer */}
      {selectedMainCat && (() => {
        const selectedCat = filteredCategories.find(c => c.key === selectedMainCat);
        if (!selectedCat || selectedCat.submenus.length === 0) return null;
        return (
          <div className="overflow-hidden h-full flex flex-col bg-gray-50/50 dark:bg-gray-950/20 w-[210px]">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between whitespace-nowrap">
              <span className="text-xs font-black text-gray-800 dark:text-gray-200">
                {filteredCategories.find(c => c.key === selectedMainCat)?.title}
              </span>
              <button onClick={() => setSelectedMainCat(null)} className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2.5 border-b border-gray-150/40 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/10">
              <div className="relative">
                <input
                  type="text"
                  placeholder="فیلتر گزینه‌های منو..."
                  value={drawerSubmenuFilter}
                  onChange={(e) => setDrawerSubmenuFilter(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-right pr-8 pl-3 py-1.5 text-[10px] rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-sans"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5" />
              </div>
            </div>
            <div className="p-2 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
              {(() => {
                const matchedSubs = (filteredCategories.find(c => c.key === selectedMainCat)?.submenus || [])
                  .filter(sub => !drawerSubmenuFilter || sub.label.includes(drawerSubmenuFilter) || sub.title.includes(drawerSubmenuFilter));
                if (matchedSubs.length === 0) {
                  return <div className="text-center py-6 text-[10px] text-gray-400 font-sans">موردی پیدا نشد</div>;
                }
                return matchedSubs.map((sub, sidx) => {
                  const isTabOpen = tabs.some(t => t.id === sub.targetId || t.moduleType === sub.targetId);
                  const isTabActive = activeTabId === sub.targetId || (tabs.find(t => t.id === activeTabId)?.moduleType === sub.targetId);
                  return (
                    <div key={sidx} className="group/item flex items-center justify-between w-full hover:bg-gray-200/50 dark:hover:bg-gray-850/50 rounded-lg pr-2 pl-1 select-none transition-all duration-150">
                      <button
                        onClick={() => handleOpenTab(sub.targetId, sub.title, sub.iconName)}
                        className={`flex-1 text-right py-2 rounded text-[11px] leading-relaxed transition-all whitespace-normal cursor-pointer ${
                          isTabActive ? 'text-teal-700 dark:text-teal-400 font-black' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-250'
                        }`}
                      >
                        <span>{sub.label}</span>
                        {isTabOpen && <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-500 mr-2 align-middle" title="دارای تب باز"></span>}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenTab(sub.targetId, sub.title, sub.iconName, true); }}
                        title="باز کردن یک تب مجزای جدید"
                        className="p-1 rounded bg-teal-500/10 hover:bg-teal-500 hover:text-white text-teal-600 dark:text-teal-400 opacity-0 group-hover/item:opacity-100 transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 w-5 h-5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
