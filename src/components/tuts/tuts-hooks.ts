// ============================================================
// TutsModule — Shared Custom Hooks
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../api';
import type {
    TutCourse, TutRegistrant, TutSurvey, TutVoucher,
    ToastMessage, SandboxResult, StatsData, SurveyFormData,
    VoucherFormData, PreRegFormData, CourseFormData, ReceiptReviewData,
} from './tuts-types';
import { mapCourse, mapVoucher, mapRegistrant, toPersianDigits, formatCurrency } from './tuts-utils';

// =================================================================
// Hook 1: Toast Notifications
// =================================================================
export function useToast() {
    const [toast, setToast] = useState<ToastMessage | null>(null);

    const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    return { toast, showToast };
}

// =================================================================
// Hook 2: Data Fetching with Lazy Load
// =================================================================
export function useTutsData(moduleId: string, showToast: (text: string, type?: 'success' | 'error' | 'info') => void) {
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingRegistrants, setLoadingRegistrants] = useState(false);
    const [loadingSurveys, setLoadingSurveys] = useState(false);
    const [loadingVouchers, setLoadingVouchers] = useState(false);

    const [courses, setCourses] = useState<TutCourse[]>([]);
    const [registrants, setRegistrants] = useState<TutRegistrant[]>([]);
    const [surveys, setSurveys] = useState<TutSurvey[]>([]);
    const [vouchers, setVouchers] = useState<TutVoucher[]>([]);

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

    // Lazy data fetching: each section fetches only its own data when activated
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

    // Individual surveys state (kept separate for UI)
    const [individualSurveys, setIndividualSurveys] = useState<any[]>([]);

    return {
        loadingCourses, loadingRegistrants, loadingSurveys, loadingVouchers,
        courses, setCourses,
        registrants, setRegistrants,
        surveys, setSurveys,
        vouchers, setVouchers,
        individualSurveys, setIndividualSurveys,
        refetchCourses, refetchVouchers,
        fetchCourseRegistrations,
    };
}

// =================================================================
// Hook 4: Course CRUD Operations
// =================================================================
export function useCourseCRUD(
    courses: TutCourse[],
    setCourses: React.Dispatch<React.SetStateAction<TutCourse[]>>,
    registrants: TutRegistrant[],
    setRegistrants: React.Dispatch<React.SetStateAction<TutRegistrant[]>>,
    categories: string[],
    showToast: (text: string, type?: 'success' | 'error' | 'info') => void,
) {
    // New course form
    const [isNewCourseModalOpen, setIsNewCourseModalOpen] = useState(false);
    const [newCourseTitle, setNewCourseTitle] = useState('');
    const [newCourseLecturer, setNewCourseLecturer] = useState('');
    const [newCourseDuration, setNewCourseDuration] = useState('');
    const [newCourseCost, setNewCourseCost] = useState('');
    const [newCourseCapacity, setNewCourseCapacity] = useState('30');
    const [newCourseStartDate, setNewCourseStartDate] = useState('۱۴۰۵/۰۵/۱۵');
    const [newCourseCategory, setNewCourseCategory] = useState('');
    const [newCourseDescription, setNewCourseDescription] = useState('');

    // Update category when categories load
    useEffect(() => {
        if (!newCourseCategory && categories.length > 0) {
            setNewCourseCategory(categories[0]);
        }
    }, [categories]);

    // Edit course form
    const [editingCourse, setEditingCourse] = useState<TutCourse | null>(null);
    const [editCourseTitle, setEditCourseTitle] = useState('');
    const [editCourseLecturer, setEditCourseLecturer] = useState('');
    const [editCourseDuration, setEditCourseDuration] = useState('');
    const [editCourseCost, setEditCourseCost] = useState('');
    const [editCourseCapacity, setEditCourseCapacity] = useState('');
    const [editCourseStartDate, setEditCourseStartDate] = useState('');
    const [editCourseCategory, setEditCourseCategory] = useState('');
    const [editCourseDescription, setEditCourseDescription] = useState('');

    // Delete confirmation
    const [courseToDelete, setCourseToDelete] = useState<TutCourse | null>(null);

    const handleCreateNewCourse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCourseTitle || !newCourseLecturer || !newCourseCost) {
            showToast('لطفاً فیلدهای ستاره‌دار و الزامی را پر کنید.', 'error');
            return;
        }
        const price = parseInt(newCourseCost.replace(/[^\d]/g, ''));
        if (isNaN(price)) { showToast('مبلغ شهریه نامعتبر است.', 'error'); return; }

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
            description: newCourseDescription || 'توضیحات دوره به زودی منتشر خواهد شد.',
        };

        setCourses([newC, ...courses]);
        setIsNewCourseModalOpen(false);
        showToast(`دوره کارگاهی جدید "${newCourseTitle}" با موفقیت تعریف گردید.`);
        setNewCourseTitle('');
        setNewCourseLecturer('');
        setNewCourseCost('');
        setNewCourseDescription('');
    };

    const startEditing = (course: TutCourse) => {
        setEditingCourse(course);
        setEditCourseTitle(course.title);
        setEditCourseLecturer(course.lecturer);
        setEditCourseDuration(course.duration);
        setEditCourseCost(String(course.cost));
        setEditCourseCapacity(String(course.capacity));
        setEditCourseStartDate(course.startDate);
        setEditCourseCategory(course.category);
        setEditCourseDescription(course.description);
    };

    const handleUpdateCourse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCourse) return;
        if (!editCourseTitle || !editCourseLecturer || !editCourseCost) {
            showToast('لطفاً فیلدهای ستاره‌دار و الزامی را پر کنید.', 'error');
            return;
        }
        const price = typeof editCourseCost === 'number' ? editCourseCost : parseInt(editCourseCost.toString().replace(/[^\d]/g, ''));
        if (isNaN(price)) { showToast('مبلغ شهریه نامعتبر است.', 'error'); return; }

        setCourses(prev => prev.map(c =>
            c.id === editingCourse.id
                ? {
                    ...c,
                    title: editCourseTitle,
                    lecturer: editCourseLecturer,
                    duration: editCourseDuration || '۱۲ ساعت',
                    cost: price,
                    capacity: parseInt(editCourseCapacity) || 30,
                    startDate: editCourseStartDate,
                    category: editCourseCategory,
                    description: editCourseDescription || 'توضیحات دوره به زودی منتشر خواهد شد.',
                }
                : c,
        ));
        setEditingCourse(null);
        showToast(`دوره کارگاهی "${editCourseTitle}" با موفقیت بروزرسانی گردید.`);
    };

    const handleToggleCourseStatus = (id: string) => {
        setCourses(prev =>
            prev.map(c => {
                if (c.id === id) {
                    const nextStatus = c.status === 'ended' ? 'active' : 'ended';
                    showToast(
                        nextStatus === 'active'
                            ? `دوره "${c.title}" مجدداً فعال گردید.`
                            : `دوره "${c.title}" غیرفعال (پایان‌یافته) گردید.`,
                        'info',
                    );
                    return { ...c, status: nextStatus };
                }
                return c;
            }),
        );
    };

    const handleDeleteCourse = (id: string) => {
        const course = courses.find(c => c.id === id);
        if (!course) return;
        setCourseToDelete(course);
    };

    const confirmDeleteCourse = () => {
        if (!courseToDelete) return;
        const id = courseToDelete.id;
        setCourses(prev => prev.filter(c => c.id !== id));
        setRegistrants(prev => prev.filter(r => r.courseId !== id));
        showToast(`دوره آموزشی "${courseToDelete.title}" با موفقیت حذف گردید.`, 'info');
        setCourseToDelete(null);
    };

    const handleCopyCourseUrl = (course: TutCourse) => {
        const url = `https://terms.sau.ac.ir/course/${course.id}`;
        navigator.clipboard.writeText(url).then(() => {
            showToast('آدرس دوره کپی شد.', 'success');
        }).catch(() => {
            showToast('خطا در کپی آدرس.', 'error');
        });
    };

    const handleExportSingleCourseExcel = (course: TutCourse) => {
        const courseRegs = registrants.filter(r => r.courseId === course.id);
        if (courseRegs.length === 0) {
            showToast('هیچ ثبت‌نامی برای این دوره یافت نشد تا خروجی گرفته شود.', 'error');
            return;
        }
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

    return {
        // New course
        isNewCourseModalOpen, setIsNewCourseModalOpen,
        newCourseTitle, setNewCourseTitle,
        newCourseLecturer, setNewCourseLecturer,
        newCourseDuration, setNewCourseDuration,
        newCourseCost, setNewCourseCost,
        newCourseCapacity, setNewCourseCapacity,
        newCourseStartDate, setNewCourseStartDate,
        newCourseCategory, setNewCourseCategory,
        newCourseDescription, setNewCourseDescription,
        handleCreateNewCourse,
        // Edit course
        editingCourse, setEditingCourse,
        editCourseTitle, setEditCourseTitle,
        editCourseLecturer, setEditCourseLecturer,
        editCourseDuration, setEditCourseDuration,
        editCourseCost, setEditCourseCost,
        editCourseCapacity, setEditCourseCapacity,
        editCourseStartDate, setEditCourseStartDate,
        editCourseCategory, setEditCourseCategory,
        editCourseDescription, setEditCourseDescription,
        startEditing, handleUpdateCourse,
        // Status & Delete
        handleToggleCourseStatus,
        handleDeleteCourse, confirmDeleteCourse,
        courseToDelete, setCourseToDelete,
        // Utilities
        handleCopyCourseUrl,
        handleExportSingleCourseExcel,
    };
}

// =================================================================
// Hook 5: Voucher Operations
// =================================================================
export function useVoucherOps(
    vouchers: TutVoucher[],
    setVouchers: React.Dispatch<React.SetStateAction<TutVoucher[]>>,
    courses: TutCourse[],
    registrants: TutRegistrant[],
    showToast: (text: string, type?: 'success' | 'error' | 'info') => void,
) {
    // Tab state
    const [voucherActiveTab, setVoucherActiveTab] = useState<'list' | 'create'>('list');

    // Creation form state
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
            code, title,
            validFrom: newVoucherValidFrom || undefined,
            validTo: newVoucherValidTo || undefined,
            allowedHours: newVoucherAllowedHours !== 'all' ? newVoucherAllowedHours : undefined,
            occasion: newVoucherOccasion || undefined,
            courseId: newVoucherCourseId !== 'all' ? newVoucherCourseId : undefined,
            category: newVoucherCategory !== 'all' ? newVoucherCategory : undefined,
            courseLevel: newVoucherCourseLevel !== 'all' ? newVoucherCourseLevel as 'elementary' | 'advanced' : undefined,
            deliveryType: newVoucherDeliveryType !== 'all' ? newVoucherDeliveryType as 'online' | 'in-person' : undefined,
            minCoursePrice: Number(newVoucherMinCoursePrice) > 0 ? Number(newVoucherMinCoursePrice) : undefined,
            globalCap: Number(newVoucherGlobalCap) > 0 ? Number(newVoucherGlobalCap) : undefined,
            totalUsed: 0,
            budgetLimit: Number(newVoucherBudgetLimit) > 0 ? Number(newVoucherBudgetLimit) : undefined,
            budgetUsed: 0,
            perEmailLimit: Number(newVoucherPerEmailLimit) > 0 ? Number(newVoucherPerEmailLimit) : undefined,
            allowedProvince: newVoucherAllowedProvince !== 'all' ? newVoucherAllowedProvince : undefined,
            allowedDevice: newVoucherAllowedDevice !== 'all' ? newVoucherAllowedDevice as 'mobile' | 'desktop' : undefined,
            allowedReferrer: newVoucherAllowedReferrer !== 'all' ? newVoucherAllowedReferrer : undefined,
            firstPurchaseOnly: newVoucherFirstPurchaseOnly,
            discountPercent: newVoucherDiscountType === 'percent' ? Number(newVoucherDiscountValue) : undefined,
            discountAmount: newVoucherDiscountType === 'amount' ? Number(newVoucherDiscountValue) : undefined,
            allowInstallments: newVoucherAllowInstallments,
            installmentCount: newVoucherAllowInstallments ? Number(newVoucherInstallmentCount) : undefined,
        };

        setVouchers([created, ...vouchers]);
        showToast(`بن خرید جدید "${title}" با کد "${code}" با موفقیت ایجاد گردید.`);
        setNewVoucherCode('');
        setNewVoucherTitle('');
        setNewVoucherOccasion('');
        setNewVoucherDiscountValue('20');
    };

    // ===== Sandbox Simulator =====
    const [sandboxCode, setSandboxCode] = useState('WELCOME_ONLINE');
    const [sandboxCourseId, setSandboxCourseId] = useState('');
    const [sandboxEmail, setSandboxEmail] = useState('student@example.com');
    const [sandboxPhone, setSandboxPhone] = useState('۰۹۱۲۳۴۵۶۷۸۹');
    const [sandboxProvince, setSandboxProvince] = useState('تهران');
    const [sandboxDevice, setSandboxDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [sandboxReferrer, setSandboxReferrer] = useState('');
    const [sandboxResult, setSandboxResult] = useState<SandboxResult | null>(null);

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
                checks: [{ title: 'وجود بن در سیستم', passed: false, desc: 'بن تخفیفی با این کد در لیست دیتابیس وجود ندارد.' }],
            });
            return;
        }

        const checks: { title: string; passed: boolean; desc: string }[] = [];
        let isValid = true;
        let failReason = '';
        const todayStr = '1405/03/23';

        // Check 1: Validity Dates
        let datePassed = true;
        let dateDesc = 'بازه زمانی آزاد است.';
        if (vouch.validFrom && todayStr < vouch.validFrom) {
            datePassed = false; isValid = false;
            failReason = `تاریخ فعلی (${toPersianDigits(todayStr)}) پیش از شروع اعتبار (${toPersianDigits(vouch.validFrom)}) است.`;
            dateDesc = `غیرمعتبر (قبل از شروع طرح: ${toPersianDigits(vouch.validFrom)})`;
        } else if (vouch.validTo && todayStr > vouch.validTo) {
            datePassed = false; isValid = false;
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
            const currentHour = 10, currentMinute = 5;
            const [start, end] = vouch.allowedHours.split('-');
            const [sh, sm] = start.split(':').map(Number);
            const [eh, em] = end.split(':').map(Number);
            const totalCur = currentHour * 60 + currentMinute;
            const totalStart = sh * 60 + sm;
            const totalEnd = eh * 60 + em;
            if (totalCur < totalStart || totalCur > totalEnd) {
                hoursPassed = false; isValid = false;
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
                productPassed = false; isValid = false;
                failReason = 'این بن تخفیف فقط برای دوره خاصی صادر شده است.';
                productDesc = `غیرمجاز (فقط مخصوص دوره با شناسه ${vouch.courseId})`;
            } else { productDesc = 'مجاز (مخصوص همین دوره)'; }
        }
        checks.push({ title: 'انطباق دوره و محصول', passed: productPassed, desc: productDesc });

        // Check 4: Category Match
        let catPassed = true;
        let catDesc = 'برای تمامی دپارتمان‌ها مجاز است.';
        if (vouch.category && vouch.category !== 'all') {
            if (vouch.category !== course.category) {
                catPassed = false; isValid = false;
                failReason = `این بن فقط برای کارگاه‌های دپارتمان ${vouch.category} معتبر است.`;
                catDesc = `غیرمجاز (دپارتمان این دوره "${course.category}" است)`;
            } else { catDesc = 'مجاز (دپارتمان منطبق)'; }
        }
        checks.push({ title: 'دپارتمان آموزشی', passed: catPassed, desc: catDesc });

        // Check 5: Minimum Base Price
        let pricePassed = true;
        let priceDesc = 'حداقل مبلغ شهریه ندارد.';
        if (vouch.minCoursePrice && course.cost < vouch.minCoursePrice) {
            pricePassed = false; isValid = false;
            failReason = 'شهریه دوره از حداقل مبلغ مجاز بن کمتر است.';
            priceDesc = `غیرمجاز (شهریه دوره ${formatCurrency(course.cost)} کمتر از حداقل مجاز ${formatCurrency(vouch.minCoursePrice)})`;
        } else if (vouch.minCoursePrice) {
            priceDesc = `مجاز (بیشتر از حداقل ${formatCurrency(vouch.minCoursePrice)})`;
        }
        checks.push({ title: 'حداقل مبلغ شهریه دوره', passed: pricePassed, desc: priceDesc });

        // Check 6: Global Usage Cap
        let capPassed = true;
        let capDesc = 'سقف تعداد استفاده ندارد.';
        if (vouch.globalCap) {
            if (vouch.totalUsed >= vouch.globalCap) {
                capPassed = false; isValid = false;
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
                budgetPassed = false; isValid = false;
                failReason = 'سقف کل بودجه تخصیص داده شده به این جشنواره تمام شده است.';
                budgetDesc = `اتمام بودجه (${formatCurrency(vouch.budgetUsed)} استفاده از ${formatCurrency(vouch.budgetLimit)})`;
            } else {
                budgetDesc = `مجاز (بودجه باقی‌مانده: ${formatCurrency(vouch.budgetLimit - vouch.budgetUsed)})`;
            }
        }
        checks.push({ title: 'سقف بودجه مالی طرح', passed: budgetPassed, desc: budgetDesc });

        // Check 8: Geo Location
        let geoPassed = true;
        let geoDesc = 'برای تمامی مناطق و استان‌ها فعال است.';
        if (vouch.allowedProvince && vouch.allowedProvince !== 'all') {
            if (sandboxProvince !== vouch.allowedProvince) {
                geoPassed = false; isValid = false;
                failReason = `این بن فقط برای ساکنین استان ${vouch.allowedProvince} صادر شده است.`;
                geoDesc = `غیرمجاز (استان شبیه‌سازی شده: ${sandboxProvince})`;
            } else { geoDesc = 'مجاز (استان منطبق)'; }
        }
        checks.push({ title: 'موقعیت جغرافیایی فراگیر', passed: geoPassed, desc: geoDesc });

        // Check 9: Device Check
        let devPassed = true;
        let devDesc = 'برای دسکتاپ و موبایل فعال است.';
        if (vouch.allowedDevice && vouch.allowedDevice !== 'all') {
            if (sandboxDevice !== vouch.allowedDevice) {
                devPassed = false; isValid = false;
                failReason = `این بن فقط در بستر ${vouch.allowedDevice === 'mobile' ? 'اپلیکیشن موبایل' : 'مرورگر دسکتاپ'} معتبر است.`;
                devDesc = `غیرمجاز (دستگاه شبیه‌سازی شده: ${sandboxDevice === 'mobile' ? 'موبایل' : 'دسکتاپ'})`;
            } else { devDesc = 'مجاز (دستگاه منطبق)'; }
        }
        checks.push({ title: 'دستگاه و کانال ثبت‌نام', passed: devPassed, desc: devDesc });

        // Check 10: Referrer Check
        let refPassed = true;
        let refDesc = 'ارجاع کانال آزاد است.';
        if (vouch.allowedReferrer && vouch.allowedReferrer !== 'all') {
            if (sandboxReferrer !== vouch.allowedReferrer) {
                refPassed = false; isValid = false;
                failReason = `این بن تخفیف فقط با ارجاع از کانال "${vouch.allowedReferrer}" معتبر است.`;
                refDesc = `غیرمجاز (منبع ارجاع فعلی: ${sandboxReferrer || 'مستقیم'})`;
            } else { refDesc = 'مجاز (منبع ارجاع منطبق)'; }
        }
        checks.push({ title: 'منبع ورود و ارجاع (UTM)', passed: refPassed, desc: refDesc });

        // Check 11: First Purchase Only
        let firstPassed = true;
        let firstDesc = 'برای همه ثبت‌نام کنندگان مجاز است.';
        if (vouch.firstPurchaseOnly) {
            const hasPurchased = registrants.some(r =>
                r.status === 'verified' && (r.studentCode === sandboxPhone || r.studentCode === sandboxEmail),
            );
            if (hasPurchased) {
                firstPassed = false; isValid = false;
                failReason = 'این بن تخفیف فقط برای «اولین خرید» فراگیران معتبر است.';
                firstDesc = 'غیرمجاز (سوابق خرید با این مشخصات در سیستم یافت شد)';
            } else { firstDesc = 'مجاز (اولین بار خرید فراگیر)'; }
        }
        checks.push({ title: 'تشخیص فراگیر جدید (اولین خرید)', passed: firstPassed, desc: firstDesc });

        // Final calculation
        let discount = 0;
        if (isValid) {
            if (vouch.discountPercent) discount = Math.round((course.cost * vouch.discountPercent) / 100);
            else if (vouch.discountAmount) discount = Math.min(course.cost, vouch.discountAmount);
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
        });

        if (isValid) showToast('شبیه‌سازی با موفقیت انجام شد: بن خرید معتبر است.', 'success');
        else showToast(`شبیه‌سازی انجام شد: بن غیرمعتبر است. علت: ${failReason}`, 'error');
    };

    return {
        voucherActiveTab, setVoucherActiveTab,
        // Creation form
        newVoucherCode, setNewVoucherCode,
        newVoucherTitle, setNewVoucherTitle,
        newVoucherValidFrom, setNewVoucherValidFrom,
        newVoucherValidTo, setNewVoucherValidTo,
        newVoucherAllowedHours, setNewVoucherAllowedHours,
        newVoucherOccasion, setNewVoucherOccasion,
        newVoucherCourseId, setNewVoucherCourseId,
        newVoucherCategory, setNewVoucherCategory,
        newVoucherCourseLevel, setNewVoucherCourseLevel,
        newVoucherDeliveryType, setNewVoucherDeliveryType,
        newVoucherMinCoursePrice, setNewVoucherMinCoursePrice,
        newVoucherGlobalCap, setNewVoucherGlobalCap,
        newVoucherBudgetLimit, setNewVoucherBudgetLimit,
        newVoucherPerEmailLimit, setNewVoucherPerEmailLimit,
        newVoucherAllowedProvince, setNewVoucherAllowedProvince,
        newVoucherAllowedDevice, setNewVoucherAllowedDevice,
        newVoucherAllowedReferrer, setNewVoucherAllowedReferrer,
        newVoucherFirstPurchaseOnly, setNewVoucherFirstPurchaseOnly,
        newVoucherDiscountType, setNewVoucherDiscountType,
        newVoucherDiscountValue, setNewVoucherDiscountValue,
        newVoucherAllowInstallments, setNewVoucherAllowInstallments,
        newVoucherInstallmentCount, setNewVoucherInstallmentCount,
        handleCreateVoucher,
        // Sandbox
        sandboxCode, setSandboxCode,
        sandboxCourseId, setSandboxCourseId,
        sandboxEmail, setSandboxEmail,
        sandboxPhone, setSandboxPhone,
        sandboxProvince, setSandboxProvince,
        sandboxDevice, setSandboxDevice,
        sandboxReferrer, setSandboxReferrer,
        sandboxResult, setSandboxResult,
        handleRunSandboxTest,
    };
}

// =================================================================
// Hook 6: Pre-Registration Flow
// =================================================================
export function usePreRegistration(
    courses: TutCourse[],
    vouchers: TutVoucher[],
    registrants: TutRegistrant[],
    showToast: (text: string, type?: 'success' | 'error' | 'info') => void,
) {
    const [registeringCourse, setRegisteringCourse] = useState<TutCourse | null>(null);
    const [studentName, setStudentName] = useState('');
    const [studentIdNum, setStudentIdNum] = useState('');
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

    const handleValidateVoucherCode = (codeToTest?: string, targetCourseOverride?: TutCourse) => {
        const code = (codeToTest || studentVoucherCode).trim().toUpperCase();
        const course = targetCourseOverride || registeringCourse;
        if (!code) {
            setVoucherError('لطفاً کد بن تخفیف را وارد کنید.');
            setAppliedVoucher(null); setVoucherDiscountAmount(0);
            return;
        }
        if (!course) {
            setVoucherError('کارگاهی برای بررسی یافت نشد.');
            setAppliedVoucher(null); setVoucherDiscountAmount(0);
            return;
        }

        const foundVoucher = vouchers.find(v => v.code.toUpperCase() === code);
        if (!foundVoucher) {
            setVoucherError('کد تخفیف معتبر نمی‌باشد یا منقضی شده است.');
            setAppliedVoucher(null); setVoucherDiscountAmount(0);
            return;
        }

        const todayStr = '1405/03/23';
        if (foundVoucher.validFrom && todayStr < foundVoucher.validFrom) {
            setVoucherError(`این بن هنوز فعال نشده است. شروع اعتبار از ${foundVoucher.validFrom}`);
            setAppliedVoucher(null); return;
        }
        if (foundVoucher.validTo && todayStr > foundVoucher.validTo) {
            setVoucherError(`این بن منقضی شده است. مهلت استفاده تا ${foundVoucher.validTo} بوده است.`);
            setAppliedVoucher(null); return;
        }
        if (foundVoucher.allowedHours && foundVoucher.allowedHours !== 'all') {
            const currentHour = 10, currentMinute = 5;
            const [start, end] = foundVoucher.allowedHours.split('-');
            const [sh, sm] = start.split(':').map(Number);
            const [eh, em] = end.split(':').map(Number);
            const totalCur = currentHour * 60 + currentMinute;
            const totalStart = sh * 60 + sm;
            const totalEnd = eh * 60 + em;
            if (totalCur < totalStart || totalCur > totalEnd) {
                setVoucherError(`این بن تخفیف فقط در ساعات خاصی از شبانه‌روز (${toPersianDigits(foundVoucher.allowedHours)}) قابل استفاده است. ساعت فعلی سیستم: ${toPersianDigits('۱۰:۰۵')}`);
                setAppliedVoucher(null); return;
            }
        }
        if (foundVoucher.courseId && foundVoucher.courseId !== 'all' && foundVoucher.courseId !== course.id) {
            const matchCourse = courses.find(c => c.id === foundVoucher.courseId);
            setVoucherError(`این بن فقط برای دوره اختصاصی «${matchCourse?.title || foundVoucher.courseId}» معتبر است.`);
            setAppliedVoucher(null); return;
        }
        if (foundVoucher.category && foundVoucher.category !== 'all' && foundVoucher.category !== course.category) {
            setVoucherError(`این بن فقط برای کارگاه‌های دپارتمان «${foundVoucher.category}» معتبر است.`);
            setAppliedVoucher(null); return;
        }
        if (foundVoucher.minCoursePrice && course.cost < foundVoucher.minCoursePrice) {
            setVoucherError(`حداقل قیمت کارگاه برای استفاده از این بن باید بیشتر از ${formatCurrency(foundVoucher.minCoursePrice)} باشد.`);
            setAppliedVoucher(null); return;
        }
        if (foundVoucher.deliveryType && foundVoucher.deliveryType !== 'all') {
            const isOnline = course.title.includes('آنلاین') || course.description.includes('آنلاین') || course.title.includes('سمینار') || course.title.includes('وبینار');
            if (foundVoucher.deliveryType === 'online' && !isOnline) {
                setVoucherError('این بن فقط برای دوره‌های آنلاین یا سمینار وبیناری معتبر است.');
                setAppliedVoucher(null); return;
            }
        }

        let discount = 0;
        if (foundVoucher.discountPercent) discount = Math.round((course.cost * foundVoucher.discountPercent) / 100);
        else if (foundVoucher.discountAmount) discount = Math.min(course.cost, foundVoucher.discountAmount);

        setAppliedVoucher(foundVoucher);
        setVoucherError(null);
        setVoucherDiscountAmount(discount);
        showToast(`کد تخفیف "${foundVoucher.code}" با موفقیت اعمال شد.`, 'success');
    };

    const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        setUploadFileName(file.name);
        setUploadProgress(0);
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) { clearInterval(interval); setIsUploading(false); return 100; }
                return prev + 25;
            });
        }, 200);
    };

    const resetPreRegForm = () => {
        setStudentName('');
        setStudentIdNum('');
        setStudentEmail('');
        setStudentPhone('');
        setStudentProvince('تهران');
        setStudentVoucherCode('');
        setAppliedVoucher(null);
        setVoucherError(null);
        setVoucherDiscountAmount(0);
        setSelectedInstallments(1);
        setSimulatedDevice('desktop');
        setSimulatedReferrer('');
        setSelectedBank('بانک ملی ایران');
        setRefCodeInput('');
        setUploadProgress(0);
        setUploadFileName('');
        setIsUploading(false);
    };

    return {
        registeringCourse, setRegisteringCourse,
        studentName, setStudentName,
        studentIdNum, setStudentIdNum,
        studentEmail, setStudentEmail,
        studentPhone, setStudentPhone,
        studentProvince, setStudentProvince,
        studentVoucherCode, setStudentVoucherCode,
        appliedVoucher, setAppliedVoucher,
        voucherError, setVoucherError,
        voucherDiscountAmount, setVoucherDiscountAmount,
        selectedInstallments, setSelectedInstallments,
        simulatedDevice, setSimulatedDevice,
        simulatedReferrer, setSimulatedReferrer,
        selectedBank, setSelectedBank,
        refCodeInput, setRefCodeInput,
        uploadProgress, setUploadProgress,
        uploadFileName, setUploadFileName,
        isUploading, setIsUploading,
        handleValidateVoucherCode,
        handleSimulateUpload,
        resetPreRegForm,
    };
}

// =================================================================
// Hook 7: Survey Operations
// =================================================================
export function useSurveyOps(
    courses: TutCourse[],
    surveys: TutSurvey[],
    setSurveys: React.Dispatch<React.SetStateAction<TutSurvey[]>>,
    individualSurveys: any[],
    setIndividualSurveys: React.Dispatch<React.SetStateAction<any[]>>,
    showToast: (text: string, type?: 'success' | 'error' | 'info') => void,
) {
    const [surveyFormCourseId, setSurveyFormCourseId] = useState('');
    const [surveyFormUser, setSurveyFormUser] = useState('');
    const [surveyFormRating, setSurveyFormRating] = useState(5);
    const [surveyFormContent, setSurveyFormContent] = useState(90);
    const [surveyFormLecturer, setSurveyFormLecturer] = useState(95);
    const [surveyFormOrg, setSurveyFormOrg] = useState(85);
    const [surveyFormFacilities, setSurveyFormFacilities] = useState(80);
    const [surveyFormComment, setSurveyFormComment] = useState('');

    const [surveySearch, setSurveySearch] = useState('');
    const [surveyFromDate, setSurveyFromDate] = useState('');
    const [surveyToDate, setSurveyToDate] = useState('');
    const [surveyPage, setSurveyPage] = useState(1);
    const [selectedSurveyDetails, setSelectedSurveyDetails] = useState<any | null>(null);

    const handleSubmitSurvey = (e: React.FormEvent) => {
        e.preventDefault();
        if (!surveyFormComment.trim()) {
            showToast('لطفاً دیدگاه متنی خود را وارد کنید.', 'error');
            return;
        }
        const targetCourse = courses.find(c => c.id === surveyFormCourseId);
        if (!targetCourse) return;

        const newComment = {
            user: surveyFormUser || 'کاربر مهمان پورتال',
            rating: surveyFormRating,
            comment: surveyFormComment,
            date: '۱۴۰۵/۰۳/۲۳',
        };

        const existingIndex = surveys.findIndex(s => s.courseId === surveyFormCourseId);
        if (existingIndex > -1) {
            setSurveys(prev => {
                const updated = [...prev];
                const s = updated[existingIndex];
                const oldTotal = s.totalResponses;
                const newTotal = oldTotal + 1;
                const newRating = parseFloat(((s.rating * oldTotal + surveyFormRating) / newTotal).toFixed(1));
                updated[existingIndex] = {
                    ...s, rating: newRating, totalResponses: newTotal,
                    breakdown: {
                        content: Math.round((s.breakdown.content * oldTotal + surveyFormContent) / newTotal),
                        lecturer: Math.round((s.breakdown.lecturer * oldTotal + surveyFormLecturer) / newTotal),
                        organization: Math.round((s.breakdown.organization * oldTotal + surveyFormOrg) / newTotal),
                        facilities: Math.round((s.breakdown.facilities * oldTotal + surveyFormFacilities) / newTotal),
                    },
                    comments: [newComment, ...s.comments],
                };
                return updated;
            });
        } else {
            const newSurvey: TutSurvey = {
                courseId: surveyFormCourseId,
                courseTitle: targetCourse.title,
                rating: surveyFormRating,
                totalResponses: 1,
                breakdown: { content: surveyFormContent, lecturer: surveyFormLecturer, organization: surveyFormOrg, facilities: surveyFormFacilities },
                comments: [newComment],
            };
            setSurveys(prev => [newSurvey, ...prev]);
        }

        const newIndividual = {
            id: individualSurveys.length > 0 ? Math.max(...individualSurveys.map(x => x.id)) + 1 : 1,
            name: surveyFormUser || 'کاربر مهمان پورتال',
            phone: '۰۹۱۲۰۰۰۰۰۰۰',
            date: '۱۴۰۵/۰۳/۲۳ ۱۲:۰۰',
            courseTitle: targetCourse.title,
            rating: surveyFormRating,
            comment: surveyFormComment,
            answers: { content: surveyFormContent, lecturer: surveyFormLecturer, organization: surveyFormOrg, facilities: surveyFormFacilities },
        };
        setIndividualSurveys(prev => [newIndividual, ...prev]);

        showToast('دیدگاه و ارزیابی شما با موفقیت ثبت شد و در آمارهای پورتال اعمال گردید.', 'success');
        setSurveyFormComment('');
    };

    return {
        surveyFormCourseId, setSurveyFormCourseId,
        surveyFormUser, setSurveyFormUser,
        surveyFormRating, setSurveyFormRating,
        surveyFormContent, setSurveyFormContent,
        surveyFormLecturer, setSurveyFormLecturer,
        surveyFormOrg, setSurveyFormOrg,
        surveyFormFacilities, setSurveyFormFacilities,
        surveyFormComment, setSurveyFormComment,
        surveySearch, setSurveySearch,
        surveyFromDate, setSurveyFromDate,
        surveyToDate, setSurveyToDate,
        surveyPage, setSurveyPage,
        selectedSurveyDetails, setSelectedSurveyDetails,
        handleSubmitSurvey,
    };
}

// =================================================================
// Hook 8: Receipt Review Operations
// =================================================================
export function useReceiptOps(
    registrants: TutRegistrant[],
    setRegistrants: React.Dispatch<React.SetStateAction<TutRegistrant[]>>,
    showToast: (text: string, type?: 'success' | 'error' | 'info') => void,
) {
    const [reviewReceipt, setReviewReceipt] = useState<ReceiptReviewData | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleApproveReceipt = (registrantId: string) => {
        setRegistrants(prev =>
            prev.map(r => (r.id === registrantId ? { ...r, status: 'verified' as const, verifiedAt: '۱۴۰۵/۰۳/۲۳' } : r)),
        );
        setReviewReceipt(null);
        showToast('رسید بانکی با موفقیت تایید شد.', 'success');
    };

    const handleRejectReceipt = (registrantId: string) => {
        if (!rejectionReason.trim()) {
            showToast('لطفاً علت رد رسید را وارد کنید.', 'error');
            return;
        }
        setRegistrants(prev =>
            prev.map(r =>
                r.id === registrantId ? { ...r, status: 'rejected' as const, rejectionReason: rejectionReason.trim() } : r,
            ),
        );
        setReviewReceipt(null);
        setRejectionReason('');
        showToast('رسید بانکی رد شد.', 'info');
    };

    return {
        reviewReceipt, setReviewReceipt,
        rejectionReason, setRejectionReason,
        handleApproveReceipt,
        handleRejectReceipt,
    };
}

// =================================================================
// Hook 9: Pagination helper
// =================================================================
export function usePagination(perPage: number = 12) {
    const [page, setPage] = useState(1);

    const paginated = useCallback(<T,>(items: T[]): T[] => {
        const start = (page - 1) * perPage;
        return items.slice(start, start + perPage);
    }, [page, perPage]);

    const totalPages = useCallback((total: number) => Math.max(1, Math.ceil(total / perPage)), [perPage]);

    const goToPage = useCallback((p: number) => setPage(p), []);

    return { page, setPage, paginated, totalPages, goToPage, perPage };
}

// =================================================================
// Hook 10: Stats filter state
// =================================================================
export function useStatsFilter() {
    const [statSelectedYear, setStatSelectedYear] = useState('۱۴۰۵');
    const [statSelectedCourse, setStatSelectedCourse] = useState('all');
    const [statAppliedYear, setStatAppliedYear] = useState('۱۴۰۵');
    const [statAppliedCourse, setStatAppliedCourse] = useState('all');

    return {
        statSelectedYear, setStatSelectedYear,
        statSelectedCourse, setStatSelectedCourse,
        statAppliedYear, setStatAppliedYear,
        statAppliedCourse, setStatAppliedCourse,
    };
}


