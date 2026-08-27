// ============================================================
// GalleryApp — مدیریت دارایی‌های دیجیتال (DAM)
// متصل به وب‌سرویس رسانه (Media Manager) + پوشه‌های مجازی
// ============================================================

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Search,
  Grid,
  List,
  Trash2,
  Download,
  Eye,
  HardDrive,
  CheckSquare,
  Square,
  X,
  Edit,
  PieChart,
  RefreshCw,
  AlertCircle,
  Upload,
  Loader2,
  Building2
} from 'lucide-react';
import {
  GalleryAsset,
  Folder as FolderType,
  DamFilterState,
  MediaType,
  MediaFile,
  formatBytes,
  formatDate,
  toGalleryAsset
} from './types';
import {
  fetchAllMedia,
  fetchFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  deleteMediaFile,
  moveMediaFile,
  folderToTreeItem
} from './api';
import { AssetDetailsDrawer } from './AssetDetailsDrawer';
import { ImageEditorModal } from './ImageEditorModal';
import { VideoEditorModal } from './VideoEditorModal';
import { AudioEditorModal } from './audio/AudioEditorModal';
import { PdfEditorModal } from './pdf/PdfEditorModal';
import { isPdfName } from './pdf/pdfEngine';
import { UploadModal } from './UploadModal';
import { LightboxModal } from './LightboxModal';
import { DamDashboard } from './DamDashboard';
import { ConfirmDialog } from '@/src/shared-components/ConfirmDialog';

interface DigitalAssetManagementProps {
  user?: any;
  activeTabId?: string;
  moduleId?: string;
  onOpenTab?: (id: string, title: string, iconName: string) => void;
}

const TYPE_LABELS: Record<MediaType, string> = {
  image: 'تصویر',
  video: 'ویدیو',
  audio: 'صدا',
  document: 'سند',
  '3d': 'سه‌بعدی',
  embed: 'جاسازی'
};

/** آیا برای این فایل ویرایشگری وجود دارد؟ (تصویر/ویدیو/صدا/پی‌دی‌اف) */
const canEditAsset = (asset: GalleryAsset): boolean =>
  asset.fileType === 'image' ||
  asset.fileType === 'video' ||
  asset.fileType === 'audio' ||
  (asset.fileType === 'document' && isPdfName(asset.name));

const editTitleFor = (asset: GalleryAsset): string => {
  if (asset.fileType === 'video') return 'ویرایش ویدئو';
  if (asset.fileType === 'audio') return 'ویرایش صدا';
  if (asset.fileType === 'document' && isPdfName(asset.name)) return 'ویرایش پی‌دی‌اف';
  return 'ویرایش تصویر';
};

export default function DigitalAssetManagement({ onOpenTab }: DigitalAssetManagementProps) {
  // ---- داده‌های وب‌سرویس رسانه ----
  const [assets, setAssets] = useState<GalleryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const loadSeqRef = useRef(0);

  // Active View Tab: 'library' or 'analytics' or 'dedicated-pages'
  const [activeStudioTab, setActiveStudioTab] = useState<'library' | 'analytics' | 'dedicated-pages'>('library');

  // Filter state
  const [filters, setFilters] = useState<DamFilterState>({
    searchQuery: '',
    folderId: null,
    fileType: 'all',
    sortBy: 'date-desc',
    viewMode: 'grid'
  });

  // Bulk Selection
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Modals & Drawers
  const [selectedAssetForDrawer, setSelectedAssetForDrawer] = useState<GalleryAsset | null>(null);
  const [assetToEdit, setAssetToEdit] = useState<GalleryAsset | null>(null);
  const [videoToEdit, setVideoToEdit] = useState<GalleryAsset | null>(null);
  const [audioToEdit, setAudioToEdit] = useState<GalleryAsset | null>(null);
  const [pdfToEdit, setPdfToEdit] = useState<GalleryAsset | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [lightboxInitialId, setLightboxInitialId] = useState<string | null>(null);

  // New Folder Modal
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderActionError, setFolderActionError] = useState<string | null>(null);

  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: 'asset'; asset: GalleryAsset }
    | { kind: 'bulk'; count: number }
    | { kind: 'folder'; folder: FolderType }
    | null
  >(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ===================== Loading (همان سرویس MediaManager) =====================
  const loadAll = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const [files, folderResp] = await Promise.all([fetchAllMedia(), fetchFolders()]);
      if (seq !== loadSeqRef.current) return;
      setAssets(files.map(toGalleryAsset));
      const dtos = folderResp.data || [];
      setFolders(dtos.map(folderToTreeItem));
    } catch (e: any) {
      if (seq !== loadSeqRef.current) return;
      setLoadError(e?.message || 'خطا در بارگذاری رسانه‌ها. لطفاً دوباره تلاش کنید.');
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ===================== فایل‌های متعلق به صفحات اختصاصی (انجمن علمی/کانون/تشکل/نشریه) =====================
  const dedicatedPageFolders = useMemo(
    () => folders.filter((f) => f.dedicatedPageId != null),
    [folders]
  );

  const dedicatedPageFolderIdSet = useMemo(
    () => new Set(dedicatedPageFolders.map((f) => f.id)),
    [dedicatedPageFolders]
  );

  // پوشهٔ ریشهٔ «صفحات اختصاصی» هم به همراه زیرپوشه‌های هر صفحه — پیش‌فرض از سایدبار/فهرست کلی پنهان است
  const dedicatedPageHiddenFolderIds = useMemo(() => {
    const ids = new Set(dedicatedPageFolderIdSet);
    dedicatedPageFolders.forEach((f) => {
      if (f.parentId) ids.add(f.parentId);
    });
    return ids;
  }, [dedicatedPageFolders, dedicatedPageFolderIdSet]);

  // نمایش پوشه‌های صفحات اختصاصی در سایدبار کتابخانهٔ رسانه — پیش‌فرض خاموش
  const [showDedicatedPageFolders, setShowDedicatedPageFolders] = useState(false);

  // ===================== Filtering =====================
  const filteredAssets = useMemo(() => {
    const q = filters.searchQuery.trim().toLowerCase();
    return assets
      .filter((asset) => {
        if (filters.folderId) {
          const fid = Number(filters.folderId);
          const inAnyGroup =
            (asset.folder_ids || []).includes(fid) || String(asset.folder_id ?? '') === String(fid);
          if (!inAnyGroup) return false;
        } else if (!showDedicatedPageFolders && dedicatedPageFolderIdSet.size > 0) {
          // پیش‌فرض: فایل‌های صفحات اختصاصی در فهرست بدون فیلتر نمایش داده نشود
          const ids = asset.folder_ids && asset.folder_ids.length > 0
            ? asset.folder_ids
            : asset.folder_id != null
              ? [asset.folder_id]
              : [];
          if (ids.some((id) => dedicatedPageFolderIdSet.has(String(id)))) return false;
        }
        if (filters.fileType !== 'all' && asset.fileType !== filters.fileType) return false;
        if (q && !asset.name.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'date-desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (filters.sortBy === 'date-asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (filters.sortBy === 'name-asc') return a.name.localeCompare(b.name, 'fa');
        if (filters.sortBy === 'size-desc') return b.size - a.size;
        return 0;
      });
  }, [assets, filters, showDedicatedPageFolders, dedicatedPageFolderIdSet]);

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of assets) {
      const ids = a.folder_ids && a.folder_ids.length > 0
        ? a.folder_ids
        : a.folder_id != null
          ? [a.folder_id]
          : [];
      for (const id of ids) {
        counts[String(id)] = (counts[String(id)] || 0) + 1;
      }
    }
    return counts;
  }, [assets]);

  const totalSizeBytes = useMemo(() => assets.reduce((acc, a) => acc + (a.size || 0), 0), [assets]);

  const dedicatedPageGroups = useMemo(() => {
    if (dedicatedPageFolders.length === 0) return [];
    const folderIds = new Set(dedicatedPageFolders.map((f) => f.id));
    return dedicatedPageFolders
      .map((folder) => {
        const fid = Number(folder.id);
        const items = assets.filter((a) => {
          const ids = a.folder_ids && a.folder_ids.length > 0 ? a.folder_ids : a.folder_id != null ? [a.folder_id] : [];
          return ids.some((id) => String(id) === folder.id) || String(a.folder_id ?? '') === folder.id;
        });
        return { folder, assets: items };
      })
      .filter((g) => g.assets.length > 0 || folderIds.has(g.folder.id));
  }, [dedicatedPageFolders, assets]);

  const dedicatedPagesTotalCount = useMemo(
    () => dedicatedPageGroups.reduce((sum, g) => sum + g.assets.length, 0),
    [dedicatedPageGroups]
  );

  // ===================== Bulk Selection =====================
  const handleToggleSelectAsset = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedAssetIds.length === filteredAssets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(filteredAssets.map((a) => a.id));
    }
  };

  // ===================== Delete (دائمی — هم‌خوان با MediaManager) =====================
  const requestDeleteAsset = (asset: GalleryAsset) => {
    setDeleteError(null);
    setDeleteTarget({ kind: 'asset', asset });
  };

  const requestBulkDelete = () => {
    if (!selectedAssetIds.length) return;
    setDeleteError(null);
    setDeleteTarget({ kind: 'bulk', count: selectedAssetIds.length });
  };

  const requestDeleteFolder = (folder: FolderType) => {
    setDeleteError(null);
    setDeleteTarget({ kind: 'folder', folder });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      if (deleteTarget.kind === 'asset') {
        const asset = deleteTarget.asset;
        await deleteMediaFile(asset);
        setAssets((prev) => prev.filter((a) => a.id !== asset.id));
        if (selectedAssetForDrawer?.id === asset.id) setSelectedAssetForDrawer(null);
      } else if (deleteTarget.kind === 'bulk') {
        const ids = selectedAssetIds;
        for (const t of assets) {
          if (ids.includes(t.id)) {
            try {
              await deleteMediaFile(t);
            } catch {
              /* ادامه بده */
            }
          }
        }
        setAssets((prev) => prev.filter((a) => !ids.includes(a.id)));
        setSelectedAssetIds([]);
      } else {
        const folder = deleteTarget.folder;
        await deleteFolder(Number(folder.id));
        setFolders((prev) => prev.filter((f) => f.id !== folder.id));
        if (filters.folderId === folder.id) setFilters((f) => ({ ...f, folderId: null }));
      }
      setDeleteTarget(null);
    } catch (e: any) {
      setDeleteError(e?.message || 'خطا در حذف.');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  };

  // ===================== Register in virtual folder group(s) =====================
  const handleMoveAsset = async (asset: GalleryAsset, folderIds: number[]): Promise<boolean> => {
    try {
      const res = await moveMediaFile(asset, folderIds);
      const folderId = res.data.folder_id ?? (folderIds[0] ?? null);
      const savedIds = res.data.folder_ids && res.data.folder_ids.length > 0 ? res.data.folder_ids : folderIds;
      const patch = { folder_id: folderId, folder_ids: savedIds };
      setAssets((prev) => prev.map((a) => (a.id === asset.id ? { ...a, ...patch } : a)));
      setSelectedAssetForDrawer((prev) => (prev?.id === asset.id ? { ...prev, ...patch } : prev));
      return true;
    } catch (e: any) {
      window.alert(e?.message || 'خطا در ثبت گروه‌ها.');
      return false;
    }
  };

  // ===================== Update title / description metadata =====================
  const handleUpdateMetadata = (updated: GalleryAsset) => {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedAssetForDrawer(updated);
  };

  // ===================== Save from editor (always a NEW file) =====================
  const handleUpdateAssetFromEditor = (updated: GalleryAsset) => {
    setAssets((prev) => {
      const exists = prev.some((a) => a.id === updated.id);
      return exists
        ? prev.map((a) => (a.id === updated.id ? updated : a))
        : [updated, ...prev];
    });
    setAssetToEdit(null);
    setVideoToEdit(null);
    setAudioToEdit(null);
    setPdfToEdit(null);
  };

  // Save multiple assets (e.g. split parts) — prepends all, then closes editors
  const handleSaveManyFromEditor = (updated: GalleryAsset[]) => {
    if (!updated.length) return;
    setAssets((prev) => {
      const existing = new Set(prev.map((a) => a.id));
      return [...updated.filter((a) => !existing.has(a.id)), ...prev];
    });
    setPdfToEdit(null);
  };

  // Open the correct editor based on file type
  const handleOpenEditor = (asset: GalleryAsset) => {
    if (asset.fileType === 'video') {
      setVideoToEdit(asset);
    } else if (asset.fileType === 'audio') {
      setAudioToEdit(asset);
    } else if (asset.fileType === 'document' && /\.pdf$/i.test(asset.name)) {
      setPdfToEdit(asset);
    } else {
      setAssetToEdit(asset);
    }
  };

  const handleCloseVideoEditor = () => {
    setVideoToEdit(null);
    setAssetToEdit(null);
  };

  const handleCloseAudioEditor = () => {
    setAudioToEdit(null);
  };

  const handleAssetsUploaded = (files: MediaFile[]) => {
    setAssets((prev) => [...files.map(toGalleryAsset), ...prev]);
    setShowUploadModal(false);
  };

  // ===================== Virtual folders (web service) =====================
  const handleCreateNewFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    setFolderActionError(null);
    try {
      const res = await createFolder(name, null);
      setFolders((prev) => [...prev, folderToTreeItem(res.data)]);
      setNewFolderName('');
      setShowNewFolderModal(false);
    } catch (e: any) {
      setFolderActionError(e?.message || 'خطا در ایجاد پوشه.');
    }
  };

  const handleRenameFolder = async (folder: FolderType) => {
    const name = window.prompt('نام جدید پوشه:', folder.name);
    if (!name || !name.trim() || name.trim() === folder.name) return;
    try {
      const res = await renameFolder(Number(folder.id), name.trim());
      setFolders((prev) => prev.map((f) => (f.id === folder.id ? { ...f, name: res.data.name } : f)));
    } catch (e: any) {
      window.alert(e?.message || 'خطا در تغییر نام پوشه.');
    }
  };

  // ===================== Folder tree =====================
  const childrenOf = useCallback(
    (parentId: string | null) =>
      folders
        .filter((f) => f.parentId === parentId)
        .filter((f) => showDedicatedPageFolders || !dedicatedPageHiddenFolderIds.has(f.id))
        .sort((a, b) => a.name.localeCompare(b.name, 'fa')),
    [folders, showDedicatedPageFolders, dedicatedPageHiddenFolderIds]
  );

  const renderFolderNode = (folder: FolderType, depth: number): React.ReactElement => {
    const isSelected = filters.folderId === folder.id;
    const count = folderCounts[folder.id] || 0;
    const kids = childrenOf(folder.id);
    const isDedicatedPageFolder = folder.dedicatedPageId != null;
    const dedicatedColor = '#7c3aed';
    return (
      <div key={folder.id} className="space-y-1">
        <div
          className={`group flex items-center gap-1 rounded-xl transition-all cursor-pointer ${
            isSelected
              ? 'bg-teal-500 text-white shadow-xs'
              : isDedicatedPageFolder
                ? 'bg-violet-500/5 hover:bg-violet-500/10'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          style={{ paddingRight: depth > 0 ? depth * 12 + 4 : 4 }}
        >
          <button
            onClick={() => setFilters((f) => ({ ...f, folderId: isSelected ? null : folder.id }))}
            className="flex-1 min-w-0 flex items-center gap-2 px-2 py-2 text-xs font-bold text-right"
          >
            <Folder
              className="w-4 h-4 shrink-0"
              style={{ color: isSelected ? '#fff' : isDedicatedPageFolder ? dedicatedColor : folder.color || '#0d9488' }}
            />
            <span className={`truncate ${!isSelected && isDedicatedPageFolder ? 'text-violet-700 dark:text-violet-400' : ''}`}>
              {folder.name}
            </span>
            {isDedicatedPageFolder && (
              <Building2
                className="w-3 h-3 shrink-0"
                style={{ color: isSelected ? '#fff' : dedicatedColor }}
              />
            )}
          </button>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {count}
          </span>
          <div className="hidden group-hover:flex items-center gap-0.5 pl-1">
            <button
              onClick={() => handleRenameFolder(folder)}
              title="تغییر نام پوشه"
              className="p-1 rounded-lg hover:bg-teal-500/10 text-slate-400 hover:text-teal-600 cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => requestDeleteFolder(folder)}
              title="حذف پوشه"
              className="p-1 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {kids.length > 0 && (
          <div className="space-y-1">{kids.map((k) => renderFolderNode(k, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans select-none overflow-hidden text-right rtl">
      {/* Top Header Navigation & Storage Status */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white">
              مدیریت دارایی‌های دیجیتال
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              مدیریت یکپارچه تصاویر، ویدیوها و اسناد — متصل به رسانه (Media Manager)
            </p>
          </div>
        </div>

        {/* Top Control Tabs & Actions */}
        <div className="flex items-center gap-3">
          {/* Studio Tab Switcher */}
          <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveStudioTab('library')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeStudioTab === 'library'
                  ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>مخزن رسانه‌ها</span>
            </button>

            <button
              onClick={() => setActiveStudioTab('analytics')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeStudioTab === 'analytics'
                  ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>داشبورد و گزارشات</span>
            </button>

            <button
              onClick={() => setActiveStudioTab('dedicated-pages')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeStudioTab === 'dedicated-pages'
                  ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>فایل‌های صفحات اختصاصی</span>
              {dedicatedPagesTotalCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-teal-500/15 text-teal-600 dark:text-teal-400 text-[9px] font-black">
                  {dedicatedPagesTotalCount}
                </span>
              )}
            </button>
          </div>

          {/* Refresh from server */}
          <button
            onClick={loadAll}
            title="بارگذاری مجدد از سرور"
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-500 hover:text-teal-600 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Bulk Upload Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer transform active:scale-98"
          >
            <Upload className="w-4 h-4" />
            <span>آپلود فایل جدید</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      {activeStudioTab === 'analytics' ? (
        <div className="flex-1 overflow-y-auto p-6">
          <DamDashboard
            assets={assets}
            onSelectAsset={(id) => {
              const found = assets.find((a) => a.id === id);
              if (found) {
                setSelectedAssetForDrawer(found);
                setActiveStudioTab('library');
              }
            }}
          />
        </div>
      ) : activeStudioTab === 'dedicated-pages' ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {dedicatedPageGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center space-y-3">
              <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-900 text-slate-400 border border-gray-200 dark:border-slate-800">
                <Building2 className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">
                هنوز فایلی از سوی صفحات اختصاصی بارگذاری نشده است
              </h4>
              <p className="text-xs text-slate-400 max-w-sm">
                فایل‌هایی که مسئولین صفحات اختصاصی (انجمن علمی، کانون فرهنگی هنری، تشکل دانشجویی، نشریه دانشجویی) از پرتال مدیریت صفحهٔ خود بارگذاری می‌کنند، اینجا نمایش داده می‌شود.
              </p>
            </div>
          ) : (
            dedicatedPageGroups.map(({ folder, assets: groupAssets }) => (
              <div key={folder.id} className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {folder.dedicatedPageTitle || folder.name}
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        {groupAssets.length.toLocaleString('fa-IR')} فایل ·{' '}
                        {formatBytes(groupAssets.reduce((s, a) => s + (a.size || 0), 0))}
                      </p>
                    </div>
                  </div>
                </div>

                {groupAssets.length === 0 ? (
                  <p className="text-[11px] text-slate-400 py-2">فایلی برای این صفحه بارگذاری نشده است.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {groupAssets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        isSelected={selectedAssetIds.includes(asset.id)}
                        onSelect={() => setSelectedAssetForDrawer(asset)}
                        onToggleSelect={() => handleToggleSelectAsset(asset.id)}
                        onOpenLightbox={() => setLightboxInitialId(asset.id)}
                        onOpenEditor={() => handleOpenEditor(asset)}
                        ownerLabel={folder.dedicatedPageTitle || folder.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar Navigation */}
          <div className="w-72 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 flex flex-col shrink-0 overflow-y-auto p-4 space-y-6">
            {/* Folder Navigation Tree (مجازی — از وب‌سرویس) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  ساختار پوشه‌ها (مجازی)
                </span>
                <button
                  onClick={() => setShowNewFolderModal(true)}
                  className="p-1 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors cursor-pointer"
                  title="ایجاد پوشه جدید"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                {/* بازگشت به پوشهٔ ریشه / نمایش همهٔ فایل‌ها بدون فیلتر پوشه */}
                <button
                  onClick={() => setFilters((f) => ({ ...f, folderId: null }))}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-black text-right transition-all cursor-pointer ${
                    filters.folderId === null
                      ? 'bg-teal-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <HardDrive
                    className="w-4 h-4 shrink-0"
                    style={{ color: filters.folderId === null ? '#fff' : '#64748b' }}
                  />
                  <span>همهٔ فایل‌ها (ریشه)</span>
                </button>

                {folders.length === 0 && (
                  <p className="text-[11px] text-slate-400 leading-relaxed px-2">
                    هنوز پوشه‌ای ساخته نشده است.
                  </p>
                )}
                {childrenOf(null).map((f) => renderFolderNode(f, 0))}
              </div>

              {dedicatedPageFolderIdSet.size > 0 && (
                <label className="flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer hover:bg-violet-500/5 transition-colors border-t border-gray-100 dark:border-slate-800/60 mt-1 pt-2.5">
                  <input
                    type="checkbox"
                    checked={showDedicatedPageFolders}
                    onChange={(e) => {
                      setShowDedicatedPageFolders(e.target.checked);
                      if (!e.target.checked && filters.folderId && dedicatedPageHiddenFolderIds.has(filters.folderId)) {
                        setFilters((f) => ({ ...f, folderId: null }));
                      }
                    }}
                    className="accent-violet-600 rounded cursor-pointer"
                  />
                  <Building2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span className="text-[11px] font-bold text-violet-700 dark:text-violet-400">
                    نمایش پوشه‌های صفحات اختصاصی
                  </span>
                </label>
              )}
            </div>

            {/* Media Type Filters */}
            <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-2">
                نوع فرمت رسانه
              </span>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'all', label: 'همه', icon: Grid },
                  { id: 'image', label: 'تصاویر', icon: ImageIcon },
                  { id: 'video', label: 'ویدیوها', icon: Video },
                  { id: 'audio', label: 'صداها', icon: Music },
                  { id: 'document', label: 'اسناد', icon: FileText }
                ].map((mt) => {
                  const IconComp = mt.icon;
                  const isSelected = filters.fileType === mt.id;
                  return (
                    <button
                      key={mt.id}
                      onClick={() =>
                        setFilters((f) => ({
                          ...f,
                          fileType: mt.id as MediaType
                        }))
                      }
                      className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-black'
                          : 'border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{mt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Storage Summary */}
            <div className="pt-3 border-t border-gray-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-2">
                فضای استفاده‌شده
              </span>
              <div className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <HardDrive className="w-3.5 h-3.5" />
                  مجموع حجم
                </span>
                <span className="text-teal-600 dark:text-teal-400">
                  {formatBytes(totalSizeBytes)}
                </span>
              </div>
            </div>
          </div>

          {/* Main Asset Grid & Toolbar */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden">
            {/* Toolbar Area */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
              {/* Search Bar */}
              <div className="relative flex-1 w-full max-w-md">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, searchQuery: e.target.value }))
                  }
                  placeholder="جستجوی نام فایل..."
                  className="w-full pl-3 pr-9 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
                {filters.searchQuery && (
                  <button
                    onClick={() => setFilters((f) => ({ ...f, searchQuery: '' }))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Modes & Sorting */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                {/* Bulk actions bar */}
                {selectedAssetIds.length > 0 && (
                  <div className="flex items-center gap-2 bg-teal-500/10 p-1.5 rounded-xl border border-teal-500/20 text-xs font-bold text-teal-700 dark:text-teal-400">
                    <span>{selectedAssetIds.length} فایل انتخاب شده</span>
                    <button
                      onClick={requestBulkDelete}
                      className="px-2.5 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      حذف دائمی
                    </button>
                  </div>
                )}

                {/* Sort selector */}
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, sortBy: e.target.value as any }))
                  }
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="date-desc">جدیدترین تاریخ</option>
                  <option value="date-asc">قدیمی‌ترین تاریخ</option>
                  <option value="name-asc">نام (الف-ی)</option>
                  <option value="size-desc">بزرگ‌ترین حجم</option>
                </select>

                {/* View Mode Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
                  <button
                    onClick={() => setFilters((f) => ({ ...f, viewMode: 'grid' }))}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      filters.viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="نمای شبکه‌ای (Grid)"
                  >
                    <Grid className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setFilters((f) => ({ ...f, viewMode: 'list' }))}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      filters.viewMode === 'list'
                        ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="نمای لیستی (Table List)"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Media Gallery Grid / List Container */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-80 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                  <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">
                    در حال بارگذاری رسانه‌ها...
                  </h4>
                  <p className="text-xs text-slate-400">
                    در حال دریافت فایل‌ها از سرور
                  </p>
                </div>
              ) : loadError ? (
                <div className="flex flex-col items-center justify-center h-80 text-center space-y-3">
                  <div className="p-4 rounded-3xl bg-red-500/10 text-red-500 border border-red-500/20">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-black text-red-600 dark:text-red-400">
                    خطا در بارگذاری رسانه‌ها
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm">{loadError}</p>
                  <button
                    onClick={loadAll}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    تلاش مجدد
                  </button>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 text-center space-y-3">
                  <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-900 text-slate-400 border border-gray-200 dark:border-slate-800">
                    <Search className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">
                    هیچ رسانه‌ای با این مشخصات یافت نشد!
                  </h4>
                  <p className="text-xs text-slate-400">
                    لطفاً عبارت جستجو یا فیلترهای انتخابی را تغییر دهید.
                  </p>
                </div>
              ) : filters.viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredAssets.map((asset) => {
                    const isSelected = selectedAssetIds.includes(asset.id);
                    return (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        isSelected={isSelected}
                        onSelect={() => setSelectedAssetForDrawer(asset)}
                        onToggleSelect={() => handleToggleSelectAsset(asset.id)}
                        onOpenLightbox={() => setLightboxInitialId(asset.id)}
                        onOpenEditor={() => handleOpenEditor(asset)}
                      />
                    );
                  })}
                </div>
              ) : (
                /* List Table View */
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 text-slate-400 font-bold">
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              selectedAssetIds.length === filteredAssets.length &&
                              filteredAssets.length > 0
                            }
                            onChange={handleSelectAllFiltered}
                            className="accent-teal-500 rounded cursor-pointer"
                          />
                        </th>
                        <th className="p-3">نام و تصویر رسانه</th>
                        <th className="p-3">نوع فرمت</th>
                        <th className="p-3">حجم فایل</th>
                        <th className="p-3">تاریخ بارگذاری</th>
                        <th className="p-3 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-medium">
                      {filteredAssets.map((asset) => {
                        const isSelected = selectedAssetIds.includes(asset.id);
                        return (
                          <tr
                            key={asset.id}
                            onClick={() => setSelectedAssetForDrawer(asset)}
                            className="hover:bg-teal-500/5 transition-colors cursor-pointer"
                          >
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectAsset(asset.id)}
                                className="accent-teal-500 rounded cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                              {asset.fileType === 'image' ? (
                                <img
                                  src={asset.url}
                                  alt={asset.name}
                                  className="w-9 h-9 rounded-xl object-cover shrink-0"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                  {asset.fileType === 'video' ? (
                                    <Video className="w-4 h-4 text-indigo-500" />
                                  ) : asset.fileType === 'audio' ? (
                                    <Music className="w-4 h-4 text-amber-500" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-sky-500" />
                                  )}
                                </div>
                              )}
                              <span className="truncate max-w-xs" title={asset.name}>
                                {asset.title || asset.name}
                              </span>
                              {asset.description && (
                                <span className="text-[10px] text-slate-400 truncate max-w-[240px] block">
                                  {asset.description}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-bold">
                                {TYPE_LABELS[asset.fileType] || asset.fileType}
                              </span>
                            </td>
                            <td className="p-3">{asset.sizeFormatted}</td>
                            <td className="p-3 text-slate-500">
                              {formatDate(asset.created_at)}
                            </td>
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setSelectedAssetForDrawer(asset)}
                                  className="p-2 rounded-xl text-teal-600 hover:bg-teal-500/10 transition-colors"
                                  title="جزئیات"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {canEditAsset(asset) && (
                                  <button
                                    onClick={() => handleOpenEditor(asset)}
                                    className="p-2 rounded-xl text-slate-500 hover:bg-teal-500/10 hover:text-teal-600 transition-colors"
                                    title={editTitleFor(asset)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => setLightboxInitialId(asset.id)}
                                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="مشاهده"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Asset Details Drawer */}
      <AnimatePresence>
        {selectedAssetForDrawer && (
          <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/50 backdrop-blur-xs">
            <AssetDetailsDrawer
              asset={selectedAssetForDrawer}
              folders={folders}
              onClose={() => setSelectedAssetForDrawer(null)}
              onDelete={requestDeleteAsset}
              onMove={handleMoveAsset}
              onOpenEditor={() => handleOpenEditor(selectedAssetForDrawer)}
              onUpdateMetadata={handleUpdateMetadata}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Built-in Image Editor Modal (always mounted — owns its own AnimatePresence) */}
      <ImageEditorModal
        asset={assetToEdit}
        folderId={filters.folderId}
        onClose={() => setAssetToEdit(null)}
        onSave={handleUpdateAssetFromEditor}
      />

      {/* Built-in Video Editor Modal (always mounted — owns its own AnimatePresence) */}
      <VideoEditorModal
        asset={videoToEdit}
        folderId={filters.folderId}
        onClose={handleCloseVideoEditor}
        onSave={handleUpdateAssetFromEditor}
      />

      {/* Built-in Audio Editor Modal (always mounted — owns its own AnimatePresence) */}
      <AudioEditorModal
        asset={audioToEdit}
        folderId={filters.folderId}
        onClose={handleCloseAudioEditor}
        onSave={handleUpdateAssetFromEditor}
      />

      {/* Built-in PDF Editor Modal (always mounted — owns its own AnimatePresence) */}
      <PdfEditorModal
        asset={pdfToEdit}
        folderId={filters.folderId}
        onClose={() => setPdfToEdit(null)}
        onSave={handleUpdateAssetFromEditor}
        onSaveMany={handleSaveManyFromEditor}
      />

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadModal
            folders={folders}
            activeFolderId={filters.folderId}
            onClose={() => setShowUploadModal(false)}
            onUploaded={handleAssetsUploaded}
          />
        )}
      </AnimatePresence>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {lightboxInitialId && (
          <LightboxModal
            assets={filteredAssets}
            initialAssetId={lightboxInitialId}
            onClose={() => setLightboxInitialId(null)}
          />
        )}
      </AnimatePresence>

      {/* New Folder Modal */}
      <AnimatePresence>
        {showNewFolderModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-4 border border-gray-200 dark:border-slate-800 text-right">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                ایجاد پوشه جدید در مخزن
              </h3>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNewFolder()}
                placeholder="نام پوشه..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              />
              {folderActionError && (
                <p className="text-[11px] font-bold text-red-600 dark:text-red-400">
                  {folderActionError}
                </p>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  onClick={handleCreateNewFolder}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black"
                >
                  ایجاد پوشه
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        busy={deleting}
        title={
          deleteTarget?.kind === 'asset'
            ? 'حذف فایل'
            : deleteTarget?.kind === 'bulk'
              ? 'حذف گروهی فایل‌ها'
              : 'حذف پوشه'
        }
        message={
          deleteTarget?.kind === 'asset' ? (
            <>
              حذف دائمی «<span className="font-bold text-slate-700 dark:text-slate-200">{deleteTarget.asset.name}</span>»؟ این فایل از سرور حذف می‌شود و قابل بازگشت نیست.
            </>
          ) : deleteTarget?.kind === 'bulk' ? (
            <>
              حذف دائمی <span className="font-bold text-slate-700 dark:text-slate-200">{deleteTarget.count}</span> فایل؟ این عملیات قابل بازگشت نیست.
            </>
          ) : deleteTarget?.kind === 'folder' ? (
            <>
              حذف پوشه «<span className="font-bold text-slate-700 dark:text-slate-200">{deleteTarget.folder.name}</span>»؟ فایل‌های داخل آن حذف نمی‌شوند و بدون پوشه می‌شوند.
            </>
          ) : null
        }
        confirmLabel="حذف دائمی"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      {deleteError && (
        <div className="fixed inset-x-0 bottom-4 z-[80] flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto px-4 py-3 rounded-2xl bg-red-600 text-white text-xs font-bold shadow-2xl border border-red-400/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {deleteError}
            <button
              onClick={() => setDeleteError(null)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= AssetCard (کارت شبکه‌ای) ================= */
interface AssetCardProps {
  asset: GalleryAsset;
  isSelected: boolean;
  onSelect: () => void;
  onToggleSelect: () => void;
  onOpenLightbox: () => void;
  onOpenEditor: () => void;
  /** برچسب نمایش «متعلق به کدام صفحهٔ اختصاصی» — فقط در تب فایل‌های صفحات اختصاصی */
  ownerLabel?: string | null;
}

const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  isSelected,
  onSelect,
  onToggleSelect,
  onOpenLightbox,
  onOpenEditor,
  ownerLabel
}) => {
  const isImage = asset.fileType === 'image';
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!isImage) return;
    let mounted = true;
    const img = new Image();
    img.onload = () => mounted && setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = asset.url;
    return () => {
      mounted = false;
    };
  }, [asset.url, isImage]);

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'border-teal-500 ring-2 ring-teal-500/30 shadow-lg'
          : 'border-gray-200 dark:border-slate-800 hover:border-teal-500/60 hover:shadow-xl'
      }`}
    >
      {/* Thumbnail Viewport */}
      <div className="relative aspect-video bg-slate-950 overflow-hidden flex items-center justify-center">
        {isImage ? (
          <img
            src={asset.url}
            alt={asset.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-300">
            {asset.fileType === 'video' ? (
              <Video className="w-9 h-9 text-indigo-400" />
            ) : asset.fileType === 'audio' ? (
              <Music className="w-9 h-9 text-amber-400" />
            ) : (
              <FileText className="w-9 h-9 text-sky-400" />
            )}
            <span className="text-[10px] font-bold">{asset.type}</span>
          </div>
        )}

        {/* Checkbox Overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className="absolute top-3 right-3 p-1 rounded-lg bg-black/60 backdrop-blur-md text-white hover:bg-teal-500 transition-colors z-10"
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4 text-teal-400" />
          ) : (
            <Square className="w-4 h-4" />
          )}
        </button>

        {/* Media Type Badge */}
        <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[9px] uppercase font-bold">
          {asset.fileType}
        </span>

        {/* Hover Overlay Actions */}
        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenLightbox();
            }}
            className="p-2.5 rounded-xl bg-white text-slate-900 hover:bg-teal-500 hover:text-white transition-colors shadow-lg"
            title="نمایش فول‌اسکرین"
          >
            <Eye className="w-4 h-4" />
          </button>

          {canEditAsset(asset) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditor();
              }}
              className="p-2.5 rounded-xl bg-white text-slate-900 hover:bg-teal-500 hover:text-white transition-colors shadow-lg"
              title={editTitleFor(asset)}
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          <a
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2.5 rounded-xl bg-white text-slate-900 hover:bg-teal-500 hover:text-white transition-colors shadow-lg"
            title="دانلود فایل"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4 space-y-2">
        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" title={asset.name}>
          {asset.title || asset.name}
        </h4>
        {asset.title && (
          <p className="text-[10px] text-slate-400 truncate" title={asset.name}>
            {asset.name}
          </p>
        )}
        {asset.description && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
            {asset.description}
          </p>
        )}

        {ownerLabel && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-400 text-[9px] font-bold truncate max-w-full">
            <Building2 className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{ownerLabel}</span>
          </span>
        )}

        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <span>{asset.sizeFormatted}</span>
          <span>
            {naturalSize
              ? `${naturalSize.w}×${naturalSize.h}`
              : formatDate(asset.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
};
