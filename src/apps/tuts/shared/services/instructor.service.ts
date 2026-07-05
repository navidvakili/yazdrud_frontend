// ============================================================
// InstructorService — API calls for instructor management
// ============================================================

import api from '@/src/shared-api';

export interface InstructorItem {
  id: number;
  name: string;
  specialty: string | null;
}

export const InstructorService = {
  /** Fetch all instructors */
  async getInstructors(): Promise<InstructorItem[]> {
    const res = await api.getInstructors({ per_page: 1000 });
    return (res.data || []).map((inst: any) => ({
      id: inst.id,
      name: inst.name,
      specialty: inst.specialty || null,
    }));
  },

  /** Fetch a single instructor by ID */
  async getInstructor(id: number): Promise<any> {
    return await api.getInstructor(id);
  },

  /** Create a new instructor */
  async createInstructor(formData: FormData): Promise<any> {
    return await api.createInstructor(formData);
  },

  /** Update an existing instructor */
  async updateInstructor(id: number, formData: FormData): Promise<any> {
    return await api.updateInstructor(id, formData);
  },

  /** Delete an instructor */
  async deleteInstructor(id: number): Promise<void> {
    await api.deleteInstructor(id);
  },
};
