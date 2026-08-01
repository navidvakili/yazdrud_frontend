import { BACKEND_API_URL } from '@/src/shared-constants';

/**
 * Normalize a storage/media URL to an absolute URL pointing at the current
 * backend.
 *
 * Handles:
 *   - `http://127.0.0.1:8000/storage/media/...`  → unchanged (already correct)
 *   - `https://db.yazdrud.ir/storage/media/...`   → rebased to current backend
 *   - `/storage/media/...`                        → prepend backend base
 *   - `/media/...`                                → prepend backend base + `/storage`
 *   - `storage/media/...` or `media/...`          → prepend backend base + `/storage`
 *   - external absolute URLs (e.g. mixkit presets) → passed through unchanged
 */
export function resolveStorageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Already points at the current backend → no change needed
  if (trimmed.startsWith(BACKEND_API_URL)) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      // Rebase only URLs that belong to a storage host / storage path.
      // External URLs (presets, stock videos, ...) must be kept as-is.
      if (parsed.hostname === 'db.yazdrud.ir' || trimmed.includes('/storage/')) {
        return `${BACKEND_API_URL}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      // fall through to relative handling
    }
    return trimmed;
  }

  // Absolute path
  if (trimmed.startsWith('/')) {
    return trimmed.startsWith('/storage/')
      ? `${BACKEND_API_URL}${trimmed}`
      : `${BACKEND_API_URL}/storage${trimmed}`;
  }

  // Relative path (e.g. "storage/media/..." or "media/...")
  const path = trimmed.startsWith('storage/') ? trimmed : `storage/${trimmed}`;
  return `${BACKEND_API_URL}/${path}`;
}
