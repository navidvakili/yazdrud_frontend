// ============================================================
// SurveyService — API calls for survey management
// ============================================================

import api from '@/src/shared-api';
import type { TutSurvey } from '../types';

export const SurveyService = {
  /** Fetch all surveys */
  async getSurveys(params?: { course_id?: number; search?: string; page?: number; per_page?: number }): Promise<{ data: any[]; meta: any }> {
    const res = await api.getSurveys(params);
    return { data: res.data || [], meta: res.meta };
  },

  /** Get survey statistics */
  async getStatistics(): Promise<any> {
    return await api.getSurveyStatistics();
  },

  /** Delete a survey */
  async deleteSurvey(id: number): Promise<void> {
    await api.deleteSurvey(id);
  },

  /** Export surveys as Excel */
  async exportSurveys(params?: { course_id?: string; search?: string; from_date?: string; to_date?: string }): Promise<void> {
    await api.exportSurveys(params);
  },
};
