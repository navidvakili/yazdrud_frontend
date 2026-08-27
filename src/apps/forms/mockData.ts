import { FormDefinition, FormSubmission, FormTheme } from './types';

export const defaultTheme: FormTheme = {
  primaryColor: '#0d9488', // Teal 600
  backgroundColor: '#f8fafc',
  cardColor: '#ffffff',
  textColor: '#0f172a',
  borderRadius: 'lg',
  fontFamily: 'IRANSans',
  showLogo: true,
  logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=200&q=80'
};

export const sampleForms: FormDefinition[] = [
  {
    id: 'form-101',
    slug: 'form-101',
    title: 'پرسشنامه جامع ارزیابی اساتید و کیفیت آموزش نیمسال اول',
    description: 'نظر سنجی پژوهشی اعضای هیئت علمی و ارزشیابی دانشجویی جهت ارتقای سطح کیفی آموزش عالی',
    type: 'survey',
    status: 'published',
    category: 'آموزشی و پژوهشی',
    tags: ['ارزیابی اساتید', 'دانشجویی', 'نیمسال اول'],
    ownerName: 'معاونت آموزشی دانشگاه',
    version: 2,
    createdAt: '۱۴۰۵/۰۲/۱۰',
    updatedAt: '۱۴۰۵/۰۵/۰۱',
    publishedAt: '۱۴۰۵/۰۵/۰۲',
    viewsCount: 1420,
    submissionsCount: 384,
    avgCompletionTimeSeconds: 180,
    steps: [
      { id: 's1', title: 'اطلاعات عمومی مقطع و دانشکده', order: 1 },
      { id: 's2', title: 'سؤالات تخصصی ارزیابی استاد', order: 2 },
      { id: 's3', title: 'پیشنهادات و جمع‌بندی', order: 3 }
    ],
    fields: [
      {
        id: 'f_role',
        type: 'select',
        label: 'مقطع تحصیلی شما چیست؟',
        placeholder: 'انتخاب کنید...',
        columnWidth: '50%',
        stepId: 's1',
        validation: { required: true },
        options: [
          { id: 'o1', label: 'کارشناسی', value: 'bachelor' },
          { id: 'o2', label: 'کارشناسی ارشد', value: 'master' },
          { id: 'o3', label: 'دکتری تخصصی', value: 'phd' }
        ]
      },
      {
        id: 'f_faculty',
        type: 'cascading',
        label: 'دانشکده و گروه آموزشی',
        placeholder: 'انتخاب دانشکده...',
        columnWidth: '50%',
        stepId: 's1',
        validation: { required: true },
        cascadingData: {
          'دانشکده مهندسی برق و کامپیوتر': ['مهندسی نرم‌افزار', 'هوش مصنوعی', 'مهندسی برق قدرت'],
          'دانشکده علوم پایه': ['ریاضی کاربردی', 'فیزیک حالت جامد', 'شیمی تجزبه'],
          'دانشکده مدیریت و علوم انسانی': ['مدیریت دولتی', 'حقوق بین‌الملل', 'روانشناسی']
        }
      },
      {
        id: 'f_student_id',
        type: 'text',
        label: 'شماره دانشجویی (جهت اعتبارسنجی ثبت‌نام)',
        placeholder: 'مثال: ۴۰۱۲۳۴۵۶',
        columnWidth: '100%',
        stepId: 's1',
        helpText: 'اطلاعات هویتی شما کاملاً محرمانه نگه داشته می‌شود.',
        validation: { required: true, minLength: 8, maxLength: 10 }
      },
      {
        id: 'f_prof_rating',
        type: 'matrix',
        label: 'ماتریس ارزشیابی کیفیت تدریس استاد در طول ترم',
        stepId: 's2',
        validation: { required: true },
        matrixRows: [
          { id: 'r1', label: 'تسلط علمی بر محتوای درس' },
          { id: 'r2', label: 'نظم و انضباط در ورود و خروج به کلاس' },
          { id: 'r3', label: 'پاسخگویی به سوالات و ارائه بازخورد مفید' },
          { id: 'r4', label: 'استفاده از ابزارها و سامانه‌های نوین آموزشی' }
        ],
        matrixCols: [
          { id: 'c1', label: 'عالی', score: 5 },
          { id: 'c2', label: 'خیلی خوب', score: 4 },
          { id: 'c3', label: 'متوسط', score: 3 },
          { id: 'c4', label: 'ضعیف', score: 2 }
        ]
      },
      {
        id: 'f_nps',
        type: 'rating',
        label: 'میزان رضایت کلی شما از روند برگزاری درس (از ۱ تا ۵ ستاره)',
        stepId: 's2',
        columnWidth: '100%',
        validation: { required: true }
      },
      {
        id: 'f_has_complaint',
        type: 'yesno',
        label: 'آیا شکایت یا انتقاد خاصی درباره شیوه ارزیابی ترم دارید؟',
        stepId: 's2',
        columnWidth: '100%'
      },
      {
        id: 'f_complaint_reason',
        type: 'textarea',
        label: 'دلیل و شرح دقیق انتقاد یا پیشنهاد شما',
        placeholder: 'لطفاً جزئیات را شفاف بیان فرمایید...',
        stepId: 's2',
        columnWidth: '100%',
        validation: { minLength: 10 }
      },
      {
        id: 'f_feedback_doc',
        type: 'file',
        label: 'بارگذاری مستندات یا فایل تکمیلی (اختیاری)',
        helpText: 'فرمت‌های مجاز: PDF, JPG (حداکثر ۵ مگابایت)',
        stepId: 's3',
        columnWidth: '100%',
        validation: { allowedExtensions: ['.pdf', '.jpg', '.png'], maxFileSizeMb: 5 }
      }
    ],
    layoutBlocks: [],
    logicRules: [
      {
        id: 'lr_1',
        fieldId: 'f_has_complaint',
        operator: 'equals',
        value: 'yes',
        action: 'show_field',
        targetId: 'f_complaint_reason'
      },
      {
        id: 'lr_2',
        fieldId: 'f_has_complaint',
        operator: 'equals',
        value: 'no',
        action: 'hide_field',
        targetId: 'f_complaint_reason'
      }
    ],
    quizConfig: {
      isQuiz: false,
      showInstantResult: false,
      allowNegativeScore: false,
      randomizeQuestions: false,
      gradeThresholds: []
    },
    theme: defaultTheme,
    settings: {
      allowAnonymous: false,
      limitOnePerUser: true,
      requireAuth: true,
      enableCaptcha: true,
      enableAutoSave: true,
      showProgressBar: true,
      showWelcomeScreen: false,
      customSuccessMessage: 'با تشکر! پاسخ شما با موفقیت در سامانه ارزشیابی دانشگاه ثبت گردید.',
      generateTrackingCode: true,
      trackingCodePrefix: 'EVAL-2026',
      sendEmailNotification: true,
      notificationEmail: 'evaluations@university.ac.ir',
      sendSmsNotification: false
    },
    userAccessRules: [
      {
        id: 'uar_101',
        userName: 'دکتر محمدی',
        userEmail: 'mohammadi@university.ac.ir',
        userRole: 'رئیس کمیته نظارت و ارزشیابی آموزشی',
        department: 'معاونت آموزشی',
        permissions: ['view_stats', 'view_charts', 'export_excel', 'export_pdf', 'create_report', 'print_report'],
        assignedAt: '۱۴۰۵/۰۲/۱۵',
        status: 'active',
        notes: 'دسترسی جهت بررسی کیفیت تدریس اساتید نیمسال اول'
      },
      {
        id: 'uar_102',
        userName: 'مهندس رضایی',
        userEmail: 'rezaei@university.ac.ir',
        userRole: 'کارشناس تحلیلی داده',
        department: 'دفتر آمار و فناوری اطلاعات',
        permissions: ['view_stats', 'view_charts', 'export_excel', 'export_csv', 'view_filtered'],
        assignedAt: '۱۴۰۵/۰۲/۱۶',
        status: 'active'
      }
    ],
    publicResultConfig: {
      enabled: true,
      customSlug: 'faculty-eval-results-2026',
      title: 'گزارش عمومی ارزشیابی اساتید و کیفیت آموزش',
      description: 'آمار تجمیعی و نمودارهای میزان رضایت دانشجویان از کیفیت تدریس اساتید به تفکیک دانشکده‌ها',
      universityBrand: 'دانشگاه جامع صنعتی و علوم پزشکی',
      showLogo: true,
      logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=200&q=80',
      passwordProtected: false,
      anonymizeRespondents: true,
      allowedQuestionIds: ['f_role', 'f_faculty', 'f_prof_rating', 'f_nps'],
      allowedExportTypes: ['pdf', 'excel'],
      chartTypes: ['bar', 'pie', 'summary'],
      autoRefresh: true,
      refreshIntervalSeconds: 30,
      readOnly: true,
      allowEmbed: true,
      viewsCount: 642,
      ipRestrictionsEnabled: false,
      allowedIps: ['192.168.1.*']
    },
    reportViews: [
      {
        id: 'rv_101',
        title: 'گزارش تجمیعی هیئت رئیسه دانشگاه',
        slug: 'board-summary-report',
        selectedQuestionIds: ['f_prof_rating', 'f_nps'],
        displayType: 'dashboard',
        createdAt: '۱۴۰۵/۰۵/۰۵',
        isPublic: true
      }
    ],
    reportAuditLogs: [
      {
        id: 'ral_1',
        accessorName: 'دکتر محمدی',
        accessorRoleOrIp: 'رئیس کمیته ارزشیابی',
        action: 'export_pdf',
        timestamp: '۱۴۰۵/۰۵/۰۸ - ۱۱:۲۰',
        success: true,
        details: 'دریافت خروجی PDF گزارش تحلیلی'
      },
      {
        id: 'ral_2',
        accessorName: 'کاربر ناشناس (لینک عمومی)',
        accessorRoleOrIp: 'IP: 5.120.44.12',
        action: 'view_dashboard',
        timestamp: '۱۴۰۵/۰۵/۰۹ - ۱۶:۴۵',
        success: true
      }
    ],
    auditLogs: [
      { id: 'al1', userName: 'مدیر سامانه', action: 'ایجاد اولیه فرم', timestamp: '۱۴۰۵/۰۲/۱۰ - ۱۰:۳۰' },
      { id: 'al2', userName: 'دکتر علوی (معاونت)', action: 'ویرایش ماتریس سؤالات و انتشار', timestamp: '۱۴۰۵/۰۵/۰۲ - ۱۴:۱۵' }
    ]
  },
  {
    id: 'form-cultural-survey',
    slug: 'form-cultural-survey',
    title: 'نظرسنجی میزان رضایت دانشجویان از خدمات فرهنگی دانشگاه',
    description: 'سنجش دیدگاه‌ها، ارزیابی کیفیت برنامه‌های فرهنگی، هنری، فوق‌برنامه و تسهیلات رفاهی دانشجویان',
    type: 'survey',
    status: 'published',
    category: 'فرهنگی و اجتماعی',
    tags: ['رضایت‌سنجی', 'خدمات فرهنگی', 'دانشجویی', 'معاونت فرهنگی'],
    ownerName: 'معاونت فرهنگی و اجتماعی دانشگاه',
    version: 1,
    createdAt: '۱۴۰۵/۰۳/۰۱',
    updatedAt: '۱۴۰۵/۰۵/۰۶',
    publishedAt: '۱۴۰۵/۰۳/۰۲',
    viewsCount: 3850,
    submissionsCount: 1248,
    avgCompletionTimeSeconds: 150,
    steps: [
      { id: 's1', title: 'ارزیابی کیفیت خدمات و برنامه‌های فرهنگی', order: 1 }
    ],
    fields: [
      {
        id: 'q_cultural_sat',
        type: 'rating',
        label: 'میزان رضایت کلی شما از تنوع و کیفیت برنامه‌های فرهنگی دانشگاه (از ۱ تا ۵)',
        stepId: 's1',
        columnWidth: '100%',
        validation: { required: true }
      },
      {
        id: 'q_service_quality',
        type: 'rating',
        label: 'کیفیت برگزاری اردوها، کانون‌ها و انجمن‌های علمی و دانشجویی',
        stepId: 's1',
        columnWidth: '100%',
        validation: { required: true }
      },
      {
        id: 'q_access_convenience',
        type: 'rating',
        label: 'سهولت دسترسی و اطلاع‌رسانی از رویدادها و خدمات فرهنگی',
        stepId: 's1',
        columnWidth: '100%',
        validation: { required: true }
      },
      {
        id: 'q_faculty_select',
        type: 'select',
        label: 'دانشکده محل تحصیل شما',
        stepId: 's1',
        columnWidth: '50%',
        options: [
          { id: 'f1', label: 'دانشکده مهندسی', value: 'eng' },
          { id: 'f2', label: 'دانشکده علوم پزشکی', value: 'med' },
          { id: 'f3', label: 'دانشکده معماری و هنر', value: 'art' },
          { id: 'f4', label: 'دانشکده علوم انسانی', value: 'hum' }
        ]
      },
      {
        id: 'q_suggestions',
        type: 'textarea',
        label: 'پیشنهادهای سازنده جهت ارتقای خدمات فرهنگی دانشگاه',
        placeholder: 'دیدگاه خود را بنویسید...',
        stepId: 's1',
        columnWidth: '100%'
      }
    ],
    layoutBlocks: [],
    logicRules: [],
    quizConfig: {
      isQuiz: false,
      showInstantResult: false,
      allowNegativeScore: false,
      randomizeQuestions: false,
      gradeThresholds: []
    },
    theme: defaultTheme,
    settings: {
      allowAnonymous: true,
      limitOnePerUser: false,
      requireAuth: false,
      enableCaptcha: true,
      enableAutoSave: true,
      showProgressBar: true,
      showWelcomeScreen: false,
      customSuccessMessage: 'با تشکر از مشارکت شما در نظرسنجی معاونت فرهنگی!',
      generateTrackingCode: true,
      trackingCodePrefix: 'CULT-2026',
      sendEmailNotification: false,
      sendSmsNotification: false
    },
    userAccessRules: [
      {
        id: 'uar_cult_1',
        userName: 'مسئول فرهنگی (جناب آقای حسینی)',
        userEmail: 'cultural_manager@university.ac.ir',
        userRole: 'مسئول فرهنگی دانشگاه',
        department: 'معاونت فرهنگی و اجتماعی',
        permissions: ['view_stats', 'view_charts', 'export_excel', 'export_pdf', 'create_report', 'print_report'],
        assignedAt: '۱۴۰۵/۰۳/۰۲',
        status: 'active',
        notes: 'دسترسی اختصاصی جهت مشاهده آمار و دریافت خروجی‌های مدیریتی نظرسنجی فرهنگی'
      }
    ],
    publicResultConfig: {
      enabled: true,
      customSlug: 'student-cultural-satisfaction',
      title: 'نتایج نظرسنجی میزان رضایت دانشجویان از خدمات فرهنگی دانشگاه',
      description: 'گزارش رسمی و آمار شفاف میزان رضایت، کیفیت خدمات و دسترسی به برنامه‌های فرهنگی - معاونت فرهنگی دانشگاه',
      universityBrand: 'دانشگاه جامع - معاونت فرهنگی و اجتماعی',
      showLogo: true,
      logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?auto=format&fit=crop&w=200&q=80',
      passwordProtected: false,
      anonymizeRespondents: true,
      allowedQuestionIds: ['q_cultural_sat', 'q_service_quality', 'q_access_convenience', 'q_faculty_select'],
      allowedExportTypes: ['pdf', 'excel', 'csv'],
      chartTypes: ['bar', 'pie', 'summary'],
      autoRefresh: true,
      refreshIntervalSeconds: 15,
      readOnly: true,
      allowEmbed: true,
      viewsCount: 2410,
      ipRestrictionsEnabled: false,
      allowedIps: []
    },
    reportViews: [
      {
        id: 'rv_cult_1',
        title: 'داشبورد عمومی رضایت دانشجویان از خدمات فرهنگی',
        slug: 'student-cultural-satisfaction',
        selectedQuestionIds: ['q_cultural_sat', 'q_service_quality', 'q_access_convenience'],
        displayType: 'dashboard',
        createdAt: '۱۴۰۵/۰۳/۰۵',
        isPublic: true
      }
    ],
    reportAuditLogs: [
      {
        id: 'ral_c1',
        accessorName: 'مسئول فرهنگی',
        accessorRoleOrIp: 'کاربر ویژه سامانه',
        action: 'export_excel',
        timestamp: '۱۴۰۵/۰۵/۰۷ - ۰۹:۱۵',
        success: true,
        details: 'دریافت خروجی اکسل نتایج برای جلسه شورای فرهنگی'
      }
    ],
    auditLogs: [
      { id: 'al_c1', userName: 'معاونت فرهنگی', action: 'ایجاد و انتشار نظرسنجی فرهنگی', timestamp: '۱۴۰۵/۰۳/۰۱' }
    ]
  },
  {
    id: 'form-102',
    slug: 'form-102',
    title: 'آزمون آنلاین سنجش اطلاعات آیین‌نامه پژوهشی و گرنت',
    description: 'آزمون خودسنجی پژوهشگران و اعضای هیئت علمی با نمره‌دهی لحظه‌ای و صدور گواهی قبولی',
    type: 'quiz',
    status: 'published',
    category: 'آزمون و ارزیابی',
    tags: ['آزمون آنلاین', 'پژوهش', 'گرنت'],
    ownerName: 'مدیریت امور پژوهشی',
    version: 1,
    createdAt: '۱۴۰۵/۰۳/۱۵',
    updatedAt: '۱۴۰۵/۰۴/۱۰',
    publishedAt: '۱۴۰۵/۰۴/۱۱',
    viewsCount: 890,
    submissionsCount: 215,
    avgCompletionTimeSeconds: 420,
    steps: [{ id: 's1', title: 'سؤالات آزمون آیین‌نامه', order: 1 }],
    fields: [
      {
        id: 'q1',
        type: 'radio',
        label: '۱. سقف حمایت از مقالات چاپ شده در مجلات JCR Q1 چه میزان می‌باشد؟',
        stepId: 's1',
        points: 25,
        correctAnswer: 'a2',
        validation: { required: true },
        options: [
          { id: 'a1', label: '۵۰ میلیون ریال', value: 'a1' },
          { id: 'a2', label: '۲۰۰ میلیون ریال + ضریب تشویق گرنت', value: 'a2', score: 25 },
          { id: 'a3', label: '۱۰۰ میلیون ریال', value: 'a3' },
          { id: 'a4', label: 'بدون سقف مالی', value: 'a4' }
        ]
      },
      {
        id: 'q2',
        type: 'radio',
        label: '۲. مهلت تسویه اعتبار گرنت پژوهشی پایان کدام ماه از سال مالی است؟',
        stepId: 's1',
        points: 25,
        correctAnswer: 'b3',
        validation: { required: true },
        options: [
          { id: 'b1', label: 'پایان آذر ماه', value: 'b1' },
          { id: 'b2', label: 'پایان دی ماه', value: 'b2' },
          { id: 'b3', label: 'پایان بهمن ماه', value: 'b3', score: 25 },
          { id: 'b4', label: 'پایان اسفند ماه', value: 'b4' }
        ]
      },
      {
        id: 'q3',
        type: 'yesno',
        label: '۳. آیا فرصت مطالعاتی صنعتی برای ارتقای مرتبه دانشیاری اجباری است؟',
        stepId: 's1',
        points: 25,
        correctAnswer: 'yes',
        validation: { required: true }
      },
      {
        id: 'q4',
        type: 'select',
        label: '۴. کدام مرجع مسئول تأیید نهایی طرح‌های تحقیقاتی برون‌دانشگاهی است؟',
        stepId: 's1',
        points: 25,
        correctAnswer: 'c1',
        validation: { required: true },
        options: [
          { id: 'c1', label: 'شورای پژوهشی و ارتباط با صنعت دانشگاه', value: 'c1', score: 25 },
          { id: 'c2', label: 'هیئت امنای دانشگاه', value: 'c2' },
          { id: 'c3', label: 'معاونت فرهنگی', value: 'c3' }
        ]
      }
    ],
    layoutBlocks: [],
    logicRules: [],
    quizConfig: {
      isQuiz: true,
      showInstantResult: true,
      timeLimitMinutes: 15,
      allowNegativeScore: false,
      randomizeQuestions: true,
      passScore: 70,
      gradeThresholds: [
        { id: 'g1', minScore: 90, maxScore: 100, gradeLabel: 'عالی (رتبه ممتاز)', feedbackText: 'تسلّط کامل بر آیین‌نامه پژوهشی و گرنت. گواهی ممتاز صادر شد.', color: '#10b981' },
        { id: 'g2', minScore: 70, maxScore: 89, gradeLabel: 'قبول (سطح خوب)', feedbackText: 'حدنصاب قبولی کسب شد. اطلاعات شما کافی است.', color: '#0d9488' },
        { id: 'g3', minScore: 0, maxScore: 69, gradeLabel: 'مردود (نیازمند مطالعه)', feedbackText: 'متأسفانه حدنصاب ۷۰ نمره کسب نشد. لطفاً آیین‌نامه را مجدداً مطالعه فرمایید.', color: '#ef4444' }
      ]
    },
    theme: {
      ...defaultTheme,
      primaryColor: '#6366f1' // Indigo
    },
    settings: {
      allowAnonymous: false,
      limitOnePerUser: true,
      requireAuth: true,
      enableCaptcha: false,
      enableAutoSave: true,
      showProgressBar: true,
      showWelcomeScreen: false,
      customSuccessMessage: 'آزمون شما به پایان رسید. کارنامه رسمی و نمره نهایی در زیر نمایش داده شده است.',
      generateTrackingCode: true,
      trackingCodePrefix: 'QUIZ-2026',
      sendEmailNotification: true,
      notificationEmail: 'research@university.ac.ir',
      sendSmsNotification: true
    },
    auditLogs: [
      { id: 'al3', userName: 'دکتر صابری', action: 'ایجاد آزمون آنلاین و تعریف نمرات', timestamp: '۱۴۰۵/۰۳/۱۵ - ۰۹:۰۰' }
    ]
  },
  {
    id: 'form-103',
    slug: 'form-103',
    title: 'فرم ثبت‌نام همایش ملی هوش مصنوعی و تحلیل داده‌های دانشگاهی',
    description: 'دریافت مقاله، محاسبه خودکار هزینه ثبت‌نام، انتخاب کارگاه آموزشی و صدور رسید دیجیتال',
    type: 'registration',
    status: 'published',
    category: 'همایش‌ها و رویدادها',
    tags: ['ثبت‌نام', 'هوش مصنوعی', 'همایش'],
    ownerName: 'دبیرخانه همایش ملی',
    version: 1,
    createdAt: '۱۴۰۵/۰۴/۰۱',
    updatedAt: '۱۴۰۵/۰۴/۰۵',
    publishedAt: '۱۴۰۵/۰۴/۰۶',
    viewsCount: 2310,
    submissionsCount: 512,
    avgCompletionTimeSeconds: 240,
    steps: [
      { id: 's1', title: 'اطلاعات فردی و هویتی', order: 1 },
      { id: 's2', title: 'انتخاب نوع حضور و کارگاه‌ها', order: 2 },
      { id: 's3', title: 'محاسبه هزینه و ارسال مدارک', order: 3 }
    ],
    fields: [
      {
        id: 'f_fullname',
        type: 'text',
        label: 'نام و نام خانوادگی کامل',
        placeholder: 'مثال: دانیال محمدی',
        stepId: 's1',
        columnWidth: '50%',
        validation: { required: true }
      },
      {
        id: 'f_email',
        type: 'email',
        label: 'پست الکترونیکی (ایمیل)',
        placeholder: 'example@domain.com',
        stepId: 's1',
        columnWidth: '50%',
        validation: { required: true }
      },
      {
        id: 'f_mobile',
        type: 'phone',
        label: 'شماره تلفن همراه',
        placeholder: '۰۹۱۲۳۴۵۶۷۸۹',
        stepId: 's1',
        columnWidth: '50%',
        validation: { required: true }
      },
      {
        id: 'f_affil',
        type: 'text',
        label: 'دانشگاه / موسسه محل خدمت',
        placeholder: 'مثال: دانشگاه تهران',
        stepId: 's1',
        columnWidth: '50%',
        validation: { required: true }
      },
      {
        id: 'f_attend_type',
        type: 'select',
        label: 'نوع شرکت در همایش',
        stepId: 's2',
        columnWidth: '50%',
        validation: { required: true },
        options: [
          { id: 'at1', label: 'دانشجویی (با تخفیف ویژه) - ۳۰۰,۰۰۰ تومان', value: '300000' },
          { id: 'at2', label: 'استاد / عضو هیئت علمی - ۵۰۰,۰۰۰ تومان', value: '500000' },
          { id: 'at3', label: 'شرکت در همایش آزاد - ۷۰۰,۰۰۰ تومان', value: '700000' }
        ]
      },
      {
        id: 'f_workshops',
        type: 'multiselect',
        label: 'انتخاب کارگاه‌های جانبی (هر کارگاه ۱۵۰,۰۰۰ تومان)',
        stepId: 's2',
        columnWidth: '50%',
        options: [
          { id: 'ws1', label: 'کارگاه پردازش زبان طبیعی فارسی (NLP)', value: '150000' },
          { id: 'ws2', label: 'کارگاه بینایی ماشین و مدل‌های انتشار', value: '150000' },
          { id: 'ws3', label: 'کارگاه داده‌کاوی آموزشی و یادگیری عمیق', value: '150000' }
        ]
      },
      {
        id: 'f_has_paper',
        type: 'switch',
        label: 'آیا متقاضی ارائه مقاله در همایش هستید؟',
        stepId: 's3',
        columnWidth: '100%'
      },
      {
        id: 'f_paper_file',
        type: 'file',
        label: 'بارگذاری فایل کامل مقاله (PDF یا DOCX)',
        stepId: 's3',
        columnWidth: '100%',
        validation: { allowedExtensions: ['.pdf', '.docx', '.doc'], maxFileSizeMb: 10 }
      },
      {
        id: 'f_sig',
        type: 'signature',
        label: 'امضای الکترونیکی و تعهد صحت اطلاعات',
        stepId: 's3',
        columnWidth: '100%',
        validation: { required: true }
      }
    ],
    layoutBlocks: [],
    logicRules: [
      {
        id: 'lr_p1',
        fieldId: 'f_has_paper',
        operator: 'equals',
        value: true,
        action: 'show_field',
        targetId: 'f_paper_file'
      },
      {
        id: 'lr_p2',
        fieldId: 'f_has_paper',
        operator: 'equals',
        value: false,
        action: 'hide_field',
        targetId: 'f_paper_file'
      }
    ],
    quizConfig: { isQuiz: false, showInstantResult: false, allowNegativeScore: false, randomizeQuestions: false, gradeThresholds: [] },
    theme: {
      ...defaultTheme,
      primaryColor: '#059669' // Emerald
    },
    settings: {
      allowAnonymous: false,
      limitOnePerUser: true,
      requireAuth: false,
      enableCaptcha: true,
      enableAutoSave: true,
      showProgressBar: true,
      showWelcomeScreen: false,
      customSuccessMessage: 'ثبت‌نام شما در همایش با موفقیت ثبت گردید. کد پیگیری و رسید پرداخت صادر شد.',
      generateTrackingCode: true,
      trackingCodePrefix: 'CONF-2026',
      sendEmailNotification: true,
      notificationEmail: 'conf@university.ac.ir',
      sendSmsNotification: true
    },
    auditLogs: [
      { id: 'al4', userName: 'دبیر اجرایی', action: 'ایجاد فرم ثبت‌نام همایش', timestamp: '۱۴۰۵/۰۴/۰۱ - ۰۸:۳۰' }
    ]
  }
];

export const sampleSubmissions: FormSubmission[] = [
  {
    id: 'sub-001',
    formId: 'form-101',
    trackingCode: 'EVAL-2026-881234',
    respondentName: 'علیرضا حسینی',
    respondentEmail: 'a.hosseini@student.ac.ir',
    respondentRole: 'دانشجو',
    submittedAt: '۱۴۰۵/۰۵/۰۵ - ۱۱:۳۰',
    status: 'approved',
    answers: {
      f_role: 'bachelor',
      f_student_id: '401123456',
      f_prof_rating: {
        r1: 'c1',
        r2: 'c2',
        r3: 'c1',
        r4: 'c2'
      },
      f_nps: 5,
      f_has_complaint: 'no'
    },
    ipAddress: '194.225.12.44',
    completionTimeSeconds: 165,
    sentimentAnalysis: 'positive',
    internalNotes: 'پاسخ کاملاً معتبر و مورد تأیید است.'
  },
  {
    id: 'sub-002',
    formId: 'form-101',
    trackingCode: 'EVAL-2026-992311',
    respondentName: 'سارا کریمی',
    respondentEmail: 's.karimi@student.ac.ir',
    respondentRole: 'دانشجو',
    submittedAt: '۱۴۰۵/۰۵/۰۶ - ۰۹:۱۵',
    status: 'under_review',
    answers: {
      f_role: 'master',
      f_student_id: '400987654',
      f_prof_rating: {
        r1: 'c3',
        r2: 'c4',
        r3: 'c3',
        r4: 'c4'
      },
      f_nps: 2,
      f_has_complaint: 'yes',
      f_complaint_reason: 'تأخیر متوالی در شروع کلاس‌ها و عدم ارائه اسلایدهای تدریس در سامانه ریفا.'
    },
    ipAddress: '5.160.22.81',
    completionTimeSeconds: 220,
    sentimentAnalysis: 'negative',
    expertAssigned: 'دکتر صابری',
    internalNotes: 'جهت بررسی اعتراض به مدیر گروه ارجاع شد.'
  },
  {
    id: 'sub-003',
    formId: 'form-102',
    trackingCode: 'QUIZ-2026-104921',
    respondentName: 'دکتر مریم رضایی',
    respondentEmail: 'rezaei@faculty.ac.ir',
    respondentRole: 'استاد',
    submittedAt: '۱۴۰۵/۰۵/۰۷ - ۱۴:۱۰',
    status: 'approved',
    answers: {
      q1: 'a2',
      q2: 'b3',
      q3: 'yes',
      q4: 'c1'
    },
    scoreTotal: 100,
    gradeLabel: 'عالی (رتبه ممتاز)',
    ipAddress: '194.225.10.12',
    completionTimeSeconds: 310,
    sentimentAnalysis: 'positive'
  }
];

export const formTemplates = [
  {
    id: 'tpl-contact',
    title: 'فرم تماس با ما و صدای مشتری',
    category: 'عمومی و ارتباطی',
    description: 'دریافت نظرات، پیشنهادات و انتقادات کاربران با ثبت کد پیگیری خودکار',
    icon: 'MessageSquare'
  },
  {
    id: 'tpl-eval',
    title: 'پرسشنامه ارزشیابی استاد و دوره آموزشی',
    category: 'آموزشی',
    description: 'شامل جدول ماتریسی، نمره‌دهی ستاره‌ای و منطق شرطی برای دریافت شکایت',
    icon: 'Award'
  },
  {
    id: 'tpl-reg',
    title: 'فرم ثبت‌نام همایش و کارگاه‌های علمی',
    category: 'رویدادها',
    description: 'دریافت مشخصات، انتخاب کارگاه، بارگذاری مقاله و امضای آنلاین',
    icon: 'UserPlus'
  },
  {
    id: 'tpl-quiz',
    title: 'آزمون و کوئیز آنلاین با تصحیح خودکار',
    category: 'ارزیابی',
    description: 'تعریف پاسخ صحیح، محاسبه نمره، تعیین سقف زمان و صدور کارنامه قبولی',
    icon: 'HelpCircle'
  },
  {
    id: 'tpl-research',
    title: 'پرسشنامه پژوهشی و لیکرت تخصصی',
    category: 'پژوهش',
    description: 'سؤالات طیف لیکرت ۵ گزینه‌ای، دسته‌بندی موضوعی و تحلیل آماری',
    icon: 'BarChart2'
  }
];
