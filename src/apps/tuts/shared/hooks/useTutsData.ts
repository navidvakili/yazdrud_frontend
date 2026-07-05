// ============================================================
// useTutsData — Lazy data fetching hook
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/src/shared-api';
import type { TutCourse, TutRegistrant, TutVoucher } from '../types';
import { mapCourse, mapVoucher, mapRegistrant } from '../utils';

export function useTutsData(
  moduleId: string,
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void
) {
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  const [courses, setCourses] = useState<TutCourse[]>([]);
  const [registrants, setRegistrants] = useState<TutRegistrant[]>([]);
  const [vouchers, setVouchers] = useState<TutVoucher[]>([]);

  // Individual surveys state (kept separate for UI)
  const [individualSurveys, setIndividualSurveys] = useState<any[]>([]);

  const fetchedRef = useRef({ courses: false, registrants: false, surveys: false, vouchers: false });

  const refetchCourses = useCallback(() => {
    fetchedRef.current.courses = false;
    setLoadingCourses(true);
    api.getCourses({ per_page: 1000 })
      .then(res => {
        const mapped = (res.data || []).map(mapCourse);
        setCourses(mapped);
      })
      .catch(err => { console.error('Error fetching courses:', err); fetchedRef.current.courses = false; })
      .finally(() => setLoadingCourses(false));
  }, []);

  const refetchVouchers = useCallback(() => {
    fetchedRef.current.vouchers = false;
    setLoadingVouchers(true);
    api.getCoupons({ per_page: 1000 })
      .then(res => {
        const mapped = (res.data || []).map(mapVoucher);
        setVouchers(mapped);
      })
      .catch(err => { console.error('Error fetching coupons:', err); fetchedRef.current.vouchers = false; })
      .finally(() => setLoadingVouchers(false));
  }, []);

  // Lazy data fetching
  useEffect(() => {
    const needsCourses = moduleId === 'tuts-list' || moduleId === 'tuts-stats' || moduleId === 'tuts-surveys';
    const needsRegistrants = moduleId === 'tuts-reports' || moduleId === 'tuts-receipts' || moduleId === 'tuts-stats';
    const needsSurveys = moduleId === 'tuts-surveys' || moduleId === 'tuts-surveys-stats';
    const needsVouchers = moduleId === 'tuts-vouchers';

    if (needsCourses && !fetchedRef.current.courses) {
      setLoadingCourses(true);
      fetchedRef.current.courses = true;
      api.getCourses({ per_page: 1000 })
        .then(res => {
          const mapped = (res.data || []).map(mapCourse);
          setCourses(mapped);
        })
        .catch(err => { console.error('Error fetching courses:', err); fetchedRef.current.courses = false; })
        .finally(() => setLoadingCourses(false));
    }

    if (needsRegistrants && !fetchedRef.current.registrants) {
      setLoadingRegistrants(true);
      fetchedRef.current.registrants = true;
      const params: Record<string, any> = { per_page: 10000 };
      api.getAllRegistrations(params)
        .then(res => {
          const mapped = (res.data || []).map(mapRegistrant);
          setRegistrants(mapped);
        })
        .catch(err => { console.error('Error fetching registrations:', err); fetchedRef.current.registrants = false; })
        .finally(() => setLoadingRegistrants(false));
    }

    if (needsSurveys && !fetchedRef.current.surveys) {
      setLoadingSurveys(true);
      fetchedRef.current.surveys = true;
      api.getSurveys({ per_page: 1000 })
        .then(res => {
          const rows: any[] = res.data || [];
          setIndividualSurveys(rows.map((s: any) => ({
            id: s.id,
            firstName: s.first_name || '',
            lastName: s.last_name || '',
            userName: s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
            userPhone: s.phone_number || '',
            ipAddress: s.ip_address || '',
            date: s.created_at ? s.created_at.replace(/-/g, '/') : '',
            courseTitle: s.course_title || '',
            rating: s.rating || 0,
            comment: s.comment || '',
            suggestions: s.suggestions || ''
          })));
        })
        .catch(err => { console.error('Error fetching surveys:', err); fetchedRef.current.surveys = false; })
        .finally(() => setLoadingSurveys(false));
    }

    if (needsVouchers && !fetchedRef.current.vouchers) {
      setLoadingVouchers(true);
      fetchedRef.current.vouchers = true;
      api.getCoupons({ per_page: 1000 })
        .then(res => {
          const mapped = (res.data || []).map(mapVoucher);
          setVouchers(mapped);
        })
        .catch(err => { console.error('Error fetching coupons:', err); fetchedRef.current.vouchers = false; })
        .finally(() => setLoadingVouchers(false));
    }
  }, [moduleId]);

  // Course registrations on-demand fetcher
  const fetchCourseRegistrations = useCallback((courseId: string) => {
    const courseIdNum = parseInt(courseId);
    if (isNaN(courseIdNum)) return Promise.resolve();
    setLoadingRegistrants(true);
    return api.getCourseRegistrations(courseIdNum)
      .then(data => {
        const mapped = (data || []).map(mapRegistrant);
        setRegistrants(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const newOnes = mapped.filter(r => !existingIds.has(r.id));
          return [...prev, ...newOnes];
        });
      })
      .catch(err => console.error('Error fetching course registrations:', err))
      .finally(() => setLoadingRegistrants(false));
  }, []);

  return {
    loadingCourses, loadingRegistrants, loadingSurveys, loadingVouchers,
    courses, setCourses,
    registrants, setRegistrants,
    vouchers, setVouchers,
    individualSurveys, setIndividualSurveys,
    refetchCourses, refetchVouchers,
    fetchCourseRegistrations,
  };
}
