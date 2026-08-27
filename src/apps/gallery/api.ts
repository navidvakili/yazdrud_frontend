// ============================================================
// Gallery / DAM — لایه ارتباط با وب‌سرویس رسانه (Media Manager)
// ============================================================

import { API, APISendFiles } from '../../shared-utils/functions';
import { API_BASE_URL } from '../../shared-constants';
import type {
  MediaFile,
  MediaFolderDto,
  MediaListResponse,
} from './types';

/**
 * آدرس «پخش مستقیم» فایل از بک‌اند (هدر CORS دارد).
 * نمایشگرهای fetch-محور مثل pdf.js به این آدرس نیاز دارند.
 */
export const getMediaStreamUrl = (file: { id: string }): string =>
  `${API_BASE_URL}/media/${file.id}/stream`;

/** دریافت فایل‌های رسانه (همان سرویسی که MediaManager استفاده می‌کند) */
export const fetchMediaPage = (
  page: number,
  perPage = 100,
  opts: { search?: string; folderId?: string | null } = {}
): Promise<MediaListResponse> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('per_page', String(perPage));
  if (opts.search) params.set('search', opts.search);
  if (opts.folderId !== undefined && opts.folderId !== null && opts.folderId !== '') {
    params.set('folder_id', opts.folderId);
  }
  return API<MediaListResponse>(`media?${params.toString()}`);
};

/** بارگذاری تمام صفحات (تا سقف معقول) برای فیلتر سمت کلاینت */
export const fetchAllMedia = async (maxFiles = 600): Promise<MediaFile[]> => {
  const first = await fetchMediaPage(1, 100);
  if (first.total <= first.data.length) return first.data;

  const pages = Math.min(first.last_page, Math.ceil(maxFiles / 100));
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) => fetchMediaPage(i + 2, 100))
  );
  return [...first.data, ...rest.flatMap((p) => p.data)].slice(0, maxFiles);
};

/** آپلود فایل (multipart) — هم‌خوان با MediaManager */
export const uploadMediaFile = (
  file: File,
  folderId: number | null,
  extraFolderIds: number[] = []
): Promise<{ message: string; data: MediaFile }> => {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId !== null && folderId !== undefined) {
    formData.append('folder_id', String(folderId));
  }
  const folderIds = Array.from(
    new Set(
      [
        ...(folderId !== null && folderId !== undefined ? [folderId] : []),
        ...extraFolderIds.filter((f) => f !== folderId),
      ].filter((f) => f != null)
    )
  );
  if (folderIds.length > 0) {
    formData.append('folder_ids', JSON.stringify(folderIds));
  }
  return APISendFiles<{ message: string; data: MediaFile }>('media/upload', formData);
};

/** حذف فایل (پایدار — فایل فیزیکی + ردیف دیتابیس حذف می‌شود) */
export const deleteMediaFile = (file: MediaFile): Promise<{ message: string }> =>
  API<{ message: string }>(`media/${file.id}`, { url: file.url }, 'DELETE');

/** ثبت فایل در یک یا چند پوشه مجازی (folderIds=[] یعنی بدون پوشه — ریشه) */
export const moveMediaFile = (
  file: MediaFile,
  folderIds: number[] | number | null
): Promise<{ message: string; data: MediaFile }> => {
  const ids = Array.isArray(folderIds)
    ? folderIds
    : folderIds === null || folderIds === undefined
      ? []
      : [folderIds];
  return API<{ message: string; data: MediaFile }>(
    `media/${file.id}/move`,
    { path: file.path, folder_ids: ids },
    'POST'
  );
};

/** به‌روزرسانی عنوان و توضیح فایل (نمایش در ویجت مخزن اسناد) */
export const updateMediaMetadata = (
  file: MediaFile,
  metadata: { title?: string | null; description?: string | null }
): Promise<{ message: string; data: MediaFile }> =>
  API<{ message: string; data: MediaFile }>(
    `media/${file.id}`,
    {
      title: metadata.title ?? null,
      description: metadata.description ?? null,
    },
    'PUT'
  );

// ========== پوشه‌های مجازی (فقط DB — در دیالوگ MediaManager نمایش داده نمی‌شوند) ==========

export const fetchFolders = (): Promise<{ data: MediaFolderDto[] }> =>
  API<{ data: MediaFolderDto[] }>('media/folders');

export const createFolder = (
  name: string,
  parentId: number | null,
  color?: string
): Promise<{ message: string; data: MediaFolderDto }> =>
  API<{ message: string; data: MediaFolderDto }>(
    'media/folders',
    { name, parent_id: parentId, color: color || '#0d9488', icon: 'Folder' },
    'POST'
  );

export const renameFolder = (
  id: number,
  name: string
): Promise<{ message: string; data: MediaFolderDto }> =>
  API<{ message: string; data: MediaFolderDto }>(`media/folders/${id}`, { name }, 'PUT');

export const deleteFolder = (id: number): Promise<{ message: string }> =>
  API<{ message: string }>(`media/folders/${id}`, {}, 'DELETE');

/** تبدیل DTO پوشه به گره درخت سایدبار */
export const folderToTreeItem = (dto: MediaFolderDto) => ({
  id: String(dto.id),
  name: dto.name,
  parentId: dto.parent_id !== null ? String(dto.parent_id) : null,
  color: dto.color || undefined,
  iconName: dto.icon || 'Folder',
  dedicatedPageId: dto.dedicated_page_id ?? null,
  dedicatedPageTitle: dto.dedicated_page_title ?? null,
  dedicatedPageType: dto.dedicated_page_type ?? null,
});

/** بلوک‌بندی DTOها به درخت */
export const buildFolderTree = (dtos: MediaFolderDto[]) => {
  const items = dtos.map(folderToTreeItem);
  const byParent = new Map<string | null, typeof items>();
  for (const item of items) {
    const key = item.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(item);
  }
  return byParent;
};
