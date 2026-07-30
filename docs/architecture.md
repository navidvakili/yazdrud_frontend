# معماری پروژه پرتال جامع دانشگاهی

## نمای کلی

پروژه **نرم‌افزار یکپارچه مدیریت محتوای نیما** یک سیستم یکپارچه مدیریت امور دانشگاهی است که با معماری **تفکیک‌شده (Decoupled)** طراحی شده است:

- **Portal Backend**: API محض با معماری **لایه‌ای (Layered)** بر پایه **Laravel 11**
- **Portal Frontend**: SPA (Single Page Application) با **React 18 + TypeScript** و معماری **Feature-Based**
- **Terms Frontend**: فرانت‌اند مستقل نمایش قوانین و مقررات (Next.js)

این سند به تشریح معماری **Portal Frontend** می‌پردازد.

---

## ساختار دایرکتوری‌ها (پس از Refactoring)

```
src/
├── main.tsx                        # نقطه ورود برنامه
├── App.tsx                         # کامپوننت اصلی (orchestration)
├── vite-env.d.ts                   # تایپ‌های Vite
│
├── apps/                           # ماژول‌های اپلیکیشن (Feature Modules)
│   ├── index.tsx                   # بارِگذاری Lazy + ModuleRenderer
│   ├── ModuleRenderer.tsx          # رندر شرطی ماژول‌ها بر اساس شناسه
│   │
│   ├── auth/                       # ماژول احراز هویت (ثبت‌نام/ورود)
│   │   └── index.tsx
│   ├── crm/                        # ماژول CRM (دانشجویان + اساتید)
│   │   ├── index.tsx
│   │   ├── StudentManagement.tsx
│   │   └── ProfessorManagement.tsx
│   ├── library/                    # ماژول کتابخانه (پایان‌نامه + ماژول‌های قدیمی)
│   │   ├── index.tsx
│   │   ├── ThesisManagement.tsx
│   │   └── LegacyModules.tsx
│   ├── accounting/                 # ماژول حسابداری
│   │   └── index.tsx
│   └── tuts/                       # ماژول آموزش (Tutorials)
│       └── index.tsx
│
├── login/                          # ماژول ورود و مدیریت نشست
│   ├── index.ts                    # export barrel
│   ├── api.ts                      # API calls مرتبط (loginApi)
│   ├── types.ts                    # تایپ‌های مختص Login
│   ├── LoginForm.tsx               # فرم ورود
│   ├── SessionWarningModal.tsx     # هشدار انقضای نشست
│   ├── ProfileModule.tsx           # پروفایل کاربری
│   ├── ChangePasswordModule.tsx    # تغییر رمز عبور
│   ├── AdminSessionsPanel.tsx      # مدیریت نشست‌های فعال (ادمین)
│   └── useSessionWarning.ts        # hook هشدار نشست
│
├── dashboard/                      # ماژول داشبورد
│   ├── index.ts
│   ├── api.ts
│   └── DashboardModule.tsx
│
├── layouts/                        # مؤلفه‌های چیدمان اصلی
│   ├── index.ts                    # export barrel
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── TabsBar.tsx
│   ├── Footer.tsx
│   ├── FloatingPanels.tsx
│   ├── AuxiliaryTools.tsx
│   ├── ThemeToggle.tsx
│   ├── api.ts                      # API calls مرتبط (layoutsApi)
│   ├── menuConfig.ts               # تنظیمات منو
│   ├── useTheme.ts                 # hook تم‌های تیره/روشن
│   └── useStandby.ts               # hook حالت آماده‌باش
│
├── css/                            # استایل‌های سراسری
│   └── index.css
│
├── shared-api/                     # لایه سازگاری (Compatibility)
│   ├── index.ts
│   └── api.ts                      # بازصادرات loginApi + layoutsApi + dashboardApi
│
├── shared-components/              # کامپوننت‌های اشتراکی
│   ├── index.ts
│   ├── Pagination.tsx
│   ├── LogoutModal.tsx
│   ├── StandbyModal.tsx
│   ├── TabLimitAlert.tsx
│   ├── JalaliDatepicker.tsx
│   ├── ToastNotification.tsx
│   └── NetworkStatus.tsx           # وضعیت اتصال شبکه
│
├── shared-constants/               # ثابت‌های اشتراکی
│   └── index.ts
│
├── shared-types/                   # تایپ‌های اشتراکی
│   └── index.ts
│
└── shared-utils/                   # توابع کاربردی اشتراکی
    ├── index.ts
    ├── functions.ts                # توابع کمکی عمومی
    ├── networkObserver.ts          # مانیتورینگ وضعیت شبکه
    └── formatters.ts               # فرمت‌کننده‌ها (تاریخ، اعداد و ...)
```

---

## دیاگرام جریان داده (Data Flow)

```
User Action
    │
    ▼
┌─────────────────┐
│    Component     │  (login/, dashboard/, apps/*, layouts/)
│   (React FC)     │
└────────┬────────┘
         │  calls
         ▼
┌─────────────────┐
│   custom hook   │  (useSessionWarning, useTheme, useStandby)
│  (logic layer)  │
└────────┬────────┘
         │  uses
         ▼
┌─────────────────┐
│  Api Service    │  (loginApi, layoutsApi, dashboardApi)
│   (fetch/write) │
└────────┬────────┘
         │  HTTP
         ▼
┌─────────────────┐
│  Portal Backend │  (Laravel API)
│   (REST/JSON)   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  MySQL Database │
└─────────────────┘
```

---

## معماری کامپوننت‌ها

### سلسله‌مراتب رندر (Component Tree)

```
<App>
  ├── <ThemeProvider> (داخلی useTheme)
  │   └── <LoginForm />                # در صورت عدم احراز هویت
  │
  ├── <StandbyModal />                 # حالت آماده‌باش (shared-components)
  ├── <SessionWarningModal />          # هشدار نشست (login/)
  │
  └── <AuthenticatedLayout>            # پس از ورود موفق
      ├── <Header>
      │   ├── <ThemeToggle />
      │   ├── <ProfileModule />        (login/)
      │   └── <ChangePasswordModule /> (login/)
      │
      ├── <Sidebar>
      │   └── <AdminSessionsPanel />   (login/, فقط ادمین)
      │
      ├── <TabsBar>
      │   └── تب‌های باز شده
      │
      ├── <ModuleRenderer>             (apps/ModuleRenderer.tsx)
      │   └── Lazy Load:
      │       ├── <CRMModule />
      │       ├── <LibraryModule />
      │       ├── <AuthModule />
      │       ├── <AccountingModule />
      │       ├── <TutsModule />
      │       └── <DashboardModule />
      │
      ├── <AuxiliaryTools />           (layouts/)
      ├── <FloatingPanels />           (layouts/)
      │
      └── <Footer />
```

### جدول ماژول‌ها

| ماژول | مسیر | توضیح |
|-------|------|-------|
| Auth | `apps/auth/` | ثبت‌نام، ورود، فعال‌سازی حساب |
| CRM | `apps/crm/` | مدیریت دانشجویان و اساتید |
| Library | `apps/library/` | پایان‌نامه‌ها، ماژول‌های قدیمی |
| Accounting | `apps/accounting/` | ماژول حسابداری |
| Tuts | `apps/tuts/` | آموزش (Tutorials) |
| Dashboard | `dashboard/` | داشبورد اصلی |
| Login | `login/` | فرم ورود، پروفایل، تغییر رمز، مدیریت نشست |

---

## مدیریت تب‌ها (Tab Management)

برنامه از سیستم تب‌های داینامیک استفاده می‌کند:

1. **TabContext** (داخلی): وضعیت تب‌های باز و تب فعال را مدیریت می‌کند
2. **TabsBar**: نوار تب‌ها را نمایش می‌دهد
3. **TabLimitAlert**: هشدار محدودیت تعداد تب‌ها (بیش از ۱۰ تب)

### جریان باز کردن یک تب

```
کلیک روی آیتم منو در Sidebar
    │
    ▼
فراخوانی openTab(category, moduleId, title)
    │
    ▼
TabContext:
  - بررسی وجود تکراری (duplicate)
  - اگر تکراری → focus روی تب موجود
  - اگر جدید → اضافه به tabList
  - اگر بیش از ۱۰ تب → نمایش TabLimitAlert
    │
    ▼
ModuleRenderer:
  - خواندن تب فعال از context
  - بارگذاری lazy ماژول متناظر
```

---

## احراز هویت (Authentication)

### ماژول Login (`src/login/`)

```
src/login/
├── index.ts                 # export barrel
├── api.ts                   # loginApi — شامل signIn, signOut, revokeSession و ...
├── types.ts                 # تایپ‌های LoginRequest, LoginResponse, User و ...
├── LoginForm.tsx            # فرم ورود با اعتبارسنجی
├── SessionWarningModal.tsx  # هشدار ۵ دقیقه مانده به اتمام نشست
├── ProfileModule.tsx        # نمایش و ویرایش پروفایل
├── ChangePasswordModule.tsx # فرم تغییر رمز عبور
├── AdminSessionsPanel.tsx   # مدیریت نشست‌های کاربران (ادمین)
└── useSessionWarning.ts     # Hook شمردن معکوس زمان نشست
```

### جریان ورود

```
1. کاربر اطلاعات ورود را در LoginForm وارد می‌کند
2. loginApi.signIn() فراخوانی می‌شود
3. در صورت موفقیت:
   - توکن در localStorage ذخیره می‌شود
   - اطلاعات کاربر در state ذخیره می‌شود
   - ریدایرکت به داشبورد
4. در صورت خطا:
   - نمایش پیام خطا (اعتبارسنجی یا سرور)
```

### مدیریت نشست (Session Management)

- **useSessionWarning**: یک hook که با فاصله زمانی مشخص (مثلاً هر ۱ دقیقه) انقضای نشست را چک می‌کند
- **SessionWarningModal**: ۵ دقیقه مانده به اتمام نشست، مودال هشدار نمایش داده می‌شود
- **AdminSessionsPanel**: به مدیران امکان مشاهده و پایان دادن به نشست‌های فعال را می‌دهد

---

## Theme و وضعیت ظاهری

- **useTheme**: Hook برای مدیریت تم تیره/روشن
  - ذخیره‌سازی preference در `localStorage`
  - اعمال کلاس `dark` روی `<html>` برای Tailwind
- **ThemeToggle**: دکمه تغییر تم در هدر

---

## State آماده‌باش (Standby)

- **useStandby**: Hook برای مدیریت حالت آماده‌باش
  - بعد از مدتی عدم فعالیت، برنامه به حالت standby می‌رود
  - **StandbyModal**: مودال قفل شده که رمز عبور مجدد می‌خواهد
  - پس از ورود مجدد، به حالت عادی برمی‌گردد

---

## ساختار API سرویس‌ها

برخلاف معماری قبلی (یک کلاس ApiService با متدهای متعدد)، معماری جدید از **اشیاء API مجزا** (Modular API Objects) استفاده می‌کند:

```typescript
// src/login/api.ts
export const loginApi = {
  signIn: (credentials) => fetch(...),
  signOut: () => fetch(...),
  revokeSession: (sessionId) => fetch(...),
  getProfile: () => fetch(...),
  changePassword: (data) => fetch(...),
  // ...
};

// src/layouts/api.ts
export const layoutsApi = {
  getMenu: () => fetch(...),
  getNotifications: () => fetch(...),
  // ...
};

// src/dashboard/api.ts
export const dashboardApi = {
  getStats: () => fetch(...),
  getRecentActivity: () => fetch(...),
  // ...
};
```

### لایه سازگاری (Compatibility Layer)

مسیر `src/shared-api/` برای سازگاری با کدهای قدیمی که `import { api } from '@/src/shared-api/api'` دارند، باقی مانده است. این فایل‌ها صرفاً اشیاء API جدید را بازصادرات (re-export) می‌کنند.

---

## مانیتورینگ وضعیت شبکه (Network Status)

برای مانیتورینگ اتصال به شبکه از دو بخش مجزا استفاده می‌شود:

1. **`shared-utils/networkObserver.ts`**: منطق خالص مانیتورینگ
   - `networkObserver.reportApiFailure()` / `networkObserver.reportApiSuccess()` — ثبت وضعیت درخواست‌های API
   - رصد تغییرات وضعیت آنلاین/آفلاین مرورگر

2. **`shared-components/NetworkStatus.tsx`**: کامپوننت نمایش وضعیت
   - نمایش وضعیت اتصال در هدر
   - مشاهده خطاهای متوالی و قطعی شبکه

این تفکیک باعث می‌شود منطق مانیتورینگ (util) از نحوه نمایش (component) جدا باشد.

---

## سیستم App System / Modules

### `ModuleRenderer.tsx`

این کامپوننت وظیفه رندر شرطی ماژول‌ها را بر اساس **تب فعال** بر عهده دارد:

```typescript
// نگاشت شناسه ماژول به کامپوننت lazy
const moduleMap: Record<string, React.LazyExoticComponent<React.FC>> = {
  crm: lazy(() => import('@/src/apps/crm')),
  library: lazy(() => import('@/src/apps/library')),
  accounting: lazy(() => import('@/src/apps/accounting')),
  auth: lazy(() => import('@/src/apps/auth')),
  tuts: lazy(() => import('@/src/apps/tuts')),
};
```

### بارگذاری Lazy

تمامی ماژول‌های `apps/*` با `React.lazy()` بارگذاری می‌شوند تا باندل نهایی بهینه شود (Code Splitting) و هر ماژول فقط در صورت نیاز دانلود شود.

---

## ماژول Tuts (Tutorials)

ماژول Tuts در مسیر `src/apps/tuts/` قرار دارد که آموزش‌های ویدئویی و محتوای آموزشی را مدیریت می‌کند. این ماژول به صورت Lazy Load شده و تنها در صورت درخواست کاربر بارگذاری می‌شود.

---

## اجزای اشتراکی (Shared Modules)

### shared-components/
کامپوننت‌های عمومی و قابل استفاده مجدد:
- **Pagination**: صفحه‌بندی
- **LogoutModal**: مودال تأیید خروج
- **StandbyModal**: مودال حالت آماده‌باش
- **TabLimitAlert**: هشدار محدودیت تب
- **JalaliDatepicker**: انتخابگر تاریخ شمسی
- **ToastNotification**: اعلان‌های Toast
- **NetworkStatus**: وضعیت اتصال شبکه

### shared-utils/
توابع کمکی عمومی:
- **functions.ts**: API, APISendFiles, downloadFile, getFileViewUrl, getBrowserFingerprint, toPersianDigits
- **networkObserver.ts**: مانیتورینگ وضعیت اتصال
- **formatters.ts**: فرمت‌دهی اعداد و تاریخ

### shared-constants/
ثابت‌های سراسری برنامه.

### shared-types/
تایپ‌های TypeScript اشتراکی.

---

## ماژول Dashboard

مسیر `src/dashboard/` شامل:
- `api.ts`: API calls مختص داشبورد
- `DashboardModule.tsx`: کامپوننت اصلی داشبورد با ویجت‌های آماری و فعالیت‌های اخیر

---

## فازهای Refactoring

### فاز ۱: ماژول Login
- ایجاد `src/login/` با ۷ فایل
- انتقال `LoginForm`, `SessionWarningModal`, `ProfileModule`, `ChangePasswordModule`, `AdminSessionsPanel`
- استخراج `loginApi` از فایل monolithic `api.ts`

### فاز ۲: Layouts و Shared API
- استخراج `layoutsApi` از فایل monolithic
- ایجاد `src/layouts/api.ts`
- انتقال `useTheme`, `useStandby` به `layouts/`
- انتقال `AuxiliaryTools`, `FloatingPanels` به `layouts/`
- ایجاد لایه سازگاری `shared-api/`

### فاز ۳: انتقال کامپوننت‌ها
- انتقال تمام فایل‌های `src/components/` به ماژول‌های مربوط:
  - کامپوننت‌های عمومی → `shared-components/`
  - ماژول‌های اپلیکیشن → `apps/*/`
  - حذف دایرکتوری `src/components/`

### فاز ۴: استخراج از App.tsx
- **useTheme**: استخراج منطق تم به `layouts/useTheme.ts`
- **useStandby**: استخراج منطق آماده‌باش به `layouts/useStandby.ts`
- **AuxiliaryTools**: استخراج کامپوننت ابزارهای کمکی به `layouts/AuxiliaryTools.tsx`
- **ModuleRenderer**: استخراج رندر ماژول به `apps/ModuleRenderer.tsx`

### فاز ۵: انتقال index.css
- انتقال از `src/index.css` به `src/css/index.css`
- به‌روزرسانی مسیر در `main.tsx`

### فاز ۶: بازسازماندهی NetworkStatus
- انتقال `NetworkStatus.tsx` از `layouts/` به `shared-components/`
- تغییر نام `networkStatus.ts` به `networkObserver.ts` در `shared-utils/` برای جلوگیری از تداخل
- تفکیک منطق مانیتورینگ از کامپوننت نمایش

---

## اصول معماری

1. **Feature-Based**: هر ویژگی (Feature) در دایرکتوری مختص خود با all related files
2. **Lazy Loading**: ماژول‌های اپلیکیشن فقط در صورت نیاز بارگذاری می‌شوند
3. **Separation of Concerns**: تفکیک API calls, Types, Components, Hooks
4. **Shared Modules**: کدهای اشتراکی در بخش‌های مجزا (components, utils, constants, types)
5. **Compatibility Layer**: لایه `shared-api/` برای backward compatibility
6. **Modular API Objects**: اشیاء API مجزا (loginApi, layoutsApi, dashboardApi) به جای کلاس monolithic
7. **Barrel Exports**: هر ماژول دارای `index.ts` برای export متمرکز
8. **Single Responsibility**: هر کامپوننت یک وظیفه مشخص دارد

---

## وابستگی‌های اصلی (Dependencies)

| کتابخانه | کاربرد |
|----------|--------|
| React 18 | فریم‌ورک اصلی |
| TypeScript | تایپ‌سیستم |
| motion/react | انیمیشن‌ها (جانشین framer-motion) |
| lucide-react | آیکون‌ها |
| Tailwind CSS | استایل‌دهی با utility classes |
| Vite | بیلد سیستم |

---

## مسیرهای آینده

- [ ] حذف نهایی `shared-api/` پس از اطمینان از عدم استفاده
- [ ] افزودن unit tests برای ماژول‌ها
- [ ] استخراج `TabContext` به یک ماژول مجزا
- [ ] تکمیل مستندات API در backend
- [ ] مهاجرت تدریجی به React Router (در صورت نیاز)
