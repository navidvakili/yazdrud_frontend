import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar, User, CheckCircle, XCircle, AlertTriangle,
  FileText, Sparkles, Info, BookOpen, Search, Filter, Layers, Plus, Clock, Copy, Edit2,
  BarChart2, Power, Download, Trash2, X, Upload, Check, Eye, Award, LayoutGrid, List, RotateCcw,
} from 'lucide-react';
import { User as UserType } from '@/src/types';
import api from '@/src/api';
import { BACKEND_API_URL } from '@/src/lib/constants';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import Pagination from './Pagination';
import type { VoucherFormData, SandboxResult } from './tuts/tuts-types';

// Configure PDF.js worker — served from /public/ to avoid CSP issues with CDN
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
import TutsCourseList from './tuts/TutsCourseList';
import TutsReports from './tuts/TutsReports';
import TutsReceipts from './tuts/TutsReceipts';
import TutsStats from './tuts/TutsStats';
import TutsSurveys from './tuts/TutsSurveys';
import TutsSurveysStats from './tuts/TutsSurveysStats';
import TutsVouchers from './tuts/TutsVouchers';
import TutsModals from './tuts/TutsModals';
import { JalaliDatepicker } from './tuts/JalaliDatepicker';
import { formatCostInput } from './tuts/tuts-utils';

interface TutsModuleProps {
  user: UserType | null;
  activeTabId: string;
  moduleId: string;
  onOpenTab?: (id: string, title: string, iconName: string, forceNewInstance?: boolean) => void;
}

interface TutCourse {
  id: string;
  title: string;
  lecturer: string;
  duration: string;
  cost: number; // in Rials
  enrolled: number;
  capacity: number;
  startDate: string;
  endDate: string;
  registrationStartDate: string;
  registrationEndDate: string;
  status: 'active' | 'completed' | 'ended';
  description: string;
  category: string;
  section: string; // 'normal' | 'featured' | 'pre_register' | 'free'
  image: string | null;
  instructor_id: number | null;
  instructor_name: string | null;
}

interface TutRegistrant {
  id: string;
  name: string;
  nationalCode: string;
  studentCode: string;
  mobile: string;
  typeText: string;
  courseId: string;
  courseTitle: string;
  date: string;
  verifiedAt: string;
  amount: number;
  paymentMethod: string;
  trackingCode: string;
  bankReceipt: string;
  status: 'pending' | 'verified' | 'rejected' | 'refunded';
  rejectionReason?: string;
  // Certificate fields
  certificateApproved?: boolean;
  certificateNumber?: string;
  certificateIssuedAt?: string;
  hasCertificate?: boolean;
}

interface TutSurvey {
  courseId: string;
  courseTitle: string;
  rating: number;
  totalResponses: number;
  breakdown: {
    content: number; // percentage
    lecturer: number;
    organization: number;
    facilities: number;
  };
  comments: {
    user: string;
    rating: number;
    comment: string;
    date: string;
  }[];
}

interface TutVoucher {
  id: string;
  code: string; // The main coupon code, e.g. "YALDA1405" or "FIRST100"
  title: string;
  // 1. Time-based
  validFrom?: string; // YYYY/MM/DD
  validTo?: string; // YYYY/MM/DD
  allowedHours?: string; // e.g. "02:00-06:00"
  daysSincePublish?: number; // e.g. 5 days after course start
  occasion?: string; // e.g. "تخفیف شب یلدا"

  // 2. Product-based
  courseId?: string; // "tut-1" or "all"
  category?: string; // specific department or "all"
  courseLevel?: 'all' | 'elementary' | 'advanced';
  deliveryType?: 'all' | 'online' | 'in-person';
  minCoursePrice?: number; // minimum course cost in Rials

  // 3. Usage & Budget
  globalCap?: number; // total allowed uses (e.g. 100)
  totalUsed: number;
  isSingleUseList?: boolean; // if yes, it's a list of single-use pre-generated codes
  singleUseCodes?: { code: string; isUsed: boolean }[];
  budgetLimit?: number; // total discount budget in Rials
  budgetUsed: number;
  perEmailLimit?: number; // max times an email/mobile can use this code

  // 4. Contextual & Technical
  allowedProvince?: string; // "خراسان رضوی" or "all"
  allowedDevice?: 'all' | 'desktop' | 'mobile';
  allowedReferrer?: string; // UTM source parameter like "blog" or "instagram"
  urlParam?: string; // auto-apply parameter name like "STUDENT"

  // 5. Simple Identity
  firstPurchaseOnly?: boolean; // if true, user must have no previous paid registrations

  // 6. Effect Combination
  discountPercent?: number; // percent discount, e.g. 20
  discountAmount?: number; // absolute discount in Rials, e.g. 500000
  discountValue?: number; // discount value used for display
  discountType?: 'percentage' | 'fixed'; // how the discount is applied
  maxUses?: number; // usage capacity
  remainingUses?: number; // remaining uses
  status?: 'active' | 'used' | 'expired'; // voucher status
  allowInstallments?: boolean; // whether this voucher enables installment plans
  installmentCount?: number; // number of installments allowed
}

// Persian helper functions
function toPersianDigits(str: string | number): string {
  if (str === null || str === undefined) return '';
  const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.toString().replace(/[0-9]/g, function (w) {
    return id[+w];
  });
}

function toEnglishDigits(str: string): string {
  if (!str) return '';
  return str.toString().replace(/[۰-۹]/g, function (d) {
    return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  });
}

/**
 * Normalize Persian/Arabic search string:
 * - Convert Arabic ي (ye) to Persian ی
 * - Convert Arabic ك (kaf) to Persian ک
 * - Convert Arabic/Persian digits to Latin digits
 * This ensures searches work regardless of which character form the user types.
 */
function normalizePersianSearch(str: string): string {
  if (!str) return '';
  return str
    // Arabic ي → Persian ی
    .replace(/ي/g, 'ی')
    // Arabic ك → Persian ک
    .replace(/ك/g, 'ک')
    // Arabic/Persian digits → Latin digits
    .replace(/[٠-۹]/g, function (d) {
      const allDigits = '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹';
      const idx = allDigits.indexOf(d);
      return idx >= 0 ? String(idx % 10) : d;
    });
}

function formatCurrency(amount: number): string {
  return toPersianDigits(amount.toLocaleString('fa-IR')) + ' ریال';
}

export default function TutsModule({ user, activeTabId, moduleId, onOpenTab }: TutsModuleProps) {
  // ===== Data Fetching States =====
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // ===== Map API data to local component types =====
  const mapCourse = (c: any): TutCourse => ({
    id: String(c.id),
    title: c.title,
    lecturer: c.instructor || 'مربی دوره',
    duration: c.duration ? String(c.duration) : '12',
    cost: parseInt(String(c.amount)) || 0,
    enrolled: (c.confirmed_count ?? c.registered_count) || 0,
    capacity: c.capacity || 30,
    startDate: c.start_date ? (c.start_date.includes('/') ? c.start_date : c.start_date.replace(/-/g, '/')) : '۱۴۰۵/۰۱/۰۱',
    endDate: c.end_date ? (c.end_date.includes('/') ? c.end_date : c.end_date.replace(/-/g, '/')) : '',
    registrationStartDate: c.registration_start_date ? (c.registration_start_date.includes('/') ? c.registration_start_date : c.registration_start_date.replace(/-/g, '/')) : '',
    registrationEndDate: c.registration_end_date ? (c.registration_end_date.includes('/') ? c.registration_end_date : c.registration_end_date.replace(/-/g, '/')) : '',
    status: c.active ? 'active' : 'ended',
    category: c.group_title || c.category || 'عمومی',
    description: c.description || 'توضیحات دوره به زودی منتشر خواهد شد.',
    section: c.section || 'normal',
    image: c.image || null,
    instructor_id: c.instructor_id || null,
    instructor_name: c.instructor_name || null,
  });

  const mapVoucher = (c: any): TutVoucher => {
    const cap = c.capacity || 0;
    const used = c.used_count || 0;
    const remaining = Math.max(0, cap - used);
    let status: 'active' | 'used' | 'expired' = 'active';
    if (used >= cap && cap > 0) {
      status = 'used';
    } else if (c.is_active === false) {
      status = 'expired';
    }
    return {
      id: String(c.id),
      code: c.code || '',
      title: c.title || '',
      validFrom: c.start_date || '1405/01/01',
      validTo: c.finish_date || '1405/12/29',
      courseId: c.course_id ? String(c.course_id) : 'all',
      globalCap: cap,
      totalUsed: used,
      maxUses: cap,
      remainingUses: remaining,
      status,
      discountType: c.type_discount === 'percent' ? 'percentage' : 'fixed',
      discountValue: Number(c.value) || 0,
      budgetUsed: 0,
      budgetLimit: 0,
      discountPercent: c.type_discount === 'percent' ? Number(c.value) : undefined,
      discountAmount: c.type_discount === 'money' ? Number(c.value) : undefined,
      allowInstallments: c.type === 'installment'
    };
  };

  const mapRegistrant = (r: any): TutRegistrant => ({
    id: String(r.id),
    name: r.fullname || r.full_name || '',
    nationalCode: r.kodmeli || '',
    studentCode: r.id_edu || r.kodmeli || '',
    mobile: r.mobile || '',
    typeText: r.type_text || '',
    courseId: String(r.course_id),
    courseTitle: r.course_title || '',
    date: r.created_at ? r.created_at.split(' ')[0].replace(/-/g, '/') : '',
    verifiedAt: r.verified_at || '',
    amount: parseInt(String(r.amount)) || 0,
    paymentMethod: r.payment_method_text || '',
    trackingCode: r.tracking_code || r.bank_receipt_filename || '',
    bankReceipt: r.bank_receipt || '',
    // Backend returns: 'paid' (online success), 'approved' (receipt verified),
    // 'rejected', 'refunded', 'pending'. Map 'paid'/'approved' to 'verified'.
    status: (r.status === 'approved' || r.status === 'paid' || r.status === 'verified')
      ? 'verified'
      : r.status === 'refunded'
        ? 'refunded'
        : r.status === 'rejected'
          ? 'rejected'
          : 'pending',
    rejectionReason: r.rejection_reason || undefined,
    // Certificate fields
    certificateApproved: r.certificate_approved ?? false,
    certificateNumber: r.certificate?.certificate_number || undefined,
    certificateIssuedAt: r.certificate?.issued_at || undefined,
    hasCertificate: !!r.certificate,
  });

  // ===== Courses =====
  const [courses, setCourses] = useState<TutCourse[]>([]);
  const [registrants, setRegistrants] = useState<TutRegistrant[]>([]);
  const [surveys, setSurveys] = useState<TutSurvey[]>([]);

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
  const [instructorFormMode, setInstructorFormMode] = useState<'create' | 'edit'>('create');
  const [editingInstructorId, setEditingInstructorId] = useState<number | null>(null);
  const [instructorFormName, setInstructorFormName] = useState('');
  const [instructorFormSpecialty, setInstructorFormSpecialty] = useState('');
  const [instructorFormBio, setInstructorFormBio] = useState('');
  const [instructorFormPhoto, setInstructorFormPhoto] = useState<File | null>(null);
  const [instructorFormPhotoPreview, setInstructorFormPhotoPreview] = useState<string | null>(null);
  const [instructorFormActive, setInstructorFormActive] = useState(true);
  const [instructorsLoading, setInstructorsLoading] = useState(false);
  const [instructorSubmitting, setInstructorSubmitting] = useState(false);

  // ===== Lazy Data Fetching: each section fetches only its own data when activated =====
  const fetchedRef = useRef({ courses: false, registrants: false, surveys: false, vouchers: false });
  const lastFetchModuleRef = useRef<string | null>(null);

  useEffect(() => {
    // When switching between receipts tab (bank-only) and other tabs (all), re-fetch registrants
    const wasReceiptsTab = lastFetchModuleRef.current === 'tuts-receipts';
    const isNowReceiptsTab = moduleId === 'tuts-receipts';
    if (fetchedRef.current.registrants && wasReceiptsTab !== isNowReceiptsTab) {
      fetchedRef.current.registrants = false;
    }
    lastFetchModuleRef.current = moduleId;

    // Determine which data types are needed based on the active moduleId
    const needsCourses = moduleId === 'tuts-list' || moduleId === 'tuts-reports' || moduleId === 'tuts-stats' || moduleId === 'tuts-surveys' || moduleId === 'tuts-vouchers';
    const needsRegistrants = moduleId === 'tuts-receipts' || moduleId === 'tuts-stats';
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
      const isReceiptsTab = moduleId === 'tuts-receipts';
      const params: Record<string, any> = { per_page: 10000 };
      // For receipts tab, only fetch bank receipt payments (همانند پروژه قدیمی)
      if (isReceiptsTab) {
        params.payment_method = 'bank';
      }
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
            name: s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
            phone: s.phone_number || '',
            date: s.created_at ? s.created_at.split(' ')[0].replace(/-/g, '/') : '',
            courseTitle: s.course_title || '',
            rating: s.rating || 0,
            comment: s.comment || s.suggestions || ''
          })));
          const grouped: Record<string, any> = {};
          rows.forEach((s: any) => {
            const key = String(s.course_id);
            if (!grouped[key]) {
              grouped[key] = {
                courseId: key,
                courseTitle: s.course_title || '',
                rating: 0,
                totalResponses: 0,
                breakdown: { content: 0, lecturer: 0, organization: 0, facilities: 0 },
                comments: []
              };
            }
            const g = grouped[key];
            g.totalResponses++;
            g.rating += s.rating || 0;
            if (s.comment || s.suggestions) {
              g.comments.push({
                user: s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'کاربر',
                rating: s.rating || 0,
                comment: s.comment || s.suggestions || '',
                date: s.created_at ? s.created_at.split(' ')[0].replace(/-/g, '/') : ''
              });
            }
          });
          const aggregated = Object.values(grouped).map((g: any) => ({
            ...g,
            rating: g.totalResponses > 0 ? Math.round(g.rating / g.totalResponses) : 0,
            breakdown: {
              content: Math.round((g.rating / g.totalResponses) * 20),
              lecturer: Math.round((g.rating / g.totalResponses) * 20),
              organization: Math.round((g.rating / g.totalResponses) * 18),
              facilities: Math.round((g.rating / g.totalResponses) * 17)
            }
          }));
          setSurveys(aggregated);
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

  // Dedicated role for education expert (کارشناس آموزش)
  const currentUserRole = user?.role || 'admin';

  // Dynamic Categories (Groups) management — synced with backend API
  const [courseGroups, setCourseGroups] = useState<{ id: number; title: string }[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const categoriesFetched = useRef(false);

  // Fetch course groups from backend API (guarded to run once even in StrictMode)
  useEffect(() => {
    if (categoriesFetched.current) return;
    categoriesFetched.current = true;
    api.getCourseGroups()
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
    api.getInstructors({ per_page: 1000 })
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
  });

  const [sandboxUserId, setSandboxUserId] = useState('');

  // Sandbox Simulator States
  const [sandboxCode, setSandboxCode] = useState('WELCOME_ONLINE');
  const [sandboxCourseId, setSandboxCourseId] = useState('tut-1');
  const [sandboxEmail, setSandboxEmail] = useState('student@example.com');
  const [sandboxPhone, setSandboxPhone] = useState('۰۹۱۲۳۴۵۶۷۸۹');
  const [sandboxProvince, setSandboxProvince] = useState('تهران');
  const [sandboxDevice, setSandboxDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [sandboxReferrer, setSandboxReferrer] = useState('');
  const [sandboxResult, setSandboxResult] = useState<SandboxResult | null>(null);

  // New Survey/Feedback Form States
  const [surveyFormCourseId, setSurveyFormCourseId] = useState('tut-1');
  const [surveyFormUser, setSurveyFormUser] = useState(user?.name || '');
  const [surveyFormRating, setSurveyFormRating] = useState(5);
  const [surveyFormContent, setSurveyFormContent] = useState(90);
  const [surveyFormLecturer, setSurveyFormLecturer] = useState(95);
  const [surveyFormOrg, setSurveyFormOrg] = useState(85);
  const [surveyFormFacilities, setSurveyFormFacilities] = useState(80);
  const [surveyFormComment, setSurveyFormComment] = useState('');

  // States for the survey list and statistical reporting
  const [individualSurveys, setIndividualSurveys] = useState<any[]>([]);

  const [surveySearch, setSurveySearch] = useState('');
  const [surveyFromDate, setSurveyFromDate] = useState('');
  const [surveyToDate, setSurveyToDate] = useState('');
  const [surveyPage, setSurveyPage] = useState(1);
  const [selectedSurveyDetails, setSelectedSurveyDetails] = useState<any | null>(null);

  // ===== Pagination States =====
  const [listPage, setListPage] = useState(1);
  const listPerPage = 12;
  const [reportPage, setReportPage] = useState(1);
  const reportPerPage = 15;

  // Server-side paginated report data (optimized: avoids fetching all 10k records)
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

  // States for reporting filters (Target: tuts-stats)
  const [statSelectedYear, setStatSelectedYear] = useState('1405');
  const [statSelectedCourse, setStatSelectedCourse] = useState('all');
  const [statAppliedYear, setStatAppliedYear] = useState('1405');
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
      const created = await api.createCourseGroup(trimmed);
      setCourseGroups(prev => [...prev, created]);
      setCategories(prev => [...prev, created.title]);
      setNewCategoryName('');
      showToast(`گروه آموزشی "${trimmed}" با موفقیت تعریف شد.`);
    } catch {
      showToast('خطا در تعریف گروه آموزشی.', 'error');
    }
  };

  const handleCreateVoucher = (e?: React.FormEvent) => {
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

    const created: TutVoucher = {
      id: `vouch-${Date.now()}`,
      code,
      title,
      validFrom: newVoucher.validFrom || undefined,
      validTo: newVoucher.validUntil || undefined,
      allowedHours: undefined,
      occasion: undefined,
      courseId: newVoucher.applicableProductIds?.[0] || undefined,
      category: newVoucher.applicableCategoryIds?.[0] || undefined,
      courseLevel: undefined,
      deliveryType: undefined,
      minCoursePrice: undefined,
      globalCap: newVoucher.maxUses > 0 ? newVoucher.maxUses : undefined,
      maxUses: newVoucher.maxUses > 0 ? newVoucher.maxUses : undefined,
      remainingUses: newVoucher.maxUses > 0 ? newVoucher.maxUses : 0,
      status: 'active',
      totalUsed: 0,
      budgetLimit: newVoucher.budgetCap > 0 ? newVoucher.budgetCap : undefined,
      budgetUsed: 0,
      perEmailLimit: undefined,
      allowedProvince: newVoucher.geoLimit || undefined,
      allowedDevice: newVoucher.deviceLimit ? (newVoucher.deviceLimit as 'mobile' | 'desktop') : undefined,
      allowedReferrer: undefined,
      firstPurchaseOnly: newVoucher.firstPurchaseOnly,
      discountType: newVoucher.discountType,
      discountValue: newVoucher.discountValue,
      discountPercent: newVoucher.discountType === 'percentage' ? newVoucher.discountValue : undefined,
      discountAmount: newVoucher.discountType === 'fixed' ? newVoucher.discountValue : undefined,
      allowInstallments: newVoucher.installmentsAllowed,
      installmentCount: newVoucher.installmentsAllowed ? newVoucher.minInstallment : undefined
    };

    setVouchers([created, ...vouchers]);
    showToast(`بن خرید جدید "${title}" با کد "${code}" با موفقیت ایجاد گردید.`);

    // reset form fields
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
    });
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

      await api.updateCoupon(Number(id), payload);

      // Refresh local state
      setVouchers(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
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
      await api.deleteCoupon(Number(id));
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

    // Check 2: Hours Limit
    let hoursPassed = true;
    let hoursDesc = 'محدودیت ساعتی ندارد.';
    if (vouch.allowedHours && vouch.allowedHours !== 'all') {
      const currentHour = 10;
      const currentMinute = 5;
      const [start, end] = vouch.allowedHours.split('-');
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const totalCur = currentHour * 60 + currentMinute;
      const totalStart = sh * 60 + sm;
      const totalEnd = eh * 60 + em;

      if (totalCur < totalStart || totalCur > totalEnd) {
        hoursPassed = false;
        isValid = false;
        failReason = `خارج از ساعات مجاز استفاده (${toPersianDigits(vouch.allowedHours)}). ساعت فعلی شبیه‌ساز: ${toPersianDigits('۱۰:۰۵')}`;
        hoursDesc = `غیرمجاز (ساعت فعلی ۱۰:۰۵ در بازه ${toPersianDigits(vouch.allowedHours)} نیست)`;
      } else {
        hoursDesc = `مجاز (در بازه ${toPersianDigits(vouch.allowedHours)})`;
      }
    }
    checks.push({ title: 'ساعات خاص شبانه‌روز', passed: hoursPassed, desc: hoursDesc });

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

    // Check 4: Category/Department Match
    let catPassed = true;
    let catDesc = 'برای تمامی دپارتمان‌ها مجاز است.';
    if (vouch.category && vouch.category !== 'all') {
      if (vouch.category !== course.category) {
        catPassed = false;
        isValid = false;
        failReason = `این بن فقط برای کارگاه‌های دپارتمان ${vouch.category} معتبر است.`;
        catDesc = `غیرمجاز (دپارتمان این دوره "${course.category}" است)`;
      } else {
        catDesc = `مجاز (دپارتمان منطبق)`;
      }
    }
    checks.push({ title: 'دپارتمان آموزشی', passed: catPassed, desc: catDesc });

    // Check 5: Minimum Base Price
    let pricePassed = true;
    let priceDesc = 'حداقل مبلغ شهریه ندارد.';
    if (vouch.minCoursePrice && course.cost < vouch.minCoursePrice) {
      pricePassed = false;
      isValid = false;
      failReason = `شهریه دوره از حداقل مبلغ مجاز بن کمتر است.`;
      priceDesc = `غیرمجاز (شهریه دوره ${formatCurrency(course.cost)} کمتر از حداقل مجاز ${formatCurrency(vouch.minCoursePrice)})`;
    } else {
      if (vouch.minCoursePrice) {
        priceDesc = `مجاز (بیشتر از حداقل ${formatCurrency(vouch.minCoursePrice)})`;
      }
    }
    checks.push({ title: 'حداقل مبلغ شهریه دوره', passed: pricePassed, desc: priceDesc });

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

    // Check 7: Budget Cap
    let budgetPassed = true;
    let budgetDesc = 'سقف بودجه تخفیف ندارد.';
    if (vouch.budgetLimit) {
      if (vouch.budgetUsed >= vouch.budgetLimit) {
        budgetPassed = false;
        isValid = false;
        failReason = 'سقف کل بودجه تخصیص داده شده به این جشنواره تمام شده است.';
        budgetDesc = `اتمام بودجه (${formatCurrency(vouch.budgetUsed)} استفاده از ${formatCurrency(vouch.budgetLimit)})`;
      } else {
        budgetDesc = `مجاز (بودجه باقی‌مانده: ${formatCurrency(vouch.budgetLimit - vouch.budgetUsed)})`;
      }
    }
    checks.push({ title: 'سقف بودجه مالی طرح', passed: budgetPassed, desc: budgetDesc });

    // Check 8: Geo Location Check
    let geoPassed = true;
    let geoDesc = 'برای تمامی مناطق و استان‌ها فعال است.';
    if (vouch.allowedProvince && vouch.allowedProvince !== 'all') {
      if (sandboxProvince !== vouch.allowedProvince) {
        geoPassed = false;
        isValid = false;
        failReason = `این بن فقط برای ساکنین استان ${vouch.allowedProvince} صادر شده است.`;
        geoDesc = `غیرمجاز (استان شبیه‌سازی شده: ${sandboxProvince})`;
      } else {
        geoDesc = `مجاز (استان منطبق)`;
      }
    }
    checks.push({ title: 'موقعیت جغرافیایی فراگیر', passed: geoPassed, desc: geoDesc });

    // Check 9: Device Check
    let devPassed = true;
    let devDesc = 'برای دسکتاپ و موبایل فعال است.';
    if (vouch.allowedDevice && vouch.allowedDevice !== 'all') {
      if (sandboxDevice !== vouch.allowedDevice) {
        devPassed = false;
        isValid = false;
        failReason = `این بن فقط در بستر ${vouch.allowedDevice === 'mobile' ? 'اپلیکیشن موبایل' : 'مرورگر دسکتاپ'} معتبر است.`;
        devDesc = `غیرمجاز (دستگاه شبیه‌سازی شده: ${sandboxDevice === 'mobile' ? 'موبایل' : 'دسکتاپ'})`;
      } else {
        devDesc = `مجاز (دستگاه منطبق)`;
      }
    }
    checks.push({ title: 'دستگاه و کانال ثبت‌نام', passed: devPassed, desc: devDesc });

    // Check 10: Referrer Check
    let refPassed = true;
    let refDesc = 'ارجاع کانال آزاد است.';
    if (vouch.allowedReferrer && vouch.allowedReferrer !== 'all') {
      if (sandboxReferrer !== vouch.allowedReferrer) {
        refPassed = false;
        isValid = false;
        failReason = `این بن تخفیف فقط با ارجاع از کانال "${vouch.allowedReferrer}" معتبر است.`;
        refDesc = `غیرمجاز (منبع ارجاع فعلی: ${sandboxReferrer || 'مستقیم'})`;
      } else {
        refDesc = `مجاز (منبع ارجاع منطبق)`;
      }
    }
    checks.push({ title: 'منبع ورود و ارجاع (UTM)', passed: refPassed, desc: refDesc });

    // Check 11: First Purchase Only
    let firstPassed = true;
    let firstDesc = 'برای همه ثبت‌نام کنندگان مجاز است.';
    if (vouch.firstPurchaseOnly) {
      const hasPurchased = registrants.some(r =>
        r.status === 'verified' &&
        (r.studentCode === sandboxPhone || r.studentCode === sandboxEmail)
      );
      if (hasPurchased) {
        firstPassed = false;
        isValid = false;
        failReason = 'این بن تخفیف فقط برای «اولین خرید» فراگیران معتبر است.';
        firstDesc = `غیرمجاز (سوابق خرید با این مشخصات در سیستم یافت شد)`;
      } else {
        firstDesc = `مجاز (اولین بار خرید فراگیر)`;
      }
    }
    checks.push({ title: 'تشخیص فراگیر جدید (اولین خرید)', passed: firstPassed, desc: firstDesc });

    // Final calculation
    let discount = 0;
    if (isValid) {
      if (vouch.discountPercent) {
        discount = Math.round((course.cost * vouch.discountPercent) / 100);
      } else if (vouch.discountAmount) {
        discount = Math.min(course.cost, vouch.discountAmount);
      }
    }

    const finalPrice = Math.max(0, course.cost - discount);
    const allowInst = vouch.allowInstallments ?? false;
    const instCount = vouch.installmentCount || 1;

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

  const handleSubmitSurvey = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!surveyFormComment.trim()) {
      showToast('لطفاً دیدگاه متنی خود را وارد کنید.', 'error');
      return;
    }
    const targetCourse = courses.find(c => c.id === surveyFormCourseId);
    if (!targetCourse) return;

    const existingIndex = surveys.findIndex(s => s.courseId === surveyFormCourseId);
    const newComment = {
      user: surveyFormUser || 'کاربر مهمان پورتال',
      rating: surveyFormRating,
      comment: surveyFormComment,
      date: '۱۴۰۵/۰۳/۲۳'
    };

    if (existingIndex > -1) {
      const updatedSurveys = [...surveys];
      const s = updatedSurveys[existingIndex];
      const oldTotal = s.totalResponses;
      const newTotal = oldTotal + 1;
      const newRating = parseFloat(((s.rating * oldTotal + surveyFormRating) / newTotal).toFixed(1));
      const newBreakdown = {
        content: Math.round((s.breakdown.content * oldTotal + surveyFormContent) / newTotal),
        lecturer: Math.round((s.breakdown.lecturer * oldTotal + surveyFormLecturer) / newTotal),
        organization: Math.round((s.breakdown.organization * oldTotal + surveyFormOrg) / newTotal),
        facilities: Math.round((s.breakdown.facilities * oldTotal + surveyFormFacilities) / newTotal),
      };

      updatedSurveys[existingIndex] = {
        ...s,
        rating: newRating,
        totalResponses: newTotal,
        breakdown: newBreakdown,
        comments: [newComment, ...s.comments]
      };
      setSurveys(updatedSurveys);
    } else {
      const newSurvey: TutSurvey = {
        courseId: surveyFormCourseId,
        courseTitle: targetCourse.title,
        rating: surveyFormRating,
        totalResponses: 1,
        breakdown: {
          content: surveyFormContent,
          lecturer: surveyFormLecturer,
          organization: surveyFormOrg,
          facilities: surveyFormFacilities
        },
        comments: [newComment]
      };
      setSurveys([newSurvey, ...surveys]);
    }

    const newIndividual = {
      id: individualSurveys.length > 0 ? Math.max(...individualSurveys.map(x => x.id)) + 1 : 1,
      name: surveyFormUser || 'کاربر مهمان پورتال',
      phone: '۰۹۱۲۰۰۰۰۰۰۰',
      date: '۱۴۰۵/۰۳/۲۳ ۱۲:۰۰',
      courseTitle: targetCourse.title,
      rating: surveyFormRating,
      comment: surveyFormComment,
      answers: {
        content: surveyFormContent,
        lecturer: surveyFormLecturer,
        organization: surveyFormOrg,
        facilities: surveyFormFacilities
      }
    };
    setIndividualSurveys(prev => [newIndividual, ...prev]);

    showToast('دیدگاه و ارزیابی شما با موفقیت ثبت شد و در آمارهای پورتال اعمال گردید.', 'success');
    setSurveyFormComment('');
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    const group = courseGroups.find(g => g.title === catToDelete);
    if (!confirm(`آیا از حذف گروه "${catToDelete}" اطمینان دارید؟`)) return;
    try {
      if (group) {
        await api.deleteCourseGroup(group.id);
      }
      setCourseGroups(prev => prev.filter(g => g.title !== catToDelete));
      setCategories(prev => prev.filter(c => c !== catToDelete));
      showToast(`گروه آموزشی "${catToDelete}" حذف گردید.`, 'info');
    } catch {
      showToast(`خطا در حذف گروه "${catToDelete}".`, 'error');
    }
  };

  // Notifications
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Certificate preview dialog — custom PDF viewer with react-pdf
  const [previewRegId, setPreviewRegId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [pdfKey, setPdfKey] = useState(0);

  const getPublicViewUrl = (regId: string, download = false) => {
    if (download) {
      return `${BACKEND_API_URL}/certificate/${regId}`;
    }
    // For preview, use relative path → goes through Vite proxy (same-origin)
    return `/certificate/preview/${regId}`;
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
  const [newCourseSection, setNewCourseSection] = useState('normal');
  const [newCourseImage, setNewCourseImage] = useState<File | null>(null);
  const [newCourseImagePreview, setNewCourseImagePreview] = useState<string | null>(null);

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
      formData.append('section', newCourseSection);
      if (newCourseInstructorId) {
        formData.append('instructor_id', newCourseInstructorId);
      }
      if (newCourseImage) {
        formData.append('image', newCourseImage);
      }

      const created = await api.createCourse(formData);

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
      setNewCourseSection('normal');
      setNewCourseImage(null);
      setNewCourseImagePreview(null);
      setNewCourseInstructorId('');
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
  const [editCourseSection, setEditCourseSection] = useState('normal');
  const [editCourseImage, setEditCourseImage] = useState<File | null>(null);
  const [editCourseImagePreview, setEditCourseImagePreview] = useState<string | null>(null);

  // Course Report selection
  const [selectedCourseReport, setSelectedCourseReport] = useState<TutCourse | null>(null);
  const [reportFetchKey, setReportFetchKey] = useState(0);

  // ===== Fetch registrations on-demand when course report dialog opens =====
  useEffect(() => {
    if (!selectedCourseReport) return;

    const courseIdNum = parseInt(selectedCourseReport.id);
    if (isNaN(courseIdNum)) return;

    setLoadingRegistrants(true);
    setPdfError(null);
    // Re-fetch registrations for this course every time dialog opens
    api.getCourseRegistrations(courseIdNum)
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
      formData.append('section', editCourseSection);
      if (editCourseInstructorId) {
        formData.append('instructor_id', editCourseInstructorId);
      }
      if (editCourseImage) {
        formData.append('image', editCourseImage);
      }
      // Use POST with _method=PUT for form data with file upload
      formData.append('_method', 'PUT');

      const updated = await api.updateCourse(courseId, formData);

      const mappedCourse = mapCourse(updated);
      setCourses(prev => prev.map(c => c.id === editingCourse.id ? mappedCourse : c));
      setEditingCourse(null);
      showToast(`دوره کارگاهی "${editCourseTitle}" با موفقیت بروزرسانی گردید.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'خطا در ارتباط با سرور';
      showToast(`خطا در بروزرسانی دوره: ${msg}`, 'error');
    }
  };

  const handleToggleCourseStatus = async (id: string) => {
    try {
      const courseId = parseInt(id);
      const updated = await api.toggleCourseActive(courseId);
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
      await api.deleteCourse(courseId);
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
      paymentMethod: 'فیش بانکی',
      trackingCode: refCodeInput,
      bankReceipt: '',
      status: 'pending',
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

  // ===== Optimized: Server-side paginated fetch for Reports (tuts-reports) =====
  // Instead of fetching all 10000 records client-side, fetch only the needed page
  // with server-side search/filter — debounced to avoid excessive API calls.
  useEffect(() => {
    if (moduleId !== 'tuts-reports') return;

    const timer = setTimeout(async () => {
      setLoadingRegistrants(true);
      try {
        const params: Record<string, any> = {
          per_page: reportPerPage,
          page: reportPage,
        };
        if (reportSearch.trim()) params.search = normalizePersianSearch(reportSearch.trim());
        if (reportCourseFilter) params.course_id = reportCourseFilter;

        const res = await api.getAllRegistrations(params);
        setReportRegistrants((res.data || []).map(mapRegistrant));
        setReportTotal(res.meta?.total ?? 0);
      } catch (err) {
        console.error('Error fetching report registrations:', err);
      } finally {
        setLoadingRegistrants(false);
      }
    }, 400); // 400ms debounce for search input

    return () => clearTimeout(timer);
  }, [moduleId, reportSearch, reportCourseFilter, reportPage]);

  const filteredRegistrants = moduleId === 'tuts-reports'
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

  const handleExportSimulate = () => {
    showToast('خروجی اکسل با فرمت استاندارد تولید و دانلود فایل آغاز شد (شبیه‌سازی)', 'success');
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
      await api.refundRegistration(id);
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
      await api.undoRefundRegistration(id);
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

  // ========== Certificate Handlers ==========
  const [certificateNotif, setCertificateNotif] = useState<string | null>(null);

  const handleApproveCertificate = async (registerId: string) => {
    try {
      const res = await api.approveCertificate(registerId);
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
      const res = await api.rejectCertificate(registerId);
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
      const res = await api.getAllRegistrations({ per_page: 1000 });
      setRegistrants((res.data || []).map(mapRegistrant));
      showToast('گواهی با موفقیت صادر شد.');
      // Reload the PDF viewer by incrementing the key
      setPdfKey(k => k + 1);
    } catch (err: any) {
      showToast(err.message || 'خطا در صدور گواهی', 'error');
    }
  };

  const handlePreviewCertificate = async (registerId: string) => {
    // Reset loading/error state, then open the dialog
    setPdfError(null);
    setPdfLoading(true);
    setPageNumber(1);
    setPdfKey(0);
    setPreviewRegId(registerId);
  };

  const handleApproveAllCertificates = async () => {
    const courseId = selectedCourseReport?.id;
    if (!courseId) {
      showToast('لطفاً ابتدا یک دوره را انتخاب کنید.', 'error');
      return;
    }
    if (!confirm('آیا از تایید همه ثبت‌نام‌های این دوره برای صدور گواهی مطمئن هستید؟')) return;
    try {
      const res = await api.approveAllCertificates(Number(courseId));
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
      const blob = await api.downloadAllCertificates(courseId);
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
  const [selectedStatCourse, setSelectedStatCourse] = useState<string>('all');

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
      {/* Interactive Toast Alerts */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[60] p-4 rounded-2xl shadow-2xl border flex items-center gap-3 max-w-md ${toastMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-500/20 text-emerald-800 dark:text-emerald-300' :
              toastMsg.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-500/20 text-rose-800 dark:text-rose-300' :
                'bg-blue-50 dark:bg-blue-950/90 border-blue-500/20 text-blue-800 dark:text-blue-300'
              }`}
          >
            {toastMsg.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
            {toastMsg.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />}
            {toastMsg.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
            <span className="text-xs font-bold leading-relaxed">{toastMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner Section */}


      {/* =========================================================================
          MODULE 1: TUTS-LIST (PRE-REGISTRATION CATALOG)
          ========================================================================= */}
      {moduleId === 'tuts-list' && (
        <div className="space-y-6">
          {/* Top filter utility block */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 dark:text-gray-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="جستجوی عنوان کارگاه مهارتی، نام مدرس یا سرفصل آموزشی..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setListPage(1); }}
                className="w-full text-xs pr-10 pl-3.5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30"
              />
            </div>

            <div className="relative min-w-[220px]">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                <Filter className="w-4 h-4" />
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setListPage(1); }}
                className="w-full text-xs pr-10 pl-3.5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 appearance-none font-sans"
              >
                <option value="">دپارتمان و گروه‌های درسی (همه)</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-1 shrink-0">
              <button
                onClick={() => {
                  setViewMode('grid');
                  localStorage.setItem('tuts_view_mode', 'grid');
                }}
                className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'grid'
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                title="نمایش گرید"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setViewMode('list');
                  localStorage.setItem('tuts_view_mode', 'list');
                }}
                className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'list'
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                title="نمایش لیستی"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {currentUserRole === 'admin' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-5 py-3.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  title="مدیریت گروه‌ها و دپارتمان‌ها"
                >
                  <Layers className="w-4 h-4 text-teal-600" />
                  تعریف گروه‌ها
                </button>

                <button
                  onClick={() => setIsInstructorManagementOpen(true)}
                  className="px-5 py-3.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  title="مدیریت اساتید"
                >
                  <User className="w-4 h-4 text-teal-600" />
                  مدیریت اساتید
                </button>

                <button
                  onClick={() => setIsNewCourseModalOpen(true)}
                  className="px-5 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  تعریف کارگاه جدید
                </button>
              </div>
            )}
          </div>

          {/* Courses grid */}
          {loadingCourses ? (
            <LoadingSpinner text="در حال دریافت لیست دوره‌ها..." />
          ) : (
            <>
              {(() => {
                const totalPages = Math.max(1, Math.ceil(filteredCoursesForListing.length / listPerPage));
                const safePage = Math.min(listPage, totalPages);
                const paginatedCourses = filteredCoursesForListing.slice(
                  (safePage - 1) * listPerPage,
                  safePage * listPerPage
                );
                const isListView = viewMode === 'list';
                return (
                  <div className={isListView ? 'flex flex-col gap-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                    {paginatedCourses.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-gray-400">
                        هیچ کارگاه یا دوره آموزشی منطبق با فیلتر شما پیدا نشد.
                      </div>
                    ) : (
                      paginatedCourses.map((course) => {
                        const isFull = course.enrolled >= course.capacity;
                        const regPercent = (course.enrolled / course.capacity) * 100;
                        const myRegistrations = registrants.filter(r => r.courseId === course.id);

                        return (
                          <div
                            key={course.id}
                            className={`${isListView
                                ? 'p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs hover:shadow-lg hover:border-teal-500/25 transition-all duration-300 group'
                                : 'p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs hover:shadow-xl hover:border-teal-500/25 transition-all duration-300 flex flex-col justify-between group'
                              }`}
                          >
                            {/* List view: horizontal layout */}
                            {isListView ? (
                              <>
                                <div className="flex items-center gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0">
                                        {course.category}
                                      </span>
                                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${course.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                          course.status === 'completed' ? 'bg-amber-500/10 text-amber-600' :
                                            'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                        }`}>
                                        {course.status === 'active' ? 'ثبت‌نام فعال' :
                                          course.status === 'completed' ? 'تکمیل ظرفیت' : 'برگزار شده'}
                                      </span>
                                    </div>
                                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-all truncate">
                                      {course.title}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                      <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {course.lecturer}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {toPersianDigits(course.duration)} ساعت
                                        {toPersianDigits(course.startDate)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 shrink-0">
                                    <div className="text-left">
                                      <span className="text-[9px] text-gray-400 block font-bold">شهریه</span>
                                      <span className="text-sm font-black text-teal-600 dark:text-teal-400 whitespace-nowrap">
                                        {formatCurrency(course.cost)}
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-center min-w-[80px]">
                                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1">
                                        <span>{toPersianDigits(Math.round(regPercent))}٪</span>
                                      </div>
                                      <div className="w-full h-1.5 rounded-full bg-gray-50 dark:bg-gray-800 overflow-hidden relative">
                                        <div className={`absolute h-full rounded-full transition-all duration-500 ${isFull ? 'bg-amber-500' : 'bg-gradient-to-r from-teal-500 to-indigo-500'}`}
                                          style={{ width: `${Math.min(100, regPercent)}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-[9px] text-gray-400 mt-0.5">
                                        {toPersianDigits(course.enrolled)}/{toPersianDigits(course.capacity)}
                                      </span>
                                    </div>
                                    <div className="flex gap-1.5">
                                      <button onClick={() => setSelectedCourseForDetail(course)}
                                        className="px-3 py-1.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer whitespace-nowrap">
                                        جزئیات
                                      </button>
                                      <button onClick={() => handleCopyCourseUrl(course)}
                                        className="p-1.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer">
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Admin Controls for List View */}
                                {currentUserRole === 'admin' && (
                                  <div className="mt-3 pt-3 border-t border-dashed border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2 bg-gray-50/50 dark:bg-gray-950/40 p-2 rounded-2xl">
                                    <span className="text-[10px] font-black text-teal-600 dark:text-teal-400">عملیات:</span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => {
                                          setEditingCourse(course);
                                          setEditCourseTitle(course.title);
                                          setEditCourseDuration(course.duration);
                                          setEditCourseCost(course.cost.toString());
                                          setEditCourseCapacity(course.capacity.toString());
                                          setEditCourseStartDate(course.startDate);
                                          setEditCourseCategory(course.category);
                                          setEditCourseDescription(course.description);
                                          setEditCourseEndDate(course.endDate);
                                          setEditCourseRegStartDate(course.registrationStartDate || '');
                                          setEditCourseRegEndDate(course.registrationEndDate || '');
                                          setEditCourseActive(course.status === 'active');
                                          setEditCourseSection(course.section || 'normal');
                                          setEditCourseImagePreview(course.image || null);
                                          setEditCourseImage(null);
                                          setEditCourseInstructorId(course.instructor_id ? String(course.instructor_id) : '');
                                          setEditCourseInstructorSearch(course.instructor_name || '');
                                        }}
                                        className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all cursor-pointer"
                                        title="ویرایش دوره"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => { setSelectedCourseReport(course); setReportFetchKey(k => k + 1); }}
                                        className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer"
                                        title="گزارش ثبت‌نام‌ها"
                                      >
                                        <BarChart2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleToggleCourseStatus(course.id)}
                                        className={`p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg transition-all cursor-pointer ${course.status === 'ended'
                                          ? 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                                          : 'text-emerald-600 hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950'
                                          }`}
                                        title={course.status === 'ended' ? 'فعال کردن دوره' : 'غیرفعال (پایان دوره)'}
                                      >
                                        <Power className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleExportSingleCourseExcel(course)}
                                        className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all cursor-pointer"
                                        title="خروجی اکسل (CSV)"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleCopyCourseUrl(course)}
                                        className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer"
                                        title="کپی آدرس دوره"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCourse(course.id)}
                                        className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all cursor-pointer"
                                        title="حذف دوره"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              /* Grid view: original vertical layout */
                              <>
                                <div>
                                  <div className="flex items-center justify-between mb-3.5">
                                    <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                      {course.category}
                                    </span>
                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${course.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                      course.status === 'completed' ? 'bg-amber-500/10 text-amber-600' :
                                        'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                      }`}>
                                      {course.status === 'active' ? 'ثبت‌نام فعال' :
                                        course.status === 'completed' ? 'تکمیل ظرفیت' : 'برگزار شده'}
                                    </span>
                                  </div>

                                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-all mb-3 line-clamp-2 min-h-[40px]">
                                    {course.title}
                                  </h3>

                                  <div className="space-y-2 mt-4 pt-3.5 border-t border-gray-50 dark:border-gray-800/40 text-xs text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center justify-between">
                                      <span className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                        مدرس دوره:
                                      </span>
                                      <span className="font-bold text-gray-700 dark:text-gray-300">{course.lecturer}</span>
                                    </div>
                                    <div className="flex items-center justify-between  text-xs">
                                      <span className="flex items-center gap-1.5 font-sans">
                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                        طول دوره:
                                      </span>
                                      <span>{toPersianDigits(course.duration)} ساعت</span>
                                    </div>
                                    <div className="flex items-center justify-between  text-xs">
                                      <span className="flex items-center gap-1.5 font-sans">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                        تاریخ شروع:
                                      </span>
                                      <span>{toPersianDigits(course.startDate)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-gray-50 dark:border-gray-800/40">
                                  {/* Enrolled progress */}
                                  <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500 mb-2 ">
                                    <span>ظرفیت: {toPersianDigits(course.enrolled)} از {toPersianDigits(course.capacity)} صندلی</span>
                                    <span>{toPersianDigits(Math.round(regPercent))}٪ تکمیل</span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-gray-50 dark:bg-gray-800 overflow-hidden mb-4 relative">
                                    <div
                                      className={`absolute h-full rounded-full transition-all duration-500 ${isFull ? 'bg-amber-500' : 'bg-gradient-to-r from-teal-500 to-indigo-500'
                                        }`}
                                      style={{ width: `${Math.min(100, regPercent)}%` }}
                                    ></div>
                                  </div>

                                  <div className="flex items-center justify-between gap-3">
                                    <div className="text-right">
                                      <span className="text-[9px] text-gray-400 block font-bold">شهریه ثبت‌نام:</span>
                                      <span className="text-sm font-black text-teal-600 dark:text-teal-400 ">
                                        {formatCurrency(course.cost)}
                                      </span>
                                    </div>

                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => setSelectedCourseForDetail(course)}
                                        className="px-4 py-2 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                                      >
                                        جزئیات سرفصل
                                      </button>
                                      <button
                                        onClick={() => handleCopyCourseUrl(course)}
                                        className="p-2 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer"
                                        title="کپی آدرس دوره"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Admin Controls Section */}
                                {currentUserRole === 'admin' && (
                                  <div className="mt-4 pt-3 border-t border-dashed border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2 bg-gray-50/50 dark:bg-gray-950/40 p-2 rounded-2xl">
                                    <span className="text-[10px] font-black text-teal-600 dark:text-teal-400">عملیات:</span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => {
                                          setEditingCourse(course);
                                          setEditCourseTitle(course.title);
                                          setEditCourseDuration(course.duration);
                                          setEditCourseCost(course.cost.toString());
                                          setEditCourseCapacity(course.capacity.toString());
                                          setEditCourseStartDate(course.startDate);
                                          setEditCourseCategory(course.category);
                                          setEditCourseDescription(course.description);
                                          setEditCourseEndDate(course.endDate);
                                          setEditCourseRegStartDate(course.registrationStartDate || '');
                                          setEditCourseRegEndDate(course.registrationEndDate || '');
                                          setEditCourseActive(course.status === 'active');
                                          setEditCourseSection(course.section || 'normal');
                                          setEditCourseImagePreview(course.image || null);
                                          setEditCourseImage(null);
                                          setEditCourseInstructorId(course.instructor_id ? String(course.instructor_id) : '');
                                          setEditCourseInstructorSearch(course.instructor_name || '');
                                        }}
                                        className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all cursor-pointer"
                                        title="ویرایش دوره"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => { setSelectedCourseReport(course); setReportFetchKey(k => k + 1); }}
                                        className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer"
                                        title="گزارش ثبت‌نام‌ها"
                                      >
                                        <BarChart2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleToggleCourseStatus(course.id)}
                                        className={`p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg transition-all cursor-pointer ${course.status === 'ended'
                                          ? 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                                          : 'text-emerald-600 hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950'
                                          }`}
                                        title={course.status === 'ended' ? 'فعال کردن دوره' : 'غیرفعال (پایان دوره)'}
                                      >
                                        <Power className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleExportSingleCourseExcel(course)}
                                        className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all cursor-pointer"
                                        title="خروجی اکسل (CSV)"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleCopyCourseUrl(course)}
                                        className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer"
                                        title="کپی آدرس دوره"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCourse(course.id)}
                                        className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all cursor-pointer"
                                        title="حذف دوره"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })()}

              {/* Pagination Controls for Courses */}
              {filteredCoursesForListing.length > listPerPage && (
                <Pagination
                  currentPage={listPage}
                  totalItems={filteredCoursesForListing.length}
                  perPage={listPerPage}
                  onPageChange={setListPage}
                />
              )}
            </>
          )}

          {/* Expandable Course Detail Drawer / Modal */}
          <AnimatePresence>
            {selectedCourseForDetail && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative"
                >
                  <button
                    onClick={() => setSelectedCourseForDetail(null)}
                    className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 block w-max mb-3">
                    {selectedCourseForDetail.category}
                  </span>

                  <h3 className="text-base font-black text-gray-900 dark:text-white leading-snug mb-4">
                    {selectedCourseForDetail.title}
                  </h3>

                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed text-justify mb-5 bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-850">
                    {selectedCourseForDetail.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-xs mb-6 ">
                    <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">مدرس و ارائه‌دهنده:</span>
                      <span className="font-sans font-bold text-gray-800 dark:text-gray-200">{selectedCourseForDetail.lecturer}</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">شهریه و ضریب مالی:</span>
                      <span className="font-bold text-teal-600 dark:text-teal-400">{formatCurrency(selectedCourseForDetail.cost)}</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">مدت زمان آموزش:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{toPersianDigits(selectedCourseForDetail.duration)} ساعت</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{toPersianDigits(selectedCourseForDetail.startDate)}</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">تاریخ پایان دوره:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{selectedCourseForDetail.endDate ? toPersianDigits(selectedCourseForDetail.endDate) : '---'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const course = selectedCourseForDetail;
                      setSelectedCourseForDetail(null);
                      setEditingCourse(course);
                      setEditCourseTitle(course.title);
                      setEditCourseDuration(course.duration);
                      setEditCourseCost(course.cost.toString());
                      setEditCourseCapacity(course.capacity.toString());
                      setEditCourseStartDate(course.startDate);
                      setEditCourseCategory(course.category);
                      setEditCourseDescription(course.description);
                      setEditCourseEndDate(course.endDate);
                      setEditCourseRegStartDate(course.registrationStartDate || '');
                      setEditCourseRegEndDate(course.registrationEndDate || '');
                      setEditCourseActive(course.status === 'active');
                      setEditCourseSection(course.section || 'normal');
                      setEditCourseImagePreview(course.image || null);
                      setEditCourseImage(null);
                      setEditCourseInstructorId(course.instructor_id ? String(course.instructor_id) : '');
                      setEditCourseInstructorSearch(course.instructor_name || '');
                    }}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer shadow-sm shadow-teal-600/15 flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-4 h-4" />
                    ویرایش مشخصات دوره
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Interactive Workshop Pre-Registration Modal (Slip Receipt Form) */}
          <AnimatePresence>
            {registeringCourse && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative my-8"
                >
                  <button
                    onClick={() => setRegisteringCourse(null)}
                    className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs mb-3">
                    <FileText className="w-4 h-4" />
                    <span>تکمیل فرآیند پیش‌ثبت‌نام و ارسال سند مالی</span>
                  </div>

                  <h3 className="text-sm font-black text-gray-900 dark:text-white leading-snug mb-4">
                    ثبت‌نام در: {registeringCourse.title}
                  </h3>

                  <div className="mb-5 p-4 bg-teal-500/5 rounded-2xl border border-teal-500/10 text-xs text-gray-600 dark:text-gray-400 leading-relaxed text-justify">
                    جهت تایید نهایی پذیرش در این کارگاه آزاد، مقتضی است مبلغ <strong className="text-teal-600  font-black">{formatCurrency(registeringCourse.cost)}</strong> را به حساب شماره <strong className=" font-black">{toPersianDigits('۰۱۱۲۳۴۵۶۷۸۹')}</strong> بانک ملی ایران به نام دانشگاه علم و هنر واریز نموده و مشخصات فیش شتابی را در زیر آپلود فرمایید.
                  </div>

                  <form onSubmit={handleSubmitPreRegister} className="space-y-4 text-right">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">نام و نام خانوادگی دانشجو</label>
                        <input
                          type="text"
                          required
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="مثال: مارال سالمی"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">کد ملی / دانشجویی</label>
                        <input
                          type="text"
                          required
                          value={studentIdNum}
                          onChange={(e) => setStudentIdNum(e.target.value)}
                          placeholder="مثال: ۴۰۲۱۵۱۴۰۱۵"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none "
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">آدرس ایمیل</label>
                        <input
                          type="email"
                          required
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          placeholder="student@example.com"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none  text-left"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">شماره موبایل</label>
                        <input
                          type="tel"
                          required
                          value={studentPhone}
                          onChange={(e) => setStudentPhone(e.target.value)}
                          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none  text-left"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">استان سکونت (تست Geo)</label>
                        <select
                          value={studentProvince}
                          onChange={(e) => setStudentProvince(e.target.value)}
                          className="w-full text-[11px] p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none appearance-none"
                        >
                          <option value="تهران">تهران</option>
                          <option value="خراسان رضوی">خراسان رضوی</option>
                          <option value="یزد">یزد</option>
                          <option value="فارس">فارس</option>
                          <option value="اصفهان">اصفهان</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">دستگاه (تست فنی)</label>
                        <select
                          value={simulatedDevice}
                          onChange={(e) => setSimulatedDevice(e.target.value as 'desktop' | 'mobile')}
                          className="w-full text-[11px] p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none appearance-none"
                        >
                          <option value="desktop">مرورگر دسکتاپ</option>
                          <option value="mobile">اپلیکیشن موبایل</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1">منبع ارجاع (UTM)</label>
                        <select
                          value={simulatedReferrer}
                          onChange={(e) => setSimulatedReferrer(e.target.value)}
                          className="w-full text-[11px] p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none appearance-none"
                        >
                          <option value="">پیش‌فرض پورتال</option>
                          <option value="blog">وبلاگ دانشگاه</option>
                          <option value="instagram">اینستاگرام</option>
                        </select>
                      </div>
                    </div>

                    {/* VOUCHER APPLICATION FIELD */}
                    <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-500/15 rounded-2xl space-y-2.5">
                      <label className="block text-xs font-extrabold text-indigo-900 dark:text-indigo-400">کد بن خرید یا تخفیف مهارتی</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={studentVoucherCode}
                          onChange={(e) => setStudentVoucherCode(e.target.value)}
                          placeholder="مثال: WELCOME_ONLINE یا YALDA1405"
                          className="flex-1 text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none  uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => handleValidateVoucherCode()}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                        >
                          اعمال بن
                        </button>
                      </div>

                      {voucherError && (
                        <div className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-[10.5px] border border-rose-500/10 font-medium">
                          ⚠ {voucherError}
                        </div>
                      )}

                      {appliedVoucher && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded-xl space-y-1">
                          <div className="flex justify-between items-center text-[10.5px]">
                            <span className="font-extrabold">✓ بن تخفیف با موفقیت اعمال شد:</span>
                            <span className=" bg-emerald-500/10 px-2 py-0.5 rounded text-[9.5px] font-black">{appliedVoucher.code}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{appliedVoucher.title}</p>
                          <div className="flex justify-between items-center text-xs font-black mt-2 pt-1.5 border-t border-emerald-500/10">
                            <span>کاهش شهریه:</span>
                            <span className="">-{formatCurrency(voucherDiscountAmount)}</span>
                          </div>

                          {appliedVoucher.allowInstallments && appliedVoucher.installmentCount && (
                            <div className="mt-2.5 pt-2 border-t border-emerald-500/10 space-y-1 text-right">
                              <label className="block text-[10px] font-bold text-gray-400">گزینه پرداخت چندقسطی فعال شد:</label>
                              <select
                                value={selectedInstallments}
                                onChange={(e) => setSelectedInstallments(parseInt(e.target.value))}
                                className="w-full text-[10.5px] p-2 rounded-lg border border-emerald-500/20 bg-white dark:bg-gray-900 text-emerald-700 dark:text-emerald-400 font-sans focus:outline-none appearance-none"
                              >
                                <option value={1}>پرداخت یکجا (نقدی)</option>
                                <option value={appliedVoucher.installmentCount}>
                                  پرداخت اقساطی ({toPersianDigits(appliedVoucher.installmentCount)} قسطه - هر قسط {formatCurrency(Math.round((registeringCourse.cost - voucherDiscountAmount) / appliedVoucher.installmentCount))})
                                </option>
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                      {!appliedVoucher && (
                        <p className="text-[9.5px] text-gray-400">کدهای پیش‌فرض جهت تست: <code className=" text-indigo-500 font-bold">WELCOME_ONLINE</code> (۳۰٪ تخفیف + اقساط) یا <code className=" text-indigo-500 font-bold">YALDA1405</code> (۲۰٪ تخفیف) یا <code className=" text-indigo-500 font-bold">FIRST_BUYER</code> (اولین خرید)</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">کد پیگیری شتابی (فیش)</label>
                        <input
                          type="text"
                          required
                          value={refCodeInput}
                          onChange={(e) => setRefCodeInput(e.target.value)}
                          placeholder="کد پیگیری ۶ الی ۱۰ رقمی"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none "
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">بانک مبدأ پرداخت</label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none appearance-none"
                        >
                          <option value="بانک ملی ایران">بانک ملی ایران</option>
                          <option value="بانک ملت">بانک ملت</option>
                          <option value="بانک سامان">بانک سامان</option>
                          <option value="بانک تجارت">بانک تجارت</option>
                          <option value="بانک قرض‌الحسنه رسالت">بانک قرض‌الحسنه رسالت</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">بارگذاری عکس یا PDF فیش پرداخت</label>
                      <div className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-950/50 text-center relative hover:bg-gray-100/30 transition-all">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleSimulateUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-6 h-6 mx-auto text-teal-600 dark:text-teal-400 mb-1.5" />
                        <span className="text-[10.5px] text-gray-500 block">فایل فیش واریزی خود را به اینجا بکشید یا کلیک کنید</span>
                        <span className="text-[8.5px] text-gray-400 block mt-0.5">فرمت‌های مجاز: JPG, PNG, PDF | حداکثر ۵ مگابایت</span>

                        {isUploading && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
                              <div className="bg-teal-500 h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                            <span className="text-[9px] text-teal-600 font-bold block mt-1">در حال بارگذاری فایل... {toPersianDigits(uploadProgress)}٪</span>
                          </div>
                        )}

                        {!isUploading && uploadFileName && (
                          <div className="mt-2 p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400  text-[9.5px] flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>فایل بارگذاری شد: {uploadFileName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setRegisteringCourse(null);
                          setStudentVoucherCode('');
                          setAppliedVoucher(null);
                          setVoucherError(null);
                          setVoucherDiscountAmount(0);
                        }}
                        className="px-4 py-2 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        ثبت نهایی و ارسال فیش واریز (پرداخت {formatCurrency(Math.max(0, registeringCourse.cost - voucherDiscountAmount))})
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* New Course Creation Modal (Admin/Staff only) */}
          <AnimatePresence>
            {isNewCourseModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative my-8"
                >
                  <button
                    onClick={() => setIsNewCourseModalOpen(false)}
                    className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <h3 className="text-sm font-black text-gray-900 dark:text-white leading-snug mb-4 flex items-center gap-1.5">
                    <Plus className="w-5 h-5 text-teal-600" />
                    تعریف و انتشار دوره آموزشی مهارتی جدید
                  </h3>

                  <form onSubmit={handleCreateNewCourse} className="space-y-4 text-right">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">عنوان کامل کارگاه آموزشی *</label>
                      <input
                        type="text"
                        required
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        placeholder="مثال: کارگاه تخصصی پایتون در پردازش تصویر"
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">دپارتمان یا حوزه علمی</label>
                        <select
                          value={newCourseCategory}
                          onChange={(e) => setNewCourseCategory(e.target.value)}
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none appearance-none font-sans"
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">محل نمایش در صفحه اصلی</label>
                            <select
                              value={newCourseSection}
                              onChange={(e) => setNewCourseSection(e.target.value)}
                              className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none appearance-none font-sans"
                            >
                              <option value="normal">عادی</option>
                              <option value="featured">پیشنهاد ویژه</option>
                              <option value="pre_register">پیش ثبت نام</option>
                              <option value="free">رایگان</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsInstructorManagementOpen(true)}
                            className="p-3 mb-0.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-all cursor-pointer"
                            title="مدیریت اساتید"
                          >
                            <User className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مدرس منتسب (از لیست اساتید)</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newCourseInstructorSearch}
                          onChange={(e) => setNewCourseInstructorSearch(e.target.value)}
                          onFocus={() => setNewCourseInstructorOpen(true)}
                          onBlur={() => setTimeout(() => setNewCourseInstructorOpen(false), 200)}
                          placeholder="جستجوی نام استاد..."
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                        />
                        {newCourseInstructorOpen && (
                          <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {filteredNewCourseInstructors.length === 0 ? (
                              <div className="p-3 text-xs text-gray-400 text-center">موردی یافت نشد</div>
                            ) : (
                              filteredNewCourseInstructors.map((inst) => (
                                <button
                                  key={inst.id}
                                  type="button"
                                  onMouseDown={() => {
                                    setNewCourseInstructorSearch(inst.name);
                                    setNewCourseInstructorId(String(inst.id));
                                    setNewCourseInstructorOpen(false);
                                  }}
                                  className={`w-full text-right px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 ${
                                    String(inst.id) === newCourseInstructorId ? 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300' : 'text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-[10px] shrink-0">
                                    {inst.name.charAt(0)}
                                  </span>
                                  <span>{inst.name}</span>
                                  {inst.specialty && <span className="text-[10px] text-gray-400">({inst.specialty})</span>}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      {newCourseInstructorId && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-lg">
                            {instructors.find(i => String(i.id) === newCourseInstructorId)?.name || 'مدرس انتخاب شد'}
                          </span>
                          <button
                            type="button"
                            onClick={() => { setNewCourseInstructorSearch(''); setNewCourseInstructorId(''); }}
                            className="text-gray-400 hover:text-red-500 transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تصویر دوره (اختیاری - ابعاد پیشنهادی: 403x226 پیکسل)</label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-950 hover:border-teal-400 dark:hover:border-teal-600 transition-all cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNewCourseImage(file);
                                setNewCourseImagePreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                          <div className="text-center">
                            <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                            <span className="text-xs text-gray-400">برای آپلود کلیک کنید</span>
                          </div>
                        </label>
                        {newCourseImagePreview && (
                          <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                            <img
                              src={newCourseImagePreview}
                              alt="پیش نمایش"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => { setNewCourseImage(null); setNewCourseImagePreview(null); }}
                              className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">طول دوره (ساعت)</label>
                        <input
                          type="text"
                          value={newCourseDuration}
                          onChange={(e) => setNewCourseDuration(e.target.value)}
                          placeholder="مثال: ۲۴ ساعت"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none "
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">شهریه ثبت‌نام (ریال) *</label>
                        <input
                          type="text"
                          required
                          value={newCourseCost}
                          onChange={(e) => setNewCourseCost(formatCostInput(e.target.value))}
                          placeholder="مثال: ۴,۵۰۰,۰۰۰"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none "
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ظرفیت پذیرش (نفر)</label>
                        <input
                          type="number"
                          value={newCourseCapacity}
                          onChange={(e) => setNewCourseCapacity(e.target.value)}
                          placeholder="مثال: ۳۰"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none "
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ شروع دوره *</label>
                        <JalaliDatepicker
                          value={newCourseStartDate}
                          onChange={(date) => setNewCourseStartDate(date)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ پایان دوره</label>
                        <JalaliDatepicker
                          value={newCourseEndDate}
                          onChange={(date) => setNewCourseEndDate(date)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مهلت شروع ثبت‌نام</label>
                        <JalaliDatepicker
                          value={newCourseRegStartDate}
                          onChange={(date) => setNewCourseRegStartDate(date)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مهلت پایان ثبت‌نام</label>
                        <JalaliDatepicker
                          value={newCourseRegEndDate}
                          onChange={(date) => setNewCourseRegEndDate(date)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">وضعیت دوره:</label>
                      <button
                        type="button"
                        dir="ltr"
                        onClick={() => setNewCourseActive(!newCourseActive)}
                        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${newCourseActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${newCourseActive ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className={`text-xs font-bold ${newCourseActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                        {newCourseActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">توضیحات و سرفصل تفصیلی</label>
                      <textarea
                        value={newCourseDescription}
                        onChange={(e) => setNewCourseDescription(e.target.value)}
                        placeholder="سرفصل‌های آموزشی، پیشنیازها و اهداف دوره..."
                        rows={3}
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none resize-none font-sans"
                      ></textarea>
                    </div>

                    <div className="pt-4 flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsNewCourseModalOpen(false)}
                        className="px-4 py-2.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        تعریف و انتشار رسمی دوره
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Edit Course Modal (Admin/Staff only) */}
          <AnimatePresence>
            {editingCourse && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative my-8"
                >
                  <button
                    onClick={() => setEditingCourse(null)}
                    className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <h3 className="text-sm font-black text-gray-900 dark:text-white leading-snug mb-4 flex items-center gap-1.5">
                    <Edit2 className="w-5 h-5 text-teal-600" />
                    ویرایش مشخصات دوره کارگاهی / آموزشی
                  </h3>

                  <form onSubmit={handleUpdateCourse} className="space-y-4 text-right">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">عنوان کامل کارگاه آموزشی *</label>
                      <input
                        type="text"
                        required
                        value={editCourseTitle}
                        onChange={(e) => setEditCourseTitle(e.target.value)}
                        placeholder="مثال: کارگاه تخصصی پایتون در پردازش تصویر"
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                      />
                    </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">دپارتمان یا حوزه علمی</label>
                        <select
                          value={editCourseCategory}
                          onChange={(e) => setEditCourseCategory(e.target.value)}
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none appearance-none font-sans"
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مدرس منتسب (از لیست اساتید)</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={editCourseInstructorSearch}
                            onChange={(e) => setEditCourseInstructorSearch(e.target.value)}
                            onFocus={() => setEditCourseInstructorOpen(true)}
                            onBlur={() => setTimeout(() => setEditCourseInstructorOpen(false), 200)}
                            placeholder="جستجوی نام استاد..."
                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                          />
                          {editCourseInstructorOpen && (
                            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                              {filteredEditCourseInstructors.length === 0 ? (
                                <div className="p-3 text-xs text-gray-400 text-center">موردی یافت نشد</div>
                              ) : (
                                filteredEditCourseInstructors.map((inst) => (
                                  <button
                                    key={inst.id}
                                    type="button"
                                    onMouseDown={() => {
                                      setEditCourseInstructorSearch(inst.name);
                                      setEditCourseInstructorId(String(inst.id));
                                      setEditCourseInstructorOpen(false);
                                    }}
                                    className={`w-full text-right px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 ${
                                      String(inst.id) === editCourseInstructorId ? 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300' : 'text-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-[10px] shrink-0">
                                      {inst.name.charAt(0)}
                                    </span>
                                    <span>{inst.name}</span>
                                    {inst.specialty && <span className="text-[10px] text-gray-400">({inst.specialty})</span>}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        {editCourseInstructorId && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="text-[10px] text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-lg">
                              {instructors.find(i => String(i.id) === editCourseInstructorId)?.name || 'مدرس انتخاب شد'}
                            </span>
                            <button
                              type="button"
                              onClick={() => { setEditCourseInstructorSearch(''); setEditCourseInstructorId(''); }}
                              className="text-gray-400 hover:text-red-500 transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">محل نمایش در صفحه اصلی</label>
                            <select
                              value={editCourseSection}
                              onChange={(e) => setEditCourseSection(e.target.value)}
                              className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none appearance-none font-sans"
                            >
                              <option value="normal">عادی</option>
                              <option value="featured">پیشنهاد ویژه</option>
                              <option value="pre_register">پیش ثبت نام</option>
                              <option value="free">رایگان</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsInstructorManagementOpen(true)}
                            className="p-3 mb-0.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-all cursor-pointer"
                            title="مدیریت اساتید"
                          >
                            <User className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تصویر دوره (اختیاری - ابعاد پیشنهادی: 403x226 پیکسل)</label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-950 hover:border-teal-400 dark:hover:border-teal-600 transition-all cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setEditCourseImage(file);
                                setEditCourseImagePreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                          <div className="text-center">
                            <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                            <span className="text-xs text-gray-400">برای آپلود کلیک کنید</span>
                          </div>
                        </label>
                        {editCourseImagePreview && (
                          <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                            <img
                              src={editCourseImagePreview}
                              alt="پیش نمایش"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => { setEditCourseImage(null); setEditCourseImagePreview(null); }}
                              className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">طول دوره (ساعت)</label>
                        <input
                          type="text"
                          value={editCourseDuration}
                          onChange={(e) => setEditCourseDuration(e.target.value)}
                          placeholder="مثال: ۲۴ ساعت"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none "
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">شهریه ثبت‌نام (ریال) *</label>
                        <input
                          type="text"
                          required
                          value={editCourseCost}
                          onChange={(e) => setEditCourseCost(formatCostInput(e.target.value))}
                          placeholder="مثال: ۴,۵۰۰,۰۰۰"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none "
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ظرفیت پذیرش (نفر)</label>
                        <input
                          type="number"
                          value={editCourseCapacity}
                          onChange={(e) => setEditCourseCapacity(e.target.value)}
                          placeholder="مثال: ۳۰"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none "
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ شروع دوره *</label>
                        <JalaliDatepicker
                          value={editCourseStartDate}
                          onChange={(date) => setEditCourseStartDate(date)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ پایان دوره</label>
                        <JalaliDatepicker
                          value={editCourseEndDate}
                          onChange={(date) => setEditCourseEndDate(date)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مهلت شروع ثبت‌نام</label>
                        <JalaliDatepicker
                          value={editCourseRegStartDate}
                          onChange={(date) => setEditCourseRegStartDate(date)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مهلت پایان ثبت‌نام</label>
                        <JalaliDatepicker
                          value={editCourseRegEndDate}
                          onChange={(date) => setEditCourseRegEndDate(date)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">وضعیت دوره:</label>
                      <button
                        type="button"
                        dir="ltr"
                        onClick={() => setEditCourseActive(!editCourseActive)}
                        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${editCourseActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${editCourseActive ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className={`text-xs font-bold ${editCourseActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                        {editCourseActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">توضیحات و سرفصل تفصیلی</label>
                      <textarea
                        value={editCourseDescription}
                        onChange={(e) => setEditCourseDescription(e.target.value)}
                        placeholder="سرفصل‌های آموزشی، پیشنیازها و اهداف دوره..."
                        rows={3}
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none resize-none font-sans"
                      ></textarea>
                    </div>

                    <div className="pt-4 flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setEditingCourse(null)}
                        className="px-4 py-2.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        ذخیره و بروزرسانی دوره
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Instructor Management Modal */}
          <AnimatePresence>
            {isInstructorManagementOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="w-full max-w-2xl p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative my-8"
                >
                  <button
                    onClick={() => { setIsInstructorManagementOpen(false); setInstructorFormMode('create'); }}
                    className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <h3 className="text-sm font-black text-gray-900 dark:text-white leading-snug mb-4 flex items-center gap-1.5">
                    <User className="w-5 h-5 text-teal-600" />
                    مدیریت اساتید
                  </h3>

                  {/* Instructors List */}
                  {instructorFormMode === 'create' && (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            setInstructorFormMode('edit');
                            setEditingInstructorId(null);
                            setInstructorFormName('');
                            setInstructorFormSpecialty('');
                            setInstructorFormBio('');
                            setInstructorFormPhoto(null);
                            setInstructorFormPhotoPreview(null);
                            setInstructorFormActive(true);
                          }}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          ثبت استاد جدید
                        </button>
                      </div>

                      {instructors.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-xs">
                          هیچ استادی ثبت نشده است. برای ثبت اولین استاد کلیک کنید.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {instructors.map((inst) => (
                            <div
                              key={inst.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-sm">
                                  {inst.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{inst.name}</div>
                                  {inst.specialty && (
                                    <div className="text-[10px] text-gray-400">{inst.specialty}</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={async () => {
                                    try {
                                      const instructor = await api.getInstructor(inst.id);
                                      setEditingInstructorId(inst.id);
                                      setInstructorFormName(instructor.name);
                                      setInstructorFormSpecialty(instructor.specialty || '');
                                      setInstructorFormBio(instructor.bio || '');
                                      setInstructorFormPhoto(null);
                                      setInstructorFormPhotoPreview(instructor.photo_url || null);
                                      setInstructorFormActive(instructor.active);
                                      setInstructorFormMode('edit');
                                    } catch (err) {
                                      showToast('خطا در دریافت اطلاعات استاد', 'error');
                                    }
                                  }}
                                  className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all cursor-pointer"
                                  title="ویرایش"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!window.confirm(`آیا از حذف استاد "${inst.name}" اطمینان دارید؟`)) return;
                                    try {
                                      await api.deleteInstructor(inst.id);
                                      setInstructors(prev => prev.filter(i => i.id !== inst.id));
                                      showToast(`استاد "${inst.name}" حذف شد.`);
                                    } catch (err: any) {
                                      showToast(err.message || 'خطا در حذف استاد', 'error');
                                    }
                                  }}
                                  className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-all cursor-pointer"
                                  title="حذف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Instructor Add/Edit Form */}
                  {instructorFormMode === 'edit' && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!instructorFormName) {
                          showToast('نام استاد الزامی است.', 'error');
                          return;
                        }
                        setInstructorSubmitting(true);
                        try {
                          const formData = new FormData();
                          formData.append('name', instructorFormName);
                          formData.append('specialty', instructorFormSpecialty);
                          formData.append('bio', instructorFormBio);
                          formData.append('active', instructorFormActive ? '1' : '0');
                          if (instructorFormPhoto) {
                            formData.append('photo', instructorFormPhoto);
                          }

                          if (editingInstructorId) {
                            formData.append('_method', 'PUT');
                            const updated = await api.updateInstructor(editingInstructorId, formData);
                            setInstructors(prev => prev.map(i => i.id === editingInstructorId
                              ? { id: i.id, name: updated.name, specialty: updated.specialty || null }
                              : i
                            ));
                            showToast(`استاد "${updated.name}" بروزرسانی شد.`);
                          } else {
                            const created = await api.createInstructor(formData);
                            setInstructors(prev => [...prev, { id: created.id, name: created.name, specialty: created.specialty || null }]);
                            showToast(`استاد "${created.name}" ثبت شد.`);
                          }

                          setInstructorFormMode('create');
                          setEditingInstructorId(null);
                          setInstructorFormName('');
                          setInstructorFormSpecialty('');
                          setInstructorFormBio('');
                          setInstructorFormPhoto(null);
                          setInstructorFormPhotoPreview(null);
                          setInstructorFormActive(true);
                        } catch (err: any) {
                          showToast(err.message || 'خطا در ذخیره اطلاعات استاد', 'error');
                        } finally {
                          setInstructorSubmitting(false);
                        }
                      }}
                      className="space-y-4 text-right"
                    >
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">نام کامل استاد *</label>
                        <input
                          type="text"
                          required
                          value={instructorFormName}
                          onChange={(e) => setInstructorFormName(e.target.value)}
                          placeholder="مثال: دکتر علیرضا صدقی"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تخصص</label>
                        <input
                          type="text"
                          value={instructorFormSpecialty}
                          onChange={(e) => setInstructorFormSpecialty(e.target.value)}
                          placeholder="مثال: هوش مصنوعی و یادگیری ماشین"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">بیوگرافی / توضیحات</label>
                        <textarea
                          value={instructorFormBio}
                          onChange={(e) => setInstructorFormBio(e.target.value)}
                          placeholder="درباره استاد..."
                          rows={3}
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none resize-none font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">عکس استاد</label>
                        <div className="flex items-center gap-3">
                          <label className="flex-1 flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-950 hover:border-teal-400 dark:hover:border-teal-600 transition-all cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setInstructorFormPhoto(file);
                                  setInstructorFormPhotoPreview(URL.createObjectURL(file));
                                }
                              }}
                            />
                            <div className="text-center">
                              <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                              <span className="text-xs text-gray-400">برای آپلود کلیک کنید</span>
                            </div>
                          </label>
                          {instructorFormPhotoPreview && (
                            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                              <img
                                src={instructorFormPhotoPreview}
                                alt="پیش نمایش"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => { setInstructorFormPhoto(null); setInstructorFormPhotoPreview(null); }}
                                className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-full"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">وضعیت:</label>
                        <button
                          type="button"
                          dir="ltr"
                          onClick={() => setInstructorFormActive(!instructorFormActive)}
                          className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${instructorFormActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                          <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${instructorFormActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <span className={`text-xs font-bold ${instructorFormActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                          {instructorFormActive ? 'فعال' : 'غیرفعال'}
                        </span>
                      </div>

                      <div className="pt-4 flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setInstructorFormMode('create');
                            setEditingInstructorId(null);
                            setInstructorFormName('');
                            setInstructorFormSpecialty('');
                            setInstructorFormBio('');
                            setInstructorFormPhoto(null);
                            setInstructorFormPhotoPreview(null);
                            setInstructorFormActive(true);
                          }}
                          className="px-4 py-2.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                        >
                          انصراف
                        </button>
                        <button
                          type="submit"
                          disabled={instructorSubmitting}
                          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {instructorSubmitting ? 'در حال ذخیره...' : editingInstructorId ? 'بروزرسانی استاد' : 'ثبت استاد'}
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Course Report Modal (Admin/Staff only) */}
          <AnimatePresence>
            {selectedCourseReport && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="w-full max-w-4xl p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative my-8"
                >
                  <button
                    onClick={() => setSelectedCourseReport(null)}
                    className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <h3 className="text-base font-black text-gray-900 dark:text-white leading-snug mb-2 flex items-center gap-1.5">
                    <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    آمار و جزئیات پیش‌ثبت‌نام دوره: {selectedCourseReport.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">مدرس: {selectedCourseReport.lecturer} | دپارتمان: {selectedCourseReport.category}</p>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                      <span className="text-[10px] text-gray-400 block font-bold mb-1">کل پیش‌ثبت‌نام‌ها</span>
                      <span className="text-base font-black  text-gray-900 dark:text-white">
                        {toPersianDigits(registrants.filter(r => r.courseId === selectedCourseReport.id).length)} نفر
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                      <span className="text-[10px] text-gray-400 block font-bold mb-1">تایید شده نهایی</span>
                      <span className="text-base font-black  text-emerald-600">
                        {toPersianDigits(registrants.filter(r => r.courseId === selectedCourseReport.id && r.status === 'verified').length)} نفر
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                      <span className="text-[10px] text-gray-400 block font-bold mb-1">در انتظار بررسی</span>
                      <span className="text-base font-black  text-amber-500">
                        {toPersianDigits(registrants.filter(r => r.courseId === selectedCourseReport.id && r.status === 'pending').length)} نفر
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                      <span className="text-[10px] text-gray-400 block font-bold mb-1">درآمد کل دوره (تایید شده)</span>
                      <span className="text-base font-black  text-teal-600 dark:text-teal-400">
                        {formatCurrency(registrants.filter(r => r.courseId === selectedCourseReport.id && r.status === 'verified').reduce((sum, r) => sum + r.amount, 0))}
                      </span>
                    </div>
                  </div>

                  {/* Certificate Management Bar - for admin */}
                  {currentUserRole === 'admin' && (
                    <div className="flex flex-wrap gap-3 items-center bg-amber-50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-200/50 dark:border-amber-800/40 mb-6">
                      <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">مدیریت صدور گواهی:</span>
                      <button
                        onClick={handleApproveAllCertificates}
                        disabled={registrants.filter(r => r.courseId === selectedCourseReport.id && r.status === 'verified').length === 0}
                        className={`px-3 py-2 text-[10px] font-extrabold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${registrants.filter(r => r.courseId === selectedCourseReport.id && r.status === 'verified').length > 0
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                          }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        تایید همه برای صدور گواهی
                      </button>
                      <button
                        onClick={handleDownloadAllCertificates}
                        className="px-3 py-2 text-[10px] font-extrabold rounded-xl flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        دانلود همه گواهی‌ها
                      </button>
                    </div>
                  )}

                  {/* Registrants Table — full columns with independent scroll */}
                  <div className="rounded-2xl border border-gray-150 dark:border-gray-850 bg-white dark:bg-gray-950 mb-6">
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 font-bold border-b border-gray-150 dark:border-gray-850">
                            <th className="p-2 text-center w-10">ردیف</th>
                            <th className="p-2 whitespace-nowrap">کد ملی</th>
                            <th className="p-2 whitespace-nowrap">نام و نام خانوادگی</th>
                            <th className="p-2 whitespace-nowrap">شماره دانشجویی</th>
                            <th className="p-2 whitespace-nowrap">موبایل</th>
                            <th className="p-2 whitespace-nowrap">نوع کاربر</th>
                            <th className="p-2 whitespace-nowrap">تاریخ ثبت نام</th>
                            {currentUserRole === 'admin' && <th className="p-2 text-center whitespace-nowrap">عملیات گواهی</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
                          {(() => {
                            const courseRegs = registrants.filter(r => r.courseId === selectedCourseReport.id && r.status === 'verified');
                            return courseRegs.length === 0 ? (
                              <tr>
                                <td colSpan={currentUserRole === 'admin' ? 8 : 7} className="p-8 text-center text-gray-400">
                                  تاکنون هیچ سندی برای پیش‌ثبت‌نام این کارگاه مهارتی آپلود نگردیده است.
                                </td>
                              </tr>
                            ) : (
                              courseRegs.map((reg, idx) => (
                                <tr key={reg.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-all">
                                  <td className="p-2 text-center  font-bold text-gray-400 w-10">
                                    {toPersianDigits(idx + 1)}
                                  </td>
                                  <td className="p-2  font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                    {toPersianDigits(reg.nationalCode)}
                                  </td>
                                  <td className="p-2 font-extrabold text-gray-900 dark:text-white whitespace-nowrap">
                                    {reg.name}
                                  </td>
                                  <td className="p-2  font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                    {toPersianDigits(reg.studentCode)}
                                  </td>
                                  <td className="p-2  font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap" dir="ltr">
                                    {toPersianDigits(reg.mobile)}
                                  </td>
                                  <td className="p-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                    {reg.typeText}
                                  </td>
                                  <td className="p-2  text-gray-500 whitespace-nowrap">
                                    {toPersianDigits(reg.date)}
                                  </td>
                                  {/* Certificate Actions Column */}
                                  {currentUserRole === 'admin' && (
                                    <td className="p-2 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        {reg.status === 'verified' && (
                                          <>
                                            {!reg.certificateApproved ? (
                                              <button
                                                onClick={() => handleApproveCertificate(reg.id)}
                                                className="px-2 py-1 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg font-bold hover:bg-emerald-500/20 transition-all cursor-pointer"
                                                title="تایید برای صدور گواهی"
                                              >
                                                <CheckCircle className="w-3.5 h-3.5 inline ml-0.5" />
                                                تایید گواهی
                                              </button>
                                            ) : (
                                              <>
                                                <button
                                                  onClick={() => handleRejectCertificate(reg.id)}
                                                  className="px-2 py-1 text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg font-bold hover:bg-rose-500/20 transition-all cursor-pointer"
                                                  title="لغو تایید گواهی"
                                                >
                                                  <XCircle className="w-3.5 h-3.5 inline ml-0.5" />
                                                  لغو
                                                </button>
                                                {!reg.hasCertificate ? (
                                                  <button
                                                    onClick={() => handlePreviewCertificate(reg.id)}
                                                    className="px-2 py-1 text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold hover:bg-indigo-500/20 transition-all cursor-pointer"
                                                    title="پیش‌نمایش گواهی"
                                                  >
                                                    <Eye className="w-3.5 h-3.5 inline ml-0.5" />
                                                    پیش نمایش مدرک
                                                  </button>
                                                ) : (
                                                  <>
                                                    <button
                                                      onClick={() => handlePreviewCertificate(reg.id)}
                                                      className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-all cursor-pointer"
                                                      title="پیش‌نمایش گواهی"
                                                    >
                                                      <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                      onClick={() => handlePreviewCertificate(reg.id)}
                                                      className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-500/10 transition-all cursor-pointer"
                                                      title="دانلود گواهی"
                                                    >
                                                      <Download className="w-3.5 h-3.5" />
                                                    </button>
                                                  </>
                                                )}
                                              </>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              ))
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => handleExportSingleCourseExcel(selectedCourseReport)}
                      disabled={registrants.filter(r => r.courseId === selectedCourseReport.id).length === 0}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      خروجی اکسل پیش‌ثبت‌نام‌ها
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCourseReport(null)}
                      className="px-5 py-2.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                    >
                      بستن گزارش
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}


      {moduleId === 'tuts-reports' && (
        <TutsReports
          courses={courses}
          loadingRegistrants={loadingRegistrants}
          reportSearch={reportSearch}
          setReportSearch={setReportSearch}
          reportCourseFilter={reportCourseFilter}
          setReportCourseFilter={setReportCourseFilter}
          reportPage={reportPage}
          setReportPage={setReportPage}
          reportPerPage={reportPerPage}
          reportTotal={reportTotal}
          filteredRegistrants={filteredRegistrants}
          handleExportSimulate={handleExportSimulate}
          onRefundRequest={(reg) => setRefundTarget(reg)}
          onUndoRefund={(reg) => setUndoRefundTarget(reg)}
        />
      )}

      {moduleId === 'tuts-receipts' && (
        <TutsReceipts
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

      {moduleId === 'tuts-stats' && (
        <TutsStats
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

      {moduleId === 'tuts-surveys' && (
        <div className="space-y-6">
          {/* Statistics section */}
          <TutsSurveysStats
            courses={courses}
            surveys={surveys}
            surveyFormCourseId={surveyFormCourseId}
            setSurveyFormCourseId={setSurveyFormCourseId}
            surveyFormUser={surveyFormUser}
            setSurveyFormUser={setSurveyFormUser}
            surveyFormRating={surveyFormRating}
            setSurveyFormRating={setSurveyFormRating}
            surveyFormContent={surveyFormContent}
            setSurveyFormContent={setSurveyFormContent}
            surveyFormLecturer={surveyFormLecturer}
            setSurveyFormLecturer={setSurveyFormLecturer}
            surveyFormOrg={surveyFormOrg}
            setSurveyFormOrg={setSurveyFormOrg}
            surveyFormFacilities={surveyFormFacilities}
            setSurveyFormFacilities={setSurveyFormFacilities}
            surveyFormComment={surveyFormComment}
            setSurveyFormComment={setSurveyFormComment}
            selectedStatCourse={selectedStatCourse}
            setSelectedStatCourse={setSelectedStatCourse}
            handleSubmitSurvey={handleSubmitSurvey}
          />
          {/* Survey list section */}
          <TutsSurveys
            currentUserRole={currentUserRole}
            individualSurveys={individualSurveys}
            loadingSurveys={loadingSurveys}
            surveySearch={surveySearch}
            setSurveySearch={setSurveySearch}
            surveyFromDate={surveyFromDate}
            setSurveyFromDate={setSurveyFromDate}
            surveyToDate={surveyToDate}
            setSurveyToDate={setSurveyToDate}
            surveyPage={surveyPage}
            setSurveyPage={setSurveyPage}
            selectedSurveyDetails={selectedSurveyDetails}
            setSelectedSurveyDetails={setSelectedSurveyDetails}
            onOpenTab={(id: string) => onOpenTab(id, '', '', false)}
            courses={courses}
          />
        </div>
      )}

      {moduleId === 'tuts-surveys-stats' && (
        <TutsSurveysStats
          courses={courses}
          surveys={surveys}
          surveyFormCourseId={surveyFormCourseId}
          setSurveyFormCourseId={setSurveyFormCourseId}
          surveyFormUser={surveyFormUser}
          setSurveyFormUser={setSurveyFormUser}
          surveyFormRating={surveyFormRating}
          setSurveyFormRating={setSurveyFormRating}
          surveyFormContent={surveyFormContent}
          setSurveyFormContent={setSurveyFormContent}
          surveyFormLecturer={surveyFormLecturer}
          setSurveyFormLecturer={setSurveyFormLecturer}
          surveyFormOrg={surveyFormOrg}
          setSurveyFormOrg={setSurveyFormOrg}
          surveyFormFacilities={surveyFormFacilities}
          setSurveyFormFacilities={setSurveyFormFacilities}
          surveyFormComment={surveyFormComment}
          setSurveyFormComment={setSurveyFormComment}
          selectedStatCourse={selectedStatCourse}
          setSelectedStatCourse={setSelectedStatCourse}
          handleSubmitSurvey={handleSubmitSurvey}
        />
      )}

      {moduleId === 'tuts-vouchers' && (
        <TutsVouchers
          vouchers={vouchers}
          courses={courses}
          categories={categories}
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
          sandboxDevice={sandboxDevice}
          setSandboxDevice={setSandboxDevice}
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

      {moduleId === 'tuts-list' && (
        <TutsModals
          isCategoryModalOpen={isCategoryModalOpen}
          setIsCategoryModalOpen={setIsCategoryModalOpen}
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          categories={categories}
          handleAddCategory={handleAddCategory}
          handleDeleteCategory={handleDeleteCategory}
          courseToDelete={courseToDelete}
          setCourseToDelete={(v: { id: string; title: string } | null) => setCourseToDelete(v as TutCourse | null)}
          confirmDeleteCourse={confirmDeleteCourse}
        />
      )}

      {/* Certificate Preview Dialog — PDF Viewer using direct public URL (no CORS) */}
      <AnimatePresence>
        {previewRegId && (() => {
          const previewReg = registrants.find(r => r.id === previewRegId);
          const hasCert = previewReg?.hasCertificate ?? false;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => { setPreviewRegId(null); setPdfLoading(false); setPdfError(null); setPageNumber(1); setPdfKey(0); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-500" />
                    پیش‌نمایش گواهی
                  </h3>
                  <div className="flex items-center gap-2">
                    {hasCert ? (
                      <a
                        href={getPublicViewUrl(previewRegId, true)}
                        className="px-3 py-1.5 text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        rel="noopener noreferrer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        دانلود مدرک
                      </a>
                    ) : (
                      <button
                        onClick={() => handleGenerateCertificate(previewRegId, previewReg?.name ?? '')}
                        className="px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        صدور گواهی
                      </button>
                    )}
                    <button
                      onClick={() => { setPreviewRegId(null); setPdfLoading(false); setPdfError(null); setPageNumber(1); setPdfKey(0); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Content — custom PDF viewer using react-pdf */}
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 min-h-[70vh] relative flex flex-col">
                  {pdfError ? (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="text-center max-w-xs">
                        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 mb-2">{pdfError}</p>
                        <p className="text-xs text-gray-400">لطفاً مجدداً تلاش کنید یا با پشتیبانی تماس بگیرید.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {pdfLoading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <div className="text-center">
                            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-xs text-gray-500">در حال بارگذاری گواهی...</p>
                          </div>
                        </div>
                      )}
                      <div className={`flex-1 overflow-auto p-4 flex justify-center ${pdfLoading ? 'opacity-0 absolute' : 'opacity-100'}`}>
                        <Document
                          key={pdfKey}
                          file={getPublicViewUrl(previewRegId)}
                          onLoadSuccess={({ numPages }) => {
                            setNumPages(numPages);
                            setPdfLoading(false);
                            setPdfError(null);
                          }}
                          onLoadError={(error) => {
                            console.error('PDF load error:', error);
                            setPdfLoading(false);
                            setPdfError('امکان بارگذاری گواهی وجود ندارد.');
                          }}
                          loading={null}
                        >
                          <Page
                            pageNumber={pageNumber}
                            scale={pdfScale}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="shadow-xl rounded-lg"
                          />
                        </Document>
                      </div>
                      {/* PDF Navigation Controls */}
                      {!pdfLoading && numPages > 0 && (
                        <div className="flex items-center justify-center gap-3 p-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                            disabled={pageNumber <= 1}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                          >
                            قبلی
                          </button>
                          <span className="text-[10px] text-gray-500 font-bold">
                            {toPersianDigits(pageNumber)} از {toPersianDigits(numPages)}
                          </span>
                          <button
                            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                            disabled={pageNumber >= numPages}
                            className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                          >
                            بعدی
                          </button>
                          <div className="mr-4 flex items-center gap-1">
                            <button
                              onClick={() => setPdfScale(s => Math.max(0.5, s - 0.1))}
                              className="px-2 py-1 text-[10px] font-bold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all cursor-pointer"
                            >
                              −
                            </button>
                            <span className="text-[10px] text-gray-500 min-w-[40px] text-center font-bold">
                              {Math.round(pdfScale * 100)}%
                            </span>
                            <button
                              onClick={() => setPdfScale(s => Math.min(2.0, s + 0.1))}
                              className="px-2 py-1 text-[10px] font-bold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ===== REFUND CONFIRMATION MODAL ===== */}
      <AnimatePresence>
        {refundTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setRefundTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center mx-auto">
                <RotateCcw className="w-7 h-7 text-orange-500" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">مستردد کردن ثبت‌نام</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  آیا از مستردد کردن ثبت‌نام <span className="font-black text-gray-700 dark:text-gray-300">«{refundTarget.name}»</span><br />
                  در دوره <span className="font-black text-gray-700 dark:text-gray-300">«{refundTarget.courseTitle}»</span> اطمینان دارید؟<br />
                  این عملیات غیرقابل بازگشت است.
                </p>
              </div>
              {/* Confirmation word input */}
              <div className="text-right">
                <label className="text-[11px] text-gray-500 font-sans block mb-1.5">
                  برای تأیید، عدد <span className="font-black text-teal-600 dark:text-teal-400 text-sm mx-1 select-all" dir="ltr">{refundConfirmWord}</span> را وارد کنید:
                </label>
                <input
                  type="text"
                  value={refundConfirmInput}
                  onChange={e => setRefundConfirmInput(e.target.value)}
                  placeholder={refundConfirmWord}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-center"
                  autoComplete="off"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setRefundTarget(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 rounded-2xl text-xs font-bold text-gray-500 cursor-pointer transition-all"
                >
                  انصراف
                </button>
                <button
                  onClick={() => { confirmRefund(); }}
                  disabled={refundConfirmInput !== refundConfirmWord}
                  className={`flex-1 py-2.5 rounded-2xl text-xs font-black cursor-pointer transition-all shadow-xs ${
                    refundConfirmInput === refundConfirmWord
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-orange-300 dark:bg-orange-950/40 text-orange-200 dark:text-orange-800 cursor-not-allowed'
                  }`}
                >
                  مستردد
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== UNDO REFUND CONFIRMATION MODAL ===== */}
      <AnimatePresence>
        {undoRefundTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setUndoRefundTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center mx-auto">
                <RotateCcw className="w-7 h-7 text-teal-500" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">لغو مستردد ثبت‌نام</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  آیا از لغو مستردد ثبت‌نام <span className="font-black text-gray-700 dark:text-gray-300">«{undoRefundTarget.name}»</span><br />
                  در دوره <span className="font-black text-gray-700 dark:text-gray-300">«{undoRefundTarget.courseTitle}»</span> اطمینان دارید؟<br />
                  این عملیات غیرقابل بازگشت است.
                </p>
              </div>
              {/* Confirmation word input */}
              <div className="text-right">
                <label className="text-[11px] text-gray-500 font-sans block mb-1.5">
                  برای تأیید، عدد <span className="font-black text-teal-600 dark:text-teal-400 text-sm mx-1 select-all" dir="ltr">{undoRefundConfirmWord}</span> را وارد کنید:
                </label>
                <input
                  type="text"
                  value={undoRefundConfirmInput}
                  onChange={e => setUndoRefundConfirmInput(e.target.value)}
                  placeholder={undoRefundConfirmWord}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-center"
                  autoComplete="off"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setUndoRefundTarget(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 rounded-2xl text-xs font-bold text-gray-500 cursor-pointer transition-all"
                >
                  انصراف
                </button>
                <button
                  onClick={() => { confirmUndoRefund(); }}
                  disabled={undoRefundConfirmInput !== undoRefundConfirmWord}
                  className={`flex-1 py-2.5 rounded-2xl text-xs font-black cursor-pointer transition-all shadow-xs ${
                    undoRefundConfirmInput === undoRefundConfirmWord
                      ? 'bg-teal-600 hover:bg-teal-700 text-white'
                      : 'bg-teal-300 dark:bg-teal-950/40 text-teal-200 dark:text-teal-800 cursor-not-allowed'
                  }`}
                >
                  لغو مستردد
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}
