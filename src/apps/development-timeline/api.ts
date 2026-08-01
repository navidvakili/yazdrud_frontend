// ============================================================
// Development Timeline API — API روند توسعه و تحول
// ============================================================

import { API } from '@/src/shared-utils/functions';

export interface DevelopmentTimelineItem {
  id: number;
  title: string;
  icon: string | null;
  value: string | null;
  value_index: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimelineApiResponse {
  success: boolean;
  data: DevelopmentTimelineItem[];
  message?: string;
}

export interface SingleTimelineResponse {
  success: boolean;
  data: DevelopmentTimelineItem;
  message?: string;
}

/**
 * Fetch all timeline items (admin)
 */
export async function fetchTimelineItems(): Promise<TimelineApiResponse> {
  return API('admin/development-timeline?lang=fa');
}

/**
 * Fetch a single timeline item
 */
export async function fetchTimelineItem(id: number): Promise<SingleTimelineResponse> {
  return API(`admin/development-timeline/${id}?lang=fa`);
}

/**
 * Create a new timeline item
 */
export async function createTimelineItem(data: Partial<DevelopmentTimelineItem>): Promise<SingleTimelineResponse> {
  return API('admin/development-timeline', { ...data, lang: 'fa' }, 'POST');
}

/**
 * Update a timeline item
 */
export async function updateTimelineItem(id: number, data: Partial<DevelopmentTimelineItem>): Promise<SingleTimelineResponse> {
  return API(`admin/development-timeline/${id}`, { ...data, lang: 'fa' }, 'PUT');
}

/**
 * Delete a timeline item
 */
export async function deleteTimelineItem(id: number): Promise<{ success: boolean; message: string }> {
  return API(`admin/development-timeline/${id}`, {}, 'DELETE');
}
