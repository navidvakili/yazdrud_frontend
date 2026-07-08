import React, { useState, useEffect, useRef, useMemo } from 'react';

import { coursesApi } from './courses/api';
import { reportsApi } from './reports/api';
import { receiptsApi } from './receipts/api';
import { surveysApi } from './surveys/api';
import { vouchersApi } from './vouchers/api';
import { certificatesApi } from './certificates/api';
import { BACKEND_API_URL } from '@/src/shared-constants';
import { pdfjs } from 'react-pdf';
import { Pagination } from '@/src/shared-components';
import type { VoucherFormData, SandboxResult, TutCourse, TutRegistrant, TutVoucher, TutsModuleProps } from './shared/types';

// Configure PDF.js worker — served from /public/ to avoid CSP issues with CDN
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
import { ToastNotification } from '@/src/shared-components';
import { formatCostInput, mapCourse, mapVoucher, mapRegistrant, toPersianDigits, formatCurrency, toEnglishDigits, normalizePersian as normalizePersianSearch } from './shared/utils';
import { useToast } from './shared/hooks';
import CertificatePreviewDialog from './certificates/dialogs/CertificatePreviewDialog';
import RefundConfirmDialog from './receipts/dialogs/RefundConfirmDialog';
import UndoRefundConfirmDialog from './receipts/dialogs/UndoRefundConfirmDialog';
import EditRegistrationDialog from './reports/dialogs/EditRegistrationDialog';
import NewRegistrationDialog from './reports/dialogs/NewRegistrationDialog';
import CoursesTab from './courses';
import ReportsTab from './reports';
import ReceiptsTab from './receipts';
import StatsTab from './stats';
import SurveysTab from './surveys';
import VouchersTab from './vouchers';

export default function TutsModule({ user, activeTabId, moduleId, onOpenTab }: TutsModuleProps) {
  // Normalize backend URL-style moduleIds to internal dash format
  const moduleIdNorm: Record<string, string> = {
    'tuts': 'tuts-list',
    'tuts-list': 'tuts-list',
    'tuts/vouchers': 'tuts-vouchers',
    'tuts/reports': 'tuts-reports',
    'tuts/bank-receipts': 'tuts-receipts',
    'tuts/statistics': 'tuts-stats',
    'course-surveys': 'tuts-surveys',
    'course-surveys/statistics': 'tuts-surveys-stats',
  };
  const normModuleId = moduleIdNorm[moduleId] || moduleId;

  // ===== Data Fetching States =====
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // ===== Courses =====
  const [courses, setCourses] = useState<TutCourse[]>([]);
  const [registrants, setRegistrants] = useState<TutRegistrant[]>([]);

  // ===== Instructors for dropdown selection =====
  const [instructors, setInstructors] = useState<{ id: number; name: string; specialty: string | null }[]>([]);
  const [newCourseInstructorId, setNewCourseInstructorId] = useState('');
  const [newCourseInstructorSearch, setNewCourseInstructorSearch] = useState('');
  const [newCourseInstructorOpen, setNewCourseInstructorOpen] = useState(false);
  const [editCourseInstructorId, setEditCourseInstructorId] = useState('');
  const [editCourseInstructorSearch, setEditCourseInstructorSearch] = useState('');
  const [editCourseInstructorOpen, setEditCourseInstructorOpen] = useState(false);

  // Filtered instructor lists for autocomplete
  const filteredNewCourseInstructors = useMemo(() => {
    if (!newCourseInstructorSearch) return instructors;
    const q = newCourseInstructorSearch.trim().toLowerCase();
    return instructors.filter(i => i.name.toLowerCase().includes(q) || (i.specialty && i.specialty.toLowerCase().includes(q)));
  }, [instructors, newCourseInstructorSearch]);

  const filteredEditCourseInstructors = useMemo(() => {
    if (!editCourseInstructorSearch) return instructors;
    const q = editCourseInstructorSearch.trim().toLowerCase();
    return instructors.filter(i => i.name.toLowerCase().includes(q) || (i.specialty && i.specialty.toLowerCase().includes(q)));
  }, [instructors, editCourseInstructorSearch]);

  // ===== Instructor Management Modal =====
  const [isInstructorManagementOpen, setIsInstructorManagementOpen] = useState(false);
  const [instructorsLoading, setInstructorsLoading] = useState(false);

  // ===== Lazy Data Fetching: each section fetches only its own data when activated =====
  const fetchedRef = useRef({ courses: false, registrants: false, surveys: false, vouchers: false });
  const lastFetchModuleRef = useRef<string | null>(null);
  const coursesTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // When switching between receipts tab (bank-only) and other tabs (all), re-fetch registrants
    const wasReceiptsTab = lastFetchModuleRef.current === 'tuts-receipts';
    const isNowReceiptsTab = normModuleId === 'tuts-receipts';
    if (fetchedRef.current.registrants && wasReceiptsTab !== isNowReceiptsTab) {
      fetchedRef.current.registrants = false;
    }
    lastFetchModuleRef.current = moduleId;

    // Determine which data types are needed based on the active moduleId
    const needsCourses = normModuleId === 'tuts-list' || normModuleId === 'tuts-reports' || normModuleId === 'tuts-stats' || normModuleId === 'tuts-surveys' || normModuleId === 'tuts-vouchers';
    const needsRegistrants = normModuleId === 'tuts-receipts' || normModuleId === 'tuts-stats';
    const needsSurveys = normModuleId === 'tuts-surveys' || normModuleId === 'tuts-surveys-stats';
    const needsVouchers = normModuleId === 'tuts-vouchers';

    if (needsCourses && !fetchedRef.current.courses) {
      setLoadingCourses(true);
      fetchedRef.current.courses = true;
      coursesApi.getCourses({ per_page: 1000 })
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
      const isReceiptsTab = normModuleId === 'tuts-receipts';
      const params: Record<string, any> = { per_page: 10000 };
      // For receipts tab, only fetch bank receipt payments (همانند پروژه قدیمی)
      if (isReceiptsTab) {
        params.payment_method = 'bank';
      }
      reportsApi.getAllRegistrations(params)
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
      surveysApi.getSurveys({ per_page: 1000 })
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
      vouchersApi.getCoupons({ per_page: 1000 })
        .then(res => {
          const mapped = (res.data || []).map(mapVoucher);
          setVouchers(mapped);
        })
        .catch(err => { console.error('Error fetching coupons:', err); fetchedRef.current.vouchers = false; })
        .finally(() => setLoadingVouchers(false));
    }
  }, [moduleId]);

  // Dedicated role for education expert (کارشناس آموزش)
  // Non-student roles (e.g. pajouheshikol, amouzesh_karshanes) get admin-level access
  const isStudent = user?.role === 'student';
  const currentUserRole = isStudent ? 'student' : 'admin';

  // Dynamic Categories (Groups) management — synced with backend API
  const [courseGroups, setCourseGroups] = useState<{ id: number; title: string }[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch course groups from backend API
  useEffect(() => {
    coursesApi.getCourseGroups()
      .then(groups => {
        setCourseGroups(groups);
        const groupTitles = groups.map((g: any) => g.title);
        // Always include 'عمومی' as a category option for uncategorized courses
        setCategories(groupTitles.includes('عمومی') ? groupTitles : ['عمومی', ...groupTitles]);
      })
      .catch(() => {
        // Fallback to localStorage if API fails
        const saved = localStorage.getItem('tuts_categories');
        if (saved) {
          try { setCategories(JSON.parse(saved)); } catch { /* ignore */ }
        }
      })
      .finally(() => setCategoriesLoading(false));
  }, []);

  // Fetch instructors for course form dropdowns
  useEffect(() => {
    coursesApi.getInstructors({ per_page: 1000 })
      .then(res => {
        const mapped = (res.data || []).map((inst: any) => ({
          id: inst.id,
          name: inst.name,
          specialty: inst.specialty || null,
        }));
        setInstructors(mapped);
      })
      .catch(err => console.error('Error fetching instructors:', err));
  }, []);

  const [vouchers, setVouchers] = useState<TutVoucher[]>([]);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Tab State for Voucher Section
  const [voucherActiveTab, setVoucherActiveTab] = useState<'list' | 'create'>('list');

  // Voucher Creation Form States
  const [newVoucherCode, setNewVoucherCode] = useState('');
  const [newVoucherTitle, setNewVoucherTitle] = useState('');
  const [newVoucherValidFrom, setNewVoucherValidFrom] = useState('1405/01/01');
  const [newVoucherValidTo, setNewVoucherValidTo] = useState('1405/12/29');
  const [newVoucherAllowedHours, setNewVoucherAllowedHours] = useState('all');
  const [newVoucherOccasion, setNewVoucherOccasion] = useState('');
  const [newVoucherCourseId, setNewVoucherCourseId] = useState('all');
  const [newVoucherCategory, setNewVoucherCategory] = useState('all');
  const [newVoucherCourseLevel, setNewVoucherCourseLevel] = useState<'all' | 'elementary' | 'advanced'>('all');
  const [newVoucherDeliveryType, setNewVoucherDeliveryType] = useState<'all' | 'online' | 'in-person'>('all');
  const [newVoucherMinCoursePrice, setNewVoucherMinCoursePrice] = useState('0');
  const [newVoucherGlobalCap, setNewVoucherGlobalCap] = useState('100');
  const [newVoucherBudgetLimit, setNewVoucherBudgetLimit] = useState('50000000');
  const [newVoucherPerEmailLimit, setNewVoucherPerEmailLimit] = useState('1');
  const [newVoucherAllowedProvince, setNewVoucherAllowedProvince] = useState('all');
  const [newVoucherAllowedDevice, setNewVoucherAllowedDevice] = useState('all');
  const [newVoucherAllowedReferrer, setNewVoucherAllowedReferrer] = useState('all');
  const [newVoucherFirstPurchaseOnly, setNewVoucherFirstPurchaseOnly] = useState(false);
  const [newVoucherDiscountType, setNewVoucherDiscountType] = useState<'percent' | 'amount'>('percent');
  const [newVoucherDiscountValue, setNewVoucherDiscountValue] = useState('20');
  const [newVoucherAllowInstallments, setNewVoucherAllowInstallments] = useState(false);
  const [newVoucherInstallmentCount, setNewVoucherInstallmentCount] = useState('2');

  // VoucherFormData object for TutsVouchers component
  const [newVoucher, setNewVoucher] = useState<VoucherFormData>({
    code: '',
    title: '',
    discountType: 'percentage',
    discountValue: 0,
    maxUses: 100,
    validFrom: '',
    validUntil: '',
    applicableProductIds: [],
    applicableCategoryIds: [],
    budgetCap: 0,
    minInstallment: 0,
    installmentsAllowed: false,
    geoLimit: '',
    deviceLimit: '',
    firstPurchaseOnly: false,
    groupId: null,
    isActive: true,
    maxDiscount: 0,
    nationalCodes: [],
  });

  const [sandboxUserId, setSandboxUserId] = useState('');

  // Sandbox Simulator States
  const [sandboxCode, setSandboxCode] = useState('WELCOME_ONLINE');
  const [sandboxCourseId, setSandboxCourseId] = useState('tut-1');
  const [sandboxEmail, setSandboxEmail] = useState('student@example.com');
  const [sandboxPhone, setSandboxPhone] = useState('۰۹۱۲۳۴۵۶۷۸۹');
  // sandboxDevice, sandboxProvince, sandboxReferrer removed per user request
  const [sandboxResult, setSandboxResult] = useState<SandboxResult | null>(null);

  // States for the survey list
  const [individualSurveys, setIndividualSurveys] = useState<any[]>([]);

  const [selectedSurveyDetails, setSelectedSurveyDetails] = useState<any | null>(null);

  // ===== Pagination States =====
  const [listPage, setListPage] = useState(1);
  const listPerPage = 12;

  // Scroll to top of course list when pagination page changes
  useEffect(() => {
    if (normModuleId === 'tuts-list') {
      requestAnimationFrame(() => {
        coursesTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [listPage, moduleId]);
  const [reportPage, setReportPage] = useState(1);
  const reportPerPage = 15;

  // Server-side paginated report data (optimized: avoids fetching all 10k records)
  const [reportStats, setReportStats] = useState<{ total_confirmed: number; online_paid: number; bank_verified: number; total_amount: number } | null>(null);
  const [reportRegistrants, setReportRegistrants] = useState<TutRegistrant[]>([]);
  const [reportTotal, setReportTotal] = useState(0);
  const [voucherPage, setVoucherPage] = useState(1);
  const voucherPerPage = 10;

  // Edit voucher state
  const [editingVoucher, setEditingVoucher] = useState<TutVoucher | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Delete voucher state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingVoucher, setDeletingVoucher] = useState<TutVoucher | null>(null);
  const [deleteConfirmWord, setDeleteConfirmWord] = useState('');
  const [deleteInput, setDeleteInput] = useState('');

  // ===== Loading Spinner Component =====
  const LoadingSpinner = ({ text }: { text?: string }) => (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <svg className="animate-spin h-8 w-8 mb-3 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="text-sm font-bold">{text || 'در حال بارگذاری...'}</span>
    </div>
  );

  // Current Jalali year (dynamic — based on real date)
  const currentJalaliYear = String(new Date().getFullYear() - 621);

  // States for reporting filters (Target: tuts-stats)
  const [statSelectedYear, setStatSelectedYear] = useState(currentJalaliYear);
  const [statSelectedCourse, setStatSelectedCourse] = useState('all');
  const [statAppliedYear, setStatAppliedYear] = useState(currentJalaliYear);
  const [statAppliedCourse, setStatAppliedCourse] = useState('all');

  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      showToast('لطفاً عنوان گروه را وارد کنید.', 'error');
      return;
    }
    if (categories.includes(trimmed)) {
      showToast('این گروه آموزشی از قبل تعریف شده است.', 'error');
      return;
    }
    try {
      const created = await coursesApi.createCourseGroup(trimmed);
      setCourseGroups(prev => [...prev, created]);
      setCategories(prev => [...prev, created.title]);
      setNewCategoryName('');
      showToast(`گروه آموزشی "${trimmed}" با موفقیت تعریف شد.`);
    } catch {
      showToast('خطا در تعریف گروه آموزشی.', 'error');
    }
  };

  const handleCreateVoucher = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = newVoucher.code.trim().toUpperCase();
    const title = newVoucher.title?.trim() || '';
    if (!code || !title) {
      showToast('لطفاً کد بن و عنوان آن را وارد کنید.', 'error');
      return;
    }

    if (vouchers.some(v => v.code === code)) {
      showToast('این کد بن خرید از قبل تعریف شده است.', 'error');
      return;
    }

    try {
      // Build backend payload
      const payload: any = {
        title,
        code,
        type: 'discount',
        type_discount: newVoucher.discountType === 'percentage' ? 'percent' : 'money',
        value: newVoucher.discountValue,
        capacity: newVoucher.maxUses > 0 ? newVoucher.maxUses : 100,
        course_id: newVoucher.applicableProductIds?.[0] || null,
        group_id: newVoucher.groupId || null,
        start_date: newVoucher.validFrom || '',
        finish_date: newVoucher.validUntil || '',
        is_active: true,
        max_discount: newVoucher.maxDiscount > 0 ? newVoucher.maxDiscount : null,
        national_code: newVoucher.nationalCodes?.length ? newVoucher.nationalCodes.join(',') : null,
      };

      const res = await vouchersApi.createCoupon(payload);
      const created = mapVoucher(res);

      setVouchers([created, ...vouchers]);
      showToast(`بن خرید جدید "${title}" با کد "${code}" با موفقیت ایجاد گردید.`);
    } catch (err: any) {
      const msg = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join('، ')
        : (err?.response?.data?.message || 'خطا در ایجاد بن تخفیف.');
      showToast(msg, 'error');
      return;
    }

    // reset form fields & switch to list tab
    setNewVoucher({
      code: '',
      title: '',
      discountType: 'percentage',
      discountValue: 0,
      maxUses: 100,
      validFrom: '',
      validUntil: '',
      applicableProductIds: [],
      applicableCategoryIds: [],
      budgetCap: 0,
      minInstallment: 0,
      installmentsAllowed: false,
      geoLimit: '',
      deviceLimit: '',
      firstPurchaseOnly: false,
      groupId: null,
      isActive: true,
      maxDiscount: 0,
      nationalCodes: [],
    });
    setVoucherActiveTab('list');
  };

  const handleUpdateVoucher = async (id: string, data: Partial<TutVoucher>) => {
    try {
      const payload: any = {};
      if (data.title !== undefined) payload.title = data.title;
      if (data.code !== undefined) payload.code = data.code;
      if (data.discountValue !== undefined) {
        payload.value = data.discountValue;
        payload.type_discount = data.discountType === 'percentage' ? 'percent' : 'money';
      }
      if (data.maxUses !== undefined) payload.capacity = data.maxUses;
      if (data.validFrom !== undefined) payload.start_date = data.validFrom;
      if (data.validTo !== undefined) payload.finish_date = data.validTo;
      if (data.discountType !== undefined) {
        payload.type_discount = data.discountType === 'percentage' ? 'percent' : 'money';
      }
      if (data.courseId !== undefined) payload.course_id = data.courseId === 'all' ? null : Number(data.courseId);
      if (data.group_id !== undefined) payload.group_id = data.group_id ? Number(data.group_id) : null;
      if (data.maxDiscount !== undefined) payload.max_discount = data.maxDiscount > 0 ? data.maxDiscount : null;
      if (data.nationalCodes !== undefined) payload.national_code = data.nationalCodes.length > 0 ? data.nationalCodes.join(',') : null;

      const res = await vouchersApi.updateCoupon(Number(id), payload);

      // Refresh local state — recalculate remainingUses and status
      setVouchers(prev => prev.map(v => {
        if (v.id !== id) return v;
        const updated = { ...v, ...data };
        const cap = updated.maxUses ?? updated.globalCap ?? 0;
        const used = updated.totalUsed ?? 0;
        updated.remainingUses = Math.max(0, cap - used);
        if (used >= cap && cap > 0) {
          updated.status = 'used' as const;
        } else if (cap > used) {
          updated.status = 'active' as const;
        }
        return updated;
      }));
      setShowEditModal(false);
      setEditingVoucher(null);
      showToast(`بن تخفیف "${data.title || ''}" با موفقیت به‌روزرسانی شد.`);
    } catch (err: any) {
      const msg = err?.errors?.code?.[0] || err?.message || 'خطا در به‌روزرسانی بن تخفیف';
      showToast(msg, 'error');
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    try {
      await vouchersApi.deleteCoupon(Number(id));
      setVouchers(prev => prev.filter(v => v.id !== id));
      setShowDeleteModal(false);
      setDeletingVoucher(null);
      setDeleteInput('');
      showToast('بن تخفیف با موفقیت حذف شد.');
    } catch (err: any) {
      const msg = err?.message || 'خطا در حذف بن تخفیف';
      showToast(msg, 'error');
      setShowDeleteModal(false);
    }
  };

  const openDeleteConfirm = (v: TutVoucher) => {
    setDeletingVoucher(v);
    setDeleteConfirmWord(String(Math.floor(1000 + Math.random() * 9000)));
    setDeleteInput('');
    setShowDeleteModal(true);
  };

  const handleRunSandboxTest = () => {
    const code = sandboxCode.trim().toUpperCase();
    const course = courses.find(c => c.id === sandboxCourseId);
    if (!course) {
      showToast('لطفاً کارگاه معتبری را انتخاب کنید.', 'error');
      return;
    }

    const vouch = vouchers.find(v => v.code.toUpperCase() === code);
    if (!vouch) {
      setSandboxResult({
        isValid: false,
        error: 'کد بن تخفیف یافت نشد.',
        discountAmount: 0,
        finalPrice: course.cost,
        originalPrice: course.cost,
        allowInstallments: false,
        checks: [
          { title: 'وجود بن در سیستم', passed: false, desc: 'بن تخفیفی با این کد در لیست دیتابیس وجود ندارد.' }
        ],
        breakdown: {
          basePrice: course.cost,
          discountAmount: 0,
          earlyBirdDiscount: 0,
          groupDiscount: 0,
          totalDiscount: 0,
        }
      });
      return;
    }

    const checks: { title: string; passed: boolean; desc: string }[] = [];
    let isValid = true;
    let failReason = '';

    // Check 1: Validity Dates
    const todayStr = '1405/03/23';
    let datePassed = true;
    let dateDesc = 'بازه زمانی آزاد است.';
    if (vouch.validFrom && todayStr < vouch.validFrom) {
      datePassed = false;
      isValid = false;
      failReason = `تاریخ فعلی (${toPersianDigits(todayStr)}) پیش از شروع اعتبار (${toPersianDigits(vouch.validFrom)}) است.`;
      dateDesc = `غیرمعتبر (قبل از شروع طرح: ${toPersianDigits(vouch.validFrom)})`;
    } else if (vouch.validTo && todayStr > vouch.validTo) {
      datePassed = false;
      isValid = false;
      failReason = `تاریخ فعلی (${toPersianDigits(todayStr)}) پس از مهلت استفاده (${toPersianDigits(vouch.validTo)}) است.`;
      dateDesc = `غیرمعتبر (منقضی شده در: ${toPersianDigits(vouch.validTo)})`;
    } else {
      if (vouch.validFrom || vouch.validTo) {
        dateDesc = `معتبر (بازه ${toPersianDigits(vouch.validFrom || '')} الی ${toPersianDigits(vouch.validTo || '')})`;
      }
    }
    checks.push({ title: 'محدودیت زمانی و تقویم', passed: datePassed, desc: dateDesc });

    // Check 3: Product Match
    let productPassed = true;
    let productDesc = 'برای تمامی کارگاه‌ها مجاز است.';
    if (vouch.courseId && vouch.courseId !== 'all') {
      if (vouch.courseId !== course.id) {
        productPassed = false;
        isValid = false;
        failReason = 'این بن تخفیف فقط برای دوره خاصی صادر شده است.';
        productDesc = `غیرمجاز (فقط مخصوص دوره با شناسه ${vouch.courseId})`;
      } else {
        productDesc = `مجاز (مخصوص همین دوره)`;
      }
    }
    checks.push({ title: 'انطباق دوره و محصول', passed: productPassed, desc: productDesc });

    // Check 4: Group Restriction
    let groupPassed = true;
    let groupDesc = 'برای تمامی گروه‌ها مجاز است.';
    if (vouch.group_id) {
      if (Number(vouch.group_id) !== course.group_id) {
        groupPassed = false;
        isValid = false;
        failReason = 'این بن تخفیف فقط برای گروه دوره خاصی معتبر است.';
        groupDesc = `غیرمجاز (مختص گروه ${vouch.group_title || vouch.group_id})`;
      } else {
        groupDesc = `مجاز (هم‌گروه با این دوره)`;
      }
    }
    checks.push({ title: 'گروه دوره', passed: groupPassed, desc: groupDesc });

    // Check 5: Maximum Discount Cap
    let maxDiscPassed = true;
    let maxDiscDesc = 'بدون سقف تخفیف.';
    if (vouch.maxDiscount && vouch.maxDiscount > 0) {
      let calculatedDiscount = 0;
      if (vouch.discountPercent) {
        calculatedDiscount = Math.round((course.cost * vouch.discountPercent) / 100);
      } else if (vouch.discountAmount) {
        calculatedDiscount = Math.min(course.cost, vouch.discountAmount);
      }
      if (calculatedDiscount > vouch.maxDiscount) {
        maxDiscPassed = false;
        isValid = false;
        failReason = `تخفیف محاسبه شده (${formatCurrency(calculatedDiscount)}) از سقف مجاز (${formatCurrency(vouch.maxDiscount)}) بیشتر است.`;
        maxDiscDesc = `غیرمجاز (${formatCurrency(calculatedDiscount)} > ${formatCurrency(vouch.maxDiscount)})`;
      } else {
        maxDiscDesc = `مجاز (${formatCurrency(calculatedDiscount)} ≤ ${formatCurrency(vouch.maxDiscount)})`;
      }
    }
    checks.push({ title: 'سقف تخفیف (Max Discount)', passed: maxDiscPassed, desc: maxDiscDesc });

    // Check 6: Global Usage Cap
    let capPassed = true;
    let capDesc = 'سقف تعداد استفاده ندارد.';
    if (vouch.globalCap) {
      if (vouch.totalUsed >= vouch.globalCap) {
        capPassed = false;
        isValid = false;
        failReason = 'تعداد مجاز استفاده از این بن به پایان رسیده است.';
        capDesc = `تکمیل ظرفیت (${toPersianDigits(vouch.totalUsed)} استفاده از ${toPersianDigits(vouch.globalCap)})`;
      } else {
        capDesc = `مجاز (ظرفیت باقی‌مانده: ${toPersianDigits(vouch.globalCap - vouch.totalUsed)} از ${toPersianDigits(vouch.globalCap)})`;
      }
    }
    checks.push({ title: 'ظرفیت کل بن (Usage Cap)', passed: capPassed, desc: capDesc });

    // Check 7: National Code Restriction
    let ncPassed = true;
    let ncDesc = 'برای همه کاربران مجاز است.';
    if (vouch.nationalCodes?.length) {
      const userNationalCode = sandboxUserId.trim();
      if (!userNationalCode) {
        ncPassed = false;
        isValid = false;
        failReason = 'لطفاً کد ملی خود را وارد کنید.';
        ncDesc = `غیرمجاز (کد ملی وارد نشده)`;
      } else if (!vouch.nationalCodes.includes(userNationalCode)) {
        ncPassed = false;
        isValid = false;
        failReason = 'این بن تخفیف فقط برای کد ملی مشخص‌شده قابل استفاده است.';
        ncDesc = `غیرمجاز (کد "${userNationalCode}" مجاز نیست)`;
      } else {
        ncDesc = `مجاز (کد ملی ${userNationalCode} در لیست)`;
      }
    }
    checks.push({ title: 'محدودیت کد ملی', passed: ncPassed, desc: ncDesc });

    // Final calculation
    let discount = 0;
    if (isValid) {
      if (vouch.discountPercent) {
        discount = Math.round((course.cost * vouch.discountPercent) / 100);
      } else if (vouch.discountAmount) {
        discount = Math.min(course.cost, vouch.discountAmount);
      }
      // Apply max discount cap
      if (vouch.maxDiscount && vouch.maxDiscount > 0 && discount > vouch.maxDiscount) {
        discount = vouch.maxDiscount;
      }
    }

    const finalPrice = Math.max(0, course.cost - discount);
    const allowInst = false;
    const instCount = 1;

    setSandboxResult({
      isValid,
      error: isValid ? undefined : failReason,
      voucher: vouch,
      discountAmount: discount,
      finalPrice,
      originalPrice: course.cost,
      allowInstallments: allowInst,
      installmentCount: instCount > 1 ? instCount : undefined,
      installmentValue: instCount > 1 ? Math.round(finalPrice / instCount) : undefined,
      checks,
      breakdown: {
        basePrice: course.cost,
        discountAmount: discount,
        earlyBirdDiscount: 0,
        groupDiscount: 0,
        totalDiscount: discount,
      }
    });

    if (isValid) {
      showToast(`شبیه‌سازی با موفقیت انجام شد: بن خرید معتبر است.`, 'success');
    } else {
      showToast(`شبیه‌سازی انجام شد: بن غیرمعتبر است. علت: ${failReason}`, 'error');
    }
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    const group = courseGroups.find(g => g.title === catToDelete);
    if (!confirm(`آیا از حذف گروه "${catToDelete}" اطمینان دارید؟`)) return;
    try {
      if (group) {
        await coursesApi.deleteCourseGroup(group.id);
      }
      setCourseGroups(prev => prev.filter(g => g.title !== catToDelete));
      setCategories(prev => prev.filter(c => c !== catToDelete));
      showToast(`گروه آموزشی "${catToDelete}" حذف گردید.`, 'info');
    } catch {
      showToast(`خطا در حذف گروه "${catToDelete}".`, 'error');
    }
  };

  const handleEditCategory = async (oldTitle: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      showToast('لطفاً عنوان گروه را وارد کنید.', 'error');
      return false;
    }
    if (oldTitle === trimmed) return true;
    if (categories.includes(trimmed)) {
      showToast('این گروه آموزشی از قبل تعریف شده است.', 'error');
      return false;
    }
    const group = courseGroups.find(g => g.title === oldTitle);
    if (!group) {
      showToast('گروه آموزشی مورد نظر یافت نشد.', 'error');
      return false;
    }
    try {
      const updated = await coursesApi.updateCourseGroup(group.id, trimmed);
      setCourseGroups(prev => prev.map(g => g.id === group.id ? updated : g));
      setCategories(prev => prev.map(c => c === oldTitle ? updated.title : c));
      showToast(`گروه آموزشی "${updated.title}" با موفقیت بروزرسانی گردید.`);
      return true;
    } catch {
      showToast('خطا در بروزرسانی گروه آموزشی.', 'error');
      return false;
    }
  };

  // Notifications
  const { toast: toastMsg, showToast } = useToast();

  // Certificate preview dialog — custom PDF viewer with react-pdf
  const [previewRegId, setPreviewRegId] = useState<string | null>(null);

  const getPublicViewUrl = (regId: string, download = false) => {
    if (download) {
      return `${BACKEND_API_URL}/certificate/${regId}`;
    }
    // For preview, use BACKEND_API_URL (same as download) so it works in both dev and production
    return `${BACKEND_API_URL}/certificate/preview/${regId}`;
  };

  // -----------------------------------------
  // 1. TUTS-LIST (WORKSHOPS PRE-REGISTRATION) STATE & HANDLERS
  // -----------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('tuts_view_mode') as 'grid' | 'list') || 'grid';
  });
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<TutCourse | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<TutCourse | null>(null);
  const [refundTarget, setRefundTarget] = useState<TutRegistrant | null>(null);
  const [refundConfirmWord, setRefundConfirmWord] = useState('');
  const [refundConfirmInput, setRefundConfirmInput] = useState('');
  const [undoRefundTarget, setUndoRefundTarget] = useState<TutRegistrant | null>(null);
  const [undoRefundConfirmWord, setUndoRefundConfirmWord] = useState('');
  const [undoRefundConfirmInput, setUndoRefundConfirmInput] = useState('');
  const [editTarget, setEditTarget] = useState<TutRegistrant | null>(null);
  const [showNewRegistration, setShowNewRegistration] = useState(false);

  const handleCopyCourseUrl = (course: TutCourse) => {
    const url = `https://terms.sau.ac.ir/course/${course.id}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('آدرس دوره کپی شد.', 'success');
    }).catch(() => {
      showToast('خطا در کپی آدرس.', 'error');
    });
  };
  const [registeringCourse, setRegisteringCourse] = useState<TutCourse | null>(null);
  const [isNewCourseModalOpen, setIsNewCourseModalOpen] = useState(false);

  // Pre-registration form fields
  const [studentName, setStudentName] = useState(user?.name || '');
  const [studentIdNum, setStudentIdNum] = useState(user?.kodmeli || '');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentProvince, setStudentProvince] = useState('تهران');
  const [studentVoucherCode, setStudentVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<TutVoucher | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherDiscountAmount, setVoucherDiscountAmount] = useState(0);
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [simulatedDevice, setSimulatedDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [simulatedReferrer, setSimulatedReferrer] = useState('');
  const [selectedBank, setSelectedBank] = useState('بانک ملی ایران');
  const [refCodeInput, setRefCodeInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // New course fields (Admin only)
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDuration, setNewCourseDuration] = useState('');
  const [newCourseCost, setNewCourseCost] = useState('');
  const [newCourseCapacity, setNewCourseCapacity] = useState('30');
  const [newCourseStartDate, setNewCourseStartDate] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState(() => categories[0] || 'علوم تربیتی و روانشناسی');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newCourseEndDate, setNewCourseEndDate] = useState('');
  const [newCourseRegStartDate, setNewCourseRegStartDate] = useState('');
  const [newCourseRegEndDate, setNewCourseRegEndDate] = useState('');
  const [newCourseActive, setNewCourseActive] = useState(true);
  const [newCourseSection, setNewCourseSection] = useState<string[]>(['normal']);
  const [newCourseImage, setNewCourseImage] = useState<File | null>(null);
  const [newCourseImagePreview, setNewCourseImagePreview] = useState<string | null>(null);
  const [newCoursePrerequisites, setNewCoursePrerequisites] = useState('');
  const [newCourseDaysOfWeek, setNewCourseDaysOfWeek] = useState<string[]>([]);
  const [newCourseTime, setNewCourseTime] = useState('');
  const [newCourseLocation, setNewCourseLocation] = useState('');

  const handleCreateNewCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle || !newCourseCost) {
      showToast('لطفاً فیلدهای ستاره‌دار و الزامی را پر کنید.', 'error');
      return;
    }

    const price = parseInt(newCourseCost.replace(/[^\d]/g, ''));
    if (isNaN(price)) {
      showToast('مبلغ شهریه نامعتبر است.', 'error');
      return;
    }

    // Map category to group_id
    const matchedGroup = courseGroups.find(g => g.title === newCourseCategory);
    const groupId = matchedGroup ? matchedGroup.id : null;

    // Clean dates: convert Persian digits to English
    const startDateEng = toEnglishDigits(newCourseStartDate);
    const endDateEng = newCourseEndDate ? toEnglishDigits(newCourseEndDate) : '';
    const regStartDateEng = newCourseRegStartDate ? toEnglishDigits(newCourseRegStartDate) : '';
    const regEndDateEng = newCourseRegEndDate ? toEnglishDigits(newCourseRegEndDate) : '';

    try {
      const formData = new FormData();
      formData.append('title', newCourseTitle);
      const selectedInstructor = instructors.find(i => String(i.id) === newCourseInstructorId);
      formData.append('instructor', selectedInstructor?.name || '');
      formData.append('amount', String(price));
      formData.append('capacity', String(parseInt(newCourseCapacity) || 30));
      formData.append('duration', String(parseInt(newCourseDuration) || 12));
      formData.append('start_date', startDateEng);
      formData.append('end_date', endDateEng || '');
      if (regStartDateEng) formData.append('registration_start_date', regStartDateEng);
      if (regEndDateEng) formData.append('registration_end_date', regEndDateEng);
      formData.append('description', newCourseDescription || '');
      formData.append('active', newCourseActive ? '1' : '0');
      if (groupId !== null) {
        formData.append('group_id', String(groupId));
      }
      newCourseSection.forEach(s => formData.append('sections[]', s));
      if (newCourseInstructorId) {
        formData.append('instructor_id', newCourseInstructorId);
      }
      if (newCoursePrerequisites) formData.append('prerequisites', newCoursePrerequisites);
      newCourseDaysOfWeek.forEach(d => formData.append('days_of_week[]', d));
      if (newCourseTime) formData.append('course_time', newCourseTime);
      if (newCourseLocation) formData.append('location', newCourseLocation);
      if (newCourseImage) {
        formData.append('image', newCourseImage);
      }

      const created = await coursesApi.createCourse(formData);

      const mappedCourse = mapCourse(created);
      setCourses([mappedCourse, ...courses]);
      setIsNewCourseModalOpen(false);
      showToast(`دوره کارگاهی جدید "${newCourseTitle}" با موفقیت تعریف گردید.`);
      // Reset Form
      setNewCourseTitle('');
      setNewCourseCost('');
      setNewCourseDuration('');
      setNewCourseCapacity('30');
      setNewCourseStartDate('');
      setNewCourseEndDate('');
      setNewCourseRegStartDate('');
      setNewCourseRegEndDate('');
      setNewCourseActive(true);
      setNewCourseCategory(categories[0] || '');
      setNewCourseDescription('');
      setNewCourseSection(['normal']);
      setNewCourseImage(null);
      setNewCourseImagePreview(null);
      setNewCourseInstructorId('');
      setNewCoursePrerequisites('');
      setNewCourseDaysOfWeek([]);
      setNewCourseTime('');
      setNewCourseLocation('');
    } catch (err: any) {
      let msg = err?.message || 'خطا در ارتباط با سرور';
      // Include validation errors if available
      const errors = err?.errors || err?.response?.data?.errors;
      if (errors) {
        const errorList = Object.values(errors).flat().join(' | ');
        msg += `: ${errorList}`;
      }
      // Include full response data for debugging
      const responseData = err?.response?.data;
      if (responseData && !errors) {
        msg += ` | ${JSON.stringify(responseData)}`;
      }
      showToast(`خطا در تعریف دوره: ${msg}`, 'error');
    }
  };

  // Editing course states (Admin only)
  const [editingCourse, setEditingCourse] = useState<TutCourse | null>(null);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseDuration, setEditCourseDuration] = useState('');
  const [editCourseCost, setEditCourseCost] = useState('');
  const [editCourseCapacity, setEditCourseCapacity] = useState('');
  const [editCourseStartDate, setEditCourseStartDate] = useState('');
  const [editCourseCategory, setEditCourseCategory] = useState('');
  const [editCourseDescription, setEditCourseDescription] = useState('');
  const [editCourseEndDate, setEditCourseEndDate] = useState('');
  const [editCourseRegStartDate, setEditCourseRegStartDate] = useState('');
  const [editCourseRegEndDate, setEditCourseRegEndDate] = useState('');
  const [editCourseActive, setEditCourseActive] = useState(true);
  const [editCourseSection, setEditCourseSection] = useState<string[]>(['normal']);
  const [editCourseImage, setEditCourseImage] = useState<File | null>(null);
  const [editCourseImagePreview, setEditCourseImagePreview] = useState<string | null>(null);
  const [editCoursePrerequisites, setEditCoursePrerequisites] = useState('');
  const [editCourseDaysOfWeek, setEditCourseDaysOfWeek] = useState<string[]>([]);
  const [editCourseTime, setEditCourseTime] = useState('');
  const [editCourseLocation, setEditCourseLocation] = useState('');

  // Course Report selection
  const [selectedCourseReport, setSelectedCourseReport] = useState<TutCourse | null>(null);
  const [reportFetchKey, setReportFetchKey] = useState(0);

  // ===== Fetch registrations on-demand when course report dialog opens =====
  useEffect(() => {
    if (!selectedCourseReport) return;

    const courseIdNum = parseInt(selectedCourseReport.id);
    if (isNaN(courseIdNum)) return;

    setLoadingRegistrants(true);
    // Re-fetch registrations for this course every time dialog opens
    coursesApi.getCourseRegistrations(courseIdNum)
      .then(data => {
        const mapped = (data || []).map(mapRegistrant);
        // Replace existing registrants for this course with fresh data
        setRegistrants(prev => [
          ...prev.filter(r => r.courseId !== selectedCourseReport.id),
          ...mapped,
        ]);
      })
      .catch(err => console.error('Error fetching course registrations:', err))
      .finally(() => setLoadingRegistrants(false));
  }, [selectedCourseReport, reportFetchKey]);

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    if (!editCourseTitle || !editCourseCost) {
      showToast('لطفاً فیلدهای ستاره‌دار و الزامی را پر کنید.', 'error');
      return;
    }

    const price = parseInt(editCourseCost.toString().replace(/[^\d]/g, ''));
    if (isNaN(price)) {
      showToast('مبلغ شهریه نامعتبر است.', 'error');
      return;
    }

    // Map category to group_id
    const matchedGroup = courseGroups.find(g => g.title === editCourseCategory);
    const groupId = matchedGroup ? matchedGroup.id : null;

    // Clean dates
    const startDateEng = toEnglishDigits(editCourseStartDate);
    const endDateEng = editCourseEndDate ? toEnglishDigits(editCourseEndDate) : '';
    const regStartDateEng = editCourseRegStartDate ? toEnglishDigits(editCourseRegStartDate) : '';
    const regEndDateEng = editCourseRegEndDate ? toEnglishDigits(editCourseRegEndDate) : '';

    try {
      const courseId = parseInt(editingCourse.id);
      const formData = new FormData();
      formData.append('title', editCourseTitle);
      const selectedInstructor = instructors.find(i => String(i.id) === editCourseInstructorId);
      formData.append('instructor', selectedInstructor?.name || '');
      formData.append('amount', String(price));
      formData.append('capacity', String(parseInt(editCourseCapacity) || 30));
      formData.append('duration', editCourseDuration || '12');
      formData.append('start_date', startDateEng);
      formData.append('end_date', endDateEng || '');
      if (regStartDateEng) formData.append('registration_start_date', regStartDateEng);
      if (regEndDateEng) formData.append('registration_end_date', regEndDateEng);
      formData.append('description', editCourseDescription || '');
      formData.append('active', editCourseActive ? '1' : '0');
      if (groupId !== null) {
        formData.append('group_id', String(groupId));
      }
      editCourseSection.forEach(s => formData.append('sections[]', s));
      if (editCourseInstructorId) {
        formData.append('instructor_id', editCourseInstructorId);
      }
      if (editCoursePrerequisites) formData.append('prerequisites', editCoursePrerequisites);
      editCourseDaysOfWeek.forEach(d => formData.append('days_of_week[]', d));
      if (editCourseTime) formData.append('course_time', editCourseTime);
      if (editCourseLocation) formData.append('location', editCourseLocation);
      if (editCourseImage) {
        formData.append('image', editCourseImage);
      }
      // Use POST with _method=PUT for form data with file upload
      formData.append('_method', 'PUT');

      const updated = await coursesApi.updateCourse(courseId, formData);

      const mappedCourse = mapCourse(updated);
      setCourses(prev => prev.map(c => c.id === editingCourse.id ? mappedCourse : c));
      setEditingCourse(null);
      showToast(`دوره کارگاهی "${editCourseTitle}" با موفقیت بروزرسانی گردید.`);
    } catch (err: any) {
      let msg = err?.response?.data?.message || err?.message || 'خطا در ارتباط با سرور';
      // Include validation errors if available
      const errors = err?.response?.data?.errors;
      if (errors) {
        const errorList = Object.values(errors).flat().join(' | ');
        msg += `: ${errorList}`;
      }
      showToast(`خطا در بروزرسانی دوره: ${msg}`, 'error');
    }
  };

  const handleToggleCourseStatus = async (id: string) => {
    try {
      const courseId = parseInt(id);
      const updated = await coursesApi.toggleCourseActive(courseId);
      const mappedCourse = mapCourse(updated);
      setCourses(prev => prev.map(c => c.id === id ? mappedCourse : c));
      const newStatus = mappedCourse.status;
      showToast(
        newStatus === 'active'
          ? `دوره "${mappedCourse.title}" مجدداً فعال گردید.`
          : `دوره "${mappedCourse.title}" غیرفعال (پایان‌یافته) گردید.`,
        'info'
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'خطا در ارتباط با سرور';
      showToast(`خطا در تغییر وضعیت دوره: ${msg}`, 'error');
    }
  };

  const handleDeleteCourse = (id: string) => {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    setCourseToDelete(course);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    const id = courseToDelete.id;
    const title = courseToDelete.title;
    try {
      const courseId = parseInt(id);
      await coursesApi.deleteCourse(courseId);
      setCourses(prev => prev.filter(c => c.id !== id));
      setRegistrants(prev => prev.filter(r => r.courseId !== id));
      showToast(`دوره آموزشی "${title}" با موفقیت حذف گردید.`, 'info');
      setCourseToDelete(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'خطا در ارتباط با سرور';
      showToast(`خطا در حذف دوره: ${msg}`, 'error');
    }
  };

  const handleExportSingleCourseExcel = (course: TutCourse) => {
    const courseRegs = registrants.filter(r => r.courseId === course.id);
    if (courseRegs.length === 0) {
      showToast('هیچ ثبت‌نامی برای این دوره یافت نشد تا خروجی گرفته شود.', 'error');
      return;
    }

    // Generate CSV content with UTF-8 BOM for proper Excel display of Persian text
    let csvContent = '\uFEFF';
    csvContent += 'ردیف,کد ملی,نام و نام خانوادگی,شماره دانشجویی,موبایل,نوع کاربر,دوره آموزشی,مبلغ (ریال),نوع پرداخت,شماره پیگیری,تاریخ ثبت نام,تاریخ تایید,وضعیت\n';

    courseRegs.forEach((r, idx) => {
      const statusText = r.status === 'verified' ? 'تایید شده' : r.status === 'rejected' ? 'رد شده' : 'در انتظار تایید';
      const verifiedDate = r.verifiedAt ? r.verifiedAt.split(' ')[0].replace(/-/g, '/') : '';
      csvContent += `"${idx + 1}","${r.nationalCode}","${r.name}","${r.studentCode}","${r.mobile}","${r.typeText}","${r.courseTitle}",${r.amount},"${r.paymentMethod}","${r.trackingCode}","${r.date}","${verifiedDate}","${statusText}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `گزارش_ثبت_نام_${course.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`فایل اکسل (CSV) ثبت‌نامی‌های دوره "${course.title}" با موفقیت صادر و دانلود شد.`);
  };

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadFileName(file.name);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const handleValidateVoucherCode = (codeToTest?: string, targetCourseOverride?: TutCourse) => {
    const code = (codeToTest || studentVoucherCode).trim().toUpperCase();
    const course = targetCourseOverride || registeringCourse;
    if (!code) {
      setVoucherError('لطفاً کد بن تخفیف را وارد کنید.');
      setAppliedVoucher(null);
      setVoucherDiscountAmount(0);
      return;
    }
    if (!course) {
      setVoucherError('کارگاهی برای بررسی یافت نشد.');
      setAppliedVoucher(null);
      setVoucherDiscountAmount(0);
      return;
    }

    const foundVoucher = vouchers.find(v => v.code.toUpperCase() === code);
    if (!foundVoucher) {
      setVoucherError('کد تخفیف معتبر نمی‌باشد یا منقضی شده است.');
      setAppliedVoucher(null);
      setVoucherDiscountAmount(0);
      return;
    }

    // 1. Time-based validations
    const todayStr = '1405/03/23'; // current date in our app context
    if (foundVoucher.validFrom && todayStr < foundVoucher.validFrom) {
      setVoucherError(`این بن هنوز فعال نشده است. شروع اعتبار از ${foundVoucher.validFrom}`);
      setAppliedVoucher(null);
      return;
    }
    if (foundVoucher.validTo && todayStr > foundVoucher.validTo) {
      setVoucherError(`این بن منقضی شده است. مهلت استفاده تا ${foundVoucher.validTo} بوده است.`);
      setAppliedVoucher(null);
      return;
    }

    // Hour validation
    if (foundVoucher.allowedHours && foundVoucher.allowedHours !== 'all') {
      // simulate checking time of 10:05 AM (outside 18:00-23:59 or other ranges)
      const currentHour = 10;
      const currentMinute = 5;
      const [start, end] = foundVoucher.allowedHours.split('-');
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const totalCur = currentHour * 60 + currentMinute;
      const totalStart = sh * 60 + sm;
      const totalEnd = eh * 60 + em;

      if (totalCur < totalStart || totalCur > totalEnd) {
        setVoucherError(`این بن تخفیف فقط در ساعات خاصی از شبانه‌روز (${toPersianDigits(foundVoucher.allowedHours)}) قابل استفاده است. ساعت فعلی سیستم: ${toPersianDigits('۱۰:۰۵')}`);
        setAppliedVoucher(null);
        return;
      }
    }

    // 2. Product-based validations
    if (foundVoucher.courseId && foundVoucher.courseId !== 'all' && foundVoucher.courseId !== course.id) {
      const matchCourse = courses.find(c => c.id === foundVoucher.courseId);
      setVoucherError(`این بن فقط برای دوره اختصاصی «${matchCourse?.title || foundVoucher.courseId}» معتبر است.`);
      setAppliedVoucher(null);
      return;
    }

    if (foundVoucher.category && foundVoucher.category !== 'all' && foundVoucher.category !== course.category) {
      setVoucherError(`این بن فقط برای کارگاه‌های دپارتمان «${foundVoucher.category}» معتبر است.`);
      setAppliedVoucher(null);
      return;
    }

    if (foundVoucher.minCoursePrice && course.cost < foundVoucher.minCoursePrice) {
      setVoucherError(`حداقل قیمت کارگاه برای استفاده از این بن باید بیشتر از ${formatCurrency(foundVoucher.minCoursePrice)} باشد.`);
      setAppliedVoucher(null);
      return;
    }

    if (foundVoucher.deliveryType && foundVoucher.deliveryType !== 'all') {
      const isOnline = course.title.includes('آنلاین') || course.description.includes('آنلاین') || course.title.includes('سمینار') || course.title.includes('وبینار');
      if (foundVoucher.deliveryType === 'online' && !isOnline) {
        setVoucherError('این بن فقط برای دوره‌های آنلاین یا سمینار وبیناری معتبر است.');
        setAppliedVoucher(null);
        return;
      }
      if (foundVoucher.deliveryType === 'in-person' && isOnline) {
        setVoucherError('این بن فقط برای کارگاه‌های حضوری و فیزیکی معتبر است.');
        setAppliedVoucher(null);
        return;
      }
    }

    // 3. Usage & Budget validations
    if (foundVoucher.globalCap && foundVoucher.totalUsed >= foundVoucher.globalCap) {
      setVoucherError('متأسفانه سقف تعداد استفاده از این بن تخفیف به پایان رسیده است.');
      setAppliedVoucher(null);
      return;
    }

    if (foundVoucher.budgetLimit && foundVoucher.budgetUsed >= foundVoucher.budgetLimit) {
      setVoucherError('سقف بودجه تخفیف‌های این جشنواره به پایان رسیده است.');
      setAppliedVoucher(null);
      return;
    }

    // 4. Contextual & Technical validations
    if (foundVoucher.allowedProvince && foundVoucher.allowedProvince !== 'all' && studentProvince !== foundVoucher.allowedProvince) {
      setVoucherError(`این بن تخفیف مخصوص کاربران استان «${foundVoucher.allowedProvince}» است. استان وارد شده: ${studentProvince}`);
      setAppliedVoucher(null);
      return;
    }

    if (foundVoucher.allowedDevice && foundVoucher.allowedDevice !== 'all' && simulatedDevice !== foundVoucher.allowedDevice) {
      setVoucherError(`این کد تخفیف فقط در نسخه ${foundVoucher.allowedDevice === 'mobile' ? 'اپلیکیشن موبایل' : 'مرورگر دسکتاپ'} معتبر است.`);
      setAppliedVoucher(null);
      return;
    }

    if (foundVoucher.allowedReferrer && foundVoucher.allowedReferrer !== 'all' && simulatedReferrer !== foundVoucher.allowedReferrer) {
      setVoucherError(`این بن فقط برای ارجاعی‌های کمپین اختصاصی «${foundVoucher.allowedReferrer}» معتبر است.`);
      setAppliedVoucher(null);
      return;
    }

    // 5. Simple Identity / First Purchase Check
    if (foundVoucher.firstPurchaseOnly) {
      const hasPurchased = registrants.some(r =>
        r.status === 'verified' &&
        (r.name.trim() === studentName.trim() || r.studentCode === studentIdNum)
      );
      if (hasPurchased) {
        setVoucherError('این بن تخفیف هدیه فقط برای «اولین خرید» کاربران جدید پورتال فعال می‌باشد.');
        setAppliedVoucher(null);
        return;
      }
    }

    // Calculation of discount
    let discount = 0;
    if (foundVoucher.discountPercent) {
      discount = Math.round((course.cost * foundVoucher.discountPercent) / 100);
    } else if (foundVoucher.discountAmount) {
      discount = Math.min(course.cost, foundVoucher.discountAmount);
    }

    setVoucherError(null);
    setAppliedVoucher(foundVoucher);
    setVoucherDiscountAmount(discount);
    if (foundVoucher.allowInstallments && foundVoucher.installmentCount) {
      setSelectedInstallments(foundVoucher.installmentCount);
    } else {
      setSelectedInstallments(1);
    }

    showToast(`بن تخفیف "${foundVoucher.title}" با موفقیت اعمال گردید.`, 'success');
  };

  const handleSubmitPreRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringCourse) return;

    if (!studentName || !studentIdNum || !refCodeInput || !uploadFileName) {
      showToast('تکمیل تمامی فیلدها و بارگذاری فیش واریزی الزامی است.', 'error');
      return;
    }

    const finalCost = Math.max(0, registeringCourse.cost - voucherDiscountAmount);

    // Create registration record in state
    const newReg: TutRegistrant & { appliedVoucherCode?: string; discountAmount?: number; installmentsCount?: number } = {
      id: `reg-${Date.now()}`,
      name: studentName,
      nationalCode: studentIdNum,
      studentCode: studentIdNum,
      mobile: studentPhone || '',
      typeText: '',
      courseId: registeringCourse.id,
      courseTitle: registeringCourse.title,
      date: '۱۴۰۵/۰۳/۲۰',
      verifiedAt: '',
      amount: finalCost,
      enrollmentCode: '',
      paymentMethod: 'فیش بانکی',
      paymentMethodRaw: 'bank_receipt',
      trackingCode: refCodeInput,
      bankReceipt: '',
      status: 'pending',
      verifiedReceipt: false,
      rejectedReceipt: false,
      appliedVoucherCode: appliedVoucher ? appliedVoucher.code : undefined,
      discountAmount: voucherDiscountAmount > 0 ? voucherDiscountAmount : undefined,
      installmentsCount: selectedInstallments > 1 ? selectedInstallments : undefined
    };

    // Update voucher stats if applied
    if (appliedVoucher) {
      setVouchers(prevVouchers => prevVouchers.map(v => {
        if (v.id === appliedVoucher.id) {
          return {
            ...v,
            totalUsed: v.totalUsed + 1,
            budgetUsed: v.budgetUsed + voucherDiscountAmount
          };
        }
        return v;
      }));
    }

    setRegistrants([newReg, ...registrants]);
    setRegisteringCourse(null);
    showToast('پیش‌ثبت‌نام شما با موفقیت ثبت شد و فیش پیوستی در صف تایید مدیریت آموزش قرار گرفت.');

    // Clear registration fields
    setRefCodeInput('');
    setUploadFileName('');
    setUploadProgress(0);
    setStudentVoucherCode('');
    setAppliedVoucher(null);
    setVoucherError(null);
    setVoucherDiscountAmount(0);
    setSelectedInstallments(1);
    setStudentEmail('');
    setStudentPhone('');
  };

  // -----------------------------------------
  // 2. TUTS-REPORTS STATE & HANDLERS
  // -----------------------------------------
  const [reportSearch, setReportSearch] = useState('');
  const [reportCourseFilter, setReportCourseFilter] = useState('');
  const [reportYear, setReportYear] = useState(currentJalaliYear);
  const [reportRefundedFilter, setReportRefundedFilter] = useState<'show' | 'hide' | 'only'>('show');

  // ===== Optimized: Server-side paginated fetch for Reports (tuts-reports) =====
  // Instead of fetching all 10000 records client-side, fetch only the needed page
  // with server-side search/filter — debounced to avoid excessive API calls.
  useEffect(() => {
    if (normModuleId !== 'tuts-reports') return;

    const timer = setTimeout(async () => {
      setLoadingRegistrants(true);
      try {
        const params: Record<string, any> = {
          per_page: reportPerPage,
          page: reportPage,
        };
        if (reportSearch.trim()) params.search = normalizePersianSearch(reportSearch.trim());
        if (reportCourseFilter) params.course_id = reportCourseFilter;
        if (reportYear) params.year = reportYear;
        params.refunded = reportRefundedFilter;

        const res = await reportsApi.getAllRegistrations(params);
        setReportRegistrants((res.data || []).map(mapRegistrant));
        setReportTotal(res.meta?.total ?? 0);
        setReportStats(res.stats ?? null);
      } catch (err) {
        console.error('Error fetching report registrations:', err);
      } finally {
        setLoadingRegistrants(false);
      }
    }, 400); // 400ms debounce for search input

    return () => clearTimeout(timer);
  }, [moduleId, reportSearch, reportCourseFilter, reportPage, reportYear, reportRefundedFilter]);

  const filteredRegistrants = normModuleId === 'tuts-reports'
    ? reportRegistrants
    : registrants.filter(reg => {
    const searchStr = normalizePersianSearch(reportSearch.toLowerCase());
    const matchText = normalizePersianSearch(reg.name.toLowerCase()).includes(searchStr) ||
      normalizePersianSearch(reg.nationalCode).includes(searchStr) ||
      normalizePersianSearch(reg.studentCode).includes(searchStr) ||
      normalizePersianSearch(reg.mobile).includes(searchStr) ||
      normalizePersianSearch(reg.trackingCode).includes(searchStr);
    const matchCourse = reportCourseFilter === '' || reg.courseId === reportCourseFilter;
    return matchText && matchCourse;
  });

  const handleExportExcel = async () => {
    try {
      const params: Record<string, any> = {};
      if (reportSearch.trim()) params.search = normalizePersianSearch(reportSearch.trim());
      if (reportCourseFilter) params.course_id = reportCourseFilter;
      if (reportYear) params.year = reportYear;
      params.refunded = reportRefundedFilter;
      await reportsApi.exportRegistrations(params);
      showToast('خروجی اکسل با موفقیت دانلود شد.', 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('خطا در دریافت خروجی اکسل. لطفاً دوباره تلاش کنید.', 'error');
    }
  };

  // -----------------------------------------
  // 3. TUTS-RECEIPTS (ADMIN REVIEW) STATE & HANDLERS
  // -----------------------------------------
  const [selectedReceiptForReview, setSelectedReceiptForReview] = useState<TutRegistrant | null>(null);
  const [rejectionInput, setRejectionInput] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [receiptWorkspaceStatusFilter, setReceiptWorkspaceStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [receiptWorkspaceCourseFilter, setReceiptWorkspaceCourseFilter] = useState<string>('all');
  const [receiptWorkspaceSearchCode, setReceiptWorkspaceSearchCode] = useState<string>('');

  const handleApproveReceipt = (id: string) => {
    const regToApprove = registrants.find(r => r.id === id);
    if (!regToApprove) return;

    // Update registrant status
    setRegistrants(prev => prev.map(r => r.id === id ? { ...r, status: 'verified', rejectionReason: undefined } : r));

    // Increment course enrolled count if not already verified
    if (regToApprove.status !== 'verified') {
      setCourses(prev => prev.map(c => c.id === regToApprove.courseId ? { ...c, enrolled: Math.min(c.capacity, c.enrolled + 1) } : c));
    }

    setSelectedReceiptForReview(null);
    showToast(`فیش واریزی ${regToApprove.name} با موفقیت تایید و ثبت‌نام نهایی شد.`);
  };

  const handleRejectReceipt = (id: string) => {
    if (!rejectionInput.trim()) {
      showToast('لطفاً دلیل عدم تایید فیش را بنویسید.', 'error');
      return;
    }

    const regToReject = registrants.find(r => r.id === id);
    if (!regToReject) return;

    // Update status to rejected
    setRegistrants(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected', rejectionReason: rejectionInput } : r));

    // Decrement course enrolled count if it was verified previously
    if (regToReject.status === 'verified') {
      setCourses(prev => prev.map(c => c.id === regToReject.courseId ? { ...c, enrolled: Math.max(0, c.enrolled - 1) } : c));
    }

    setSelectedReceiptForReview(null);
    setShowRejectBox(false);
    setRejectionInput('');
    showToast(`فیش واریزی ${regToReject.name} رد صلاحیت شد و علت به کارتابل دانشجو ارسال گردید.`, 'info');
  };

  // ========== Refund Handler (برای گزارش ثبت‌نامی‌ها) ==========
  const executeRefund = async (id: string) => {
    const reg = reportRegistrants.find(r => r.id === id);
    if (!reg) return;

    try {
      await receiptsApi.refundRegistration(id);
      // Update local state: mark as refunded
      setReportRegistrants(prev => prev.map(r =>
        r.id === id ? { ...r, status: 'refunded' as const } : r
      ));
      showToast(`ثبت‌نام ${reg.name} - ${reg.courseTitle} با موفقیت مستردد شد.`);
    } catch (err: any) {
      const msg = err?.errors?.[0] || err?.message || 'خطا در مستردد کردن ثبت‌نام';
      showToast(msg, 'error');
    }
  };

  const confirmRefund = () => {
    if (refundTarget) {
      executeRefund(refundTarget.id);
      setRefundTarget(null);
    }
  };

  const executeUndoRefund = async (id: string) => {
    const reg = reportRegistrants.find(r => r.id === id);
    if (!reg) return;

    try {
      await receiptsApi.undoRefundRegistration(id);
      setReportRegistrants(prev => prev.map(r =>
        r.id === id ? { ...r, status: 'verified' as const } : r
      ));
      showToast(`وضعیت مستردد ثبت‌نام ${reg.name} - ${reg.courseTitle} با موفقیت لغو شد.`);
    } catch (err: any) {
      const msg = err?.errors?.[0] || err?.message || 'خطا در لغو مستردد';
      showToast(msg, 'error');
    }
  };

  const confirmUndoRefund = () => {
    if (undoRefundTarget) {
      executeUndoRefund(undoRefundTarget.id);
      setUndoRefundTarget(null);
    }
  };

  // Generate random confirm word when refund / undo-refund modal opens
  useEffect(() => {
    if (refundTarget) {
      setRefundConfirmWord(String(Math.floor(1000 + Math.random() * 9000)));
      setRefundConfirmInput('');
    }
  }, [refundTarget]);

  useEffect(() => {
    if (undoRefundTarget) {
      setUndoRefundConfirmWord(String(Math.floor(1000 + Math.random() * 9000)));
      setUndoRefundConfirmInput('');
    }
  }, [undoRefundTarget]);

  // ========== Edit Registration Handler ==========
  const handleEditRegistration = async (id: string, data: Record<string, string>) => {
    const reg = reportRegistrants.find(r => r.id === id);
    if (!reg) return;

    try {
      // Map frontend field names to backend field names (مطابق terms_frontend)
      const payload: Record<string, string> = {};
      if (data.name !== undefined) payload.fullname = data.name;
      if (data.nationalCode !== undefined) payload.kodmeli = data.nationalCode;
      if (data.studentCode !== undefined) payload.id_edu = data.studentCode;
      if (data.mobile !== undefined) payload.mobile = data.mobile;
      if (data.universityRelation !== undefined) {
        payload.type = data.universityRelation === 'student' ? '1' : '2';
      }
      if (data.skills !== undefined) payload.skills = data.skills;
      if (data.motivation !== undefined) payload.motivation = data.motivation;

      await reportsApi.updateRegistration(id, payload);

      // Update local state with fields that are visible in the table
      setReportRegistrants(prev => prev.map(r =>
        r.id === id ? {
          ...r,
          ...(data.name !== undefined && { name: data.name }),
          ...(data.nationalCode !== undefined && { nationalCode: data.nationalCode }),
          ...(data.studentCode !== undefined && { studentCode: data.studentCode }),
          ...(data.mobile !== undefined && { mobile: data.mobile }),
          ...(data.universityRelation !== undefined && { type: data.universityRelation === 'student' ? '1' : '2' }),
        } : r
      ));

      setEditTarget(null);
      showToast(`اطلاعات ثبت‌نام ${reg.name} با موفقیت به‌روزرسانی شد.`);
    } catch (err: any) {
      const msg = err?.errors?.[0] || err?.message || 'خطا در ویرایش اطلاعات ثبت‌نام';
      showToast(msg, 'error');
    }
  };

  // ========== Manual New Registration Handler ==========
  const handleNewRegistration = async (data: {
    course_id: number;
    fullname: string;
    kodmeli: string;
    mobile: string;
    type: string;
    id_edu?: string;
    skills?: string;
    motivation?: string;
  }) => {
    try {
      const newReg = await reportsApi.createRegistration(data);
      // Close dialog and refresh the registrations list
      setShowNewRegistration(false);
      // Trigger re-fetch by slightly changing the search or page
      // The easiest: reset to page 1 and let the useEffect re-fetch
      setReportPage(1);
      showToast(`فراگیر ${data.fullname} با موفقیت به دوره اضافه شد.`);
    } catch (err: any) {
      const msg = err?.errors?.[0] || err?.message || 'خطا در ثبت‌نام دستی فراگیر';
      showToast(msg, 'error');
    }
  };

  // ========== Certificate Handlers ==========
  const [certificateNotif, setCertificateNotif] = useState<string | null>(null);

  const handleApproveCertificate = async (registerId: string) => {
    try {
      const res = await certificatesApi.approveCertificate(registerId);
      setRegistrants(prev => prev.map(r =>
        r.id === registerId ? { ...r, certificateApproved: true } : r
      ));
      setCertificateNotif(res.message || 'تایید شد.');
      showToast(res.message || 'ثبت‌نام برای صدور گواهی تایید شد.');
    } catch (err: any) {
      showToast(err.message || 'خطا در تایید گواهی', 'error');
    }
  };

  const handleRejectCertificate = async (registerId: string) => {
    try {
      const res = await certificatesApi.rejectCertificate(registerId);
      setRegistrants(prev => prev.map(r =>
        r.id === registerId ? { ...r, certificateApproved: false, certificateNumber: undefined, hasCertificate: false } : r
      ));
      setCertificateNotif(res.message || 'تایید لغو شد.');
      showToast(res.message || 'تایید صدور گواهی لغو شد.');
    } catch (err: any) {
      showToast(err.message || 'خطا در لغو تایید گواهی', 'error');
    }
  };

  const handleGenerateCertificate = async (registerId: string, fullname: string) => {
    try {
      // Open the public certificate URL in a new tab — browser handles the download natively
      window.open(`${BACKEND_API_URL}/certificate/${registerId}`, '_blank');
      // Refresh registrants to get updated certificate info
      const res = await reportsApi.getAllRegistrations({ per_page: 1000 });
      setRegistrants((res.data || []).map(mapRegistrant));
      showToast('گواهی با موفقیت صادر شد.');
    } catch (err: any) {
      showToast(err.message || 'خطا در صدور گواهی', 'error');
    }
  };

  const handlePreviewCertificate = async (registerId: string) => {
    // Open the dialog — PDF loading state is managed inside CertificatePreviewDialog
    setPreviewRegId(registerId);
  };

  const handleClosePreRegistration = () => {
    setRegisteringCourse(null);
    setStudentVoucherCode('');
    setAppliedVoucher(null);
    setVoucherError(null);
    setVoucherDiscountAmount(0);
  };

  const handleEditCourseFromDetail = (course: TutCourse) => {
    setSelectedCourseForDetail(null);
    setEditingCourse(course);
    setEditCourseTitle(course.title);
    setEditCourseDuration(course.duration);
    setEditCourseCost(formatCostInput(course.cost.toString()));
    setEditCourseCapacity(course.capacity.toString());
    setEditCourseStartDate(course.startDate);
    setEditCourseCategory(course.category);
    setEditCourseDescription(course.description);
    setEditCourseEndDate(course.endDate);
    setEditCourseRegStartDate(course.registrationStartDate || '');
    setEditCourseRegEndDate(course.registrationEndDate || '');
    setEditCourseActive(course.status === 'active');
    setEditCourseSection(Array.isArray(course.sections) ? course.sections : ['normal']);
    setEditCourseImagePreview(course.image || null);
    setEditCourseImage(null);
    setEditCourseInstructorId(course.instructor_id ? String(course.instructor_id) : '');
    setEditCourseInstructorSearch(course.instructor_name || '');
    setEditCoursePrerequisites(course.prerequisites || '');
    setEditCourseDaysOfWeek(course.daysOfWeek || []);
    setEditCourseTime(course.courseTime || '');
    setEditCourseLocation(course.location || '');
  };

  const handleApproveAllCertificates = async () => {
    const courseId = selectedCourseReport?.id;
    if (!courseId) {
      showToast('لطفاً ابتدا یک دوره را انتخاب کنید.', 'error');
      return;
    }
    if (!confirm('آیا از تایید همه ثبت‌نام‌های این دوره برای صدور گواهی مطمئن هستید؟')) return;
    try {
      const res = await certificatesApi.approveAllCertificates(Number(courseId));
      setRegistrants(prev => prev.map(r =>
        r.courseId === courseId ? { ...r, certificateApproved: true } : r
      ));
      showToast(res.message || 'همه ثبت‌نام‌ها برای صدور گواهی تایید شدند.');
    } catch (err: any) {
      showToast(err.message || 'خطا در تایید همه', 'error');
    }
  };

  const handleDownloadAllCertificates = async () => {
    try {
      const courseId = selectedCourseReport?.id ? Number(selectedCourseReport.id) : undefined;
      const blob = await certificatesApi.downloadAllCertificates(courseId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificates_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('فایل فشرده گواهی‌ها با موفقیت دانلود شد.');
    } catch (err: any) {
      showToast(err.message || 'خطا در دانلود فایل فشرده', 'error');
    }
  };

  // -----------------------------------------
  // 4. TUTS-STATS (CHART SELECTION & INTERACTIVE STATE)
  // -----------------------------------------

  const currentModuleTitle = () => {
    switch (moduleId) {
      case 'tuts-list': return 'دوره های آموزشی';
      case 'tuts-reports': return 'گزارشات ثبت نام ها';
      case 'tuts-receipts': return 'مدیریت فیش های بانکی';
      case 'tuts-stats': return 'گزارشات آماری دوره‌های آموزشی';
      case 'tuts-surveys': return 'مدیریت نظرسنجی های دوره های آموزشی';
      case 'tuts-surveys-stats': return 'آمار و نمودارهای نظرسنجی';
      case 'tuts-vouchers': return 'مدیریت و شرایط بن خرید';
      default: return 'مدیریت دوره‌های آموزشی';
    }
  };

  const filteredCoursesForListing = courses.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchSearch = c.title.toLowerCase().includes(q) ||
      c.lecturer.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q));
    const matchCategory = selectedCategory === '' || c.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div id="tuts-management-container" className="py-2.5 relative">
      <ToastNotification toast={toastMsg} />

      {/* Header Banner Section */}


      {/* =========================================================================
          MODULE 1: TUTS-LIST (PRE-REGISTRATION CATALOG)
          ========================================================================= */}
      {normModuleId === 'tuts-list' && (
        <CoursesTab
          coursesTopRef={coursesTopRef}
          courses={courses}
          registrants={registrants}
          categories={categories}
          courseGroups={courseGroups}
          loadingCourses={loadingCourses}
          currentUserRole={currentUserRole}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          viewMode={viewMode}
          setViewMode={setViewMode}
          listPage={listPage}
          setListPage={setListPage}
          listPerPage={listPerPage}
          filteredCoursesForListing={filteredCoursesForListing}
          isCategoryModalOpen={isCategoryModalOpen}
          setIsCategoryModalOpen={setIsCategoryModalOpen}
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          handleAddCategory={handleAddCategory}
          handleDeleteCategory={handleDeleteCategory}
          handleEditCategory={handleEditCategory}
          isInstructorManagementOpen={isInstructorManagementOpen}
          setIsInstructorManagementOpen={setIsInstructorManagementOpen}
          instructors={instructors}
          setInstructors={setInstructors}
          selectedCourseForDetail={selectedCourseForDetail}
          setSelectedCourseForDetail={setSelectedCourseForDetail}
          handleEditCourseFromDetail={handleEditCourseFromDetail}
          courseToDelete={courseToDelete}
          setCourseToDelete={setCourseToDelete}
          confirmDeleteCourse={confirmDeleteCourse}
          registeringCourse={registeringCourse}
          studentName={studentName}
          setStudentName={setStudentName}
          studentIdNum={studentIdNum}
          setStudentIdNum={setStudentIdNum}
          studentEmail={studentEmail}
          setStudentEmail={setStudentEmail}
          studentPhone={studentPhone}
          setStudentPhone={setStudentPhone}
          studentProvince={studentProvince}
          setStudentProvince={setStudentProvince}
          simulatedDevice={simulatedDevice}
          setSimulatedDevice={setSimulatedDevice}
          simulatedReferrer={simulatedReferrer}
          setSimulatedReferrer={setSimulatedReferrer}
          studentVoucherCode={studentVoucherCode}
          setStudentVoucherCode={setStudentVoucherCode}
          appliedVoucher={appliedVoucher}
          voucherError={voucherError}
          voucherDiscountAmount={voucherDiscountAmount}
          selectedInstallments={selectedInstallments}
          setSelectedInstallments={setSelectedInstallments}
          refCodeInput={refCodeInput}
          setRefCodeInput={setRefCodeInput}
          selectedBank={selectedBank}
          setSelectedBank={setSelectedBank}
          uploadProgress={uploadProgress}
          uploadFileName={uploadFileName}
          isUploading={isUploading}
          handleSubmitPreRegister={handleSubmitPreRegister}
          handleValidateVoucherCode={handleValidateVoucherCode}
          handleClosePreRegistration={handleClosePreRegistration}
          handleSimulateUpload={handleSimulateUpload}
          isNewCourseModalOpen={isNewCourseModalOpen}
          setIsNewCourseModalOpen={setIsNewCourseModalOpen}
          newCourseTitle={newCourseTitle}
          setNewCourseTitle={setNewCourseTitle}
          newCourseCategory={newCourseCategory}
          setNewCourseCategory={setNewCourseCategory}
          newCourseInstructorSearch={newCourseInstructorSearch}
          setNewCourseInstructorSearch={setNewCourseInstructorSearch}
          newCourseInstructorOpen={newCourseInstructorOpen}
          setNewCourseInstructorOpen={setNewCourseInstructorOpen}
          newCourseInstructorId={newCourseInstructorId}
          setNewCourseInstructorId={setNewCourseInstructorId}
          newCourseSection={newCourseSection}
          setNewCourseSection={setNewCourseSection}
          newCourseActive={newCourseActive}
          setNewCourseActive={setNewCourseActive}
          newCourseDuration={newCourseDuration}
          setNewCourseDuration={setNewCourseDuration}
          newCourseCapacity={newCourseCapacity}
          setNewCourseCapacity={setNewCourseCapacity}
          newCourseCost={newCourseCost}
          setNewCourseCost={setNewCourseCost}
          newCourseStartDate={newCourseStartDate}
          setNewCourseStartDate={setNewCourseStartDate}
          newCourseEndDate={newCourseEndDate}
          setNewCourseEndDate={setNewCourseEndDate}
          newCourseRegStartDate={newCourseRegStartDate}
          setNewCourseRegStartDate={setNewCourseRegStartDate}
          newCourseRegEndDate={newCourseRegEndDate}
          setNewCourseRegEndDate={setNewCourseRegEndDate}
          newCourseImage={newCourseImage}
          setNewCourseImage={setNewCourseImage}
          newCourseImagePreview={newCourseImagePreview}
          setNewCourseImagePreview={setNewCourseImagePreview}
          newCourseDescription={newCourseDescription}
          setNewCourseDescription={setNewCourseDescription}
          newCoursePrerequisites={newCoursePrerequisites}
          setNewCoursePrerequisites={setNewCoursePrerequisites}
          newCourseDaysOfWeek={newCourseDaysOfWeek}
          setNewCourseDaysOfWeek={setNewCourseDaysOfWeek}
          newCourseTime={newCourseTime}
          setNewCourseTime={setNewCourseTime}
          newCourseLocation={newCourseLocation}
          setNewCourseLocation={setNewCourseLocation}
          filteredNewCourseInstructors={filteredNewCourseInstructors}
          handleCreateNewCourse={handleCreateNewCourse}
          editingCourse={editingCourse}
          setEditingCourse={setEditingCourse}
          editCourseTitle={editCourseTitle}
          setEditCourseTitle={setEditCourseTitle}
          editCourseCategory={editCourseCategory}
          setEditCourseCategory={setEditCourseCategory}
          editCourseInstructorSearch={editCourseInstructorSearch}
          setEditCourseInstructorSearch={setEditCourseInstructorSearch}
          editCourseInstructorOpen={editCourseInstructorOpen}
          setEditCourseInstructorOpen={setEditCourseInstructorOpen}
          editCourseInstructorId={editCourseInstructorId}
          setEditCourseInstructorId={setEditCourseInstructorId}
          editCourseSection={editCourseSection}
          setEditCourseSection={setEditCourseSection}
          editCourseActive={editCourseActive}
          setEditCourseActive={setEditCourseActive}
          editCourseDuration={editCourseDuration}
          setEditCourseDuration={setEditCourseDuration}
          editCourseCapacity={editCourseCapacity}
          setEditCourseCapacity={setEditCourseCapacity}
          editCourseCost={editCourseCost}
          setEditCourseCost={setEditCourseCost}
          editCourseStartDate={editCourseStartDate}
          setEditCourseStartDate={setEditCourseStartDate}
          editCourseEndDate={editCourseEndDate}
          setEditCourseEndDate={setEditCourseEndDate}
          editCourseRegStartDate={editCourseRegStartDate}
          setEditCourseRegStartDate={setEditCourseRegStartDate}
          editCourseRegEndDate={editCourseRegEndDate}
          setEditCourseRegEndDate={setEditCourseRegEndDate}
          editCourseImage={editCourseImage}
          setEditCourseImage={setEditCourseImage}
          editCourseImagePreview={editCourseImagePreview}
          setEditCourseImagePreview={setEditCourseImagePreview}
          editCourseDescription={editCourseDescription}
          setEditCourseDescription={setEditCourseDescription}
          editCoursePrerequisites={editCoursePrerequisites}
          setEditCoursePrerequisites={setEditCoursePrerequisites}
          editCourseDaysOfWeek={editCourseDaysOfWeek}
          setEditCourseDaysOfWeek={setEditCourseDaysOfWeek}
          editCourseTime={editCourseTime}
          setEditCourseTime={setEditCourseTime}
          editCourseLocation={editCourseLocation}
          setEditCourseLocation={setEditCourseLocation}
          filteredEditCourseInstructors={filteredEditCourseInstructors}
          handleUpdateCourse={handleUpdateCourse}
          selectedCourseReport={selectedCourseReport}
          setSelectedCourseReport={setSelectedCourseReport}
          setReportFetchKey={setReportFetchKey}
          handleExportSingleCourseExcel={handleExportSingleCourseExcel}
          handleApproveAllCertificates={handleApproveAllCertificates}
          handleDownloadAllCertificates={handleDownloadAllCertificates}
          handleApproveCertificate={handleApproveCertificate}
          handleRejectCertificate={handleRejectCertificate}
          handlePreviewCertificate={handlePreviewCertificate}
          handleCopyCourseUrl={handleCopyCourseUrl}
          handleToggleCourseStatus={handleToggleCourseStatus}
          handleDeleteCourse={handleDeleteCourse}
          formatCurrency={formatCurrency}
          toPersianDigits={toPersianDigits}
          formatCostInput={formatCostInput}
          showToast={showToast}
        />
      )}


      {normModuleId === 'tuts-reports' && (
        <ReportsTab
          courses={courses}
          loadingRegistrants={loadingRegistrants}
          reportSearch={reportSearch}
          setReportSearch={setReportSearch}
          reportCourseFilter={reportCourseFilter}
          setReportCourseFilter={setReportCourseFilter}
          reportYear={reportYear}
          setReportYear={setReportYear}
          reportRefundedFilter={reportRefundedFilter}
          setReportRefundedFilter={setReportRefundedFilter}
          reportPage={reportPage}
          setReportPage={setReportPage}
          reportPerPage={reportPerPage}
          reportTotal={reportTotal}
          reportStats={reportStats}
          filteredRegistrants={filteredRegistrants}
          handleExportExcel={handleExportExcel}
          onNewRegistration={() => setShowNewRegistration(true)}
          onRefundRequest={(reg) => setRefundTarget(reg)}
          onUndoRefund={(reg) => setUndoRefundTarget(reg)}
          onEditRequest={(reg) => setEditTarget(reg)}
        />
      )}

      {normModuleId === 'tuts-receipts' && (
        <ReceiptsTab
          registrants={registrants}
          courses={courses}
          selectedReceiptForReview={selectedReceiptForReview}
          setSelectedReceiptForReview={setSelectedReceiptForReview}
          receiptWorkspaceStatusFilter={receiptWorkspaceStatusFilter}
          setReceiptWorkspaceStatusFilter={(v: string) => setReceiptWorkspaceStatusFilter(v as 'all' | 'pending' | 'verified' | 'rejected')}
          receiptWorkspaceCourseFilter={receiptWorkspaceCourseFilter}
          setReceiptWorkspaceCourseFilter={setReceiptWorkspaceCourseFilter}
          receiptWorkspaceSearchCode={receiptWorkspaceSearchCode}
          setReceiptWorkspaceSearchCode={setReceiptWorkspaceSearchCode}
          showRejectBox={showRejectBox}
          setShowRejectBox={setShowRejectBox}
          rejectionInput={rejectionInput}
          setRejectionInput={setRejectionInput}
          handleApproveReceipt={handleApproveReceipt}
          handleRejectReceipt={handleRejectReceipt}
        />
      )}

      {normModuleId === 'tuts-stats' && (
        <StatsTab
          courses={courses}
          categories={categories}
          statSelectedYear={statSelectedYear}
          setStatSelectedYear={setStatSelectedYear}
          statSelectedCourse={statSelectedCourse}
          setStatSelectedCourse={setStatSelectedCourse}
          statAppliedYear={statAppliedYear}
          statAppliedCourse={statAppliedCourse}
          setStatAppliedYear={setStatAppliedYear}
          setStatAppliedCourse={setStatAppliedCourse}
          showToast={showToast}
        />
      )}

      {normModuleId === 'tuts-surveys' && (
        <SurveysTab
          currentUserRole={currentUserRole}
          individualSurveys={individualSurveys}
          loadingSurveys={loadingSurveys}
          selectedSurveyDetails={selectedSurveyDetails}
          setSelectedSurveyDetails={setSelectedSurveyDetails}
        />
      )}

      {normModuleId === 'tuts-vouchers' && (
        <VouchersTab
          vouchers={vouchers}
          courses={courses}
          categories={categories}
          courseGroups={courseGroups}
          loadingVouchers={loadingVouchers}
          voucherActiveTab={voucherActiveTab}
          setVoucherActiveTab={setVoucherActiveTab}
          newVoucher={newVoucher}
          setNewVoucher={setNewVoucher}
          sandboxCode={sandboxCode}
          setSandboxCode={setSandboxCode}
          sandboxCourseId={sandboxCourseId}
          setSandboxCourseId={setSandboxCourseId}
          sandboxUserId={sandboxUserId}
          setSandboxUserId={setSandboxUserId}
          sandboxEmail={sandboxEmail}
          setSandboxEmail={setSandboxEmail}
          sandboxPhone={sandboxPhone}
          setSandboxPhone={setSandboxPhone}
          sandboxResult={sandboxResult}
          setSandboxResult={setSandboxResult}
          voucherPage={voucherPage}
          setVoucherPage={setVoucherPage}
          voucherPerPage={voucherPerPage}
          handleCreateVoucher={handleCreateVoucher}
          handleRunSandboxTest={handleRunSandboxTest}
          editingVoucher={editingVoucher}
          setEditingVoucher={setEditingVoucher}
          showEditModal={showEditModal}
          setShowEditModal={setShowEditModal}
          showDeleteModal={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
          deletingVoucher={deletingVoucher}
          setDeletingVoucher={setDeletingVoucher}
          deleteConfirmWord={deleteConfirmWord}
          deleteInput={deleteInput}
          setDeleteInput={setDeleteInput}
          handleUpdateVoucher={handleUpdateVoucher}
          handleDeleteVoucher={handleDeleteVoucher}
          openDeleteConfirm={openDeleteConfirm}
        />
      )}

      {/* CategoryManagerDialog & DeleteCourseDialog moved to CoursesTab */}

      {/* Certificate Preview Dialog */}
      <CertificatePreviewDialog
        regId={previewRegId}
        registrantName={registrants.find(r => r.id === previewRegId)?.name ?? ''}
        hasCertificate={registrants.find(r => r.id === previewRegId)?.hasCertificate ?? false}
        getPublicViewUrl={getPublicViewUrl}
        toPersianDigits={toPersianDigits}
        onClose={() => { setPreviewRegId(null); }}
        onGenerateCertificate={(regId) => handleGenerateCertificate(regId, registrants.find(r => r.id === regId)?.name ?? '')}
      />

      {/* ===== REFUND CONFIRMATION MODAL ===== */}

      {/* Refund Confirmation Modal */}
      <RefundConfirmDialog
        target={refundTarget}
        confirmWord={refundConfirmWord}
        confirmInput={refundConfirmInput}
        onInputChange={setRefundConfirmInput}
        onConfirm={confirmRefund}
        onClose={() => setRefundTarget(null)}
      />

      {/* ===== UNDO REFUND CONFIRMATION MODAL ===== */}

      {/* Undo Refund Confirmation Modal */}
      <UndoRefundConfirmDialog
        target={undoRefundTarget}
        confirmWord={undoRefundConfirmWord}
        confirmInput={undoRefundConfirmInput}
        onInputChange={setUndoRefundConfirmInput}
        onConfirm={confirmUndoRefund}
        onClose={() => setUndoRefundTarget(null)}
      />

      {/* ===== EDIT REGISTRATION MODAL ===== */}
      <EditRegistrationDialog
        target={editTarget}
        onSave={handleEditRegistration}
        onClose={() => setEditTarget(null)}
      />

      {/* ===== NEW REGISTRATION MODAL ===== */}
      <NewRegistrationDialog
        open={showNewRegistration}
        courses={courses}
        onSave={handleNewRegistration}
        onClose={() => setShowNewRegistration(false)}
      />
    </div >
  );
}
