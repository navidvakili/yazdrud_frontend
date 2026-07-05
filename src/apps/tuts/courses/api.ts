// ============================================================
// Courses API — ارتباط با بک‌اند برای دوره‌های آموزشی
// ============================================================

import { API, APISendFiles } from '@/src/shared-utils';
import type { Course, CourseGroup, Instructor } from '@/src/shared-types';

export const coursesApi = {
  // ========== Courses (دوره‌های آموزشی) ==========

  async getCourses(params?: { active?: boolean; search?: string; page?: number; per_page?: number }): Promise<{ data: Course[]; meta: any }> {
    const query = new URLSearchParams();
    if (params?.active !== undefined) query.set('active', String(params.active));
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    const qs = query.toString();
    const url = qs ? `courses?${qs}` : 'courses';
    return API<any>(url);
  },

  async getCourse(id: number): Promise<Course> {
    const data = await API<any>(`courses/${id}`);
    return data.data;
  },

  async createCourse(courseData: any): Promise<Course> {
    const data = courseData instanceof FormData
      ? await APISendFiles<any>('courses', courseData)
      : await API<any>('courses', courseData, 'POST');
    return data.data;
  },

  async updateCourse(id: number, courseData: any): Promise<Course> {
    const data = courseData instanceof FormData
      ? await APISendFiles<any>(`courses/${id}`, courseData)
      : await API<any>(`courses/${id}`, courseData, 'PUT');
    return data.data;
  },

  async deleteCourse(id: number): Promise<void> {
    await API(`courses/${id}`, {}, 'DELETE');
  },

  async toggleCourseActive(id: number): Promise<Course> {
    const data = await API<any>(`courses/${id}/toggle-active`, {}, 'PUT');
    return data.data;
  },

  async getCourseRegistrations(courseId: number): Promise<any[]> {
    const data = await API<any>(`courses/${courseId}/registrations`);
    return data.data;
  },

  // ========== Course Groups (گروه‌های آموزشی و کارگاهی) ==========

  async getCourseGroups(): Promise<CourseGroup[]> {
    const data = await API<any>('course-groups');
    return data.data;
  },

  async createCourseGroup(title: string): Promise<CourseGroup> {
    const data = await API<any>('course-groups', { title }, 'POST');
    return data.data;
  },

  async updateCourseGroup(id: number, title: string): Promise<CourseGroup> {
    const data = await API<any>(`course-groups/${id}`, { title }, 'PUT');
    return data.data;
  },

  async deleteCourseGroup(id: number): Promise<void> {
    await API(`course-groups/${id}`, {}, 'DELETE');
  },

  // ========== Instructors (اساتید دوره‌ها) ==========

  async getInstructors(params?: { active?: boolean; search?: string; page?: number; per_page?: number }): Promise<{ data: Instructor[]; meta: any }> {
    const query = new URLSearchParams();
    if (params?.active !== undefined) query.set('active', String(params.active));
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    const qs = query.toString();
    const url = qs ? `instructors?${qs}` : 'instructors';
    return API<any>(url);
  },

  async getInstructor(id: number): Promise<Instructor> {
    const data = await API<any>(`instructors/${id}`);
    return data.data;
  },

  async createInstructor(instructorData: FormData | any): Promise<Instructor> {
    const data = instructorData instanceof FormData
      ? await APISendFiles<any>('instructors', instructorData)
      : await API<any>('instructors', instructorData, 'POST');
    return data.data;
  },

  async updateInstructor(id: number, instructorData: FormData | any): Promise<Instructor> {
    const data = instructorData instanceof FormData
      ? await APISendFiles<any>(`instructors/${id}`, instructorData)
      : await API<any>(`instructors/${id}`, instructorData, 'PUT');
    return data.data;
  },

  async deleteInstructor(id: number): Promise<void> {
    await API(`instructors/${id}`, {}, 'DELETE');
  },
};
