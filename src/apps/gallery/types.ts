export type MediaType = 'image' | 'video' | 'audio' | 'document' | '3d' | 'embed';

export type AssetStatus = 'published' | 'draft' | 'archived' | 'trashed';

export interface ExifMetadata {
  camera?: string;
  lens?: string;
  iso?: number;
  aperture?: string;
  exposure?: string;
  focalLength?: string;
  flash?: string;
  dateTaken?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsLocationName?: string;
}

export interface AiMetadata {
  autoAltText?: string;
  autoCaption?: string;
  detectedObjects?: string[];
  faceCount?: number;
  dominantColors?: string[];
  extractedOcrText?: string;
  safetyScore?: 'safe' | 'warning' | 'flagged';
}

export interface AssetVersion {
  id: string;
  presetName: string; // e.g., 'Thumbnail', 'Medium WebP', 'Original'
  width: number;
  height: number;
  sizeBytes: number;
  sizeFormatted: string;
  format: string; // 'webp', 'jpeg', 'png', 'avif'
  url: string;
}

export interface AssetUsage {
  id: string;
  moduleName: string; // e.g. 'اخبار و اطلاعیه‌ها', 'صفحه‌ساز هوشمند', 'اسلایدر اصلی', 'دوره آموزشی'
  targetTitle: string;
  targetUrl: string;
  usedAt: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  fileName: string;
  fileType: MediaType;
  mimeType: string;
  sizeBytes: number;
  sizeFormatted: string;
  url: string;
  thumbnailUrl: string;
  durationSeconds?: number; // for video/audio
  width?: number;
  height?: number;
  dpi?: number;
  folderId: string;
  categoryId: string;
  albumIds: string[];
  tags: string[];
  altText: string;
  title: string;
  caption: string;
  copyright: string;
  photographer: string;
  source: string;
  license: 'All Rights Reserved' | 'CC BY 4.0' | 'Public Domain' | 'Editorial Use Only';
  exif?: ExifMetadata;
  ai?: AiMetadata;
  versions: AssetVersion[];
  usages: AssetUsage[];
  likesCount: number;
  viewsCount: number;
  downloadsCount: number;
  rating: number;
  status: AssetStatus;
  createdAt: string;
  updatedAt: string;
  fileHash: string;
  isFavorite: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color?: string;
  iconName?: string;
  assetCount?: number;
  /** اگر این پوشه، پوشهٔ اختصاصیِ یک صفحهٔ اختصاصی (انجمن علمی/کانون/تشکل/نشریه) باشد */
  dedicatedPageId?: number | null;
  dedicatedPageTitle?: string | null;
  dedicatedPageType?: string | null;
}

export interface Album {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  type: 'photo' | 'video' | 'mixed';
  isSmart: boolean;
  smartCondition?: string; // e.g. "tag:خبر AND type:image"
  isPublic: boolean;
  assetCount: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  description?: string;
  count?: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
}

export interface DamFilterState {
  searchQuery: string;
  folderId: string | null;
  fileType: MediaType | 'all';
  sortBy: 'date-desc' | 'date-asc' | 'name-asc' | 'size-desc';
  viewMode: 'grid' | 'list';
}

// ============================================================
// انواع متصل به وب‌سرویس رسانه بک‌اند (Media Manager)
// ============================================================

/** شکل فایل رسانه‌ای که وب‌سرویس رسانه برمی‌گرداند (MediaController::formatFileFromModel) */
export interface MediaFile {
  id: string; // md5(path) — شناسه پایدار API
  name: string;
  title?: string | null; // عنوان نمایشی (ویجت مخزن اسناد)
  description?: string | null; // توضیح (ویجت مخزن اسناد)
  url: string;
  path: string;
  size: number; // بایت
  type: string; // mime type
  folder_id: number | null; // پوشه اولیه (سازگاری) — اولین عضو folder_ids
  folder_ids?: number[] | null; // همه پوشه‌های مجازی که فایل در آن‌ها ثبت شده (چند گروهی)
  created_at: string; // ISO
}

/** دارایی گالری = MediaFile + فیلدهای مشتق‌شده UI */
export interface GalleryAsset extends MediaFile {
  fileType: MediaType;
  sizeFormatted: string;
  width?: number;
  height?: number;
}

/** پوشه مجازی (فقط DB — هیچ دایرکتوری فیزیکی ساخته نمی‌شود) */
export interface MediaFolderDto {
  id: number;
  name: string;
  parent_id: number | null;
  color: string | null;
  icon: string | null;
  ordering: number;
  dedicated_page_id: number | null;
  dedicated_page_title: string | null;
  dedicated_page_type: string | null;
}

/** پاسخ صفحه‌بندی‌شده GET media */
export interface MediaListResponse {
  data: MediaFile[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
  sort_by: string;
  sort_order: string;
}

/** نگاشت mime type به نوع رسانه نمایشی */
export const getFileType = (mime: string): MediaType => {
  const m = (mime || '').toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  if (m === 'model/gltf-binary' || m === 'model/gltf+json') return '3d';
  return 'document';
};

const faNumber = new Intl.NumberFormat('fa-IR');

/** فرمت‌بندی حجم فایل با ارقام فارسی */
export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '۰ بایت';
  if (bytes < 1024) return `${faNumber.format(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${faNumber.format(Math.round(bytes / 1024))} کیلوبایت`;
  const mb = bytes / (1024 * 1024);
  return `${faNumber.format(Math.round(mb * 10) / 10)} مگابایت`;
};

/** فرمت‌بندی تاریخ با تقویم فارسی */
export const formatDate = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso || '';
  }
};

/** ساخت دارایی گالری از پاسخ وب‌سرویس */
export const toGalleryAsset = (file: MediaFile): GalleryAsset => ({
  ...file,
  fileType: getFileType(file.type),
  sizeFormatted: formatBytes(file.size),
});
