import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  GripVertical,
  MapPin,
  Phone,
  Printer,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { NavigationItem } from './types';
import { getFooterAddressDetailRows } from './footerAddressUtils';

interface FooterAddressTreeItemProps {
  item: NavigationItem;
  onEdit: (item: NavigationItem) => void;
  onDelete: (itemId: string, itemTitle?: string) => void;
  onDuplicate: (item: NavigationItem) => void;
  onToggleStatus: (itemId: string) => void;
  onMoveUp: (itemId: string) => void;
  onMoveDown: (itemId: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

const DetailIcon: React.FC<{ name: 'MapPin' | 'Phone' | 'Printer' | 'ExternalLink' }> = ({ name }) => {
  const cls = 'w-3.5 h-3.5 shrink-0';
  switch (name) {
    case 'Phone':
      return <Phone className={`${cls} text-emerald-500`} />;
    case 'Printer':
      return <Printer className={`${cls} text-slate-400`} />;
    case 'ExternalLink':
      return <ExternalLink className={`${cls} text-blue-500`} />;
    default:
      return <MapPin className={`${cls} text-blue-500`} />;
  }
};

export const FooterAddressTreeItem: React.FC<FooterAddressTreeItemProps> = ({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  const detailRows = getFooterAddressDetailRows(item);

  return (
    <div className="space-y-2 text-xs font-sans">
      <div className={`p-3.5 rounded-2xl border transition-all ${item.status === 'active' ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-[240px]">
            <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
            <button onClick={() => onToggleStatus(item.id)} className="p-1 text-slate-400 hover:text-teal-600" title={item.status === 'active' ? 'غیرفعال‌سازی' : 'فعال‌سازی'}>
              {item.status === 'active' ? (<CheckCircle className="w-4 h-4 text-emerald-500" />) : (<XCircle className="w-4 h-4 text-slate-400" />)}
            </button>
            <div className="w-8 h-8 rounded-xl bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 dark:text-white">{item.title}</div>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">بلوک فوتر</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
              <button onClick={() => onMoveUp(item.id)} disabled={isFirst} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => onMoveDown(item.id)} disabled={isLast} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
            </div>
            <button onClick={() => onDuplicate(item)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700" title="تکثیر"><Copy className="w-3.5 h-3.5" /></button>
            <button onClick={() => onEdit(item)} className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700" title="ویرایش بلوک"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => onDelete(item.id, item.title)} className="p-1.5 rounded-xl text-slate-400 hover:text-red-600" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {detailRows.length > 0 && (
          <div className="mt-3 mr-10 space-y-1.5 border-r-2 border-blue-200 dark:border-blue-800 pr-3">
            {detailRows.map(row => (
              <div key={row.id} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <DetailIcon name={row.icon} />
                <span className="font-bold text-slate-500 shrink-0">{row.label}:</span>
                {row.isLink && row.href ? (
                  <a href={row.href} onClick={e => e.preventDefault()} className="text-blue-600 dark:text-blue-400 hover:underline font-mono dir-ltr text-left">
                    {row.value}
                    <span className="text-slate-400 font-normal mr-1">({row.href})</span>
                  </a>
                ) : (
                  <span className={row.href ? 'dir-ltr text-left font-mono' : ''}>{row.value}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
