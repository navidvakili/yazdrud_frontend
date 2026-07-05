// ============================================================
// CourseService — API calls for course & registration management
// ============================================================

import api from '@/src/shared-api';
import type { TutCourse, TutRegistrant } from '../types';
import { mapCourse, mapRegistrant } from '../utils';

export const CourseService = {
  /** Fetch all courses */
  async getCourses(): Promise<TutCourse[]> {
    const res = await api.getCourses({ per_page: 1000 });
    return (res.data || []).map(mapCourse);
  },

  /** Fetch a single course by ID */
  async getCourse(id: number): Promise<TutCourse> {
    const course = await api.getCourse(id);
    return mapCourse(course);
  },

  /** Create a new course */
  async createCourse(courseData: any): Promise<TutCourse> {
    const result = await api.createCourse(courseData);
    return mapCourse(result);
  },

  /** Update an existing course */
  async updateCourse(id: number, courseData: any): Promise<TutCourse> {
    const result = await api.updateCourse(id, courseData);
    return mapCourse(result);
  },

  /** Delete a course */
  async deleteCourse(id: number): Promise<void> {
    await api.deleteCourse(id);
  },

  /** Toggle course active/inactive status */
  async toggleCourseActive(id: number): Promise<TutCourse> {
    const result = await api.toggleCourseActive(id);
    return mapCourse(result);
  },

  /** Get course groups */
  async getCourseGroups(): Promise<{ id: number; title: string }[]> {
    const groups = await api.getCourseGroups();
    return groups;
  },

  /** Create a course group */
  async createCourseGroup(title: string): Promise<{ id: number; title: string }> {
    return await api.createCourseGroup(title);
  },

  /** Update a course group */
  async updateCourseGroup(id: number, title: string): Promise<{ id: number; title: string }> {
    return await api.updateCourseGroup(id, title);
  },

  /** Delete a course group */
  async deleteCourseGroup(id: number): Promise<void> {
    await api.deleteCourseGroup(id);
  },
};
