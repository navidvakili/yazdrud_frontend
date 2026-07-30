// ============================================================
// templateUtils — Utilities for applying preset templates
// ============================================================

import type { Slide, LayerInteraction } from '@/src/shared-types/slider-studio';
import { APISendFiles } from '@/src/shared-utils/functions';

/**
 * Generate a unique ID for slides, layers, interactions
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Walk through an object and return all string values that look like
 * external (http/https) image URLs. This covers both background images
 * and image‑layer content.
 */
function collectExternalImageUrls(slides: Slide[]): string[] {
  const urls: string[] = [];
  const isExtUrl = (v: string) =>
    (v.startsWith('http://') || v.startsWith('https://'));

  for (const slide of slides) {
    if (slide.background.imageUrl && isExtUrl(slide.background.imageUrl)) {
      urls.push(slide.background.imageUrl);
    }
    for (const layer of slide.layers) {
      if (layer.type === 'image' && layer.content && isExtUrl(layer.content)) {
        urls.push(layer.content);
      }
    }
  }
  return [...new Set(urls)]; // deduplicate
}

/**
 * Download an external image, upload it to the server via the media API,
 * and return the new local URL. Returns the original URL on failure.
 */
async function localizeSingleImage(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();

    // Build a reasonable filename from the original URL
    const rawName = url.split('/').pop()?.split('?')[0] || 'template-image.jpg';
    const fileName = rawName.includes('.') ? rawName : `${rawName}.jpg`;

    const formData = new FormData();
    formData.append('file', blob, fileName);

    const result = await APISendFiles<{ url: string }>('media/upload', formData);
    return result.url;
  } catch (err) {
    console.warn('[templateUtils] Failed to localize image, keeping original URL:', url, err);
    return url; // fallback to the external URL
  }
}

/**
 * Download every external image referenced in the template slides and
 * upload them to the server so they work offline. Returns a new slides
 * array with local URLs substituted.
 */
export async function localizeSlideImages(slides: Slide[]): Promise<Slide[]> {
  const extUrls = collectExternalImageUrls(slides);
  if (extUrls.length === 0) return slides;

  const replacements = new Map<string, string>();

  // Process in parallel
  const results = await Promise.allSettled(
    extUrls.map(async (url) => {
      const localUrl = await localizeSingleImage(url);
      replacements.set(url, localUrl);
    })
  );

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`[templateUtils] ${failed.length}/${extUrls.length} image(s) could not be localized`);
  }

  // Return slides with URLs replaced
  return slides.map(slide => ({
    ...slide,
    background: {
      ...slide.background,
      imageUrl: slide.background.imageUrl
        ? (replacements.get(slide.background.imageUrl) ?? slide.background.imageUrl)
        : slide.background.imageUrl,
    },
    layers: slide.layers.map(layer => ({
      ...layer,
      content:
        layer.type === 'image' && layer.content
          ? (replacements.get(layer.content) ?? layer.content)
          : layer.content,
    })),
  }));
}

/**
 * Deep‑clone template slides, regenerate all IDs so they do not collide
 * with existing slides in the current project, and update internal
 * cross‑references (e.g. jumpSlide targetSlideId).
 */
export function regenerateSlideIds(slides: Slide[]): Slide[] {
  const slideIdMap = new Map<string, string>(); // old → new
  const groupIdMap = new Map<string, string>();  // old groupId → new groupId

  // first pass — assign new slide IDs & group IDs
  const newSlides = slides.map(s => {
    const newId = generateId();
    slideIdMap.set(s.id, newId);
    return { ...s, id: newId };
  });

  // second pass — regenerate layer & interaction IDs, remap references
  return newSlides.map(slide => ({
    ...slide,
    layers: slide.layers.map(layer => {
      const newLayerId = generateId();
      let newGroupId = layer.groupId;
      if (layer.groupId) {
        if (!groupIdMap.has(layer.groupId)) {
          groupIdMap.set(layer.groupId, generateId());
        }
        newGroupId = groupIdMap.get(layer.groupId)!;
      }
      const mapInteraction = (int: LayerInteraction): LayerInteraction => ({
        ...int,
        id: generateId(),
        targetSlideId: int.targetSlideId
          ? (slideIdMap.get(int.targetSlideId) ?? int.targetSlideId)
          : undefined,
      });
      return {
        ...layer,
        id: newLayerId,
        groupId: newGroupId,
        interactions: (layer.interactions || []).map(mapInteraction),
      };
    }),
    interactions: (slide.interactions || []).map(int => ({
      ...int,
      id: generateId(),
      targetSlideId: int.targetSlideId
        ? (slideIdMap.get(int.targetSlideId) ?? int.targetSlideId)
        : undefined,
    })),
  }));
}
