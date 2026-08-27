import React from 'react';
import {
  HardDrive,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Clock,
  FolderOpen,
  ArrowLeft
} from 'lucide-react';
import { GalleryAsset, formatBytes, formatDate } from './types';

interface DamDashboardProps {
  assets: GalleryAsset[];
  onSelectAsset: (assetId: string) => void;
}

export const DamDashboard: React.FC<DamDashboardProps> = ({ assets, onSelectAsset }) => {
  // Stats calculations
  const totalAssets = assets.length;
  const totalSizeBytes = assets.reduce((acc, a) => acc + (a.size || 0), 0);

  const imageAssets = assets.filter((a) => a.fileType === 'image');
  const videoAssets = assets.filter((a) => a.fileType === 'video');
  const audioAssets = assets.filter((a) => a.fileType === 'audio');
  const docAssets = assets.filter((a) => a.fileType === 'document');

  // Newest files by created_at (fallback to name sort when equal)
  const newestAssets = [...assets]
    .sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 5);

  return (
    <div className="space-y-6 text-right rtl">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold opacity-80">کل دارایی‌های دیجیتال</span>
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black">{totalAssets} فایل</div>
          <p className="text-[11px] opacity-90">مجموع حجم: {formatBytes(totalSizeBytes)}</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-teal-600 dark:text-teal-400">
            <span className="text-xs font-bold">تصاویر</span>
            <ImageIcon className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {imageAssets.length}
          </div>
          <p className="text-[11px] text-slate-400">فایل گرافیکی</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-xs font-bold">ویدیوها</span>
            <Video className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {videoAssets.length}
          </div>
          <p className="text-[11px] text-slate-400">فایل ویدیویی</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-bold">صداها</span>
            <Music className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {audioAssets.length}
          </div>
          <p className="text-[11px] text-slate-400">فایل صوتی</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-sky-600 dark:text-sky-400">
            <span className="text-xs font-bold">اسناد</span>
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {docAssets.length}
          </div>
          <p className="text-[11px] text-slate-400">PDF و فایل‌های متنی</p>
        </div>
      </div>

      {/* Newest Assets */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
          <Clock className="w-4 h-4 text-teal-500" />
          <span>جدیدترین فایل‌های بارگذاری‌شده</span>
        </div>

        {newestAssets.length > 0 ? (
          <div className="space-y-2">
            {newestAssets.map((ast) => (
              <div
                key={ast.id}
                onClick={() => onSelectAsset(ast.id)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 hover:border-teal-500 flex items-center justify-between text-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {ast.fileType === 'image' ? (
                      <img
                        src={ast.url}
                        alt={ast.name}
                        className="w-full h-full object-cover"
                      />
                    ) : ast.fileType === 'video' ? (
                      <Video className="w-5 h-5 text-indigo-400" />
                    ) : ast.fileType === 'audio' ? (
                      <Music className="w-5 h-5 text-amber-400" />
                    ) : (
                      <FileText className="w-5 h-5 text-sky-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400">
                      {ast.name}
                    </h5>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(ast.created_at)} • {ast.sizeFormatted}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1 shrink-0">
                  مشاهده جزئیات
                  <ArrowLeft className="w-3.5 h-3.5" />
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 flex items-center justify-center gap-2">
            <FolderOpen className="w-5 h-5" />
            <span>هنوز فایلی بارگذاری نشده است.</span>
          </div>
        )}
      </div>
    </div>
  );
};
