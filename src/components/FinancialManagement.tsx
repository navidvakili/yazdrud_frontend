// ============================================================
// FinancialManagement — مدیریت بن‌های خرید و تخفیف
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DollarSign, Tag, Plus, Search, X, Edit2, Trash2, Copy, Check,
  Zap, Clock, RefreshCw, Sparkles, Flame, Beaker, AlertTriangle, Info,
} from 'lucide-react';
import api from '@/src/api';
import type { CourseCoupon } from '@/src/types';
import { JalaliDatepicker } from './tuts/JalaliDatepicker';
import { toPersianDigits, toEnglishDigits, getTodayJalali } from './tuts/tuts-utils';

// ========== Main Component ==========
export default function FinancialManagement() {
  // ===== State: list =====
  const [coupons, setCoupons] = useState<CourseCoupon[]>([]);
  const [meta, setMeta] = useState<any>({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // ===== State: modal =====
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // ===== State: form fields =====
  const [formTitle, setFormTitle] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formTypeDiscount, setFormTypeDiscount] = useState<'percent' | 'money'>('percent');
  const [formValue, setFormValue] = useState('');
  const [formCourseId, setFormCourseId] = useState<string>('');
  const [formCourseTitle, setFormCourseTitle] = useState('');
  const [formGroupId, setFormGroupId] = useState<string>('');
  const [formGroupTitle, setFormGroupTitle] = useState('');
  const [formCapacity, setFormCapacity] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formFinishDate, setFormFinishDate] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formMaxDiscount, setFormMaxDiscount] = useState('');
  const [formNationalCode, setFormNationalCode] = useState('');

  // ===== State: course autocomplete =====
  const [courseSearch, setCourseSearch] = useState('');
  const [courseResults, setCourseResults] = useState<{ id: number; title: string }[]>([]);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const courseRef = useRef<HTMLDivElement>(null);

  // ===== State: group autocomplete =====
  const [groupSearch, setGroupSearch] = useState('');
  const [groupResults, setGroupResults] = useState<{ id: number; title: string }[]>([]);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);

  // ===== State: delete confirm =====
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteConfirmWord, setDeleteConfirmWord] = useState('');
  const [deleteInput, setDeleteInput] = useState('');

  // ===== State: notification =====
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ===== State: sandbox simulator =====
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [sandboxCode, setSandboxCode] = useState('');
  const [sandboxCourseId, setSandboxCourseId] = useState('');
  const [sandboxCourseTitle, setSandboxCourseTitle] = useState('');
  const [sandboxResult, setSandboxResult] = useState<{
    isValid: boolean;
    error?: string;
    discountAmount: number;
    finalPrice: number;
    originalPrice: number;
    checks?: { title: string; passed: boolean; desc: string }[];
  } | null>(null);
  const [sandboxCourseResults, setSandboxCourseResults] = useState<{ id: number; title: string }[]>([]);
  const [sandboxCourseDropdownOpen, setSandboxCourseDropdownOpen] = useState(false);
  const [sandboxLoadingCourses, setSandboxLoadingCourses] = useState(false);
  const sandboxCourseRef = useRef<HTMLDivElement>(null);

  // ===== Fetch coupons =====
  const fetchCoupons = useCallback(async (p: number = page, s: string = search) => {
    setLoading(true);
    try {
      const params: any = { page: p, per_page: 15 };
      if (s.trim()) params.search = s.trim();
      const res = await api.getCoupons(params);
      setCoupons(res.data);
      setMeta(res.meta);
    } catch {
      showNotify('error', 'خطا در دریافت لیست بن‌های تخفیف');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCoupons(page, search); }, [page, search]);

  // ===== Fetch courses for autocomplete =====
  const fetchCourses = useCallback(async (q: string) => {
    if (!q.trim()) { setCourseResults([]); return; }
    setLoadingCourses(true);
    try {
      const res = await api.getCouponCourses({ search: q, limit: 10 });
      setCourseResults(res);
    } catch { /* ignore */ }
    finally { setLoadingCourses(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (courseSearch.trim()) fetchCourses(courseSearch); }, 300);
    return () => clearTimeout(timer);
  }, [courseSearch, fetchCourses]);

  // ===== Fetch groups for autocomplete =====
  const fetchGroups = useCallback(async (q: string) => {
    if (!q.trim()) { setGroupResults([]); return; }
    setLoadingGroups(true);
    try {
      const res = await api.getCourseGroups();
      // Filter by search term client-side (groups are limited so it's fine)
      const filtered = res.filter(g => g.title.includes(q));
      setGroupResults(filtered);
    } catch { /* ignore */ }
    finally { setLoadingGroups(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (groupSearch.trim()) fetchGroups(groupSearch); }, 300);
    return () => clearTimeout(timer);
  }, [groupSearch, fetchGroups]);

  // Close course dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (courseRef.current && !courseRef.current.contains(e.target as Node)) {
        setCourseDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close group dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
        setGroupDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close sandbox course dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sandboxCourseRef.current && !sandboxCourseRef.current.contains(e.target as Node)) {
        setSandboxCourseDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ===== Fetch courses for sandbox autocomplete =====
  const fetchCoursesForSandbox = useCallback(async (q: string) => {
    if (!q.trim()) { setSandboxCourseResults([]); return; }
    setSandboxLoadingCourses(true);
    try {
      const res = await api.getCouponCourses({ search: q, limit: 10 });
      setSandboxCourseResults(res);
      setSandboxCourseDropdownOpen(true);
    } catch { /* ignore */ }
    finally { setSandboxLoadingCourses(false); }
  }, []);

  // ===== Notify =====
  const showNotify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // ===== Open modal for create/edit =====
  const openCreateModal = () => {
    setEditId(null);
    setFormTitle('');
    setFormCode('');
    setFormTypeDiscount('percent');
    setFormValue('');
    setFormCourseId('');
    setFormCourseTitle('');
    setFormGroupId('');
    setFormGroupTitle('');
    setFormCapacity('');
    setFormStartDate('');
    setFormFinishDate('');
    setFormIsActive(true);
    setFormMaxDiscount('');
    setFormNationalCode('');
    setCourseSearch('');
    setCourseResults([]);
    setGroupSearch('');
    setGroupResults([]);
    setModalOpen(true);
  };

  const openEditModal = (c: CourseCoupon) => {
    setEditId(c.id);
    setFormTitle(c.title);
    setFormCode(c.code);
    setFormTypeDiscount(c.type_discount);
    setFormValue(String(c.value));
    setFormCourseId(c.course_id ? String(c.course_id) : '');
    setFormCourseTitle(c.course_title || '');
    setFormCapacity(String(c.capacity));
    setFormStartDate(c.start_date);
    setFormFinishDate(c.finish_date);
    setFormIsActive(c.is_active);
    setFormMaxDiscount(c.max_discount ? String(c.max_discount) : '');
    setFormNationalCode(c.national_code || '');
    setCourseSearch(c.course_title || '');
    setCourseResults([]);
    setFormGroupId(c.group_id ? String(c.group_id) : '');
    setFormGroupTitle(c.group_title || '');
    setGroupSearch(c.group_title || '');
    setGroupResults([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
  };

  // ===== Auto-generate code (frontend) =====
  const handleGenerateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setFormCode(code);
  };

  // ===== Save coupon =====
  const handleSave = async () => {
    if (!formTitle.trim() || !formCode.trim() || !formValue) {
      showNotify('error', 'لطفاً عنوان، کد و مقدار تخفیف را وارد کنید');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: formTitle.trim(),
        code: formCode.trim(),
        type: 'discount',
        type_discount: formTypeDiscount,
        value: parseInt(toEnglishDigits(formValue)) || 0,
        course_id: formCourseId ? parseInt(formCourseId) : null,
        group_id: formGroupId ? parseInt(formGroupId) : null,
        capacity: formCapacity ? parseInt(toEnglishDigits(formCapacity)) : 100,
        start_date: formStartDate,
        finish_date: formFinishDate,
        is_active: formIsActive,
        max_discount: formMaxDiscount ? parseInt(toEnglishDigits(formMaxDiscount)) : null,
        national_code: formNationalCode.trim() || null,
      };

      if (editId) {
        await api.updateCoupon(editId, payload);
        showNotify('success', 'بن تخفیف با موفقیت به‌روزرسانی شد');
      } else {
        await api.createCoupon(payload);
        showNotify('success', 'بن تخفیف با موفقیت ایجاد شد');
      }
      closeModal();
      fetchCoupons(page, search);
    } catch (err: any) {
      const msg = err?.errors?.code?.[0] || err?.message || 'خطا در ذخیره بن تخفیف';
      showNotify('error', msg);
    } finally {
      setSaving(false);
    }
  };

  // ===== Generate & Save (ایجاد خودکار / تولید کد جدید) =====
  const handleGenerateAndSave = async () => {
    if (!formTitle.trim() || !formValue) {
      showNotify('error', 'لطفاً عنوان و مقدار تخفیف را وارد کنید');
      return;
    }
    setSaving(true);
    try {
      // Generate a random code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let newCode = '';
      for (let i = 0; i < 8; i++) {
        newCode += chars[Math.floor(Math.random() * chars.length)];
      }
      setFormCode(newCode);

      const payload = {
        title: formTitle.trim(),
        code: newCode,
        type: 'discount',
        type_discount: formTypeDiscount,
        value: parseInt(toEnglishDigits(formValue)) || 0,
        course_id: formCourseId ? parseInt(formCourseId) : null,
        group_id: formGroupId ? parseInt(formGroupId) : null,
        capacity: formCapacity ? parseInt(toEnglishDigits(formCapacity)) : 100,
        start_date: formStartDate,
        finish_date: formFinishDate,
        is_active: formIsActive,
        max_discount: formMaxDiscount ? parseInt(toEnglishDigits(formMaxDiscount)) : null,
        national_code: formNationalCode.trim() || null,
      };

      if (editId) {
        await api.updateCoupon(editId, payload);
        showNotify('success', 'بن تخفیف با کد جدید به‌روزرسانی شد');
      } else {
        await api.generateCoupon(payload);
        showNotify('success', 'بن تخفیف با کد خودکار ایجاد شد');
      }
      closeModal();
      fetchCoupons(page, search);
    } catch (err: any) {
      const msg = err?.message || 'خطا در ذخیره بن تخفیف';
      showNotify('error', msg);
    } finally {
      setSaving(false);
    }
  };

  // ===== Delete =====
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteCoupon(deleteId);
      showNotify('success', 'بن تخفیف با موفقیت حذف شد');
      setDeleteId(null);
      setDeleteInput('');
      fetchCoupons(page, search);
    } catch (err: any) {
      const msg = err?.message || 'خطا در حذف بن تخفیف';
      showNotify('error', msg);
    }
  };

  const openDeleteConfirm = (id: number) => {
    setDeleteId(id);
    setDeleteConfirmWord(String(Math.floor(1000 + Math.random() * 9000)));
    setDeleteInput('');
  };

  // ===== Toggle active =====
  const handleToggleActive = async (c: CourseCoupon) => {
    try {
      await api.updateCoupon(c.id, { is_active: !c.is_active });
      showNotify('success', c.is_active ? 'بن تخفیف غیرفعال شد' : 'بن تخفیف فعال شد');
      fetchCoupons(page, search);
    } catch {
      showNotify('error', 'خطا در تغییر وضعیت');
    }
  };

  // ===== Copy code =====
  const copyCode = async (code: string) => {
    try { await navigator.clipboard.writeText(code); showNotify('success', 'کد کپی شد'); }
    catch { showNotify('error', 'خطا در کپی کد'); }
  };

  // ===== Sandbox: Run validation test =====
  const handleRunSandboxTest = () => {
    const code = sandboxCode.trim().toUpperCase();
    if (!code) {
      showNotify('error', 'لطفاً کد بن را وارد کنید');
      return;
    }

    // Find the coupon in the current list
    const coupon = coupons.find(c => c.code.toUpperCase() === code);
    if (!coupon) {
      setSandboxResult({
        isValid: false,
        error: 'کد بن تخفیف در سیستم یافت نشد.',
        discountAmount: 0,
        finalPrice: 0,
        originalPrice: 0,
        checks: [
          { title: 'وجود بن در سیستم', passed: false, desc: 'بن تخفیفی با این کد در لیست بن‌ها وجود ندارد.' },
        ],
      });
      return;
    }

    const checks: { title: string; passed: boolean; desc: string }[] = [];
    let isValid = true;
    let failReason = '';

    // Check 1: Active status
    const activePassed = coupon.is_active;
    checks.push({
      title: 'وضعیت فعال بودن بن',
      passed: activePassed,
      desc: activePassed ? 'بن فعال است.' : 'بن غیرفعال شده است.',
    });
    if (!activePassed) {
      isValid = false;
      failReason = 'این بن تخفیف غیرفعال شده است.';
    }

    // Check 2: Validity dates
    const todayStr = getTodayJalali();
    let datePassed = true;
    let dateDesc = 'بازه زمانی آزاد است.';
    if (coupon.start_date && todayStr < coupon.start_date) {
      datePassed = false;
      dateDesc = `غیرمعتبر (قبل از شروع: ${toPersianDigits(coupon.start_date)})`;
    } else if (coupon.finish_date && todayStr > coupon.finish_date) {
      datePassed = false;
      dateDesc = `غیرمعتبر (منقضی شده در: ${toPersianDigits(coupon.finish_date)})`;
    } else if (coupon.start_date || coupon.finish_date) {
      dateDesc = `معتبر (بازه ${toPersianDigits(coupon.start_date || '')} الی ${toPersianDigits(coupon.finish_date || '')})`;
    }
    checks.push({ title: 'محدودیت زمانی', passed: datePassed, desc: dateDesc });
    if (!datePassed) {
      isValid = false;
      failReason = failReason || 'تاریخ اعتبار بن به اتمام رسیده یا هنوز شروع نشده است.';
    }

    // Check 3: Capacity
    const capPassed = coupon.remaining > 0;
    checks.push({
      title: 'ظرفیت باقی‌مانده',
      passed: capPassed,
      desc: capPassed
        ? `مجاز (${toPersianDigits(coupon.remaining)} از ${toPersianDigits(coupon.capacity)} باقی‌مانده)`
        : `تکمیل ظرفیت (${toPersianDigits(coupon.used_count)} از ${toPersianDigits(coupon.capacity)} استفاده شده)`,
    });
    if (!capPassed) {
      isValid = false;
      failReason = failReason || 'ظرفیت استفاده از این بن به پایان رسیده است.';
    }

    // Check 4: Course match
    let coursePassed = true;
    let courseDesc = 'برای تمامی دوره‌ها مجاز است.';
    if (coupon.course_id) {
      if (sandboxCourseId && Number(sandboxCourseId) !== coupon.course_id) {
        coursePassed = false;
        courseDesc = `غیرمجاز (فقط برای دوره "${coupon.course_title}" قابل استفاده است)`;
      } else if (sandboxCourseId) {
        courseDesc = '✅ مجاز (مخصوص همین دوره)';
      } else {
        courseDesc = `⚠️ محدود به دوره "${coupon.course_title}" (دوره‌ای انتخاب نشده)`;
      }
    }
    checks.push({ title: 'انطباق دوره', passed: coursePassed, desc: courseDesc });
    if (!coursePassed) {
      isValid = false;
      failReason = failReason || 'این بن فقط برای دوره خاصی صادر شده است.';
    }

    // Calculate discount
    let discount = 0;
    let originalPrice = 0;
    if (isValid) {
      originalPrice = 0;
      if (coupon.type_discount === 'percent') {
        discount = Math.round((originalPrice * coupon.value) / 100);
      } else {
        discount = Math.min(originalPrice || Infinity, coupon.value);
      }
    }

    const finalPrice = Math.max(0, originalPrice - discount);

    setSandboxResult({
      isValid,
      error: isValid ? undefined : failReason,
      discountAmount: discount,
      finalPrice,
      originalPrice,
      checks,
    });

    if (isValid) {
      showNotify('success', '✅ بن تخفیف معتبر است.');
    } else {
      showNotify('error', `❌ بن نامعتبر: ${failReason}`);
    }
  };

  // ===== Render =====
  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* ===== Header ===== */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 dark:text-white">مدیریت بن‌های خرید و تخفیف</h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">ایجاد، ویرایش و مدیریت بن‌های تخفیف دوره‌های آموزشی</p>
            </div>
          </div>

          {/* ===== Actions Bar ===== */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="جستجوی عنوان یا کد بن..."
                  className="w-full text-xs pr-9 pl-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                />
              </div>
              <button onClick={() => fetchCoupons(page, search)}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                title="تازه‌سازی">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setSandboxOpen(true); setSandboxResult(null); setSandboxCode(''); setSandboxCourseId(''); setSandboxCourseTitle(''); setSandboxCourseResults([]); }}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs">
                <Beaker className="w-4 h-4" />
                سندباکس
              </button>
              <button onClick={openCreateModal}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs">
                <Plus className="w-4 h-4" />
                بن تخفیف جدید
              </button>
            </div>
          </div>
        </div>

        {/* ===== Coupons Table ===== */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-xs text-gray-400">در حال بارگذاری...</div>
          ) : coupons.length === 0 ? (
            <div className="p-10 text-center text-xs text-gray-400">هیچ بن تخفیفی یافت نشد.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/30">
                    <th className="text-right p-3.5 font-bold text-gray-500">عنوان</th>
                    <th className="text-right p-3.5 font-bold text-gray-500">کد</th>
                    <th className="text-right p-3.5 font-bold text-gray-500">مقدار</th>
                    <th className="text-right p-3.5 font-bold text-gray-500">دوره</th>
                    <th className="text-center p-3.5 font-bold text-gray-500">ظرفیت</th>
                    <th className="text-center p-3.5 font-bold text-gray-500">تاریخ شروع</th>
                    <th className="text-center p-3.5 font-bold text-gray-500">تاریخ پایان</th>
                    <th className="text-center p-3.5 font-bold text-gray-500">وضعیت</th>
                    <th className="text-center p-3.5 font-bold text-gray-500">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-850">
                  {coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-55/30 dark:hover:bg-gray-950/20 transition-colors">
                      <td className="p-3.5 font-bold text-gray-900 dark:text-white whitespace-nowrap">{c.title}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-teal-600 dark:text-teal-400 text-[11px]">{c.code}</span>
                          <button onClick={() => copyCode(c.code)}
                            className="p-1 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-bold text-gray-800 dark:text-gray-200">{c.value_formatted}</span>
                      </td>
                      <td className="p-3.5 max-w-[200px] truncate text-gray-500">{c.course_title || '—'}</td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="text-gray-500">{toPersianDigits(c.used_count)}/{toPersianDigits(c.capacity)}</span>
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap text-gray-500">{c.start_date ? toPersianDigits(c.start_date) : '—'}</td>
                      <td className="p-3.5 text-center whitespace-nowrap text-gray-500">{c.finish_date ? toPersianDigits(c.finish_date) : '—'}</td>
                      <td className="p-3.5 text-center">
                        <button onClick={() => handleToggleActive(c)}
                          className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold border cursor-pointer transition-all ${
                            c.is_active
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/15'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>
                          {c.is_active ? 'فعال' : 'غیرفعال'}
                        </button>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditModal(c)}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer"
                            title="ویرایش">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openDeleteConfirm(c.id)}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                            title="حذف">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ===== Pagination ===== */}
          {meta.last_page > 1 && (
            <div className="flex flex-wrap items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-55/30 dark:bg-gray-950/30">
              <span className="text-[10px] text-gray-400">
                {toPersianDigits(meta.total)} بن · صفحه {toPersianDigits(meta.current_page)} از {toPersianDigits(meta.last_page)}
              </span>
              <div className="flex items-center gap-1.5">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-gray-200 dark:border-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
                  قبلی
                </button>
                {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => {
                  let pNum: number;
                  if (meta.last_page <= 5) {
                    pNum = i + 1;
                  } else if (meta.current_page <= 3) {
                    pNum = i + 1;
                  } else if (meta.current_page >= meta.last_page - 2) {
                    pNum = meta.last_page - 4 + i;
                  } else {
                    pNum = meta.current_page - 2 + i;
                  }
                  return (
                    <button key={pNum} onClick={() => setPage(pNum)}
                      className={`w-7 h-7 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                        pNum === page
                          ? 'bg-teal-600 text-white'
                          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                      {toPersianDigits(pNum)}
                    </button>
                  );
                })}
                <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-gray-200 dark:border-gray-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
                  بعدی
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ===== Create / Edit Modal ===== */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-xl p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative my-8"
            >
              <button onClick={closeModal}
                className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-black text-gray-900 dark:text-white leading-snug mb-5 flex items-center gap-1.5">
                <Tag className="w-5 h-5 text-teal-600" />
                {editId ? 'ویرایش بن تخفیف' : 'ایجاد بن تخفیف جدید'}
              </h3>

              <div className="space-y-4 text-right" dir="rtl">
                {/* ===== Title ===== */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">عنوان بن *</label>
                  <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="مثال: تخفیف ویژه تابستان"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                </div>

                {/* ===== Code + Generate ===== */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">کد بن *</label>
                  <div className="flex gap-2">
                    <input type="text" value={formCode} onChange={(e) => setFormCode(e.target.value)}
                      placeholder="مثال: WELCOME10"
                      className="flex-1 text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono" />
                    <button onClick={handleGenerateCode} type="button"
                      className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border border-indigo-200 dark:border-indigo-900/30">
                      <Zap className="w-3.5 h-3.5" />
                      تولید خودکار
                    </button>
                  </div>
                </div>

                {/* ===== Discount Type + Value ===== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">نوع تخفیف</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setFormTypeDiscount('percent')}
                        className={`flex-1 p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          formTypeDiscount === 'percent'
                            ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-400'
                            : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-500'}`}>
                        درصدی
                      </button>
                      <button type="button" onClick={() => setFormTypeDiscount('money')}
                        className={`flex-1 p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          formTypeDiscount === 'money'
                            ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-400'
                            : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-500'}`}>
                        مبلغ ثابت
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      {formTypeDiscount === 'percent' ? 'درصد تخفیف' : 'مبلغ تخفیف (ریال)'} *
                    </label>
                    <input type="text" value={formValue} onChange={(e) => setFormValue(e.target.value)}
                      placeholder={formTypeDiscount === 'percent' ? 'مثال: ۱۰' : 'مثال: ۵۰۰,۰۰۰'}
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                  </div>
                </div>

                {/* ===== Course Autocomplete ===== */}
                <div ref={courseRef} className="relative">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">دوره مجاز (اختیاری)</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input type="text" value={courseSearch} onChange={(e) => { setCourseSearch(e.target.value); setCourseDropdownOpen(true); }}
                      onFocus={() => { if (courseResults.length > 0) setCourseDropdownOpen(true); }}
                      placeholder="جستجوی دوره..."
                      className="w-full text-xs pr-9 pl-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                    {formCourseId && !courseSearch && (
                      <button onClick={() => { setFormCourseId(''); setFormCourseTitle(''); setCourseSearch(''); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-300 hover:text-rose-500 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown */}
                  {courseDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {loadingCourses ? (
                        <div className="p-3 text-xs text-gray-400 text-center">در حال جستجو...</div>
                      ) : courseResults.length === 0 ? (
                        courseSearch.trim() ? (
                          <div className="p-3 text-xs text-gray-400 text-center">نتیجه‌ای یافت نشد</div>
                        ) : null
                      ) : (
                        courseResults.map((cr) => (
                          <button key={cr.id} type="button" onClick={() => {
                            setFormCourseId(String(cr.id));
                            setFormCourseTitle(cr.title);
                            setCourseSearch(cr.title);
                            setCourseDropdownOpen(false);
                          }}
                            className="w-full text-right p-3 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-850 last:border-0 cursor-pointer transition-colors">
                            {cr.title}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* ===== Course Group Autocomplete ===== */}
                <div ref={groupRef} className="relative">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">گروه دوره (اختیاری)</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input type="text" value={groupSearch} onChange={(e) => { setGroupSearch(e.target.value); setGroupDropdownOpen(true); }}
                      onFocus={() => { if (groupResults.length > 0) setGroupDropdownOpen(true); }}
                      placeholder="جستجوی گروه..."
                      className="w-full text-xs pr-9 pl-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                    {formGroupId && !groupSearch && (
                      <button onClick={() => { setFormGroupId(''); setFormGroupTitle(''); setGroupSearch(''); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-300 hover:text-rose-500 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown */}
                  {groupDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {loadingGroups ? (
                        <div className="p-3 text-xs text-gray-400 text-center">در حال جستجو...</div>
                      ) : groupResults.length === 0 ? (
                        groupSearch.trim() ? (
                          <div className="p-3 text-xs text-gray-400 text-center">نتیجه‌ای یافت نشد</div>
                        ) : null
                      ) : (
                        groupResults.map((gr) => (
                          <button key={gr.id} type="button" onClick={() => {
                            setFormGroupId(String(gr.id));
                            setFormGroupTitle(gr.title);
                            setGroupSearch(gr.title);
                            setGroupDropdownOpen(false);
                          }}
                            className="w-full text-right p-3 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-850 last:border-0 cursor-pointer transition-colors">
                            {gr.title}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* ===== Capacity ===== */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ظرفیت استفاده</label>
                  <input type="number" value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)}
                    placeholder="تعداد دفعات مجاز استفاده"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                </div>

                {/* ===== Max Discount Cap ===== */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">حداکثر مبلغ تخفیف (ریال) — اختیاری</label>
                  <input type="text" value={formMaxDiscount} onChange={(e) => setFormMaxDiscount(e.target.value)}
                    placeholder="مثال: ۱,۵۰۰,۰۰۰ — اگر تخفیف محاسبه‌شده بیشتر باشد اعمال نمی‌شود"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                  <p className="text-[9px] text-gray-400 mt-1">حداکثر سقف تخفیف (مثلاً برای ۳۰٪ تخفیف، اگر مبلغ از این مقدار بیشتر شود، همین مقدار اعمال می‌شود)</p>
                </div>

                {/* ===== Exclusive National Code ===== */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">کد ملی اختصاصی (اختیاری)</label>
                  <input type="text" value={formNationalCode} onChange={(e) => setFormNationalCode(e.target.value)}
                    placeholder="مثال: ۰۰۱۲۳۴۵۶۷۸ — فقط این فرد می‌تواند از بن استفاده کند"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono" />
                  <p className="text-[9px] text-gray-400 mt-1">در صورت وارد کردن کد ملی، بن تخفیف فقط برای آن فرد قابل استفاده خواهد بود</p>
                </div>

                {/* ===== Dates (Jalali Datepicker) ===== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">فعال از تاریخ</label>
                    <JalaliDatepicker value={formStartDate} onChange={(d) => setFormStartDate(d)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">فعال تا تاریخ</label>
                    <JalaliDatepicker value={formFinishDate} onChange={(d) => setFormFinishDate(d)} />
                  </div>
                </div>

                {/* ===== Active Toggle ===== */}
                <div className="flex items-center gap-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">وضعیت بن:</label>
                  <button type="button" dir="ltr" onClick={() => setFormIsActive(!formIsActive)}
                    className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${formIsActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${formIsActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className={`text-xs font-bold ${formIsActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                    {formIsActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>

                {/* ===== No Text Restriction Section (حذف شده) ===== */}

                {/* ===== Budget & Installments (غیرفعال) ===== */}
                <div className="p-4 bg-gray-55/50 dark:bg-gray-950/30 rounded-2xl border border-gray-100/50 dark:border-gray-850 opacity-50">
                  <h6 className="text-[10px] font-black text-gray-400 flex items-center gap-1.5 mb-3">
                    <Clock className="w-3 h-3" />
                    بودجه و اقساط (به زودی)
                  </h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block">سقف بودجه (ریال)</label>
                      <input type="text" disabled value=""
                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-400 focus:outline-none cursor-not-allowed mt-1" />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-[11px] text-gray-400 cursor-not-allowed">
                        <input type="checkbox" disabled className="rounded accent-teal-600" />
                        قسط‌بندی مجاز باشد
                      </label>
                    </div>
                  </div>
                </div>

                {/* ===== Actions ===== */}
                <div className="flex gap-2 pt-2">
                  <button onClick={handleSave} disabled={saving || !formTitle.trim() || !formCode.trim() || !formValue}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5">
                    {saving ? 'در حال ذخیره...' : <><Check className="w-4 h-4" />{editId ? 'به‌روزرسانی بن' : 'ذخیره بن'}</>}
                  </button>
                  <button onClick={handleGenerateAndSave} disabled={saving || !formTitle.trim() || !formValue}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="w-4 h-4" />
                    {editId ? 'تولید کد جدید' : 'ایجاد خودکار'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== Sandbox Modal ===== */}
      <AnimatePresence>
        {sandboxOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto"
            onClick={() => setSandboxOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative my-8"
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setSandboxOpen(false)}
                className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-black text-gray-900 dark:text-white leading-snug mb-5 flex items-center gap-1.5">
                <Beaker className="w-5 h-5 text-purple-500" />
                سندباکس شبیه‌ساز بن تخفیف
              </h3>

              <div className="space-y-4 text-right" dir="rtl">
                {/* Sandbox Code Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">کد بن تخفیف *</label>
                  <input type="text" value={sandboxCode} onChange={(e) => setSandboxCode(e.target.value)}
                    placeholder="مثال: WELCOME10"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono" />
                </div>

                {/* Course Select (Optional) */}
                <div ref={sandboxCourseRef} className="relative">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">انتخاب دوره (اختیاری)</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <input type="text" value={sandboxCourseTitle} onChange={(e) => {
                      setSandboxCourseTitle(e.target.value);
                      setSandboxCourseId('');
                      if (e.target.value.trim()) {
                        fetchCoursesForSandbox(e.target.value);
                      }
                    }}
                      placeholder="جستجوی دوره برای بررسی انطباق..."
                      className="w-full text-xs pr-9 pl-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                    {sandboxCourseId && (
                      <button onClick={() => { setSandboxCourseId(''); setSandboxCourseTitle(''); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-300 hover:text-rose-500 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {/* Sandbox course dropdown */}
                  {sandboxCourseDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {sandboxLoadingCourses ? (
                        <div className="p-3 text-xs text-gray-400 text-center">در حال جستجو...</div>
                      ) : sandboxCourseResults.length === 0 ? (
                        sandboxCourseTitle.trim() ? (
                          <div className="p-3 text-xs text-gray-400 text-center">نتیجه‌ای یافت نشد</div>
                        ) : null
                      ) : (
                        sandboxCourseResults.map((cr) => (
                          <button key={cr.id} type="button" onClick={() => {
                            setSandboxCourseId(String(cr.id));
                            setSandboxCourseTitle(cr.title);
                            setSandboxCourseDropdownOpen(false);
                          }}
                            className="w-full text-right p-3 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-850 last:border-0 cursor-pointer transition-colors">
                            {cr.title}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Run button */}
                <div className="flex gap-2 pt-2">
                  <button onClick={handleRunSandboxTest}
                    disabled={!sandboxCode.trim()}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5">
                    <Flame className="w-4 h-4" />
                    اجرای تست اعتبارسنجی
                  </button>
                  {sandboxResult && (
                    <button onClick={() => setSandboxResult(null)}
                      className="px-5 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 rounded-2xl text-xs text-gray-500 font-bold cursor-pointer">
                      پاک کردن
                    </button>
                  )}
                </div>

                {/* Sandbox Result */}
                {sandboxResult && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Beaker className="w-4 h-4 text-purple-500" />
                        نتیجه سندباکس
                      </h5>
                      {sandboxResult.isValid ? (
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/15">
                          ✅ معتبر
                        </span>
                      ) : (
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-extrabold border border-rose-500/15">
                          ❌ نامعتبر
                        </span>
                      )}
                    </div>

                    {/* Error message */}
                    {sandboxResult.error && (
                      <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-500/10 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-rose-700 dark:text-rose-400">{sandboxResult.error}</span>
                      </div>
                    )}

                    {/* Checks trace */}
                    {sandboxResult.checks && sandboxResult.checks.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-gray-400 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          گزارش بررسی (Trace Logs)
                        </span>
                        {sandboxResult.checks.map((log, i) => (
                          <div key={i} className={`p-2.5 rounded-xl text-[10px] font-mono border ${log.passed
                            ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
                            <div className="flex items-center gap-1.5">
                              <span>{log.passed ? '✅' : '❌'}</span>
                              <span className="font-bold">{log.title}</span>
                            </div>
                            <span className="block mr-5 text-gray-500">{log.desc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== Delete Confirmation Modal ===== */}
      <AnimatePresence>
        {deleteId !== null && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs"
            onClick={() => { setDeleteId(null); setDeleteInput(''); }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-5 rounded-3xl shadow-2xl max-w-sm w-full space-y-4"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">حذف بن تخفیف</h4>
                  <p className="text-[11px] text-gray-400">این عملیات قابل بازگشت نیست.</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                برای تأیید، کد <span className="font-mono font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-lg">{toPersianDigits(deleteConfirmWord)}</span> را وارد کنید:
              </p>
              <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="کد تأیید را وارد کنید"
                className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none text-center font-mono" />
              <div className="flex gap-2">
                <button onClick={() => { setDeleteId(null); setDeleteInput(''); }}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-bold cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  انصراف
                </button>
                <button onClick={handleDelete} disabled={deleteInput !== deleteConfirmWord}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer transition-colors">
                  حذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== Notification Toast ===== */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-[300] px-5 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'}`}>
            {notification.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
