# طرح بازآرایی (Refactor) پروژه بر اساس معماری Feature-Based

## فهرست مراحل

| مرحله | عنوان | پیش‌نیاز | وضعیت |
|-------|-------|----------|-------|
| ۱ | تحلیل ساختار فعلی و شناسایی وابستگی‌ها | — | ⬜ |
| ۲ | ایجاد پوشه‌های `shared-*` و انتقال کدهای اشتراکی | ۱ | ⬜ |
| ۳ | ایجاد ساختار `apps/` و App های اصلی | ۱ | ⬜ |
| ۴ | استخراج `tuts` به عنوان اولین App | ۲, ۳ | ⬜ |
| ۵ | استخراج Tab های درون `tuts` | ۴ | ⬜ |
| ۶ | استخراق `accounting` (مالی) | ۲, ۳ | ⬜ |
| ۷ | استخراج `crm` (دانشجویان، اساتید) | ۲, ۳ | ⬜ |
| ۸ | استخراج `library` و سایر Apps | ۲, ۳ | ⬜ |
| ۹ | ایجاد `apps/index.tsx` و تجمیع Route ها | ۴-۸ | ⬜ |
| ۱۰ | بازنویسی `App.tsx` به نازک (Thin App) | ۹ | ⬜ |
| ۱۱ | افزودن Lazy Loading و Dynamic Import | ۱۰ | ⬜ |
| ۱۲ | پاک‌سازی فایل‌های قدیمی و تست نهایی | ۱۱ | ⬜ |

---

## مرحله ۱: تحلیل ساختار فعلی و شناسایی وابستگی‌ها

### وضعیت فعلی (Current State)

```
src/
├── api.ts                      # سرویس API یکپارچه (~۵۰۰+ خط)
├── App.tsx                     # کامپوننت اصلی (~۸۵۰+ خط) — state مرکزی + switch-case رندر
├── main.tsx                    # نقطه ورود (فقط <App />)
├── types.ts                    # انواع عمومی (User, Tab, NavItem, ...)
├── index.css                   # استایل‌های Tailwind
├── lib/                        # توابع و ثابت‌های اشتراکی
│   ├── constants.ts
│   ├── functions.ts
│   ├── menuConfig.ts
│   └── networkStatus.ts
└── components/                 # همه کامپوننت‌ها به صورت Flat
    ├── LoginForm.tsx
    ├── Header.tsx
    ├── Sidebar.tsx
    ├── TabsBar.tsx
    ├── Footer.tsx
    ├── DashboardModule.tsx
    ├── ProfileModule.tsx
    ├── ChangePasswordModule.tsx
    ├── StudentManagement.tsx
    ├── ProfessorManagement.tsx
    ├── FinancialManagement.tsx
    ├── ThesisManagement.tsx
    ├── LegacyModules.tsx       # Iframe ماژول‌های قدیمی
    ├── TutsModule.tsx          # ~۲۱۰۰ خط — بزرگترین ماژول (ارکستراتور ۷ زیرماژول)
    ├── tuts/                   # زیرماژول‌های Tuts
    │   ├── tuts-types.ts
    │   ├── tuts-utils.ts
    │   ├── tuts-hooks.ts
    │   ├── tuts-components.tsx
    │   ├── hooks/              # ۱۱ هوک مجزا
    │   ├── dialogs/            # ۱۳ دیالوگ مجزا
    │   ├── services/           # ۵ سرویس مجزا
    │   ├── types/
    │   ├── utils/
    │   └── validators/
    ├── ... (سایر کامپوننت‌ها)
    └── NetworkStatus.tsx
```

### نگاشت ماژول‌ها به App و Tab (Target Mapping)

| ماژول فعلی (moduleId) | App مربوطه | Tab مربوطه | اولویت |
|------------------------|------------|------------|--------|
| `tuts-list`, `tuts-reports`, `tuts-receipts`, `tuts-stats`, `tuts-surveys`, `tuts-vouchers` | `tuts` | `courses`, `reports`, `receipts`, `stats`, `surveys`, `vouchers` | **۱** |
| `profile` | — | به `sign-in` یا shared منتقل شود | ۲ |
| `change-password` | — | به `sign-in` یا shared منتقل شود | ۲ |
| `students` | `crm` | `students` | ۳ |
| `professors` | `crm` | `professors` | ۳ |
| `finance` | `accounting` | `finance` | ۳ |
| `theses`, `theses-scientific`, `theses-permits` | (پیش‌بینی برای App مجزا) | `theses` | ۲ |
| `admin-sessions` | `crm` | `sessions` | ۳ |
| سایر (LegacyModules) | `library` | — | ۴ |

### شناسایی وابستگی‌های اصلی

#### سلسله‌مراتب وابستگی (Dependency Hierarchy)

```
Level 0 (بدون وابستگی — Pure)
├── lib/constants.ts        # ثابت‌های مستقل
├── lib/networkStatus.ts    # pure observer pattern
├── Pagination.tsx           # UI بدون وابستگی
├── ThemeToggle.tsx          # UI بدون وابستگی
├── tuts/utils/formatters.ts # توابع فرمت pure
├── tuts/validators/*        # اعتبارسنجی pure
├── tuts/hooks/usePagination.ts, useStatsFilter.ts

Level 1 (وابسته به Level 0)
├── lib/functions.ts → constants
├── api.ts → constants, functions, types (📛 ۷۶۰ خط)
├── types.ts (📛 ۳۸۰ خط)
├── tuts/tuts-types.ts → types (User)

Level 2 (وابسته به کتابخانه‌های اشتراکی)
├── اکثر کامپوننت‌ها (LoginForm, ProfileModule, ...)
├── اکثر هوک‌های tuts → api, tuts-types, tuts-utils

Level 3 (Orchestrator — وابسته به همه)
├── App.tsx → همه کامپوننت‌ها (📛 ۷۷۰ خط)
├── TutsModule.tsx → همه tuts (📛 ۸۰۰+ خط)
```

#### نقشه وابستگی کامپوننت‌ها (خارج از tuts/)

| کامپوننت | سایز | api | types | lib | کتابخانه خارجی |
|----------|------|-----|-------|-----|----------------|
| LoginForm.tsx | ۱۵۰ | ✅ | ✅ User | ✅ functions | motion, lucide |
| DashboardModule.tsx | ۱۲۰ | ❌ | ✅ User | ✅ constants | motion, lucide |
| ProfileModule.tsx | ۲۰۰+ | ✅ | ✅ User | ❌ | motion, lucide |
| ChangePasswordModule.tsx | ۸۰ | ✅ | ❌ | ❌ | motion, lucide |
| StudentManagement.tsx | ۶۰ | ❌ | ❌ | ❌ | motion, lucide |
| AdminSessionsPanel.tsx | ۱۵۰+ | ✅ | ✅ AdminSession | ❌ | motion, lucide |
| Header.tsx | ۱۵۰+ | ❌ | ✅ User, Tab | ✅ menuConfig | motion, lucide |
| Sidebar.tsx | ۱۵۰+ | ❌ | ✅ Tab | ✅ menuConfig | lucide |
| FinancialManagement.tsx | ۱۵ | ❌ | ❌ | ❌ | (import از tuts) |

#### آمار سایز فایل‌های مهم

| فایل | خطوط | وضعیت |
|------|-------|--------|
| api.ts | ۷۶۰ | 🔴 بزرگ |
| App.tsx | ۷۷۰ | 🔴 بزرگ |
| TutsModule.tsx | ۸۰۰+ | 🔴 بزرگ |
| TutsVouchers.tsx | ۳۰۰+ | 🟡 متوسط |
| types.ts | ۳۸۰ | 🟡 متوسط |
| lib/functions.ts | ۲۸۰ | 🟡 قابل قبول |

#### Map وابستگی‌های داخلی tuts/

```
tuts-types.ts ←────── referenced by EVERY tuts file
     ↑
tuts-utils.ts ─── barrel از utils/
     ├── utils/formatters.ts   (pure, بدون وابستگی)
     ├── utils/mappers.ts      (tuts-types)
     ├── utils/dates.ts        (persian-date)
     │
tuts-hooks.ts ─── barrel از hooks/
     ├── hooks/useToast.ts           (tuts-types)
     ├── hooks/useTutsData.ts        (api, tuts-types, tuts-utils)
     ├── hooks/useCourseCRUD.ts      (api, tuts-types, tuts-utils)
     ├── hooks/useVoucherOps.ts      (tuts-types, tuts-utils, validators)
     ├── hooks/usePreRegistration.ts (tuts-types, tuts-utils)
     ├── hooks/useSurveyOps.ts       (tuts-types)
     ├── hooks/useReceiptOps.ts      (tuts-types)
     ├── hooks/usePagination.ts      (pure)
     ├── hooks/useStatsFilter.ts     (pure)
     ├── hooks/useCertificateOps.ts  (api, tuts-types, tuts-utils, constants)
     ├── hooks/useInstructorManagement.ts (api)
     │
services/  ←── all: api + tuts-types + tuts-utils
validators/ ←── all: tuts-types (pure)
```

#### استفاده از کتابخانه‌های خارجی

| کتابخانه | کجا استفاده شده |
|----------|-----------------|
| **lucide-react** | تمام فایل‌های پروژه |
| **motion/react** | اکثر کامپوننت‌ها (بجز Pagination, ThemeToggle, NetworkStatus) |
| **recharts** | فقط TutsStats.tsx |
| **react-pdf** | TutsModule.tsx, CertificatePreviewDialog.tsx |
| **react-multi-date-picker** | JalaliDatepicker.tsx |
| **persian-date** | tuts/utils/dates.ts |

#### ریسک‌ها و نکات مهم

1. **api.ts (۷۶۰ خط)** — بزرگترین فایل، ترکیبی از احراز هویت + دوره‌ها + نظرسنجی‌ها + بن‌ها + sessions + گواهی‌ها + اساتید
2. **App.tsx (۷۷۰ خط)** — ۱۲+ ماژول در switch-case رندر می‌شود
3. **توابع تکراری** — `lib/functions.ts` دارای `normalizePersianText`، `tuts/utils/formatters.ts` دارای `normalizePersian` (عملاً یکسان)
4. **FinancialManagement.tsx** — از `./tuts/TutsVouchers` import می‌کند (پل بین دو domain)
5. **react-pdf worker** — `pdfjs.GlobalWorkerOptions.workerSrc` به صورت side-effect در TutsModule.tsx اجرا می‌شود

#### خلاصه مرزهای App

| App | کامپوننت‌ها |
|-----|------------|
| **tuts** | `components/tuts/*` + `TutsModule.tsx` + `FinancialManagement.tsx` (bridges tuts) |
| **crm** | `StudentManagement`, `ProfessorManagement`, `AdminSessionsPanel` |
| **accounting** | `FinancialManagement` (در صورت جداسازی از tuts) |
| **library** | `LegacyModules` (iframe) |
| **auth** | `LoginForm`, `ProfileModule`, `ChangePasswordModule` |
| **core (در App)** | `Header`, `Sidebar`, `TabsBar`, `Footer`, `DashboardModule`, `FloatingPanels` |

---

## مرحله ۲: ایجاد پوشه‌های `shared-*` و انتقال کدهای اشتراکی

### ساختار هدف

```
src/
├── shared-api/
│   ├── index.ts                # barrel export
│   └── api.ts                  # ApiService اصلی از api.ts فعلی
├── shared-types/
│   ├── index.ts                # barrel export
│   └── index.ts                # types.ts فعلی
├── shared-constants/
│   ├── index.ts                # barrel export
│   └── index.ts                # constants.ts فعلی
├── shared-utils/
│   ├── index.ts                # barrel export
│   ├── functions.ts            # functions.ts فعلی
│   └── networkStatus.ts        # networkStatus.ts فعلی
├── shared-components/
│   ├── index.ts                # barrel export
│   ├── Footer.tsx
│   ├── NetworkStatus.tsx
│   ├── ThemeToggle.tsx
│   └── Pagination.tsx
├── shared-hooks/
│   └── index.ts
├── shared-dialogs/
│   └── index.ts
├── shared-services/
│   └── index.ts
├── shared-validators/
│   └── index.ts
├── shared-assets/
│   └── index.ts
```

### اقدامات

1. **ایجاد `shared-constants`**:
   - انتقال `lib/constants.ts` به `shared-constants/index.ts`
   - به‌روزرسانی تمام import ها از `@/src/lib/constants` به `@/src/shared-constants`

2. **ایجاد `shared-utils`**:
   - انتقال `lib/functions.ts` به `shared-utils/functions.ts`
   - انتقال `lib/networkStatus.ts` به `shared-utils/networkStatus.ts`
   - ایجاد barrel export در `shared-utils/index.ts`

3. **ایجاد `shared-types`**:
   - انتقال `types.ts` به `shared-types/index.ts`
   - به‌روزرسانی تمام import ها

4. **ایجاد `shared-api`**:
   - انتقال `api.ts` به `shared-api/api.ts`
   - ایجاد `shared-api/index.ts` با barrel export

5. **ایجاد `shared-components`**:
   - انتقال کامپوننت‌های عمومی: `Footer`, `NetworkStatus`, `ThemeToggle`, `Pagination`
   - کامپوننت‌های UI مانند `ToastNotification`, `LoadingSpinner` در `tuts/` اگر عمومی شدند

6. **ایجاد `shared-hooks`**:
   - اگر هوکی بین چند App مشترک است (مثلاً `useToast`)

7. **ایجاد `shared-assets`**:
   - انتقال assets عمومی (اگر وجود دارد)

### نکات مهم

- از **barrel export** (فایل `index.ts`) برای هر پوشه استفاده شود
- مسیرهای import با alias `@/` کار می‌کنند (مثلاً `@/src/shared-constants`)
- تمام import های قدیمی باید همزمان با انتقال، به‌روزرسانی شوند

---

## مرحله ۳: ایجاد ساختار `apps/` و App های اصلی

### ساختار هدف

```
src/
├── apps/
│   ├── index.tsx               # تجمیع Route های تمام App ها
│   ├── tuts/
│   │   ├── index.tsx           # کامپوننت TutsApp (Lazy Load)
│   │   ├── routes.tsx          # Route های tuts
│   │   ├── shared/             # اشتراکی بین Tab های tuts
│   │   │   ├── components/
│   │   │   ├── dialogs/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   ├── types/
│   │   │   └── validators/
│   │   ├── courses/            # Tab: مدیریت دوره‌ها
│   │   │   ├── index.tsx
│   │   │   ├── routes.tsx
│   │   │   ├── components/
│   │   │   ├── dialogs/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   ├── utils/
│   │   │   ├── types/
│   │   │   └── validators/
│   │   ├── vouchers/           # Tab: بن‌های تخفیف
│   │   │   ├── index.tsx
│   │   │   ├── routes.tsx
│   │   │   └── ...
│   │   ├── surveys/            # Tab: نظرسنجی‌ها
│   │   ├── reports/            # Tab: گزارش‌ها
│   │   ├── receipts/           # Tab: فیش‌های بانکی
│   │   ├── stats/              # Tab: آمار و نمودار
│   │   └── theses/             # Tab: پایان‌نامه‌ها
│   ├── accounting/
│   │   ├── index.tsx
│   │   ├── routes.tsx
│   │   └── finance/
│   │       ├── index.tsx
│   │       ├── routes.tsx
│   │       └── ...
│   ├── crm/
│   │   ├── index.tsx
│   │   ├── routes.tsx
│   │   ├── students/
│   │   ├── professors/
│   │   └── sessions/
│   └── library/
│       ├── index.tsx
│       ├── routes.tsx
│       └── legacy/             # LegacyModules (Iframe)
```

### قوانین ساختار App

1. هر App دارای `index.tsx` (کامپوننت اصلی) و `routes.tsx` (تعریف Route ها) است
2. `routes.tsx` فقط Route های مربوط به همان App را تعریف می‌کند
3. هر Tab داخل App نیز `index.tsx` و `routes.tsx` دارد
4. Route های Tab در `routes.tsx` همان Tab تعریف می‌شوند
5. کد اشتراکی بین Tab های یک App در `apps/{app}/shared/` قرار می‌گیرد

---

## مرحله ۴: استخراج `tuts` به عنوان اولین App

### شرح

ماژول `TutsModule` (دوره‌های آموزشی) بزرگترین بخش پروژه است و بهترین گزینه برای اولین استخراج به عنوان یک App مستقل است.

### اقدامات

1. **ایجاد `apps/tuts/`** با ساختار:
   - `index.tsx` — کامپوننت اصلی (Lazy Load)
   - `routes.tsx` — تعریف Route ها

2. **انتقال `components/tuts/` به `apps/tuts/shared/`**:
   - `tuts-types.ts` → `shared/types/course.ts`
   - `tuts-utils.ts` → `shared/utils/`
   - `tuts-hooks.ts` (barrel) + `hooks/*` → `shared/hooks/`
   - `tuts-components.tsx` → `shared/components/`
   - `dialogs/*` → `shared/dialogs/`
   - `services/*` → `shared/services/`
   - `validators/*` → `shared/validators/`
   - `utils/*` → `shared/utils/`
   - `ToastNotification.tsx` → `shared/components/`
   - `CourseFilterBar.tsx` → `shared/components/`
   - `CourseCard.tsx` → `shared/components/`

3. **انتقال محتوای `TutsModule.tsx` به Tab های مربوطه**:

   Tab `courses` (از TutsModule ماژول‌های):
   - منطق CRUD دوره → `courses/hooks/useCourseCRUD.ts`
   - لیست دوره‌ها → `courses/components/CourseList.tsx`
   - دیالوگ‌های مربوط به دوره → `courses/dialogs/`

   Tab `vouchers`:
   - منطق بن‌ها → `vouchers/hooks/useVoucherOps.ts`
   - کامپوننت بن‌ها → `vouchers/components/`

   Tab `surveys`:
   - منطق نظرسنجی → `surveys/hooks/useSurveyOps.ts`

   Tab `reports`:
   - گزارش ثبت‌نام‌ها → `reports/`

   Tab `receipts`:
   - بررسی فیش‌ها → `receipts/`

   Tab `stats`:
   - آمار و نمودار → `stats/`

4. **ایجاد `tuts/routes.tsx`** با استفاده از **Tab-based routing patterns**:

```tsx
// مثال از tuts/routes.tsx
import { lazy } from 'react';

const CoursesTab = lazy(() => import('./courses'));
const VouchersTab = lazy(() => import('./vouchers'));
const SurveysTab = lazy(() => import('./surveys'));

export const tutsRoutes = {
  'tuts-list': CoursesTab,
  'tuts-vouchers': VouchersTab,
  'tuts-surveys': SurveysTab,
  // ... سایر Route ها
};
```

### Route Definition Pattern

از آنجایی که پروژه از `react-router` استفاده نمی‌کند و سیستم Tab-محور دارد، `routes.tsx` می‌تواند یک **Route Registry** باشد:

```tsx
// apps/tuts/routes.tsx
import type { ComponentType, LazyExoticComponent } from 'react';

export interface RouteDefinition {
  path: string;        // moduleId
  component: LazyExoticComponent<ComponentType<any>>;
  title: string;
  icon?: string;
}

export const tutsRoutes: RouteDefinition[] = [
  {
    path: 'tuts-list',
    component: lazy(() => import('./courses')),
    title: 'مدیریت دوره‌ها',
    icon: 'GraduationCap',
  },
  {
    path: 'tuts-vouchers',
    component: lazy(() => import('./vouchers')),
    title: 'بن‌های تخفیف',
    icon: 'Ticket',
  },
  // ...
];
```

---

## مرحله ۵: استخراج Tab های درون `tuts`

### ساختار هر Tab

هر Tab درون `tuts` باید **Self-Contained** باشد:

```
courses/
├── index.tsx              # کامپوننت اصلی (Lazy Load)
├── routes.tsx             # (اختیاری) زیرمسیرهای Tab
├── components/
│   ├── CourseList.tsx
│   ├── CourseCard.tsx
│   ├── CourseFilterBar.tsx
│   └── index.ts
├── dialogs/
│   ├── NewCourseDialog.tsx
│   ├── EditCourseDialog.tsx
│   ├── CourseDetailDialog.tsx
│   ├── DeleteCourseDialog.tsx
│   └── index.ts
├── hooks/
│   ├── useCourseList.ts
│   ├── useCourseFilter.ts
│   └── index.ts
├── api/                   # API calls مختص courses
│   ├── courseApi.ts
│   └── index.ts
├── services/              # منطق تجاری مختص courses
│   ├── courseService.ts
│   └── index.ts
├── types/
│   ├── course.ts
│   └── index.ts
├── utils/
│   ├── courseUtils.ts
│   └── index.ts
├── validators/
│   ├── courseValidator.ts
│   └── index.ts
└── constants/
    ├── courseConstants.ts
    └── index.ts
```

### قانون توزیع کد

| کد | مقصد | مثال |
|----|------|------|
| فقط در یک Tab استفاده می‌شود | داخل همان Tab | کامپوننت اختصاصی |
| در چند Tab از یک App استفاده می‌شود | `apps/{app}/shared/` | `CourseCard`, `CourseFilterBar` |
| در چند App استفاده می‌شود | `shared-*` سطح بالاتر | `ToastNotification`, `Pagination` |

---

## مرحله ۶: استخراج `accounting` (مالی)

### اقدامات

1. ایجاد `apps/accounting/` با ساختار:
   - `index.tsx`
   - `routes.tsx`

2. انتقال `FinancialManagement.tsx` به `apps/accounting/finance/`:
   - `finance/index.tsx`
   - `finance/components/`
   - `finance/dialogs/`
   - `finance/hooks/`

3. در `routes.tsx` تعریف شود:
   - `finance` → `./finance`

---

## مرحله ۷: استخراج `crm` (دانشجویان، اساتید)

### اقدامات

1. ایجاد `apps/crm/` با ساختار:
   - `index.tsx`
   - `routes.tsx`

2. انتقال کامپوننت‌ها:
   - `StudentManagement.tsx` → `crm/students/`
   - `ProfessorManagement.tsx` → `crm/professors/`
   - `AdminSessionsPanel.tsx` → `crm/sessions/`

3. در `routes.tsx` تعریف شود:
   - `students` → `./students`
   - `professors` → `./professors`
   - `admin-sessions` → `./sessions`

---

## مرحله ۸: استخراج `library` و سایر Apps

### اقدامات

1. ایجاد `apps/library/` برای ماژول‌های قدیمی (Iframe)
   - انتقال `LegacyModules.tsx`
   - این App می‌تواند تمام moduleId های متفرقه را مدیریت کند

2. ایجاد `apps/auth/` (یا در `sign-in/`) برای:
   - `LoginForm.tsx`
   - `ProfileModule.tsx`
   - `ChangePasswordModule.tsx`

---

## مرحله ۹: ایجاد `apps/index.tsx` و تجمیع Route ها

### ساختار

```tsx
// apps/index.tsx
import { lazy } from 'react';

export const AppRoutes = {
  tuts: lazy(() => import('./tuts')),
  accounting: lazy(() => import('./accounting')),
  crm: lazy(() => import('./crm')),
  library: lazy(() => import('./library')),
};

// یا به صورت مسیریابی ماژولار:
export const moduleToAppMap: Record<string, string> = {
  'tuts-list': 'tuts',
  'tuts-vouchers': 'tuts',
  'tuts-surveys': 'tuts',
  'tuts-reports': 'tuts',
  'tuts-receipts': 'tuts',
  'tuts-stats': 'tuts',
  'theses': 'tuts',
  'students': 'crm',
  'professors': 'crm',
  'admin-sessions': 'crm',
  'finance': 'accounting',
  // Legacy modules → library
};

// مسیریاب نهایی
export function resolveAppModule(moduleId: string) {
  const appName = moduleToAppMap[moduleId] || 'library';
  return { appName, moduleId };
}
```

---

## مرحله ۱۰: بازنویسی `App.tsx` به نازک (Thin App)

### App.tsx جدید

پس از استخراج، `App.tsx` باید **فقط** مسئولیت‌های زیر را داشته باشد:

1. **احراز هویت** (Login/Logout)
2. **مدیریت تم** (Theme)
3. **مدیریت تب‌ها** (Tab Management)
4. **Standby/Auto-lock**
5. **Session Warning**
6. **مسیریابی به App های مربوطه**

### ساختار جدید

```tsx
// App.tsx — Thin Version
export default function App() {
  // Core State
  const [viewState, setViewState] = useState<'login' | 'authenticated'>('login');
  const [theme, setTheme] = useState<'light' | 'dark'>(...);
  const [user, setUser] = useState<UserType | null>(null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // ... (حداقل state مورد نیاز)

  // Module Renderer — به جای switch-case بزرگ، از AppRoutes استفاده می‌کند
  const renderModuleForTab = (tabId: string | null) => {
    if (!tabId) return <DashboardModule ... />;

    const { appName, moduleId } = resolveAppModule(moduleType);
    const AppComponent = AppRoutes[appName as keyof typeof AppRoutes];

    return (
      <Suspense fallback={<LoadingFallback />}>
        <AppComponent
          moduleId={moduleId}
          user={user}
          onOpenTab={handleOpenTab}
        />
      </Suspense>
    );
  };

  // ... (UI layout)
}
```

### انتقال state های تخصصی

| State فعلی در App.tsx | مقصد جدید |
|-----------------------|-----------|
| کلیه state های TutsModule | به `apps/tuts/` منتقل شود |
| pinnedMenus, allMenuItems | در App.tsx بماند (Dashboard نیاز دارد) |
| navItems, menuCategories | در App.tsx بماند (Header, Sidebar نیاز دارند) |
| notifications | در App.tsx بماند یا به shared-hooks منتقل شود |

---

## مرحله ۱۱: افزودن Lazy Loading و Dynamic Import

### Lazy Loading برای هر Tab

```tsx
// apps/tuts/index.tsx
import { Suspense, lazy } from 'react';
import type { TutsAppProps } from './shared/types';

const CoursesTab = lazy(() => import('./courses'));
const VouchersTab = lazy(() => import('./vouchers'));
const SurveysTab = lazy(() => import('./surveys'));
// ...

export default function TutsApp({ moduleId, ...props }: TutsAppProps) {
  const tabMap: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
    'tuts-list': CoursesTab,
    'tuts-vouchers': VouchersTab,
    'tuts-surveys': SurveysTab,
    'tuts-reports': ReportsTab,
    'tuts-receipts': ReceiptsTab,
    'tuts-stats': StatsTab,
  };

  const TabComponent = tabMap[moduleId] || CoursesTab;

  return (
    <Suspense fallback={<div className="...">در حال بارگذاری...</div>}>
      <TabComponent {...props} />
    </Suspense>
  );
}
```

### Code Splitting

هر `lazy()` یک **Chunk مجزا** در build نهایی ایجاد می‌کند. با این روش:

- فایل `TutsModule.tsx` (۲۱۰۰+ خط) → به ۶-۷ chunk مجزا تبدیل می‌شود
- کاربر فقط chunk مربوط به Tab فعال را دانلود می‌کند
- کاهش حجم bundle اولیه

---

## مرحله ۱۲: پاک‌سازی فایل‌های قدیمی و تست نهایی

### فایل‌های قابل حذف

پس از اتمام Refactor، فایل‌های زیر قابل حذف هستند:

- `src/api.ts` ← به `shared-api/api.ts` منتقل شده
- `src/types.ts` ← به `shared-types/index.ts` منتقل شده
- `src/lib/constants.ts` ← به `shared-constants/index.ts` منتقل شده
- `src/lib/functions.ts` ← به `shared-utils/functions.ts` منتقل شده
- `src/lib/networkStatus.ts` ← به `shared-utils/networkStatus.ts` منتقل شده
- `src/lib/menuConfig.ts` ← کد split شود (types به shared-types، منطق به shared-utils)
- `src/components/tuts/TutsModals.tsx` ← قبلاً منسوخ شده
- `src/components/TutsModule.tsx` ← با `apps/tuts/` جایگزین شده
- سایر کامپوننت‌های flat که به Apps منتقل شده‌اند

### تست نهایی

1. **تست کامپایل**: `npx tsc --noEmit` — بدون خطا
2. **تست build**: `npm run build` — موفق
3. **تست باز کردن Tab های مختلف**: همه Tab ها باید正常工作 کنند
4. **تست Lazy Loading**: بررسی Network Tab برای اطمینان از Code Splitting
5. **تست احراز هویت**: ورود، خروج، تغییر نقش
6. **تست حالت‌های خاص**: Standby، Session Warning، Tab Limit

---

## نکات کلیدی و راهنمایی‌ها

### Barrel Export

برای هر پوشه یک `index.ts` ایجاد شود که همه موارد را Export کند:

```tsx
// shared-components/index.ts
export { default as Footer } from './Footer';
export { default as NetworkStatus } from './NetworkStatus';
export { default as ThemeToggle } from './ThemeToggle';
export { default as Pagination } from './Pagination';
```

### مسیردهی Import

از alias `@/` استفاده شود:

```tsx
// قبلی
import api from '@/src/api';
import { THEME_STRING } from '@/src/lib/constants';

// جدید
import api from '@/src/shared-api';
import { THEME_STRING } from '@/src/shared-constants';
```

### Dynamic Route Resolution

سیستم فعلی Tab-based از `moduleId` برای تعیین محتوا استفاده می‌کند. در ساختار جدید:

1. `App.tsx` ماژول `moduleId` را به `appName` نگاشت می‌کند
2. `apps/{app}/index.tsx` ماژول `moduleId` را به `Tab` نگاشت می‌کند
3. هر `Tab` به صورت Lazy Load شده و کاملاً Self-Contained است

### ترتیب پیشنهادی اجرا

برای کاهش ریسک، ترتیب زیر پیشنهاد می‌شود:

1. **ایجاد shared-* اول**: چون هیچ وابستگی به App ها ندارند و import ها را اصلاح می‌کنند
2. **استخراج tuts**: چون بزرگترین و پیچیده‌ترین App است
3. **استخراج سایر Apps**: به ترتیب سادگی
4. **نازک‌سازی App.tsx**: در انتها، وقتی همه App ها آماده باشند
5. **Lazy Loading**: آخرین مرحله، چون نیاز به تست کامل دارد

### ریسک‌ها و راهکارها

| ریسک | راهکار |
|------|--------|
| شکستن import ها | پس از هر دسته تغییر، `npx tsc --noEmit` اجرا شود |
| از دست دادن state در Tab ها | هر Tab state خود را مدیریت کند (useState داخلی) |
| افزایش حجم bundle اولیه | Lazy Loading + Code Splitting در مرحله ۱۱ |
| عدم تطابق مسیرها | تست دستی تمام Tab ها پس از هر مرحله |
| وابستگی‌های مخفی | از ابزارهای آنالیز وابستگی استفاده شود |

---

## ساختار نهایی (پس از اتمام Refactor)

```
src/
├── main.tsx
├── index.css
├── App.tsx                          # Thin App (فقط Core Logic)
├── vite-env.d.ts
├── apps/
│   ├── index.tsx                    # AppRoutes, moduleToAppMap, resolveAppModule
│   ├── tuts/
│   │   ├── index.tsx                # Lazy Load + Tab Router
│   │   ├── routes.tsx               # Route Registry
│   │   ├── shared/                  # مشترک بین Tab های tuts
│   │   │   ├── components/
│   │   │   ├── dialogs/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── validators/
│   │   ├── courses/
│   │   │   ├── index.tsx
│   │   │   ├── routes.tsx
│   │   │   ├── components/
│   │   │   ├── dialogs/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   ├── utils/
│   │   │   ├── types/
│   │   │   └── validators/
│   │   ├── vouchers/
│   │   ├── surveys/
│   │   ├── reports/
│   │   ├── receipts/
│   │   ├── stats/
│   │   └── theses/
│   ├── accounting/
│   │   ├── index.tsx
│   │   ├── routes.tsx
│   │   └── finance/
│   ├── crm/
│   │   ├── index.tsx
│   │   ├── routes.tsx
│   │   ├── students/
│   │   ├── professors/
│   │   └── sessions/
│   └── library/
│       ├── index.tsx
│       ├── routes.tsx
│       └── legacy/
├── pages/
│   └── Dashboard.tsx                 # DashboardModule
├── shared-components/
│   ├── index.ts
│   ├── Footer.tsx
│   ├── NetworkStatus.tsx
│   ├── ThemeToggle.tsx
│   ├── Pagination.tsx
│   └── ToastNotification.tsx
├── shared-hooks/
│   └── index.ts
├── shared-dialogs/
│   └── index.ts
├── shared-api/
│   ├── index.ts
│   └── api.ts
├── shared-services/
│   └── index.ts
├── shared-utils/
│   ├── index.ts
│   ├── functions.ts
│   └── networkStatus.ts
├── shared-types/
│   ├── index.ts
│   └── index.ts                     # types.ts قبلی
├── shared-constants/
│   ├── index.ts
│   └── index.ts                     # constants.ts قبلی
├── configs/
│   └── vite.config.ts               # (اختیاری) تنظیمات
├── theme-layouts/
│   └── (کامپوننت‌های Layout)
└── sign-in/
    ├── LoginForm.tsx
    ├── ProfileModule.tsx
    └── ChangePasswordModule.tsx
```

---

## جمع‌بندی

| معیار | قبل از Refactor | بعد از Refactor |
|-------|----------------|-----------------|
| **App.tsx** | ~۸۵۰ خط (منولوتیک) | ~۳۰۰ خط (نازک) |
| **TutsModule.tsx** | ~۲۱۰۰ خط | حذف (جایگزین با ۶ Tab مجزا) |
| **تعداد فایل‌های src/** | ~۴۰ فایل Flat | ~۱۰۰+ فایل سازماندهی‌شده |
| **Code Splitting** | ❌ یک Bundle | ✅ Lazy Loading برای هر Tab |
| **قابلیت افزودن Tab جدید** | ❌ نیاز به تغییر switch-case در App.tsx | ✅ فقط یک پوشه جدید |
| **Shared Code** | ❌ تکراری یا بی‌سازمان | ✅ سازماندهی شده در shared-* |
| **قابلیت نگهداری** | دشوار (فایل‌های بزرگ) | آسان (فایل‌های کوچک و مجزا) |
