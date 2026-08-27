import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Copy,
  Plus,
  Layers,
  Sparkles,
  Shield,
  Calendar,
  Move,
  GripVertical,
  CheckCircle,
  XCircle,
  CornerDownLeft,
  ArrowRight,
  ArrowLeft,
  LayoutGrid,
  ExternalLink
} from 'lucide-react';
import { NavigationItem } from './types';

interface NavigationTreeItemProps {
  item: NavigationItem;
  level: number;
  onEdit: (item: NavigationItem) => void;
  onEditMegaMenu: (item: NavigationItem) => void;
  onDelete: (itemId: string, itemTitle?: string) => void;
  onDuplicate: (item: NavigationItem) => void;
  onAddChild: (parentId: string) => void;
  onToggleStatus: (itemId: string) => void;
  onMoveUp: (itemId: string) => void;
  onMoveDown: (itemId: string) => void;
  onIndent: (itemId: string) => void;
  onOutdent: (itemId: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

export const NavigationTreeItem: React.FC<NavigationTreeItemProps> = ({
  item,
  level,
  onEdit,
  onEditMegaMenu,
  onDelete,
  onDuplicate,
  onAddChild,
  onToggleStatus,
  onMoveUp,
  onMoveDown,
  onIndent,
  onOutdent,
  isFirst,
  isLast
}) => {
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="space-y-2 text-xs font-sans">
      {/* Main Row */}
      <div
        className={`p-3.5 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
          item.status === 'active'
            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-300 dark:hover:border-teal-700'
            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
        }`}
        style={{ marginRight: `${level * 24}px` }}
      >
        {/* Left Side (RTL Right): Indent Marker, Title & Info */}
        <div className="flex items-center gap-2.5 min-w-[240px]">
          {level > 0 && (
            <div className="text-slate-400 flex items-center">
              <CornerDownLeft className="w-4 h-4 text-slate-300" />
            </div>
          )}

          {/* Grip / Reorder Icon */}
          <div className="text-slate-300 dark:text-slate-600 cursor-grab">
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Item Status Toggle Icon */}
          <button
            onClick={() => onToggleStatus(item.id)}
            className="p-1 text-slate-400 hover:text-teal-600 transition-colors"
            title={item.status === 'active' ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
          >
            {item.status === 'active' ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : (
              <XCircle className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Title & Path */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                {item.title}
              </span>

              {item.titleEn && (
                <span className="text-[10px] text-slate-400 dir-ltr font-mono">
                  ({item.titleEn})
                </span>
              )}

              {/* Badge if present */}
              {item.settings?.badge?.enabled && (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-300">
                  {item.settings?.badge?.text}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
              <span className="font-mono dir-ltr">{item.targetUrl}</span>

              {item.itemType === 'external' && (
                <span className="text-amber-500 font-bold flex items-center gap-0.5">
                  <ExternalLink className="w-3 h-3" /> خارجی
                </span>
              )}

              {item.internalSource && (
                <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {item.internalSource}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Display Mode & Meta Pills */}
        <div className="flex items-center gap-2">
          {/* Display Mode Pill */}
          <span
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 ${
              item.displayType === 'mega_menu'
                ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                : item.displayType === 'dropdown'
                ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {item.displayType === 'mega_menu' ? (
              <>
                <LayoutGrid className="w-3 h-3 text-purple-600" /> مگا منو
              </>
            ) : item.displayType === 'dropdown' ? (
              <>
                <Layers className="w-3 h-3 text-blue-600" /> کشویی (Dropdown)
              </>
            ) : (
              'منوی ساده'
            )}
          </span>

          {/* Mega Menu Builder Quick Button if mega_menu */}
          {item.displayType === 'mega_menu' && (
            <button
              onClick={() => onEditMegaMenu(item)}
              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow transition-all"
            >
              <Sparkles className="w-3 h-3" /> طراح مگا منو
            </button>
          )}

          {/* Access Rules Indicator */}
          <div
            className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"
            title={`نقش‌های مجاز: ${item.settings?.accessRules?.join ? item.settings.accessRules.join(', ') : ''}`}
          >
            <Shield className="w-3.5 h-3.5 text-teal-600" />
          </div>
        </div>

        {/* Right Side: Reordering & Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Hierarchy Reorder (Up/Down) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => onMoveUp(item.id)}
              disabled={isFirst}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-30"
              title="انتقال به بالا"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onMoveDown(item.id)}
              disabled={isLast}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-30"
              title="انتقال به پایین"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Indent / Change Parent */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => onOutdent(item.id)}
              disabled={level === 0}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-30"
              title="کاهش عمق (انتقال به سطح بالاتر)"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onIndent(item.id)}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
              title="افزایش عمق (زیرمجموعه کردن)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Child */}
          <button
            onClick={() => onAddChild(item.id)}
            className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 transition-colors"
            title="افزودن زیرمنو"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Duplicate */}
          <button
            onClick={() => onDuplicate(item)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="تکثیر آیتم"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Edit Item Settings */}
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
            title="ویرایش تنظیمات آیتم"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Delete Item */}
          <button
            onClick={() => onDelete(item.id, item.title)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="حذف آیتم"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Render Recursive Child Submenus */}
      {hasChildren && (
        <div className="space-y-2">
          {item.children!.map((child, cIdx) => (
            <NavigationTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              onEdit={onEdit}
              onEditMegaMenu={onEditMegaMenu}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onAddChild={onAddChild}
              onToggleStatus={onToggleStatus}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onIndent={onIndent}
              onOutdent={onOutdent}
              isFirst={cIdx === 0}
              isLast={cIdx === item.children!.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
