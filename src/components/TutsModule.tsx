import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  User, 
  DollarSign, 
  Users, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Sparkles, 
  Search, 
  Filter, 
  Plus, 
  X, 
  Info, 
  ArrowLeft,
  ChevronDown,
  Award,
  Check,
  Building,
  BarChart2,
  Trash2,
  TrendingUp,
  MessageSquare,
  Clock,
  CheckSquare,
  Activity,
  UserCheck,
  BookOpen,
  Edit2,
  Power,
  Download,
  Layers,
  Gift,
  Percent,
  Tag,
  Laptop,
  MapPin,
  UserPlus,
  Phone,
  Eye
} from 'lucide-react';
import { User as UserType } from '@/src/types';
import api from '@/src/api';
import Pagination from '@/src/components/Pagination';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  status: 'active' | 'completed' | 'ended';
  description: string;
  category: string;
}

interface TutRegistrant {
  id: string;
  name: string;
  studentCode: string;
  courseId: string;
  courseTitle: string;
  date: string;
  amount: number;
  referenceCode: string;
  bank: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
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
    duration: c.duration_text || '۱۲ ساعت',
    cost: parseInt(String(c.amount)) || 0,
    enrolled: c.registered_count || 0,
    capacity: c.capacity || 30,
    startDate: c.start_date ? (c.start_date.includes('/') ? c.start_date : c.start_date.replace(/-/g, '/')) : '۱۴۰۵/۰۱/۰۱',
    status: c.active ? 'active' : 'ended',
    category: c.category || 'عمومی',
    description: c.description || 'توضیحات دوره به زودی منتشر خواهد شد.'
  });

  const mapVoucher = (c: any): TutVoucher => ({
    id: String(c.id),
    code: c.code || '',
    title: c.title || '',
    validFrom: c.start_date || '1405/01/01',
    validTo: c.finish_date || '1405/12/29',
    courseId: c.course_id ? String(c.course_id) : 'all',
    globalCap: c.capacity || 0,
    totalUsed: c.used_count || 0,
    budgetUsed: 0,
    budgetLimit: 0,
    discountPercent: c.type_discount === 'percent' ? Number(c.value) : undefined,
    discountAmount: c.type_discount === 'money' ? Number(c.value) : undefined,
    allowInstallments: c.type === 'installment'
  });

  const mapRegistrant = (r: any): TutRegistrant => ({
    id: String(r.id),
    name: r.fullname || r.full_name || '',
    studentCode: r.id_edu || r.kodmeli || '',
    courseId: String(r.course_id),
    courseTitle: r.course_title || '',
    date: r.created_at ? r.created_at.split(' ')[0].replace(/-/g, '/') : '',
    amount: parseInt(String(r.amount)) || 0,
    referenceCode: '',
    bank: r.payment_method_text || '',
    status: r.status === 'verified' ? 'verified' : r.status === 'rejected' ? 'rejected' : 'pending',
    rejectionReason: r.rejection_reason || undefined
  });

  // ===== Courses =====
  const [courses, setCourses] = useState<TutCourse[]>([]);
  const [registrants, setRegistrants] = useState<TutRegistrant[]>([]);
  const [surveys, setSurveys] = useState<TutSurvey[]>([]);

  // ===== Lazy Data Fetching: each section fetches only its own data when activated =====
  const fetchedRef = useRef({ courses: false, registrants: false, surveys: false, vouchers: false });

  useEffect(() => {
    // Determine which data types are needed based on the active moduleId
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
      api.getAllRegistrations({ per_page: 1000 })
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

  // Dynamic Categories (Groups) management
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('tuts_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      'علوم تربیتی و روانشناسی',
      'فناوری و مهندسی',
      'هنر و رسانه دیجیتال',
      'مدیریت و تجارت'
    ];
  });

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

  // Sandbox Simulator States
  const [sandboxCode, setSandboxCode] = useState('WELCOME_ONLINE');
  const [sandboxCourseId, setSandboxCourseId] = useState('tut-1');
  const [sandboxEmail, setSandboxEmail] = useState('student@example.com');
  const [sandboxPhone, setSandboxPhone] = useState('۰۹۱۲۳۴۵۶۷۸۹');
  const [sandboxProvince, setSandboxProvince] = useState('تهران');
  const [sandboxDevice, setSandboxDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [sandboxReferrer, setSandboxReferrer] = useState('');
  const [sandboxResult, setSandboxResult] = useState<{
    isValid: boolean;
    error?: string;
    voucher?: TutVoucher;
    discountAmount: number;
    finalPrice: number;
    originalPrice: number;
    allowInstallments: boolean;
    installmentCount?: number;
    installmentValue?: number;
    checks: { title: string; passed: boolean; desc: string }[];
  } | null>(null);

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
  const [voucherPage, setVoucherPage] = useState(1);
  const voucherPerPage = 10;

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
  const [statSelectedYear, setStatSelectedYear] = useState('۱۴۰۵');
  const [statSelectedCourse, setStatSelectedCourse] = useState('all');
  const [statAppliedYear, setStatAppliedYear] = useState('۱۴۰۵');
  const [statAppliedCourse, setStatAppliedCourse] = useState('all');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      showToast('لطفاً عنوان گروه را وارد کنید.', 'error');
      return;
    }
    if (categories.includes(trimmed)) {
      showToast('این گروه آموزشی از قبل تعریف شده است.', 'error');
      return;
    }
    setCategories(prev => [...prev, trimmed]);
    setNewCategoryName('');
    showToast(`گروه آموزشی "${trimmed}" با موفقیت تعریف شد.`);
  };

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newVoucherCode.trim().toUpperCase();
    const title = newVoucherTitle.trim();
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
      validFrom: newVoucherValidFrom || undefined,
      validTo: newVoucherValidTo || undefined,
      allowedHours: newVoucherAllowedHours !== 'all' ? newVoucherAllowedHours : undefined,
      occasion: newVoucherOccasion || undefined,
      courseId: newVoucherCourseId !== 'all' ? newVoucherCourseId : undefined,
      category: newVoucherCategory !== 'all' ? newVoucherCategory : undefined,
      courseLevel: newVoucherCourseLevel !== 'all' ? (newVoucherCourseLevel as 'elementary' | 'advanced') : undefined,
      deliveryType: newVoucherDeliveryType !== 'all' ? (newVoucherDeliveryType as 'online' | 'in-person') : undefined,
      minCoursePrice: Number(newVoucherMinCoursePrice) > 0 ? Number(newVoucherMinCoursePrice) : undefined,
      globalCap: Number(newVoucherGlobalCap) > 0 ? Number(newVoucherGlobalCap) : undefined,
      totalUsed: 0,
      budgetLimit: Number(newVoucherBudgetLimit) > 0 ? Number(newVoucherBudgetLimit) : undefined,
      budgetUsed: 0,
      perEmailLimit: Number(newVoucherPerEmailLimit) > 0 ? Number(newVoucherPerEmailLimit) : undefined,
      allowedProvince: newVoucherAllowedProvince !== 'all' ? newVoucherAllowedProvince : undefined,
      allowedDevice: newVoucherAllowedDevice !== 'all' ? (newVoucherAllowedDevice as 'mobile' | 'desktop') : undefined,
      allowedReferrer: newVoucherAllowedReferrer !== 'all' ? newVoucherAllowedReferrer : undefined,
      firstPurchaseOnly: newVoucherFirstPurchaseOnly,
      discountPercent: newVoucherDiscountType === 'percent' ? Number(newVoucherDiscountValue) : undefined,
      discountAmount: newVoucherDiscountType === 'amount' ? Number(newVoucherDiscountValue) : undefined,
      allowInstallments: newVoucherAllowInstallments,
      installmentCount: newVoucherAllowInstallments ? Number(newVoucherInstallmentCount) : undefined
    };

    setVouchers([created, ...vouchers]);
    showToast(`بن خرید جدید "${title}" با کد "${code}" با موفقیت ایجاد گردید.`);
    
    // reset form fields
    setNewVoucherCode('');
    setNewVoucherTitle('');
    setNewVoucherOccasion('');
    setNewVoucherDiscountValue('20');
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
        ]
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
      checks
    });

    if (isValid) {
      showToast(`شبیه‌سازی با موفقیت انجام شد: بن خرید معتبر است.`, 'success');
    } else {
      showToast(`شبیه‌سازی انجام شد: بن غیرمعتبر است. علت: ${failReason}`, 'error');
    }
  };

  const handleSubmitSurvey = (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleDeleteCategory = (catToDelete: string) => {
    if (confirm(`آیا از حذف گروه "${catToDelete}" اطمینان دارید؟`)) {
      setCategories(prev => prev.filter(c => c !== catToDelete));
      showToast(`گروه آموزشی "${catToDelete}" حذف گردید.`, 'info');
    }
  };

  // Notifications
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // -----------------------------------------
  // 1. TUTS-LIST (WORKSHOPS PRE-REGISTRATION) STATE & HANDLERS
  // -----------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<TutCourse | null>(null);
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
  const [newCourseLecturer, setNewCourseLecturer] = useState('');
  const [newCourseDuration, setNewCourseDuration] = useState('');
  const [newCourseCost, setNewCourseCost] = useState('');
  const [newCourseCapacity, setNewCourseCapacity] = useState('30');
  const [newCourseStartDate, setNewCourseStartDate] = useState('۱۴۰۵/۰۵/۱۵');
  const [newCourseCategory, setNewCourseCategory] = useState(() => categories[0] || 'علوم تربیتی و روانشناسی');
  const [newCourseDescription, setNewCourseDescription] = useState('');

  const handleCreateNewCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle || !newCourseLecturer || !newCourseCost) {
      showToast('لطفاً فیلدهای ستاره‌دار و الزامی را پر کنید.', 'error');
      return;
    }

    const price = parseInt(newCourseCost.replace(/[^\d]/g, ''));
    if (isNaN(price)) {
      showToast('مبلغ شهریه نامعتبر است.', 'error');
      return;
    }

    const newC: TutCourse = {
      id: `tut-${courses.length + 1}`,
      title: newCourseTitle,
      lecturer: newCourseLecturer,
      duration: newCourseDuration || '۱۲ ساعت',
      cost: price,
      enrolled: 0,
      capacity: parseInt(newCourseCapacity) || 30,
      startDate: newCourseStartDate,
      status: 'active',
      category: newCourseCategory,
      description: newCourseDescription || 'توضیحات دوره به زودی منتشر خواهد شد.'
    };

    setCourses([newC, ...courses]);
    setIsNewCourseModalOpen(false);
    showToast(`دوره کارگاهی جدید "${newCourseTitle}" با موفقیت تعریف گردید.`);
    // Reset Form
    setNewCourseTitle('');
    setNewCourseLecturer('');
    setNewCourseCost('');
    setNewCourseDescription('');
  };

  // Editing course states (Admin only)
  const [editingCourse, setEditingCourse] = useState<TutCourse | null>(null);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseLecturer, setEditCourseLecturer] = useState('');
  const [editCourseDuration, setEditCourseDuration] = useState('');
  const [editCourseCost, setEditCourseCost] = useState('');
  const [editCourseCapacity, setEditCourseCapacity] = useState('');
  const [editCourseStartDate, setEditCourseStartDate] = useState('');
  const [editCourseCategory, setEditCourseCategory] = useState('');
  const [editCourseDescription, setEditCourseDescription] = useState('');

  // Course Report selection
  const [selectedCourseReport, setSelectedCourseReport] = useState<TutCourse | null>(null);

  const handleUpdateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    if (!editCourseTitle || !editCourseLecturer || !editCourseCost) {
      showToast('لطفاً فیلدهای ستاره‌دار و الزامی را پر کنید.', 'error');
      return;
    }

    const price = typeof editCourseCost === 'number' ? editCourseCost : parseInt(editCourseCost.toString().replace(/[^\d]/g, ''));
    if (isNaN(price)) {
      showToast('مبلغ شهریه نامعتبر است.', 'error');
      return;
    }

    setCourses(prev => prev.map(c => c.id === editingCourse.id ? {
      ...c,
      title: editCourseTitle,
      lecturer: editCourseLecturer,
      duration: editCourseDuration || '۱۲ ساعت',
      cost: price,
      capacity: parseInt(editCourseCapacity) || 30,
      startDate: editCourseStartDate,
      category: editCourseCategory,
      description: editCourseDescription || 'توضیحات دوره به زودی منتشر خواهد شد.'
    } : c));

    setEditingCourse(null);
    showToast(`دوره کارگاهی "${editCourseTitle}" با موفقیت بروزرسانی گردید.`);
  };

  const handleToggleCourseStatus = (id: string) => {
    setCourses(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'ended' ? 'active' : 'ended';
        showToast(
          nextStatus === 'active' 
            ? `دوره "${c.title}" مجدداً فعال گردید.` 
            : `دوره "${c.title}" غیرفعال (پایان‌یافته) گردید.`,
          'info'
        );
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const handleDeleteCourse = (id: string) => {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    if (confirm(`آیا از حذف کامل دوره آموزشی "${course.title}" اطمینان دارید؟ تمام داده‌های مرتبط حذف خواهند شد.`)) {
      setCourses(prev => prev.filter(c => c.id !== id));
      setRegistrants(prev => prev.filter(r => r.courseId !== id));
      showToast(`دوره آموزشی "${course.title}" با موفقیت حذف گردید.`, 'info');
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
    csvContent += 'شناسه ثبت‌نام,نام دانشجو,کد ملی/دانشجویی,کد پیگیری شتابی,بانک مبدأ,تاریخ ثبت,مبلغ پرداختی (ریال),وضعیت\n';
    
    courseRegs.forEach(r => {
      const statusText = r.status === 'verified' ? 'تایید شده' : r.status === 'rejected' ? 'رد شده' : 'در انتظار تایید';
      csvContent += `"${r.id}","${r.name}","${r.studentCode}","${r.referenceCode}","${r.bank}","${r.date}",${r.amount},"${statusText}"\n`;
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
      studentCode: studentIdNum,
      courseId: registeringCourse.id,
      courseTitle: registeringCourse.title,
      date: '۱۴۰۵/۰۳/۲۰',
      amount: finalCost,
      referenceCode: refCodeInput,
      bank: selectedBank,
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
  const [reportStatusFilter, setReportStatusFilter] = useState('');

  const filteredRegistrants = registrants.filter(reg => {
    const matchText = reg.name.toLowerCase().includes(reportSearch.toLowerCase()) || 
                      reg.studentCode.includes(reportSearch) ||
                      reg.referenceCode.includes(reportSearch);
    const matchCourse = reportCourseFilter === '' || reg.courseId === reportCourseFilter;
    const matchStatus = reportStatusFilter === '' || reg.status === reportStatusFilter;
    return matchText && matchCourse && matchStatus;
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

  const handleDeleteRegistrant = (id: string) => {
    if (confirm('آیا از حذف این رکورد پیش‌ثبت‌نام مطمئن هستید؟')) {
      const target = registrants.find(r => r.id === id);
      setRegistrants(prev => prev.filter(r => r.id !== id));
      if (target && target.status === 'verified') {
        setCourses(prev => prev.map(c => c.id === target.courseId ? { ...c, enrolled: Math.max(0, c.enrolled - 1) } : c));
      }
      showToast('سند پیش‌ثبت‌نام مورد نظر با موفقیت حذف گردید.', 'info');
    }
  };

  // -----------------------------------------
  // 4. TUTS-STATS (CHART SELECTION & INTERACTIVE STATE)
  // -----------------------------------------
  const [selectedStatCourse, setSelectedStatCourse] = useState<string>('all');

  // Compute stats metrics dynamically
  const totalEnrolledAllWorkshops = courses.reduce((sum, c) => sum + c.enrolled, 0);
  const totalCapacityAllWorkshops = courses.reduce((sum, c) => sum + c.capacity, 0);
  const totalEstimatedRevenue = registrants.filter(r => r.status === 'verified').reduce((sum, r) => sum + r.amount, 0);
  const pendingReceiptCount = registrants.filter(r => r.status === 'pending').length;

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
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        c.lecturer.toLowerCase().includes(searchQuery.toLowerCase());
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
            className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 max-w-md ${
              toastMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-500/20 text-emerald-800 dark:text-emerald-300' :
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
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800/60">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs uppercase mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span>پرتال جامع دانشگاهی کارانت</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            {currentModuleTitle()}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            برگزاری وبینارهای تخصصی، دوره‌های توانمندسازی علمی کوتاه مدت و ثبت پرداخت فیش‌های الحاقی
          </p>
        </div>
      </div>

      {/* QUICK SYSTEM STATS BANNER */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-gray-400 block font-bold mb-1">کل ظرفیت کارگاه‌ها</span>
            <span className="text-lg font-black font-mono text-gray-900 dark:text-white">
              {toPersianDigits(totalEnrolledAllWorkshops)} / {toPersianDigits(totalCapacityAllWorkshops)} <span className="text-xs font-sans font-normal text-gray-400">نفر</span>
            </span>
          </div>
          <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-gray-400 block font-bold mb-1">درآمد وصول شده (تایید فیش)</span>
            <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
              {toPersianDigits((totalEstimatedRevenue / 10).toLocaleString('fa-IR'))} <span className="text-xs font-sans font-normal">تومان</span>
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-gray-400 block font-bold mb-1">فیش‌های در انتظار بررسی</span>
            <span className="text-lg font-black font-mono text-amber-500">
              {toPersianDigits(pendingReceiptCount)} <span className="text-xs font-sans font-normal text-gray-400">فقره</span>
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-gray-400 block font-bold mb-1">تعداد دوره‌های آموزشی</span>
            <span className="text-lg font-black font-mono text-indigo-500">
              {toPersianDigits(courses.length)} <span className="text-xs font-sans font-normal text-gray-400">عنوان</span>
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>


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
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                            className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs hover:shadow-xl hover:border-teal-500/25 transition-all duration-300 flex flex-col justify-between group"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-3.5">
                                <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                  {course.category}
                                </span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                  course.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
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
                                <div className="flex items-center justify-between font-mono text-xs">
                                  <span className="flex items-center gap-1.5 font-sans">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    طول دوره:
                                  </span>
                                  <span>{toPersianDigits(course.duration)}</span>
                                </div>
                                <div className="flex items-center justify-between font-mono text-xs">
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
                              <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500 mb-2 font-mono">
                                <span>ظرفیت: {toPersianDigits(course.enrolled)} از {toPersianDigits(course.capacity)} صندلی</span>
                                <span>{toPersianDigits(Math.round(regPercent))}٪ تکمیل</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-gray-50 dark:bg-gray-800 overflow-hidden mb-4 relative">
                                <div
                                  className={`absolute h-full rounded-full transition-all duration-500 ${
                                    isFull ? 'bg-amber-500' : 'bg-gradient-to-r from-teal-500 to-indigo-500'
                                  }`}
                                  style={{ width: `${Math.min(100, regPercent)}%` }}
                                ></div>
                              </div>

                              <div className="flex items-center justify-between gap-3">
                                <div className="text-right">
                                  <span className="text-[9px] text-gray-400 block font-bold">شهریه ثبت‌نام:</span>
                                  <span className="text-sm font-black text-teal-600 dark:text-teal-400 font-mono">
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
                                </div>
                              </div>
                            </div>

                            {/* Admin Controls Section */}
                            {currentUserRole === 'admin' && (
                              <div className="mt-4 pt-3 border-t border-dashed border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2 bg-gray-50/50 dark:bg-gray-950/40 p-2 rounded-2xl">
                                <span className="text-[10px] font-black text-teal-600 dark:text-teal-400">مدیریت کارشناس:</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingCourse(course);
                                      setEditCourseTitle(course.title);
                                      setEditCourseLecturer(course.lecturer);
                                      setEditCourseDuration(course.duration);
                                      setEditCourseCost(course.cost.toString());
                                      setEditCourseCapacity(course.capacity.toString());
                                      setEditCourseStartDate(course.startDate);
                                      setEditCourseCategory(course.category);
                                      setEditCourseDescription(course.description);
                                    }}
                                    className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all cursor-pointer"
                                    title="ویرایش دوره"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setSelectedCourseReport(course)}
                                    className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer"
                                    title="گزارش ثبت‌نام‌ها"
                                  >
                                    <BarChart2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleCourseStatus(course.id)}
                                    className={`p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg transition-all cursor-pointer ${
                                      course.status === 'ended' 
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
                                    onClick={() => handleDeleteCourse(course.id)}
                                    className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all cursor-pointer"
                                    title="حذف دوره"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
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

                  <div className="grid grid-cols-2 gap-4 text-xs mb-6 font-mono">
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
                      <span className="font-bold text-gray-800 dark:text-gray-200">{toPersianDigits(selectedCourseForDetail.duration)}</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">تاریخ شروع کلاسی:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{toPersianDigits(selectedCourseForDetail.startDate)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const course = selectedCourseForDetail;
                      setSelectedCourseForDetail(null);
                      setEditingCourse(course);
                      setEditCourseTitle(course.title);
                      setEditCourseLecturer(course.lecturer);
                      setEditCourseDuration(course.duration);
                      setEditCourseCost(course.cost.toString());
                      setEditCourseCapacity(course.capacity.toString());
                      setEditCourseStartDate(course.startDate);
                      setEditCourseCategory(course.category);
                      setEditCourseDescription(course.description);
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
                    جهت تایید نهایی پذیرش در این کارگاه آزاد، مقتضی است مبلغ <strong className="text-teal-600 font-mono font-black">{formatCurrency(registeringCourse.cost)}</strong> را به حساب شماره <strong className="font-mono font-black">{toPersianDigits('۰۱۱۲۳۴۵۶۷۸۹')}</strong> بانک ملی ایران به نام دانشگاه علم و هنر واریز نموده و مشخصات فیش شتابی را در زیر آپلود فرمایید.
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
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono"
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
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono text-left"
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
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono text-left"
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
                          className="flex-1 text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none font-mono uppercase"
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
                            <span className="font-mono bg-emerald-500/10 px-2 py-0.5 rounded text-[9.5px] font-black">{appliedVoucher.code}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{appliedVoucher.title}</p>
                          <div className="flex justify-between items-center text-xs font-black mt-2 pt-1.5 border-t border-emerald-500/10">
                            <span>کاهش شهریه:</span>
                            <span className="font-mono">-{formatCurrency(voucherDiscountAmount)}</span>
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
                        <p className="text-[9.5px] text-gray-400">کدهای پیش‌فرض جهت تست: <code className="font-mono text-indigo-500 font-bold">WELCOME_ONLINE</code> (۳۰٪ تخفیف + اقساط) یا <code className="font-mono text-indigo-500 font-bold">YALDA1405</code> (۲۰٪ تخفیف) یا <code className="font-mono text-indigo-500 font-bold">FIRST_BUYER</code> (اولین خرید)</p>
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
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono"
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
                          <div className="mt-2 p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 font-mono text-[9.5px] flex items-center justify-center gap-1">
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
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">استاد / مدرس دوره *</label>
                        <input
                          type="text"
                          required
                          value={newCourseLecturer}
                          onChange={(e) => setNewCourseLecturer(e.target.value)}
                          placeholder="مثال: دکتر علیرضا صدقی"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                        />
                      </div>
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">طول دوره (ساعت)</label>
                        <input
                          type="text"
                          value={newCourseDuration}
                          onChange={(e) => setNewCourseDuration(e.target.value)}
                          placeholder="مثال: ۲۴ ساعت"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">شهریه ثبت‌نام (ریال) *</label>
                        <input
                          type="text"
                          required
                          value={newCourseCost}
                          onChange={(e) => setNewCourseCost(e.target.value)}
                          placeholder="مثال: ۴,۵۰۰,۰۰۰"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ظرفیت پذیرش (نفر)</label>
                        <input
                          type="number"
                          value={newCourseCapacity}
                          onChange={(e) => setNewCourseCapacity(e.target.value)}
                          placeholder="مثال: ۳۰"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ شروع دوره</label>
                        <input
                          type="text"
                          value={newCourseStartDate}
                          onChange={(e) => setNewCourseStartDate(e.target.value)}
                          placeholder="۱۴۰۵/۰۵/۱۵"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono"
                        />
                      </div>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">استاد / مدرس دوره *</label>
                        <input
                          type="text"
                          required
                          value={editCourseLecturer}
                          onChange={(e) => setEditCourseLecturer(e.target.value)}
                          placeholder="مثال: دکتر علیرضا صدقی"
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">طول دوره (ساعت)</label>
                        <input
                          type="text"
                          value={editCourseDuration}
                          onChange={(e) => setEditCourseDuration(e.target.value)}
                          placeholder="مثال: ۲۴ ساعت"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">شهریه ثبت‌نام (ریال) *</label>
                        <input
                          type="text"
                          required
                          value={editCourseCost}
                          onChange={(e) => setEditCourseCost(e.target.value)}
                          placeholder="مثال: ۴,۵۰۰,۰۰۰"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ظرفیت پذیرش (نفر)</label>
                        <input
                          type="number"
                          value={editCourseCapacity}
                          onChange={(e) => setEditCourseCapacity(e.target.value)}
                          placeholder="مثال: ۳۰"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ شروع دوره</label>
                        <input
                          type="text"
                          value={editCourseStartDate}
                          onChange={(e) => setEditCourseStartDate(e.target.value)}
                          placeholder="۱۴۰۵/۰۵/۱۵"
                          className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono"
                        />
                      </div>
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
                      <span className="text-base font-black font-mono text-gray-900 dark:text-white">
                        {toPersianDigits(registrants.filter(r => r.courseId === selectedCourseReport.id).length)} نفر
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                      <span className="text-[10px] text-gray-400 block font-bold mb-1">تایید شده نهایی</span>
                      <span className="text-base font-black font-mono text-emerald-600">
                        {toPersianDigits(registrants.filter(r => r.courseId === selectedCourseReport.id && r.status === 'verified').length)} نفر
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                      <span className="text-[10px] text-gray-400 block font-bold mb-1">در انتظار بررسی</span>
                      <span className="text-base font-black font-mono text-amber-500">
                        {toPersianDigits(registrants.filter(r => r.courseId === selectedCourseReport.id && r.status === 'pending').length)} نفر
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                      <span className="text-[10px] text-gray-400 block font-bold mb-1">درآمد کل دوره (تایید شده)</span>
                      <span className="text-base font-black font-mono text-teal-600 dark:text-teal-400">
                        {formatCurrency(registrants.filter(r => r.courseId === selectedCourseReport.id && r.status === 'verified').reduce((sum, r) => sum + r.amount, 0))}
                      </span>
                    </div>
                  </div>

                  {/* Registrants Table */}
                  <div className="overflow-x-auto rounded-2xl border border-gray-150 dark:border-gray-850 bg-white dark:bg-gray-950 mb-6">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 font-bold border-b border-gray-150 dark:border-gray-850">
                          <th className="p-3.5">نام دانشجو</th>
                          <th className="p-3.5">کد ملی / دانشجویی</th>
                          <th className="p-3.5">کد پیگیری شتابی</th>
                          <th className="p-3.5">بانک مبدأ</th>
                          <th className="p-3.5">مبلغ پرداختی</th>
                          <th className="p-3.5">وضعیت سند</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
                        {registrants.filter(r => r.courseId === selectedCourseReport.id).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-400">
                              تاکنون هیچ سندی برای پیش‌ثبت‌نام این کارگاه مهارتی آپلود نگردیده است.
                            </td>
                          </tr>
                        ) : (
                          registrants.filter(r => r.courseId === selectedCourseReport.id).map((reg) => (
                            <tr key={reg.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-all font-mono">
                              <td className="p-3.5 font-sans font-bold text-gray-900 dark:text-white">{reg.name}</td>
                              <td className="p-3.5">{toPersianDigits(reg.studentCode)}</td>
                              <td className="p-3.5">{toPersianDigits(reg.referenceCode)}</td>
                              <td className="p-3.5 font-sans">{reg.bank}</td>
                              <td className="p-3.5 font-bold text-gray-700 dark:text-gray-300">{formatCurrency(reg.amount)}</td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-sans font-black ${
                                  reg.status === 'verified' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                  reg.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                  'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                }`}>
                                  {reg.status === 'verified' ? 'تایید نهایی' : reg.status === 'rejected' ? 'مردود' : 'در انتظار بررسی'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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


      {/* =========================================================================
          MODULE 2: TUTS-REPORTS (REGISTRANTS REPORT LIST)
          ========================================================================= */}
      {moduleId === 'tuts-reports' && (
        <div className="space-y-5">
          {/* Filters Area */}
          <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/80">
            <div className="relative flex-1 w-full">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="جستجو با نام دانشجو، شماره دانشجویی، کد پیگیری فیش..."
                value={reportSearch}
                onChange={(e) => { setReportSearch(e.target.value); setReportPage(1); }}
                className="w-full text-xs pr-10 pl-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full xl:w-auto">
              <select
                value={reportCourseFilter}
                onChange={(e) => { setReportCourseFilter(e.target.value); setReportPage(1); }}
                className="w-full text-xs px-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none"
              >
                <option value="">فیلتر کارگاه‌های مهارتی</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>

              <select
                value={reportStatusFilter}
                onChange={(e) => { setReportStatusFilter(e.target.value); setReportPage(1); }}
                className="w-full text-xs px-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none"
              >
                <option value="">فیلتر وضعیت سند مالی</option>
                <option value="pending">در انتظار تایید</option>
                <option value="verified">تایید نهایی شده</option>
                <option value="rejected">رد شده</option>
              </select>

              <button
                onClick={handleExportSimulate}
                className="px-4 py-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 border border-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer w-full sm:w-auto"
              >
                <FileText className="w-4 h-4" />
                خروجی اکسل
              </button>
            </div>
          </div>

          {/* Table Container */}
          {loadingRegistrants ? (
            <LoadingSpinner text="در حال دریافت گزارش ثبت‌نام‌ها..." />
          ) : (
            <>
              {(() => {
                const totalPages = Math.max(1, Math.ceil(filteredRegistrants.length / reportPerPage));
                const safePage = Math.min(reportPage, totalPages);
                const paginatedRegistrants = filteredRegistrants.slice(
                  (safePage - 1) * reportPerPage,
                  safePage * reportPerPage
                );
                return (
                  <div className="overflow-x-auto rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-gray-55 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 font-extrabold">
                          <th className="p-4">شناسه</th>
                          <th className="p-4">نام دانشجو</th>
                          <th className="p-4">شماره دانشجویی / کد ملی</th>
                          <th className="p-4">کارگاه آموزشی</th>
                          <th className="p-4">مبلغ واریزی</th>
                          <th className="p-4">کد پیگیری / بانک</th>
                          <th className="p-4 text-center">تاریخ سند</th>
                          <th className="p-4 text-center">وضعیت تایید</th>
                          {currentUserRole === 'admin' && <th className="p-4 text-center">عملیات</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                        {paginatedRegistrants.length === 0 ? (
                          <tr>
                            <td colSpan={currentUserRole === 'admin' ? 9 : 8} className="p-12 text-center text-gray-400">
                              هیچ پرونده ثبتی یا آماری مطابق با فیلتر شما ثبت نشده است.
                            </td>
                          </tr>
                        ) : (
                          paginatedRegistrants.map((reg, idx) => {
                            const globalIdx = (safePage - 1) * reportPerPage + idx + 1;
                            const matchedC = courses.find(c => c.id === reg.courseId);

                            return (
                              <tr key={reg.id} className="hover:bg-gray-55/40 dark:hover:bg-gray-850/10 transition-colors">
                                <td className="p-4 font-mono font-bold text-gray-400">
                                  {toPersianDigits(globalIdx)}
                                </td>
                                <td className="p-4 font-extrabold text-gray-900 dark:text-white">
                                  {reg.name}
                                </td>
                                <td className="p-4 font-mono font-bold text-gray-600 dark:text-gray-400">
                                  {toPersianDigits(reg.studentCode)}
                                </td>
                                <td className="p-4 text-gray-700 dark:text-gray-300 font-medium max-w-xs truncate">
                                  {reg.courseTitle}
                                </td>
                                <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(reg.amount)}
                                </td>
                                <td className="p-4">
                                  <div className="font-mono font-bold text-gray-800 dark:text-gray-200">
                                    {toPersianDigits(reg.referenceCode)}
                                  </div>
                                  <div className="text-[10px] text-gray-400 mt-0.5">
                                    {reg.bank}
                                  </div>
                                </td>
                                <td className="p-4 text-center font-mono text-gray-500">
                                  {toPersianDigits(reg.date)}
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                                    reg.status === 'verified' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                    reg.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                    'bg-amber-500/10 text-amber-600'
                                  }`}>
                                    {reg.status === 'verified' ? 'تایید نهایی شده' :
                                     reg.status === 'rejected' ? 'فیش رد شده' : 'در انتظار بررسی'}
                                  </span>
                                  {reg.status === 'rejected' && reg.rejectionReason && (
                                    <div className="text-[9px] text-rose-500 mt-1 max-w-[150px] mx-auto truncate" title={reg.rejectionReason}>
                                      علت: {reg.rejectionReason}
                                    </div>
                                  )}
                                </td>
                                {currentUserRole === 'admin' && (
                                  <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {reg.status === 'pending' && (
                                        <button
                                          onClick={() => {
                                            setSelectedReceiptForReview(reg);
                                            setShowRejectBox(false);
                                          }}
                                          className="px-2 py-1 text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg font-bold hover:bg-teal-500/20 transition-all cursor-pointer"
                                        >
                                          بررسی مدارک
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleDeleteRegistrant(reg.id)}
                                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                                        title="حذف پرونده"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* Pagination Controls for Registrants */}
              {filteredRegistrants.length > reportPerPage && (
                <Pagination
                  currentPage={reportPage}
                  totalItems={filteredRegistrants.length}
                  perPage={reportPerPage}
                  onPageChange={setReportPage}
                />
              )}
            </>
          )}
        </div>
      )}


      {/* =========================================================================
          MODULE 3: TUTS-RECEIPTS (BANK RECEIPTS APPROVAL WORKSPACE)
          ========================================================================= */}
      {moduleId === 'tuts-receipts' && (
        <div className="space-y-6">
          <div className="p-4 bg-teal-500/5 border border-teal-500/10 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-black text-teal-800 dark:text-teal-400 block">مرکز بررسی هویت، انطباق مالی و احراز صلاحیت فیش‌های واریزی شتاب</span>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                مدیر آموزش محترم؛ در این کارتابل می‌توانید کلیه فیش‌های ارسالی دانشجویان برای ثبت‌نام در دوره‌ها را بازبینی و با تایید فیش، ظرفیت دوره را به صورت سیستمی نهایی فرمایید. در صورت عدم انطباق یا نقص تصویر، فیش را رد نمایید.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Receipts List Area */}
            <div className={`${selectedReceiptForReview ? 'lg:col-span-6 xl:col-span-5' : 'lg:col-span-12'} space-y-3`}>
              {/* Filter panel */}
              <div className="bg-gray-50/50 dark:bg-gray-950/20 p-4 rounded-2xl border border-gray-100 dark:border-gray-850 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-gray-800 dark:text-white justify-start">
                  <Filter className="w-4 h-4 text-teal-600" />
                  <span>جستجو و فیلترینگ پیشرفته کارتابل فیش‌ها</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 mb-1">وضعیت تایید فیش</label>
                    <select
                      value={receiptWorkspaceStatusFilter}
                      onChange={(e) => setReceiptWorkspaceStatusFilter(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-sans cursor-pointer"
                    >
                      <option value="all">همه وضعیت‌ها</option>
                      <option value="pending">در انتظار بررسی</option>
                      <option value="verified">تایید شده</option>
                      <option value="rejected">رد شده</option>
                    </select>
                  </div>

                  {/* Course Filter */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 mb-1">فیلتر براساس دوره / کارگاه</label>
                    <select
                      value={receiptWorkspaceCourseFilter}
                      onChange={(e) => setReceiptWorkspaceCourseFilter(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-sans cursor-pointer"
                    >
                      <option value="all">همه دوره‌ها</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Learner Code / Student ID Filter */}
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 mb-1">کد ملی یا دانشجویی فراگیر</label>
                    <input
                      type="text"
                      value={receiptWorkspaceSearchCode}
                      onChange={(e) => setReceiptWorkspaceSearchCode(e.target.value)}
                      placeholder="جستجوی کد ملی یا نام..."
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-sans"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {(() => {
                  const filtered = registrants.filter(r => {
                    const matchesStatus = receiptWorkspaceStatusFilter === 'all' || r.status === receiptWorkspaceStatusFilter;
                    const matchesCourse = receiptWorkspaceCourseFilter === 'all' || r.courseId === receiptWorkspaceCourseFilter;
                    const matchesCode = !receiptWorkspaceSearchCode.trim() || 
                      r.studentCode.toString().includes(receiptWorkspaceSearchCode.trim()) ||
                      r.name.includes(receiptWorkspaceSearchCode.trim());
                    return matchesStatus && matchesCourse && matchesCode;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-center text-gray-400 text-xs">
                        هیچ فیش بانکی با معیارهای فیلتر انتخاب شده یافت نشد.
                      </div>
                    );
                  }

                  return filtered.map((reg) => {
                    const isSelected = selectedReceiptForReview?.id === reg.id;

                    return (
                      <div
                        key={reg.id}
                        onClick={() => {
                          setSelectedReceiptForReview(reg);
                          setShowRejectBox(false);
                          setRejectionInput('');
                        }}
                        className={`p-4 bg-white dark:bg-gray-900 border rounded-2xl shadow-2xs hover:shadow-md cursor-pointer transition-all text-right ${
                          isSelected 
                            ? 'border-teal-500 dark:border-teal-500/60 ring-1 ring-teal-500/10' 
                            : 'border-gray-100 dark:border-gray-800/80 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-extrabold text-xs text-gray-900 dark:text-white block">{reg.name}</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5 font-mono">کد ملی / دانشجویی: {toPersianDigits(reg.studentCode)}</span>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                            reg.status === 'verified' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                            reg.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                            'bg-amber-500/10 text-amber-600'
                          }`}>
                            {reg.status === 'verified' ? 'تایید شده' :
                             reg.status === 'rejected' ? 'رد شده' : 'در انتظار بررسی'}
                          </span>
                        </div>

                        <div className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-1 mb-3.5">
                          کارگاه: {reg.courseTitle}
                        </div>

                        <div className="flex justify-between items-center border-t border-gray-50 dark:border-gray-800/60 pt-2 text-[10px]">
                          <span className="font-mono text-gray-400">{toPersianDigits(reg.date)}</span>
                          <span className="font-mono font-black text-teal-600 dark:text-teal-400">{formatCurrency(reg.amount)}</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Receipt Review and Preview Slip Panel */}
            {selectedReceiptForReview && (
              <div className="lg:col-span-6 xl:col-span-7">
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-xl space-y-6 sticky top-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">بررسی تفصیلی پرونده مالی و پرداخت</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">شناسه سند: {selectedReceiptForReview.id}</p>
                    </div>
                    <button
                      onClick={() => setSelectedReceiptForReview(null)}
                      className="p-1 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* SIMULATED SLIP / RECEIPT CARD */}
                  <div className="border border-indigo-500/15 rounded-3xl bg-gradient-to-br from-indigo-50/25 to-white dark:from-indigo-950/10 dark:to-gray-950 p-5 shadow-xs relative overflow-hidden text-right select-none">
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center text-gray-200/25 dark:text-gray-800/15 text-5xl font-black rotate-12 uppercase">
                      karante university
                    </div>
                    
                    <div className="flex justify-between items-center border-b border-gray-200/40 pb-3 mb-4">
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">فیش دیجیتال شتاب</span>
                      <span className="text-xs font-black text-gray-800 dark:text-gray-200">{selectedReceiptForReview.bank}</span>
                    </div>

                    <div className="space-y-2.5 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-sans">بابت ثبت‌نام کارگاه:</span>
                        <span className="text-gray-900 dark:text-white font-sans font-bold text-left truncate max-w-[200px]">{selectedReceiptForReview.courseTitle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-sans">نام کامل واریز کننده:</span>
                        <span className="text-gray-900 dark:text-white font-sans font-black">{selectedReceiptForReview.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-sans">شماره ملی / دانشجویی:</span>
                        <span className="text-gray-900 dark:text-white font-bold">{toPersianDigits(selectedReceiptForReview.studentCode)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-sans">کد رهگیری تراکنش (Ref):</span>
                        <span className="text-gray-900 dark:text-white font-black text-indigo-600 dark:text-indigo-400">{toPersianDigits(selectedReceiptForReview.referenceCode)}</span>
                      </div>
                       <div className="flex justify-between">
                        <span className="text-gray-400 font-sans">تاریخ و زمان تراکنش:</span>
                        <span className="text-gray-900 dark:text-white font-bold">{toPersianDigits(selectedReceiptForReview.date)}</span>
                      </div>
                      
                      {/* VOUCHER & DISCOUNT INFO IN SLIP */}
                      {(selectedReceiptForReview as any).appliedVoucherCode && (
                        <div className="bg-indigo-500/5 p-2 rounded-xl border border-indigo-500/10 space-y-1 mt-2 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-indigo-600 dark:text-indigo-400 font-sans">بن تخفیف استفاده شده:</span>
                            <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">{(selectedReceiptForReview as any).appliedVoucherCode}</span>
                          </div>
                          {(selectedReceiptForReview as any).discountAmount && (
                            <div className="flex justify-between">
                              <span className="text-gray-400 font-sans">مبلغ تخفیف کسر شده:</span>
                              <span className="text-rose-500 font-bold font-mono">-{formatCurrency((selectedReceiptForReview as any).discountAmount)}</span>
                            </div>
                          )}
                          {(selectedReceiptForReview as any).installmentsCount && (
                            <div className="flex justify-between">
                              <span className="text-gray-400 font-sans">نوع پرداخت:</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">پرداخت اقساطی ({toPersianDigits((selectedReceiptForReview as any).installmentsCount)} قسطه)</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between pt-3.5 border-t border-dashed border-gray-200/50 mt-4 text-sm">
                        <span className="text-gray-400 font-sans font-bold">مبلغ نهایی پرداختی:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">{formatCurrency(selectedReceiptForReview.amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  {selectedReceiptForReview.status === 'pending' ? (
                    <div className="space-y-4">
                      {!showRejectBox ? (
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              setShowRejectBox(true);
                              setRejectionInput('');
                            }}
                            className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <X className="w-4 h-4" />
                            عدم تایید فیش
                          </button>
                          <button
                            onClick={() => handleApproveReceipt(selectedReceiptForReview.id)}
                            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-4 h-4" />
                            تایید نهایی و ثبت‌نام
                          </button>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3 bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl text-right"
                        >
                          <label className="block text-xs font-bold text-rose-800 dark:text-rose-400 mb-1.5">علت عدم تایید فیش واریز را بنویسید:</label>
                          <textarea
                            value={rejectionInput}
                            onChange={(e) => setRejectionInput(e.target.value)}
                            placeholder="مثال: مبلغ تراکنش کافی نیست یا کد رهگیری تکراری است..."
                            rows={2}
                            required
                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                          ></textarea>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowRejectBox(false)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 rounded-xl text-[11px] text-gray-500 font-bold cursor-pointer"
                            >
                              انصراف
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectReceipt(selectedReceiptForReview.id)}
                              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold cursor-pointer"
                            >
                              ثبت رد صلاحیت فیش
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                      {selectedReceiptForReview.status === 'verified' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 text-xs font-bold">
                          <Check className="w-4 h-4" />
                          این سند مالی با موفقیت تایید شده و دانشجو ثبت‌نام گردید.
                        </span>
                      ) : (
                        <div>
                          <span className="text-rose-500 flex items-center justify-center gap-1 mb-1">
                            <AlertTriangle className="w-4 h-4" />
                            این سند مالی قبلاً رد صلاحیت شده است.
                          </span>
                          <span className="text-[10px] text-gray-400">علت: {selectedReceiptForReview.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}      {moduleId === 'tuts-stats' && (() => {
        const getStatsData = () => {
          if (statAppliedCourse === 'all') {
            return {
              totalApproved: 524,
              totalAmount: 1582310000,
              onlinePayment: 240,
              bankSlips: 284,
              months: [
                { month: 'فروردین', count: 2, amount: 1500000, online: 2, bankSlip: 0, percentage: 0.38 },
                { month: 'اردیبهشت', count: 427, amount: 1115960000, online: 143, bankSlip: 284, percentage: 81.49 },
                { month: 'خرداد', count: 95, amount: 464850000, online: 95, bankSlip: 0, percentage: 18.13 },
                { month: 'تیر', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                { month: 'مرداد', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                { month: 'شهریور', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                { month: 'مهر', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                { month: 'آبان', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                { month: 'آذر', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                { month: 'دی', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                { month: 'بهمن', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                { month: 'اسفند', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
              ],
              seasons: {
                spring: { count: 524, amount: 1582310000 },
                summer: { count: 0, amount: 0 },
                autumn: { count: 0, amount: 0 },
                winter: { count: 0, amount: 0 }
              },
              avgMonthly: 44,
              peekMonth: 'اردیبهشت با ۴۲۷ نفر'
            };
          }
          
          const course = courses.find(c => c.id === statAppliedCourse);
          if (!course) {
            return {
              totalApproved: 0,
              totalAmount: 0,
              onlinePayment: 0,
              bankSlips: 0,
              months: [],
              seasons: { spring: { count:0, amount:0 }, summer: { count:0, amount:0 }, autumn: { count:0, amount:0 }, winter: { count:0, amount:0 } },
              avgMonthly: 0,
              peekMonth: 'ندارد'
            };
          }

          const total = course.enrolled;
          const countFar = Math.round(total * 0.1);
          const countOrd = Math.round(total * 0.7);
          const countKhor = total - countFar - countOrd;

          const amtFar = countFar * course.cost;
          const amtOrd = countOrd * course.cost;
          const amtKhor = countKhor * course.cost;

          let onlineRatio = 1.0;
          if (course.id === 'tut-1') onlineRatio = 0.47;
          if (course.id === 'tut-2') onlineRatio = 0.41;

          const totalOnline = Math.round(total * onlineRatio);
          const totalBank = total - totalOnline;

          const onlineFar = Math.round(countFar * onlineRatio);
          const bankFar = countFar - onlineFar;

          const onlineOrd = Math.round(countOrd * onlineRatio);
          const bankOrd = countOrd - onlineOrd;

          const onlineKhor = totalOnline - onlineFar - onlineOrd;
          const bankKhor = totalBank - bankFar - bankOrd;

          return {
            totalApproved: total,
            totalAmount: total * course.cost,
            onlinePayment: totalOnline,
            bankSlips: totalBank,
            months: [
              { month: 'فروردین', count: countFar, amount: amtFar, online: onlineFar, bankSlip: bankFar, percentage: total > 0 ? Number(((countFar / total) * 100).toFixed(2)) : 0 },
              { month: 'اردیبهشت', count: countOrd, amount: amtOrd, online: onlineOrd, bankSlip: bankOrd, percentage: total > 0 ? Number(((countOrd / total) * 100).toFixed(2)) : 0 },
              { month: 'خرداد', count: countKhor, amount: amtKhor, online: onlineKhor, bankSlip: bankKhor, percentage: total > 0 ? Number(((countKhor / total) * 100).toFixed(2)) : 0 },
              { month: 'تیر', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
              { month: 'مرداد', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
              { month: 'شهریور', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
              { month: 'مهر', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
              { month: 'آبان', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
              { month: 'آذر', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
              { month: 'دی', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
              { month: 'بهمن', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
              { month: 'اسفند', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
            ],
            seasons: {
              spring: { count: total, amount: total * course.cost },
              summer: { count: 0, amount: 0 },
              autumn: { count: 0, amount: 0 },
              winter: { count: 0, amount: 0 }
            },
            avgMonthly: Math.round(total / 12),
            peekMonth: `اردیبهشت با ${toPersianDigits(countOrd)} نفر`
          };
        };

        const currentData = getStatsData();

        return (
          <div className="space-y-6 text-right">
            {/* Filter Section */}
            <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs space-y-4">
              <h5 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800/80 pb-3">
                <Filter className="w-4 h-4 text-teal-600" />
                فیلترهای گزارشات آماری دوره‌ها
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block">انتخاب سال مالی</label>
                  <select
                    value={statSelectedYear}
                    onChange={(e) => setStatSelectedYear(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none"
                  >
                    <option value="۱۴۰۵">۱۴۰۵</option>
                    <option value="۱۴۰۴">۱۴۰۴</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block">دوره آموزشی</label>
                  <select
                    value={statSelectedCourse}
                    onChange={(e) => setStatSelectedCourse(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none"
                  >
                    <option value="all">همه دوره‌ها</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    setStatAppliedYear(statSelectedYear);
                    setStatAppliedCourse(statSelectedCourse);
                    showToast('فیلتر گزارش با موفقیت اعمال شد.', 'success');
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  اعمال فیلتر
                </button>
              </div>
            </div>

            {/* Selected Year Bar */}
            <div className="flex items-center gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/10 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold">
              <Calendar className="w-4 h-4" />
              <span>سال انتخاب شده: {toPersianDigits(statAppliedYear)}</span>
              {statAppliedCourse !== 'all' && (
                <>
                  <span className="mx-1">•</span>
                  <span>دوره: {courses.find(c => c.id === statAppliedCourse)?.title}</span>
                </>
              )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold mb-1">کل ثبت‌نام‌های تایید شده</span>
                  <span className="text-xl font-black font-mono text-gray-900 dark:text-white">
                    {toPersianDigits(currentData.totalApproved)} <span className="text-xs font-sans text-gray-400">نفر</span>
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold mb-1">کل مبلغ دریافتی (ریال)</span>
                  <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {toPersianDigits(currentData.totalAmount.toLocaleString('fa-IR'))}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold mb-1">پرداخت آنلاین</span>
                  <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                    {toPersianDigits(currentData.onlinePayment)} <span className="text-xs font-sans text-gray-400">تراکنش</span>
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold mb-1">فیش بانکی تایید شده</span>
                  <span className="text-xl font-black font-mono text-purple-600 dark:text-purple-400">
                    {toPersianDigits(currentData.bankSlips)} <span className="text-xs font-sans text-gray-400">فیش</span>
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Recharts Area Chart for monthly progress */}
            <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs">
              <h5 className="text-xs font-black text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                روند ثبت‌نام در ۱۲ ماه اخیر (سال {toPersianDigits(statAppliedYear)})
              </h5>
              <div className="h-72 w-full font-mono text-xs" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={currentData.months}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-gray-800" />
                    <XAxis 
                      dataKey="month" 
                      className="fill-gray-400 dark:fill-gray-500" 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      className="fill-gray-400 dark:fill-gray-500" 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(v) => toPersianDigits(v)}
                    />
                    <Tooltip 
                      formatter={(value: any) => [toPersianDigits(value) + ' نفر', 'تعداد ثبت‌نام']}
                      labelFormatter={(label) => `ماه: ${label}`}
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', textAlign: 'right' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Stats Table */}
              <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs lg:col-span-2 space-y-4">
                <h5 className="text-xs font-black text-gray-900 dark:text-white">آمار ماهانه - سال {toPersianDigits(statAppliedYear)}</h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-gray-55 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-850 text-gray-400 dark:text-gray-500 font-extrabold">
                        <th className="p-2.5 font-extrabold text-right">ماه</th>
                        <th className="p-2.5 font-extrabold text-center">تعداد ثبت‌نام</th>
                        <th className="p-2.5 font-extrabold text-left">مبلغ دریافتی (ریال)</th>
                        <th className="p-2.5 font-extrabold text-center">پرداخت آنلاین</th>
                        <th className="p-2.5 font-extrabold text-center">فیش بانکی</th>
                        <th className="p-2.5 font-extrabold text-left">درصد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                      {currentData.months.map((m) => (
                        <tr key={m.month} className="hover:bg-gray-55/40 dark:hover:bg-gray-950/40 transition-colors">
                          <td className="p-2.5 text-right font-bold text-gray-800 dark:text-gray-200">{m.month}</td>
                          <td className="p-2.5 text-center font-mono font-bold">{toPersianDigits(m.count)}</td>
                          <td className="p-2.5 text-left font-mono text-emerald-600 dark:text-emerald-400 font-bold">{toPersianDigits(m.amount.toLocaleString('fa-IR'))}</td>
                          <td className="p-2.5 text-center font-mono text-gray-500">{toPersianDigits(m.online)}</td>
                          <td className="p-2.5 text-center font-mono text-gray-500">{toPersianDigits(m.bankSlip)}</td>
                          <td className="p-2.5 text-left font-mono">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-gray-400 text-[10px]">{toPersianDigits(m.percentage)}٪</span>
                              <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-850 rounded-full overflow-hidden inline-block relative">
                                <div className="absolute right-0 top-0 h-full bg-blue-600 rounded-full" style={{ width: `${m.percentage}%` }}></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 dark:bg-gray-950 font-black border-t-2 border-gray-200 dark:border-gray-800">
                        <td className="p-3 text-right">جمع کل</td>
                        <td className="p-3 text-center font-mono">{toPersianDigits(currentData.totalApproved)}</td>
                        <td className="p-3 text-left font-mono text-emerald-600 dark:text-emerald-400">{toPersianDigits(currentData.totalAmount.toLocaleString('fa-IR'))}</td>
                        <td className="p-3 text-center font-mono">{toPersianDigits(currentData.onlinePayment)}</td>
                        <td className="p-3 text-center font-mono">{toPersianDigits(currentData.bankSlips)}</td>
                        <td className="p-3 text-left font-mono">۱۰۰٪</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-6">
                {/* Seasonal breakdown */}
                <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs space-y-4">
                  <h5 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    آمار فصلی - سال {toPersianDigits(statAppliedYear)}
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-rose-50/40 dark:bg-rose-950/10 border border-rose-500/10 rounded-2xl text-center">
                      <span className="text-[10px] text-rose-500 block font-bold mb-1">بهار</span>
                      <span className="text-sm font-black font-mono text-rose-600 dark:text-rose-400 block">{toPersianDigits(currentData.seasons.spring.count)} نفر</span>
                      <span className="text-[9px] font-mono text-gray-400">{toPersianDigits(currentData.seasons.spring.amount.toLocaleString('fa-IR'))} ریال</span>
                    </div>
                    <div className="p-3 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-500/10 rounded-2xl text-center">
                      <span className="text-[10px] text-amber-500 block font-bold mb-1">تابستان</span>
                      <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400 block">{toPersianDigits(currentData.seasons.summer.count)} نفر</span>
                      <span className="text-[9px] font-mono text-gray-400">{toPersianDigits(currentData.seasons.summer.amount.toLocaleString('fa-IR'))} ریال</span>
                    </div>
                    <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-500/10 rounded-2xl text-center">
                      <span className="text-[10px] text-emerald-500 block font-bold mb-1">پاییز</span>
                      <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 block">{toPersianDigits(currentData.seasons.autumn.count)} نفر</span>
                      <span className="text-[9px] font-mono text-gray-400">{toPersianDigits(currentData.seasons.autumn.amount.toLocaleString('fa-IR'))} ریال</span>
                    </div>
                    <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-2xl text-center">
                      <span className="text-[10px] text-indigo-500 block font-bold mb-1">زمستان</span>
                      <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400 block">{toPersianDigits(currentData.seasons.winter.count)} نفر</span>
                      <span className="text-[9px] font-mono text-gray-400">{toPersianDigits(currentData.seasons.winter.amount.toLocaleString('fa-IR'))} ریال</span>
                    </div>
                  </div>
                </div>

                {/* Report summary card */}
                <div className="p-5 rounded-3xl bg-teal-500/5 border border-teal-500/15 shadow-xs space-y-4">
                  <h5 className="text-xs font-black text-teal-800 dark:text-teal-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    خلاصه گزارش دوره‌ها
                  </h5>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-xl border border-teal-500/10">
                      <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                      <span className="text-gray-400 font-bold text-[10px]">میانگین ماهانه ثبت نام:</span>
                      <span className="font-mono font-black text-gray-800 dark:text-gray-200 mr-auto">{toPersianDigits(currentData.avgMonthly)} نفر</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-xl border border-teal-500/10">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-gray-400 font-bold text-[10px]">پربازدیدترین ماه سال:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 mr-auto">{toPersianDigits(currentData.peekMonth)}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-xl border border-teal-500/10">
                      <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                      <span className="text-gray-400 font-bold text-[10px]">مجموع پذیرش دانشجو:</span>
                      <span className="font-mono font-black text-gray-800 dark:text-gray-200 mr-auto">{toPersianDigits(currentData.totalApproved)} نفر</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}


      {/* =========================================================================
          MODULE 4: TUTS-STATS (ANALYTICS & CHARTS PANEL)
          ========================================================================= */}
      {moduleId === 'tuts-stats' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-gray-950 dark:text-white mb-1">گزارش کلی و عملکرد مالی دوره‌های آموزشی</h4>
              <p className="text-xs text-gray-400">تحلیل آماری ثبت‌نام، ظرفیت کلاس‌ها و سود خالص ناخالص کارگاه‌های مهارتی</p>
            </div>
            
            <button
              onClick={() => {
                showToast('در حال آماده‌سازی گزارش تجمیعی PDF دوره‌ها...', 'info');
                setTimeout(() => showToast('خروجی PDF گزارشات با موفقیت دانلود شد.', 'success'), 1200);
              }}
              className="px-4 py-2 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 border border-teal-500/15 text-teal-700 dark:text-teal-400 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              دریافت گزارش تجمیعی کارگاه‌ها
            </button>
          </div>

          {/* Quick Metrics of General Course Report */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl">
              <span className="text-[10px] text-gray-400 block font-bold mb-1">تعداد کل کارگاه‌ها</span>
              <span className="text-xl font-black font-mono text-gray-900 dark:text-white">
                {toPersianDigits(courses.length)} <span className="text-xs font-sans text-gray-400">دوره فعال</span>
              </span>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl">
              <span className="text-[10px] text-gray-400 block font-bold mb-1">میانگین ثبت‌نامی‌ها</span>
              <span className="text-xl font-black font-mono text-teal-600 dark:text-teal-400">
                {toPersianDigits(Math.round(totalEnrolledAllWorkshops / courses.length))} <span className="text-xs font-sans text-gray-400">دانشجو در کلاس</span>
              </span>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl">
              <span className="text-[10px] text-gray-400 block font-bold mb-1">درصد پوشش کل ظرفیت</span>
              <span className="text-xl font-black font-mono text-indigo-500">
                {toPersianDigits(Math.round((totalEnrolledAllWorkshops / totalCapacityAllWorkshops) * 100))}٪
              </span>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl">
              <span className="text-[10px] text-gray-400 block font-bold mb-1">مجموع گردش ناخالص</span>
              <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {toPersianDigits((courses.reduce((sum, c) => sum + (c.enrolled * c.cost), 0) / 10).toLocaleString('fa-IR'))} <span className="text-xs font-sans">تومان</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Registration progress bar list */}
            <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs lg:col-span-2">
              <h5 className="text-xs font-black text-gray-900 dark:text-white mb-6 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                توزیع آمار کل ثبت‌نامی‌ها نسبت به ظرفیت کلاس‌ها
              </h5>

              <div className="space-y-4">
                {courses.map(c => {
                  const percent = (c.enrolled / c.capacity) * 100;
                  return (
                    <div key={c.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-bold text-gray-700 dark:text-gray-300 truncate max-w-[280px]">{c.title}</span>
                        <span className="font-mono text-gray-400">{toPersianDigits(c.enrolled)} از {toPersianDigits(c.capacity)} نفر ({toPersianDigits(Math.round(percent))}٪)</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-gray-50 dark:bg-gray-950 overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, percent)}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={`absolute h-full rounded-full ${
                            percent >= 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                            percent >= 75 ? 'bg-gradient-to-r from-teal-500 to-indigo-500' :
                            'bg-gradient-to-r from-indigo-500 to-purple-500'
                          }`}
                        ></motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category summary distribution card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs">
              <h5 className="text-xs font-black text-gray-900 dark:text-white mb-6 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                سهم گروه‌های درسی از کل جذب دانشجو
              </h5>

              <div className="space-y-4">
                {categories.map((cat, idx) => {
                  const catCourses = courses.filter(c => c.category === cat);
                  const catEnrolled = catCourses.reduce((sum, c) => sum + c.enrolled, 0);
                  const sharePercent = totalEnrolledAllWorkshops > 0 ? Math.round((catEnrolled / totalEnrolledAllWorkshops) * 100) : 0;
                  const colors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-purple-500'];
                  const colorClass = colors[idx % colors.length];

                  return (
                    <div key={cat} className="p-3 bg-gray-55 dark:bg-gray-950 rounded-2xl border border-gray-100/50 dark:border-gray-850 space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-gray-700 dark:text-gray-300">{cat}</span>
                        <span className="font-mono text-gray-500 font-extrabold">{toPersianDigits(catEnrolled)} نفر ({toPersianDigits(sharePercent)}٪)</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${sharePercent}%` }}></div>
                      </div>
                      <span className="text-[9px] text-gray-400 block">{toPersianDigits(catCourses.length)} دوره تعریف شده در این حوزه</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance analysis course breakdown table */}
          <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs">
            <h5 className="text-xs font-black text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              جدول جامع موازنه‌های آماری و درآمدی کارگاه‌ها
            </h5>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-gray-55 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-850 text-gray-400 dark:text-gray-500 font-extrabold">
                    <th className="p-3 font-extrabold text-right">عنوان کارگاه / مدرس</th>
                    <th className="p-3 font-extrabold text-center">گروه علمی</th>
                    <th className="p-3 font-extrabold text-center">ظرفیت / ثبت‌نامی</th>
                    <th className="p-3 font-extrabold text-left">هزینه دوره</th>
                    <th className="p-3 font-extrabold text-left">مجموع ناخالص تولید شده</th>
                    <th className="p-3 font-extrabold text-center">وضعیت برگزاری</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                  {courses.map(c => {
                    const rev = c.enrolled * c.cost;
                    return (
                      <tr key={c.id} className="hover:bg-gray-55/40 dark:hover:bg-gray-950/40 transition-colors">
                        <td className="p-3 text-right">
                          <span className="font-black text-gray-900 dark:text-white block">{c.title}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">مدرس: {c.lecturer}</span>
                        </td>
                        <td className="p-3 text-center text-[10.5px] text-gray-500 font-medium">
                          {c.category}
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono font-bold text-gray-800 dark:text-gray-200 block">
                            {toPersianDigits(c.enrolled)} از {toPersianDigits(c.capacity)}
                          </span>
                          <span className="text-[10px] text-gray-400 block font-mono">({toPersianDigits(Math.round((c.enrolled / c.capacity) * 100))}٪)</span>
                        </td>
                        <td className="p-3 text-left font-mono font-bold text-gray-700 dark:text-gray-300">
                          {toPersianDigits((c.cost / 10).toLocaleString('fa-IR'))} <span className="text-[10px] font-sans text-gray-400">تومان</span>
                        </td>
                        <td className="p-3 text-left font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {toPersianDigits((rev / 10).toLocaleString('fa-IR'))} <span className="text-[10px] font-sans font-normal text-gray-400">تومان</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-extrabold ${
                            c.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10' :
                            c.status === 'completed' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-500/10' :
                            'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}>
                            {c.status === 'active' ? 'در حال ثبت‌نام' :
                             c.status === 'completed' ? 'پایان کلاس مهارتی' : 'پایان یافته و بسته شده'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 5: TUTS-SURVEYS (SURVEYS LIST & EVALUATION MODULE)
          ========================================================================= */}
      {moduleId === 'tuts-surveys' && (() => {
        // Calculate filtered list of individual surveys
        const filteredSurveys = individualSurveys.filter(survey => {
          const query = surveySearch.trim().toLowerCase();
          if (query) {
            const queryEng = toEnglishDigits(query);
            const queryPer = toPersianDigits(query);
            
            const matchesName = survey.name.toLowerCase().includes(query) || survey.name.toLowerCase().includes(queryEng) || survey.name.toLowerCase().includes(queryPer);
            const matchesPhone = survey.phone.includes(query) || survey.phone.includes(queryEng) || survey.phone.includes(queryPer);
            const matchesCourse = survey.courseTitle.toLowerCase().includes(query) || survey.courseTitle.toLowerCase().includes(queryEng) || survey.courseTitle.toLowerCase().includes(queryPer);
            
            if (!matchesName && !matchesPhone && !matchesCourse) return false;
          }
          
          if (surveyFromDate.trim()) {
            const sDate = toEnglishDigits(survey.date.split(' ')[0]);
            const fromDate = toEnglishDigits(surveyFromDate.trim());
            if (sDate < fromDate) return false;
          }
          
          if (surveyToDate.trim()) {
            const sDate = toEnglishDigits(survey.date.split(' ')[0]);
            const toDate = toEnglishDigits(surveyToDate.trim());
            if (sDate > toDate) return false;
          }
          
          return true;
        });

        const surveysPerPage = 20;
        const totalSurveysCount = filteredSurveys.length;
        const totalPagesCount = Math.max(1, Math.ceil(totalSurveysCount / surveysPerPage));
        
        // Ensure page is safe
        const safeCurrentPage = Math.min(surveyPage, totalPagesCount);
        const paginatedSurveys = filteredSurveys.slice(
          (safeCurrentPage - 1) * surveysPerPage,
          safeCurrentPage * surveysPerPage
        );

        const thisMonthCount = individualSurveys.filter(s => s.date.includes('۱۴۰۵/۰۳') || s.date.includes('1405/03')).length;

        const handleResetFilters = () => {
          setSurveySearch('');
          setSurveyFromDate('');
          setSurveyToDate('');
          setSurveyPage(1);
          showToast('فیلترهای جستجو با موفقیت بازنشانی شدند.', 'info');
        };

        const handleApplySearch = () => {
          setSurveyPage(1);
          showToast('فیلترها با موفقیت اعمال گردیدند.', 'success');
        };

        const handleDeleteSurvey = (id: number) => {
          setIndividualSurveys(prev => prev.filter(s => s.id !== id));
          showToast('نظرسنجی انتخاب‌شده با موفقیت حذف گردید.', 'info');
        };

        const handleDownloadExcel = () => {
          const headers = ['شناسه', 'نام و نام خانوادگی', 'شماره همراه', 'تاریخ ثبت', 'عنوان دوره', 'امتیاز', 'دیدگاه'];
          const rows = filteredSurveys.map(s => [
            s.id,
            s.name,
            s.phone,
            s.date,
            s.courseTitle,
            s.rating,
            s.comment
          ]);
          
          const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
          
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "surveys_report.csv");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast('گزارش اکسل نظرسنجی‌ها با موفقیت دانلود شد.', 'success');
        };

        return (
          <div className="space-y-6 text-right">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-base font-black text-gray-950 dark:text-white">مدیریت نظرسنجی های دوره های آموزشی</h4>
            </div>

            {/* Search Filters Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 p-5 rounded-3xl shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800/60 pb-3">
                <span className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-gray-400" />
                  فیلترهای جستجو
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                {/* Search & Reset Buttons */}
                <div className="md:col-span-3 flex gap-2">
                  <button
                    onClick={handleResetFilters}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-650 dark:text-gray-300 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-4 h-4 rotate-180" />
                    بازنشانی
                  </button>
                  <button
                    onClick={handleApplySearch}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Search className="w-4 h-4" />
                    جستجو
                  </button>
                </div>

                {/* To Date */}
                <div className="md:col-span-2 space-y-1 text-right">
                  <label className="text-[10px] font-bold text-gray-400 block flex items-center gap-1 justify-end">
                    <span>تا تاریخ</span>
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  </label>
                  <input
                    type="text"
                    placeholder="YYYY/MM/DD"
                    value={surveyToDate}
                    onChange={(e) => { setSurveyToDate(e.target.value); setSurveyPage(1); }}
                    className="w-full text-xs text-center px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                {/* From Date */}
                <div className="md:col-span-2 space-y-1 text-right">
                  <label className="text-[10px] font-bold text-gray-400 block flex items-center gap-1 justify-end">
                    <span>از تاریخ</span>
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  </label>
                  <input
                    type="text"
                    placeholder="YYYY/MM/DD"
                    value={surveyFromDate}
                    onChange={(e) => { setSurveyFromDate(e.target.value); setSurveyPage(1); }}
                    className="w-full text-xs text-center px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                {/* Text query search */}
                <div className="md:col-span-5 space-y-1 text-right">
                  <label className="text-[10px] font-bold text-gray-400 block">جستجو</label>
                  <input
                    type="text"
                    placeholder="نام، نام خانوادگی یا شماره همراه را وارد کنید"
                    value={surveySearch}
                    onChange={(e) => { setSurveySearch(e.target.value); setSurveyPage(1); }}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Excel and Stats download button strip */}
              <div className="flex justify-end gap-2 border-t border-gray-50 dark:border-gray-800/40 pt-4">
                <button
                  onClick={handleDownloadExcel}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  دانلود اکسل
                </button>
                <button
                  onClick={() => onOpenTab?.('tuts-surveys-stats', 'آمار و نمودارهای نظرسنجی', 'BarChart2')}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <BarChart2 className="w-4 h-4" />
                  آمار و نمودارها
                </button>
              </div>
            </div>

            {/* Statistical summary cards on the right */}
            <div className="flex justify-end">
              <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                {/* This Month Card (Pink) */}
                <div className="relative overflow-hidden bg-gradient-to-l from-pink-500 to-rose-400 p-6 rounded-3xl text-white shadow-xs text-right h-28 flex flex-col justify-between">
                  <div className="absolute left-6 top-6 opacity-20">
                    <Calendar className="w-10 h-10" />
                  </div>
                  <div className="text-3xl font-black font-mono leading-none">
                    {toPersianDigits(thisMonthCount)}
                  </div>
                  <div className="text-xs font-bold opacity-90">این ماه</div>
                </div>

                {/* Total Surveys Card (Purple) */}
                <div className="relative overflow-hidden bg-gradient-to-l from-indigo-600 to-purple-500 p-6 rounded-3xl text-white shadow-xs text-right h-28 flex flex-col justify-between">
                  <div className="absolute left-6 top-6 opacity-20">
                    <MessageSquare className="w-10 h-10" />
                  </div>
                  <div className="text-3xl font-black font-mono leading-none">
                    {toPersianDigits(filteredSurveys.length)}
                  </div>
                  <div className="text-xs font-bold opacity-90">کل نظرسنجی‌ها</div>
                </div>
              </div>
            </div>

            {/* List and Table Card */}
            {loadingSurveys ? (
              <LoadingSpinner text="در حال دریافت نظرسنجی‌ها..." />
            ) : (
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 p-5 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-400 font-sans">
                    {toPersianDigits(filteredSurveys.length)} مورد
                  </span>
                  <span className="text-xs font-black text-gray-950 dark:text-white flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    لیست نظرسنجی ها
                  </span>
                </div>

                {/* Table wrapper */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-850 text-gray-400 dark:text-gray-500 font-extrabold">
                      <th className="p-3 text-center w-16 font-extrabold">شناسه</th>
                      <th className="p-3 font-extrabold">نام و نام خانوادگی</th>
                      <th className="p-3 text-center font-extrabold">شماره همراه</th>
                      <th className="p-3 text-center font-extrabold">تاریخ ثبت</th>
                      <th className="p-3 text-center w-36 font-extrabold">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                    {paginatedSurveys.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400 font-bold">
                          هیچ موردی منطبق بر فیلترهای جستجوی شما یافت نشد.
                        </td>
                      </tr>
                    ) : (
                      paginatedSurveys.map((survey, index) => (
                        <tr key={survey.id} className="hover:bg-gray-55/30 dark:hover:bg-gray-950/20 transition-colors">
                          {/* ID Badge */}
                          <td className="p-3 text-center">
                            <div className="h-7 w-7 bg-blue-600 dark:bg-blue-500 text-white font-mono font-bold text-xs rounded-lg flex items-center justify-center mx-auto shadow-xs">
                              {survey.id}
                            </div>
                          </td>

                          {/* Full Name */}
                          <td className="p-3 font-black text-gray-900 dark:text-white">
                            {survey.name}
                          </td>

                          {/* Mobile Phone */}
                          <td className="p-3 text-center">
                            <span className="text-blue-600 dark:text-blue-400 font-mono font-bold text-xs flex items-center justify-center gap-1">
                              {survey.phone}
                              <Phone className="w-3 h-3 text-blue-500" />
                            </span>
                          </td>

                          {/* Date of registration */}
                          <td className="p-3 text-center text-gray-550 dark:text-gray-400 font-mono">
                            <span className="flex items-center justify-center gap-1.5">
                              {toPersianDigits(survey.date)}
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="p-3 text-center">
                            <div className="flex justify-center gap-1.5">
                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteSurvey(survey.id)}
                                className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                              >
                                <Trash2 className="w-3 h-3" />
                                حذف
                              </button>
                              {/* View/Show Button */}
                              <button
                                onClick={() => setSelectedSurveyDetails(survey)}
                                className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                              >
                                <Eye className="w-3 h-3" />
                                نمایش
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls for Surveys */}
              {totalSurveysCount > surveysPerPage && (
                <Pagination
                  currentPage={surveyPage}
                  totalItems={totalSurveysCount}
                  perPage={surveysPerPage}
                  onPageChange={setSurveyPage}
                />
              )}
            </div>
            )}

            {/* Interactive Survey Detail Modal dialog */}
            <AnimatePresence>
              {selectedSurveyDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 max-w-lg w-full text-right space-y-6 shadow-2xl relative"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                      <h4 className="font-extrabold text-sm text-gray-950 dark:text-white">جزئیات کامل نظرسنجی ثبت‌شده</h4>
                      <button
                        onClick={() => setSelectedSurveyDetails(null)}
                        className="p-1 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Details content body */}
                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-gray-400 block font-bold">نام و نام خانوادگی:</span>
                          <span className="text-gray-950 dark:text-white font-black text-sm">{selectedSurveyDetails.name}</span>
                        </div>
                        <div className="space-y-1 text-left">
                          <span className="text-gray-400 block font-bold">شماره همراه:</span>
                          <span className="text-blue-600 dark:text-blue-400 font-mono font-bold text-sm flex items-center gap-1 justify-end">
                            <span>{selectedSurveyDetails.phone}</span>
                            <Phone className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-gray-50 dark:border-gray-800/50 pt-3">
                        <div className="space-y-1">
                          <span className="text-gray-400 block font-bold">عنوان کارگاه مهارتی:</span>
                          <span className="text-gray-900 dark:text-gray-100 font-semibold">{selectedSurveyDetails.courseTitle}</span>
                        </div>
                        <div className="space-y-1 text-left">
                          <span className="text-gray-400 block font-bold">تاریخ و زمان ثبت:</span>
                          <span className="text-gray-750 dark:text-gray-300 font-mono flex items-center gap-1 justify-end">
                            <span>{selectedSurveyDetails.date}</span>
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="border-t border-gray-50 dark:border-gray-800/50 pt-3 space-y-1.5">
                        <span className="text-gray-400 block font-bold">امتیاز ارزیابی کیفی:</span>
                        <div className="flex justify-start items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-xl ${
                                star <= selectedSurveyDetails.rating ? 'text-amber-500' : 'text-gray-250 dark:text-gray-800'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                          <span className="text-gray-550 font-mono text-xs mr-2">({toPersianDigits(selectedSurveyDetails.rating)} از ۵)</span>
                        </div>
                      </div>

                      {/* Comment text */}
                      <div className="border-t border-gray-50 dark:border-gray-800/50 pt-3 space-y-2">
                        <span className="text-gray-400 block font-bold">متن دیدگاه و نظر ارزیابی:</span>
                        <div className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 rounded-2xl text-gray-700 dark:text-gray-300 leading-relaxed text-justify text-[11.5px] font-medium italic">
                          « {selectedSurveyDetails.comment} »
                        </div>
                      </div>
                    </div>

                    {/* Footer Close button */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setSelectedSurveyDetails(null)}
                        className="px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-650 dark:text-gray-300 rounded-xl font-bold text-xs cursor-pointer transition-all"
                      >
                        بستن پنجره
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        );
      })()}

      {/* =========================================================================
          MODULE 5B: TUTS-SURVEYS-STATS (STATS & GRAPHIC ANALYSIS MODULE)
          ========================================================================= */}
      {moduleId === 'tuts-surveys-stats' && (
        <div className="space-y-6 text-right animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-gray-950 dark:text-white mb-1">آمار، نمودارها و ارزیابی کیفی دوره‌ها</h4>
              <p className="text-xs text-gray-400">شاخص‌های رضایت‌مندی دانشجویان، ارزیابی کیفیت اساتید و پلتفرم برگزاری کلاس‌ها</p>
            </div>
            
            <div className="relative min-w-[240px] w-full sm:w-auto">
              <select
                value={selectedStatCourse}
                onChange={(e) => setSelectedStatCourse(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none"
              >
                <option value="all">نمای کلی تمامی نظرسنجی‌ها</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
            {/* Left side: Star ratings and question breakdowns */}
            <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-55 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold mb-1">میانگین امتیاز رضایت‌مندی کاربران</span>
                  {selectedStatCourse === 'all' ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-gray-900 dark:text-white font-mono">
                        {toPersianDigits(4.6)}
                      </span>
                      <span className="text-xs text-gray-400 font-sans">از ۵ (مبتنی بر کل نظرات)</span>
                    </div>
                  ) : (
                    (() => {
                      const s = surveys.find(item => item.courseId === selectedStatCourse);
                      return (
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-gray-900 dark:text-white font-mono">
                            {toPersianDigits(s?.rating || '۰.۰')}
                          </span>
                          <span className="text-xs text-gray-400 font-sans">از ۵ (مبتنی بر {toPersianDigits(s?.totalResponses || 0)} رای ثبت‌شده)</span>
                        </div>
                      );
                    })()
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const avg = selectedStatCourse === 'all' ? 4.6 : (surveys.find(item => item.courseId === selectedStatCourse)?.rating || 0);
                    return (
                      <span key={star} className={`text-2xl ${star <= Math.round(avg) ? 'text-amber-500' : 'text-gray-250 dark:text-gray-800'}`}>
                        ★
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Question breakdowns bar chart */}
              <div className="space-y-4">
                <h6 className="text-xs font-black text-gray-900 dark:text-white">ارزیابی تفکیکی ابعاد کیفی دوره‌ها</h6>
                
                {selectedStatCourse === 'all' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { title: 'کیفیت و جامعیت علمی مطالب آموزشی', score: 91, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                      { title: 'تسلط و قدرت انتقال مفاهیم مدرس', score: 94, color: 'text-teal-500', bg: 'bg-teal-500/10' },
                      { title: 'برنامه‌ریزی اجرایی و هماهنگی کارگاه', score: 88, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                      { title: 'پلتفرم و امکانات برگزاری وبینار', score: 83, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    ].map((crit, i) => (
                      <div key={i} className="p-4 bg-gray-55 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 rounded-2xl text-center space-y-2">
                        <span className="text-[10.5px] text-gray-400 block font-bold">{crit.title}</span>
                        <span className={`text-xl font-black font-mono ${crit.color}`}>{toPersianDigits(crit.score)}٪</span>
                        <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
                          <div className={`absolute h-full ${crit.bg} ${crit.color} left-0`} style={{ width: `${crit.score}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  (() => {
                    const s = surveys.find(item => item.courseId === selectedStatCourse);
                    if (!s) return <div className="text-center py-6 text-gray-400">اطلاعات نظرسنجی برای این کارگاه ثبت نشده است.</div>;
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { title: 'کیفیت و جامعیت علمی مطالب آموزشی', score: s.breakdown.content, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                          { title: 'تسلط و قدرت انتقال مفاهیم مدرس', score: s.breakdown.lecturer, color: 'text-teal-500', bg: 'bg-teal-500/10' },
                          { title: 'برنامه‌ریزی اجرایی و هماهنگی کارگاه', score: s.breakdown.organization, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                          { title: 'پلتفرم و امکانات برگزاری وبینار', score: s.breakdown.facilities, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                        ].map((crit, i) => (
                          <div key={i} className="p-4 bg-gray-55 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 rounded-2xl text-center space-y-2">
                            <span className="text-[10.5px] text-gray-400 block font-bold">{crit.title}</span>
                            <span className={`text-xl font-black font-mono ${crit.color}`}>{toPersianDigits(crit.score)}٪</span>
                            <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
                              <div className={`absolute h-full ${crit.bg} ${crit.color} left-0`} style={{ width: `${crit.score}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            {/* Right side: Interactive Form to submit feedback */}
            <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs space-y-4">
              <h5 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800/80 pb-3">
                <Plus className="w-4 h-4 text-teal-600" />
                ثبت ارزیابی و نظرسنجی مکتوب جدید
              </h5>

              <form onSubmit={handleSubmitSurvey} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block">انتخاب کارگاه مهارتی</label>
                  <select
                    value={surveyFormCourseId}
                    onChange={(e) => setSurveyFormCourseId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block">نام دانشجوی ارزیابی‌کننده</label>
                  <input
                    type="text"
                    required
                    placeholder="نام کامل خود را وارد کنید..."
                    value={surveyFormUser}
                    onChange={(e) => setSurveyFormUser(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none shadow-xs"
                  />
                </div>

                {/* Rating selection stars */}
                <div className="space-y-1.5 text-center bg-gray-55 dark:bg-gray-950 p-2.5 rounded-xl border border-gray-100 dark:border-gray-850">
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">امتیاز کلی شما به کارگاه</label>
                  <div className="flex justify-center items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSurveyFormRating(star)}
                        className="text-2xl transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                      >
                        <span className={star <= surveyFormRating ? 'text-amber-500' : 'text-gray-250 dark:text-gray-800'}>
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Range parameters */}
                <div className="space-y-3 p-3 bg-gray-55/60 dark:bg-gray-950/40 rounded-xl border border-gray-100/50 dark:border-gray-850">
                  <span className="text-[10px] font-bold text-gray-400 block">ارزیابی پارامترهای جزئی (درصد رضایت)</span>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-gray-450">
                      <span>محتوای علمی</span>
                      <span className="font-mono">{toPersianDigits(surveyFormContent)}٪</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={surveyFormContent}
                      onChange={(e) => setSurveyFormContent(parseInt(e.target.value))}
                      className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-gray-450">
                      <span>شیوه تدریس مدرس</span>
                      <span className="font-mono">{toPersianDigits(surveyFormLecturer)}٪</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={surveyFormLecturer}
                      onChange={(e) => setSurveyFormLecturer(parseInt(e.target.value))}
                      className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-gray-450">
                      <span>هماهنگی و نظم اجرایی</span>
                      <span className="font-mono">{toPersianDigits(surveyFormOrg)}٪</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={surveyFormOrg}
                      onChange={(e) => setSurveyFormOrg(parseInt(e.target.value))}
                      className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-gray-450">
                      <span>امکانات و پلتفرم وبینار</span>
                      <span className="font-mono">{toPersianDigits(surveyFormFacilities)}٪</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={surveyFormFacilities}
                      onChange={(e) => setSurveyFormFacilities(parseInt(e.target.value))}
                      className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block">دیدگاه و نظر مکتوب شما</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="نظرات، انتقادات یا پیشنهادات خود را درباره کیفیت این کلاس بنویسید..."
                    value={surveyFormComment}
                    onChange={(e) => setSurveyFormComment(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  ثبت نهایی نظرسنجی و ارزیابی
                </button>
              </form>
            </div>
          </div>

          {/* Interactive Comments wall */}
          <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs">
            <h5 className="text-xs font-black text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              دیدگاه‌ها و نظرات مکتوب دانشجویان
            </h5>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {surveys
                .filter(s => selectedStatCourse === 'all' || s.courseId === selectedStatCourse)
                .flatMap(s => s.comments.map(c => ({ ...c, courseTitle: s.courseTitle })))
                .map((comment, i) => (
                  <div key={i} className="p-4 bg-gray-55 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 rounded-2xl space-y-2 text-right">
                    <div className="flex justify-between items-center">
                      <div className="text-right">
                        <span className="font-extrabold text-xs text-gray-900 dark:text-white block">{comment.user}</span>
                        <span className="text-[9px] text-gray-400 block mt-0.5">{comment.courseTitle}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-amber-500">★</span>
                        <span>{toPersianDigits(comment.rating)}</span>
                      </div>
                    </div>
                    <p className="text-[11.5px] text-gray-650 dark:text-gray-300 leading-relaxed text-justify">
                      {comment.comment}
                    </p>
                    <div className="text-[9.5px] text-gray-400 text-left font-mono">
                      {toPersianDigits(comment.date)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 6: TUTS-VOUCHERS (VOUCHER, BONS & SANDBOX TESTING MODULE)
          ========================================================================= */}
      {moduleId === 'tuts-vouchers' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
            <div className="text-right">
              <h4 className="text-sm font-black text-gray-950 dark:text-white mb-1">مدیریت بن‌های خرید، کدهای تخفیف و جشنواره‌ها</h4>
              <p className="text-xs text-gray-400">تنظیمات کمپین‌های تخفیف مهارتی، شرایط چندگانه زمانی، مکانی، فنی و پرداخت اقساطی</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setVoucherActiveTab('list')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  voucherActiveTab === 'list'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                لیست بن‌های فعال
              </button>
              <button
                onClick={() => setVoucherActiveTab('create')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  voucherActiveTab === 'create'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                + تعریف بن خرید جدید
              </button>
            </div>
          </div>

          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl text-right">
              <span className="text-[10px] text-gray-400 block font-bold mb-1">تعداد بن‌های تعریف شده</span>
              <div className="flex items-center gap-2 justify-start mt-1">
                <Gift className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xl font-black font-mono text-gray-900 dark:text-white">{toPersianDigits(vouchers.length)} طرح</span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl text-right">
              <span className="text-[10px] text-gray-400 block font-bold mb-1">کل دفعات استفاده شده</span>
              <div className="flex items-center gap-2 justify-start mt-1">
                <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xl font-black font-mono text-gray-900 dark:text-white">{toPersianDigits(vouchers.reduce((sum, v) => sum + (v.totalUsed || 0), 0))} بار</span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl text-right">
              <span className="text-[10px] text-gray-400 block font-bold mb-1">کل بودجه مصرفی تخفیف</span>
              <div className="flex items-center gap-2 justify-start mt-1">
                <DollarSign className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <span className="text-xl font-black font-mono text-gray-900 dark:text-white">{formatCurrency(vouchers.reduce((sum, v) => sum + (v.budgetUsed || 0), 0))}</span>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl text-right">
              <span className="text-[10px] text-gray-400 block font-bold mb-1">بودجه کل طرح‌ها</span>
              <div className="flex items-center gap-2 justify-start mt-1">
                <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span className="text-xl font-black font-mono text-gray-900 dark:text-white">{formatCurrency(vouchers.reduce((sum, v) => sum + (v.budgetLimit || 0), 0))}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-right">
            {/* Left Main Pane: Voucher manager lists or creation form */}
            <div className="lg:col-span-7 space-y-4">
              {voucherActiveTab === 'list' ? (
                <div className="space-y-4">
                  {loadingVouchers ? (
                    <LoadingSpinner text="در حال دریافت بن‌های خرید..." />
                  ) : (
                    <>
                      {(() => {
                        const totalPages = Math.max(1, Math.ceil(vouchers.length / voucherPerPage));
                        const safePage = Math.min(voucherPage, totalPages);
                        const paginatedVouchers = vouchers.slice(
                          (safePage - 1) * voucherPerPage,
                          safePage * voucherPerPage
                        );
                        return (
                          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/85 p-5 rounded-3xl space-y-4">
                            <h5 className="text-xs font-black text-gray-900 dark:text-white">کدهای تخفیف و بن‌های خرید فعال سیستم</h5>
                            <div className="divide-y divide-gray-55 dark:divide-gray-800 space-y-4">
                              {paginatedVouchers.map((v) => (
                                <div key={v.id} className="pt-4 first:pt-0 space-y-3">
                                  <div className="flex justify-between items-start gap-4">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-xs text-gray-900 dark:text-white">{v.title}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                          {v.code}
                                        </span>
                                      </div>
                                      <p className="text-[10.5px] text-gray-400 mt-1">مناسبت: {v.occasion || 'عمومی / آزاد'}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-xl">
                                        {v.discountPercent ? `${toPersianDigits(v.discountPercent)}٪ تخفیف` : `${formatCurrency(v.discountAmount || 0)} تخفیف`}
                                      </span>
                                      <button
                                        onClick={() => {
                                          if (confirm('آیا مایل به حذف این بن خرید هستید؟')) {
                                            setVouchers(vouchers.filter(item => item.id !== v.id));
                                            showToast('بن خرید با موفقیت حذف شد.');
                                          }
                                        }}
                                        className="p-1.5 text-rose-500 hover:bg-rose-500/5 rounded-lg cursor-pointer transition-all"
                                        title="حذف بن"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Conditions Tags Display */}
                                  <div className="flex flex-wrap gap-1.5">
                                    {/* Time */}
                                    {v.validFrom && (
                                      <span className="text-[9.5px] bg-amber-500/5 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/10 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>اعتبار تا: {toPersianDigits(v.validTo || '')}</span>
                                      </span>
                                    )}
                                    {v.allowedHours && (
                                      <span className="text-[9.5px] bg-amber-500/5 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/10 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>ساعات: {toPersianDigits(v.allowedHours)}</span>
                                      </span>
                                    )}

                                    {/* Geo Location */}
                                    {v.allowedProvince && v.allowedProvince !== 'all' && (
                                      <span className="text-[9.5px] bg-indigo-500/5 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/10 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>مخصوص: {v.allowedProvince}</span>
                                      </span>
                                    )}

                                    {/* Device & Tech */}
                                    {v.allowedDevice && v.allowedDevice !== 'all' && (
                                      <span className="text-[9.5px] bg-indigo-500/5 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/10 flex items-center gap-1">
                                        <Laptop className="w-3 h-3" />
                                        <span>کانال: {v.allowedDevice === 'mobile' ? 'اپ موبایل' : 'مرورگر دسکتاپ'}</span>
                                      </span>
                                    )}

                                    {/* First Purchase */}
                                    {v.firstPurchaseOnly && (
                                      <span className="text-[9.5px] bg-rose-500/5 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-md border border-rose-500/10 flex items-center gap-1">
                                        <UserPlus className="w-3 h-3" />
                                        <span>فقط اولین خرید</span>
                                      </span>
                                    )}

                                    {/* Installments */}
                                    {v.allowInstallments && (
                                      <span className="text-[9.5px] bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/10 flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        <span>پشتیبانی اقساط ({toPersianDigits(v.installmentCount || 2)} قسطه)</span>
                                      </span>
                                    )}

                                    {/* Budget/Cap */}
                                    {v.globalCap && (
                                      <span className="text-[9.5px] bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        <span>استفاده: {toPersianDigits(v.totalUsed || 0)} از {toPersianDigits(v.globalCap)}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Pagination Controls for Vouchers */}
                      {vouchers.length > voucherPerPage && (
                        <Pagination
                          currentPage={voucherPage}
                          totalItems={vouchers.length}
                          perPage={voucherPerPage}
                          onPageChange={setVoucherPage}
                        />
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/85 p-6 rounded-3xl">
                  <h5 className="text-xs font-black text-gray-900 dark:text-white mb-4">تعریف بن خرید و سناریو تخفیف جدید</h5>
                  
                  <form onSubmit={handleCreateVoucher} className="space-y-4">
                    {/* SECTION 1 */}
                    <div className="bg-gray-50/50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-850 space-y-3">
                      <h6 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">۱. مشخصات کلی بن و میزان تخفیف</h6>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">کد تخفیف (بزرگ و بدون فاصله)</label>
                          <input
                            type="text"
                            required
                            value={newVoucherCode}
                            onChange={(e) => setNewVoucherCode(e.target.value)}
                            placeholder="مثال: FALL1405"
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none font-mono uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">عنوان فارسی کمپین</label>
                          <input
                            type="text"
                            required
                            value={newVoucherTitle}
                            onChange={(e) => setNewVoucherTitle(e.target.value)}
                            placeholder="مثال: تخفیف ویژه ورودی‌های جدید پاییز"
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">نوع تخفیف</label>
                          <select
                            value={newVoucherDiscountType}
                            onChange={(e) => setNewVoucherDiscountType(e.target.value as any)}
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none appearance-none"
                          >
                            <option value="percent">درصدی (٪)</option>
                            <option value="amount">مبلغ ثابت (ریال)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">میزان یا ارزش تخفیف</label>
                          <input
                            type="number"
                            required
                            value={newVoucherDiscountValue}
                            onChange={(e) => setNewVoucherDiscountValue(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">مناسبت تقویمی (اختیاری)</label>
                          <input
                            type="text"
                            value={newVoucherOccasion}
                            onChange={(e) => setNewVoucherOccasion(e.target.value)}
                            placeholder="مثال: شب یلدا، اعیاد شعبانیه"
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2 */}
                    <div className="bg-gray-50/50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-850 space-y-3">
                      <h6 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">۲. محدودیت‌های زمانی کمپین</h6>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">تاریخ شروع اعتبار</label>
                          <input
                            type="text"
                            value={newVoucherValidFrom}
                            onChange={(e) => setNewVoucherValidFrom(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">تاریخ پایان اعتبار</label>
                          <input
                            type="text"
                            value={newVoucherValidTo}
                            onChange={(e) => setNewVoucherValidTo(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">ساعات مجاز روزانه</label>
                          <select
                            value={newVoucherAllowedHours}
                            onChange={(e) => setNewVoucherAllowedHours(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none appearance-none"
                          >
                            <option value="all">شبانه روزی (۲۴ ساعته)</option>
                            <option value="02:00-06:00">بامداد خلوت (۰۲:۰۰ الی ۰۶:۰۰)</option>
                            <option value="18:00-23:59">عصرگاهی ویژه (۱۸:۰۰ الی ۲۳:۵۹)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3 */}
                    <div className="bg-gray-50/50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-850 space-y-3">
                      <h6 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">۳. محدودیت‌های محصول و دپارتمان آموزشی</h6>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">دوره / کارگاه هدف</label>
                          <select
                            value={newVoucherCourseId}
                            onChange={(e) => setNewVoucherCourseId(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="all">همه کارگاه‌ها</option>
                            {courses.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">گروه آموزشی دپارتمان</label>
                          <select
                            value={newVoucherCategory}
                            onChange={(e) => setNewVoucherCategory(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="all">همه دپارتمان‌ها</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">حداقل شهریه دوره (ریال)</label>
                          <input
                            type="number"
                            value={newVoucherMinCoursePrice}
                            onChange={(e) => setNewVoucherMinCoursePrice(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4 */}
                    <div className="bg-gray-50/50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-850 space-y-3">
                      <h6 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">۴. بودجه، ظرفیت استفاده و قوانین پرداخت اقساطی</h6>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">ظرفیت کل بن (تعداد)</label>
                          <input
                            type="number"
                            value={newVoucherGlobalCap}
                            onChange={(e) => setNewVoucherGlobalCap(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">سقف بودجه مالی کل (ریال)</label>
                          <input
                            type="number"
                            value={newVoucherBudgetLimit}
                            onChange={(e) => setNewVoucherBudgetLimit(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">تعداد استفاده برای هر ایمیل</label>
                          <input
                            type="number"
                            value={newVoucherPerEmailLimit}
                            onChange={(e) => setNewVoucherPerEmailLimit(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newVoucherFirstPurchaseOnly}
                            onChange={(e) => setNewVoucherFirstPurchaseOnly(e.target.checked)}
                            className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                          <span className="text-[10.5px] font-bold text-gray-700 dark:text-gray-300">مخصوص اولین خرید دانشجو (تشخیص هویت مستقل)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newVoucherAllowInstallments}
                            onChange={(e) => setNewVoucherAllowInstallments(e.target.checked)}
                            className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                          <span className="text-[10.5px] font-bold text-gray-700 dark:text-gray-300">امکان ثبت‌نام به صورت اقساطی دانشگاهی</span>
                        </label>

                        {newVoucherAllowInstallments && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-gray-400">تعداد قسط:</span>
                            <select
                              value={newVoucherInstallmentCount}
                              onChange={(e) => setNewVoucherInstallmentCount(e.target.value)}
                              className="text-[10px] p-1 border rounded bg-gray-50 dark:bg-gray-800 focus:outline-none font-mono"
                            >
                              <option value="2">۲ قسط</option>
                              <option value="3">۳ قسط</option>
                              <option value="4">۴ قسط</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION 5 */}
                    <div className="bg-gray-50/50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-850 space-y-3">
                      <h6 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">۵. شرایط فرامتنی و احراز فنی (Contextual Limits)</h6>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">استان مجاز (Geo IP)</label>
                          <select
                            value={newVoucherAllowedProvince}
                            onChange={(e) => setNewVoucherAllowedProvince(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="all">کلیه استان‌های کشور</option>
                            <option value="تهران">فقط استان تهران</option>
                            <option value="خراسان رضوی">فقط استان خراسان رضوی</option>
                            <option value="یزد">فقط استان یزد</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">دستگاه مورد استفاده</label>
                          <select
                            value={newVoucherAllowedDevice}
                            onChange={(e) => setNewVoucherAllowedDevice(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="all">تمامی سیستم‌ها (آزاد)</option>
                            <option value="desktop">فقط دسکتاپ و لپ‌تاپ</option>
                            <option value="mobile">فقط اپلیکیشن موبایل</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">منبع ارجاع (UTM Referrer)</label>
                          <select
                            value={newVoucherAllowedReferrer}
                            onChange={(e) => setNewVoucherAllowedReferrer(e.target.value)}
                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="all">تمامی منابع (آزاد)</option>
                            <option value="blog">وبلاگ دانشگاه</option>
                            <option value="instagram">کمپین اینستاگرام</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setVoucherActiveTab('list')}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-800 text-xs font-bold rounded-xl text-gray-650 dark:text-gray-300 hover:bg-gray-100 transition-all cursor-pointer"
                      >
                        انصراف و بازگشت
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        ذخیره و فعال‌سازی بن خرید جدید
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Right Main Pane: Interactive Vouchers Simulator (Sandbox Playground) */}
            <div className="lg:col-span-5">
              <div className="bg-gradient-to-br from-indigo-50/20 to-white dark:from-indigo-950/5 dark:to-gray-900 border border-indigo-500/15 p-5 rounded-3xl space-y-5 sticky top-4">
                <div className="flex items-center gap-2 justify-start">
                  <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <h5 className="text-xs font-black text-indigo-950 dark:text-indigo-300">شبیه‌ساز و تست زنده قوانین بن (Playground)</h5>
                    <p className="text-[10px] text-gray-400 mt-0.5">بدون نیاز به ثبت‌نام واقعی، فرآیند تطبیق تخفیف را تست کنید</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 mb-1">۱. انتخاب بن جهت آزمایش</label>
                    <select
                      value={sandboxCode}
                      onChange={(e) => setSandboxCode(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-950/50 bg-white dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono"
                    >
                      {vouchers.map(v => (
                        <option key={v.id} value={v.code}>{v.code} - {v.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-500 mb-1">۲. کارگاه آموزشی فرضی</label>
                    <select
                      value={sandboxCourseId}
                      onChange={(e) => setSandboxCourseId(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-250 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none cursor-pointer"
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title} ({formatCurrency(c.cost)})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 mb-1">ایمیل شبیه‌سازی</label>
                      <input
                        type="email"
                        value={sandboxEmail}
                        onChange={(e) => setSandboxEmail(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-250 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono text-left"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 mb-1">موبایل شبیه‌سازی</label>
                      <input
                        type="tel"
                        value={sandboxPhone}
                        onChange={(e) => setSandboxPhone(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-250 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono text-left"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-150 dark:border-gray-850">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 mb-1">موقعیت (استان)</label>
                      <select
                        value={sandboxProvince}
                        onChange={(e) => setSandboxProvince(e.target.value)}
                        className="w-full text-[10.5px] p-1.5 border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-lg focus:outline-none"
                      >
                        <option value="تهران">تهران</option>
                        <option value="خراسان رضوی">خراسان رضوی</option>
                        <option value="یزد">یزد</option>
                        <option value="فارس">فارس</option>
                        <option value="اصفهان">اصفهان</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 mb-1">بستر اتصال</label>
                      <select
                        value={sandboxDevice}
                        onChange={(e) => setSandboxDevice(e.target.value as any)}
                        className="w-full text-[10.5px] p-1.5 border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-lg focus:outline-none"
                      >
                        <option value="desktop">مرورگر دسکتاپ</option>
                        <option value="mobile">اپلیکیشن موبایل</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 mb-1">منبع ارجاع (UTM)</label>
                      <select
                        value={sandboxReferrer}
                        onChange={(e) => setSandboxReferrer(e.target.value)}
                        className="w-full text-[10.5px] p-1.5 border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white rounded-lg focus:outline-none"
                      >
                        <option value="">مستقیم</option>
                        <option value="blog">وبلاگ دانشگاه</option>
                        <option value="instagram">اینستاگرام</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunSandboxTest}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Activity className="w-4 h-4 animate-pulse" />
                    ارزیابی قوانین و تست شرایط بن
                  </button>
                </div>

                {/* Simulated Results Console */}
                {sandboxResult && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-gray-950 border border-indigo-500/10 space-y-4 text-right">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-850">
                      <span className="text-[10.5px] font-black text-gray-900 dark:text-white">نتیجه بررسی شبیه‌ساز:</span>
                      <span className={`text-[9.5px] px-2.5 py-1 rounded-full font-black ${
                        sandboxResult.isValid
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {sandboxResult.isValid ? '✓ بن معتبر است' : '⚠ بن نامعتبر است'}
                      </span>
                    </div>

                    {/* Receipt breakdown */}
                    <div className="space-y-1.5 text-xs font-mono p-3 bg-gray-55 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-850/80">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-400 font-sans">شهریه اصلی کارگاه:</span>
                        <span className="text-gray-600 dark:text-gray-300">{formatCurrency(sandboxResult.originalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-400 font-sans">مبلغ تخفیف کسر شده:</span>
                        <span className="text-rose-500 font-extrabold font-mono">-{formatCurrency(sandboxResult.discountAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-black pt-1.5 border-t border-gray-200/50 mt-1.5">
                        <span className="font-sans">مبلغ پرداختی نهایی:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(sandboxResult.finalPrice)}</span>
                      </div>
                      
                      {sandboxResult.allowInstallments && sandboxResult.installmentCount && (
                        <div className="pt-2 mt-2 border-t border-indigo-500/10 space-y-0.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-sans">
                          <div>✓ قابلیت ثبت‌نام اقساطی فعال شد.</div>
                          <div>تعداد اقساط: {toPersianDigits(sandboxResult.installmentCount)} قسط؛ هر قسط {formatCurrency(sandboxResult.installmentValue || 0)} بدون بهره.</div>
                        </div>
                      )}
                    </div>

                    {/* Step-by-Step logs */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">مراحل ارزیابی شرایط (Trace Logs):</span>
                      <div className="space-y-1.5 text-[10.5px] max-h-[220px] overflow-y-auto pr-1">
                        {sandboxResult.checks.map((check, idx) => (
                          <div key={idx} className="flex gap-2 items-start justify-between">
                            <span className="text-gray-600 dark:text-gray-400 font-bold">{idx + 1}. {check.title}:</span>
                            <div className="text-left shrink-0">
                              <span className={`inline-block text-[9.5px] font-bold ml-1.5 ${
                                check.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400 font-black'
                              }`}>
                                {check.passed ? '✓ تایید' : '✗ خطا'}
                              </span>
                              <span className="text-[9px] text-gray-400 block">{check.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Category/Group Management Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative my-8 text-right"
            >
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-black text-gray-900 dark:text-white leading-snug mb-5 flex items-center gap-1.5 justify-start">
                <Layers className="w-5 h-5 text-teal-600" />
                تعریف و مدیریت گروه‌های آموزشی و کارگاهی
              </h3>

              {/* Add New Category form */}
              <form onSubmit={handleAddCategory} className="space-y-3 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">عنوان گروه درسی جدید</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="مثال: روانشناسی بالینی، هوش مصنوعی"
                      className="flex-1 text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      افزودن گروه
                    </button>
                  </div>
                </div>
              </form>

              {/* List of existing categories */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 block mb-2">لیست گروه‌های تعریف شده فعلی ({toPersianDigits(categories.length)} گروه):</span>
                <div className="max-h-[220px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-850 border border-gray-150 dark:border-gray-850 rounded-2xl bg-gray-50/50 dark:bg-gray-950/20 pr-1">
                  {categories.map((cat, idx) => (
                    <div key={cat} className="p-3 flex items-center justify-between text-xs hover:bg-white dark:hover:bg-gray-900/40 transition-all">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-mono">#{toPersianDigits(idx + 1)}</span>
                        <span className="font-extrabold text-gray-800 dark:text-gray-200">{cat}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                        title="حذف گروه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                >
                  بستن پنجره
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
