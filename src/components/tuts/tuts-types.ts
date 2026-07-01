// ============================================================
// TutsModule — Shared Type Definitions
// ============================================================

import type { User as UserType } from '@/src/types';

export interface TutsModuleProps {
    user: UserType | null;
    activeTabId: string;
    moduleId: string;
    onOpenTab?: (id: string, title: string, iconName: string, forceNewInstance?: boolean) => void;
}

export interface TutCourse {
    id: string;
    title: string;
    group_id: number | null;
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
    section: string[]; // array of 'normal' | 'featured' | 'pre_register' | 'free'
    image: string | null;
    instructor_id: number | null;
    instructor_name: string | null;
    daysOfWeek: string[];
    courseTime: string;
    location: string;
    prerequisites: string;
}

export interface TutRegistrant {
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

export interface TutSurvey {
    id?: string;
    courseId: string;
    courseTitle: string;
    rating: number;
    totalResponses: number;
    userName?: string;
    userPhone?: string;
    date?: string;
    comment?: string;
    contentRating?: number;
    lecturerRating?: number;
    organizationRating?: number;
    facilitiesRating?: number;
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

export interface TutVoucher {
    id: string;
    code: string;
    title: string;
    discountType?: 'percentage' | 'fixed';
    discountValue?: number;
    validFrom?: string;
    validTo?: string;
    allowedHours?: string;
    daysSincePublish?: number;
    occasion?: string;
    courseId?: string;
    courseTitle?: string;
    group_id?: string | number;
    group_title?: string;
    category?: string;
    courseLevel?: 'all' | 'elementary' | 'advanced';
    deliveryType?: 'all' | 'online' | 'in-person';
    minCoursePrice?: number;
    globalCap?: number;
    totalUsed: number;
    maxUses?: number;
    remainingUses?: number;
    status?: 'active' | 'used' | 'expired';
    applicableProductIds?: string[];
    applicableCategoryIds?: string[];
    isSingleUseList?: boolean;
    singleUseCodes?: { code: string; isUsed: boolean }[];
    budgetLimit?: number;
    budgetUsed: number;
    perEmailLimit?: number;
    allowedProvince?: string;
    allowedDevice?: 'all' | 'desktop' | 'mobile';
    allowedReferrer?: string;
    urlParam?: string;
    firstPurchaseOnly?: boolean;
    discountPercent?: number;
    discountAmount?: number;
    allowInstallments?: boolean;
    installmentCount?: number;
    maxDiscount?: number;
    nationalCodes?: string[];
    isActive?: boolean;
}

export interface StatMonthData {
    month: string;
    count: number;
    amount: number;
    online: number;
    bankSlip: number;
    percentage: number;
}

export interface StatSeasonData {
    spring: { count: number; amount: number };
    summer: { count: number; amount: number };
    autumn: { count: number; amount: number };
    winter: { count: number; amount: number };
}

export interface StatsData {
    months: StatMonthData[];
    seasons: StatSeasonData;
    totalApproved: number;
    totalAmount: number;
    onlinePayment: number;
    bankSlips: number;
    avgMonthly: number;
    peekMonth: string;
}

export interface ToastMessage {
    id?: number;
    text: string;
    type: 'success' | 'error' | 'info';
}

export interface SandboxResult {
    isValid: boolean;
    error?: string;
    voucher?: TutVoucher;
    discountAmount: number;
    finalPrice: number;
    originalPrice: number;
    allowInstallments?: boolean;
    installmentCount?: number;
    installmentValue?: number;
    checks?: { title: string; passed: boolean; desc: string }[];
    breakdown?: {
        basePrice: number;
        discountAmount: number;
        earlyBirdDiscount: number;
        groupDiscount: number;
        totalDiscount: number;
    };
}

export interface SurveyFormData {
    courseId: string;
    user: string;
    rating: number;
    content: number;
    lecturer: number;
    organization: number;
    facilities: number;
    comment: string;
}

export interface VoucherFormData {
    code: string;
    title?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxUses: number;
    validFrom: string;
    validUntil: string;
    applicableProductIds: string[];
    applicableCategoryIds: string[];
    budgetCap: number;
    minInstallment: number;
    installmentsAllowed: boolean;
    geoLimit: string;
    deviceLimit: string;
    firstPurchaseOnly: boolean;
    groupId: number | null;
    isActive: boolean;
    maxDiscount: number;
    nationalCodes: string[];
}

export interface PreRegFormData {
    name: string;
    nationalCode: string;
    email: string;
    phone: string;
    province: string;
    voucherCode: string;
}

export interface CourseFormData {
    title: string;
    lecturer: string;
    duration: string;
    cost: string;
    capacity: string;
    startDate: string;
    category: string;
    description: string;
}

export interface ReceiptReviewData {
    receiptId: string;
    status: 'verified' | 'rejected';
    rejectionReason?: string;
}

export type TutCategory = string;
