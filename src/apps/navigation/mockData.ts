import { NavigationMenu, CmsSourceItem, MenuVersionHistory } from './types';

export const sampleCmsSources: CmsSourceItem[] = [
  // CMS Pages & Page Builder
  { id: 'cms_p1', title: 'صفحه اصلی دانشگاه', type: 'CMS Pages', url: '/', category: 'اصلی', scope: 'single_item' },
  { id: 'cms_p2', title: 'درباره دانشگاه و تاریخچه', type: 'CMS Pages', url: '/about-us', category: 'معرفی', scope: 'single_item' },
  { id: 'cms_p3', title: 'چشم‌انداز و سند راهبردی', type: 'CMS Pages', url: '/strategic-plan', category: 'معرفی', scope: 'single_item' },
  { id: 'cms_p4', title: 'راهنمای پذیرش دانشجویان جدید', type: 'CMS Pages', url: '/admissions', category: 'آموزش', scope: 'single_item' },
  
  // Page Builder Pages (صفحه‌ساز)
  { id: 'cms_pb1', title: 'صفحه‌ساز: هاب پوستر همایش بین‌المللی AI', type: 'Page Builder', url: '/page-builder/ai-symposium-2026', category: 'طراحی شده با صفحه‌ساز', categoryPath: 'صفحه‌ساز > لندینگ رویداد', scope: 'page_builder' },
  { id: 'cms_pb2', title: 'صفحه‌ساز: لندینگ کمپین ثبت‌نام ورودی جدید', type: 'Page Builder', url: '/page-builder/registration-landing', category: 'طراحی شده با صفحه‌ساز', categoryPath: 'صفحه‌ساز > کمپین پذیرش', scope: 'page_builder' },
  { id: 'cms_pb3', title: 'صفحه‌ساز: معرفی مرکز نوآوری و پارک فناوری', type: 'Page Builder', url: '/page-builder/innovation-center', category: 'طراحی شده با صفحه‌ساز', categoryPath: 'صفحه‌ساز > معرفی مرکز', scope: 'page_builder' },

  // News (Single News Items - خبر منفرد)
  { id: 'cms_n_item1', title: 'خبر اختصاصی: کسب رتبه اول پژوهشی دانشگاه در سطح بین‌المللی', type: 'News', url: '/news/detail/101', category: 'اخبار پژوهشی', categoryPath: 'اخبار > پژوهش و فناوری', scope: 'single_item' },
  { id: 'cms_n_item2', title: 'خبر: امضای تفاهم‌نامه همکاری با صندوق حمایت از پژوهشگران', type: 'News', url: '/news/detail/102', category: 'اخبار کلان', categoryPath: 'اخبار > دستاوردها', scope: 'single_item' },
  { id: 'cms_n_item3', title: 'خبر: افتتاح آزمایشگاه نانو و پردازش هوادیده‌ای', type: 'News', url: '/news/detail/103', category: 'اخبار دانشکده‌ها', categoryPath: 'اخبار > تجهیزات', scope: 'single_item' },

  // News Categories (Group/Category of News - گروه و دسته‌بندی اخبار)
  { id: 'cms_n_cat1', title: 'آرشیو کل اخبار دانشگاه (کامل)', type: 'News Categories', url: '/news/archive/all', category: 'گروه اخبار', categoryPath: 'دسته‌بندی کل اخبار', scope: 'category_group', itemCount: 480 },
  { id: 'cms_n_cat2', title: 'دسته‌بندی اخبار پژوهشی و فناوری', type: 'News Categories', url: '/news/category/research', category: 'گروه اخبار', categoryPath: 'اخبار > دسته‌بندی پژوهش', scope: 'category_group', itemCount: 125 },
  { id: 'cms_n_cat3', title: 'دسته‌بندی اخبار فرهنگی و دانشجویی', type: 'News Categories', url: '/news/category/cultural', category: 'گروه اخبار', categoryPath: 'اخبار > دسته‌بندی فرهنگی', scope: 'category_group', itemCount: 68 },
  { id: 'cms_n_cat4', title: 'دسته‌بندی اخبار بین‌الملل و همایش‌ها', type: 'News Categories', url: '/news/category/international', category: 'گروه اخبار', categoryPath: 'اخبار > دسته‌بندی بین‌الملل', scope: 'category_group', itemCount: 42 },

  // Announcements (Single Announcements - اطلاعیه منفرد)
  { id: 'cms_ann_item1', title: 'اطلاعیه مهم ۱: زمان‌بندی انتخاب واحد و ترمیم دروس نیمسال جدید', type: 'Announcements', url: '/announcements/view/201', category: 'اطلاعیه آموزشی', categoryPath: 'اطلاعیه‌ها > آموزش', scope: 'single_item' },
  { id: 'cms_ann_item2', title: 'اطلاعیه مهم ۲: نحوه ثبت‌نام و دریافت تسهیلات خوابگاهی', type: 'Announcements', url: '/announcements/view/202', category: 'اطلاعیه رفاهی', categoryPath: 'اطلاعیه‌ها > خوابگاه', scope: 'single_item' },
  { id: 'cms_ann_item3', title: 'اطلاعیه شماره ۳: فراخوان دریافت گرنت‌های پژوهشی اساتید', type: 'Announcements', url: '/announcements/view/203', category: 'اطلاعیه پژوهشی', categoryPath: 'اطلاعیه‌ها > گرنت', scope: 'single_item' },

  // Announcement Categories (Group/Category of Announcements - دسته‌بندی اطلاعیه‌ها)
  { id: 'cms_ann_cat1', title: 'دسته‌بندی کلی اطلاعیه‌های آموزشی و ثبت‌نام', type: 'Announcement Categories', url: '/announcements/category/academic', category: 'گروه اطلاعیه‌ها', categoryPath: 'اطلاعیه‌ها > گروه آموزشی', scope: 'category_group', itemCount: 84 },
  { id: 'cms_ann_cat2', title: 'دسته‌بندی اطلاعیه‌های مالی و امور شهریه', type: 'Announcement Categories', url: '/announcements/category/financial', category: 'گروه اطلاعیه‌ها', categoryPath: 'اطلاعیه‌ها > گروه مالی', scope: 'category_group', itemCount: 32 },

  // Articles (Single & Categories)
  { id: 'cms_art_item1', title: 'مقاله علمی: تحلیل هوش مصنوعی در پردازش سیگنال‌های حیاتی', type: 'Articles', url: '/articles/view/301', category: 'مقاله منفرد', categoryPath: 'مقالات > مهندسی پزشکی', scope: 'single_item' },
  { id: 'cms_art_cat1', title: 'دسته‌بندی مقالات ISI و علمی-پژوهشی', type: 'Article Categories', url: '/articles/category/isi-journals', category: 'گروه مقالات', categoryPath: 'مقالات > مجلات ISI', scope: 'category_group', itemCount: 195 },

  // Events & Services
  { id: 'cms_e1', title: 'تقویم آموزشی و رویدادهای نیمسال', type: 'Events', url: '/events/academic-calendar', category: 'آموزش', scope: 'single_item' },
  { id: 'cms_s1', title: 'پورتال جامع خدمات الکترونیکی', type: 'Services', url: '/services/e-portal', category: 'خدمات', scope: 'single_item' },
  { id: 'cms_s2', title: 'سامانه تغذیه و رزرو غذای دانشجویی', type: 'Services', url: '/services/food', category: 'رفاهی', scope: 'single_item' },

  // Downloads & Forms
  { id: 'cms_d1', title: 'دانلود آیین‌نامه‌ها و فرم‌های پژوهشی', type: 'Downloads', url: '/downloads/research-forms', category: 'دانلود', scope: 'category_group', itemCount: 28 },
  { id: 'cms_f1', title: 'فرمساز ارزشیابی کیفی اساتید', type: 'Forms', url: '/forms/faculty-eval', category: 'فرم‌ها', scope: 'single_item' },

  // Categories & Tags
  { id: 'cms_cat_general', title: 'دسته‌بندی کلی: دانشکده‌ها و گروه‌های آموزشی', type: 'Categories', url: '/categories/faculties', category: 'دسته‌بندی کلی', scope: 'category_group', itemCount: 18 },
  { id: 'cms_tag1', title: 'برچسب / تگ: #هوش_مصنوعی', type: 'Tags', url: '/tags/ai', category: 'تگ مطالب', scope: 'tag', itemCount: 54 },
  { id: 'cms_tag2', title: 'برچسب / تگ: #بین_الملل', type: 'Tags', url: '/tags/international', category: 'تگ مطالب', scope: 'tag', itemCount: 31 }
];

export const sampleNavigationMenus: NavigationMenu[] = [
  {
    id: 'menu_header_main',
    name: 'منوی اصلی هدر سایت (Header Main Menu)',
    slug: 'header-main-menu',
    location: 'Header Main Menu',
    language: 'fa',
    status: 'active',
    version: 3,
    createdBy: 'مدیر کل CMS',
    createdAt: '۱۴۰۵/۰۱/۱۵',
    updatedAt: '۱۴۰۵/۰۵/۱۰',
    mobileBehavior: 'Accordion Menu',
    items: [
      {
        id: 'item_1',
        menuId: 'menu_header_main',
        parentId: null,
        title: 'صفحه اصلی',
        titleEn: 'Home',
        itemType: 'internal',
        internalSource: 'CMS Pages',
        targetUrl: '/',
        target: '_self',
        displayType: 'simple',
        sortOrder: 1,
        status: 'active',
        settings: {
          icon: 'Home',
          accessRules: ['Public User', 'Student', 'Employee', 'Administrator']
        }
      },
      {
        id: 'item_2',
        menuId: 'menu_header_main',
        parentId: null,
        title: 'آموزش و پژوهش',
        titleEn: 'Academics & Research',
        itemType: 'internal',
        internalSource: 'CMS Pages',
        targetUrl: '/academics',
        target: '_self',
        displayType: 'mega_menu',
        sortOrder: 2,
        status: 'active',
        settings: {
          icon: 'GraduationCap',
          badge: { enabled: true, text: 'ویژه', type: 'Featured' },
          accessRules: ['Public User', 'Student', 'Employee', 'Administrator']
        },
        megaMenuConfig: {
          columnsCount: 3,
          columns: [
            {
              id: 'col_1',
              title: 'دانشکده‌ها و گروه‌های آموزشی',
              type: 'links',
              widthSpan: 4,
              links: [
                { id: 'l1', title: 'دانشکده مهندسی برق و کامپیوتر', url: '/faculties/engineering', icon: 'Cpu', description: 'گروه‌های نرم‌افزار، معماری و هوش مصنوعی' },
                { id: 'l2', title: 'دانشکده علوم پزشکی و پیراپزشکی', url: '/faculties/medical', icon: 'Heart', description: 'پزشکی عمومی، پرستاری و علوم آزمایشگاهی' },
                { id: 'l3', title: 'دانشکده معماری، هنر و شهرسازی', url: '/faculties/art', icon: 'Building', description: 'معماری، طراحی شهری و هنرهای تجسمی' },
                { id: 'l4', title: 'دانشکده علوم انسانی و حقوق', url: '/faculties/humanities', icon: 'BookOpen', description: 'حقوق بین‌الملل، مدیریت و روانشناسی' }
              ]
            },
            {
              id: 'col_2',
              title: 'سامانه‌ها و امور پژوهشی',
              type: 'links',
              widthSpan: 4,
              links: [
                { id: 'l5', title: 'آزمایشگاه مرکزی و مراکز تحقیقاتی', url: '/research/labs', icon: 'Activity', badge: 'جدید' },
                { id: 'l6', title: 'گرنت پژوهشی و حمایت مالی پایان‌نامه‌ها', url: '/research/grants', icon: 'Coins' },
                { id: 'l7', title: 'مجلات علمی-پژوهشی دانشگاه', url: '/research/journals', icon: 'FileText' },
                { id: 'l8', title: 'مرکز رشد و پارک علم و فناوری', url: '/research/incubator', icon: 'Sparkles', badge: 'داغ' }
              ]
            },
            {
              id: 'col_3',
              title: 'رویداد برجسته آموزشی',
              type: 'image',
              widthSpan: 4,
              imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80',
              imageAlt: 'پذیرش دانشجویان بین‌الملل',
              imageLink: '/admissions/international',
              imageCaption: 'آغاز ثبت‌نام دوره‌های بین‌المللی و کارشناسی ارشد'
            }
          ]
        }
      },
      {
        id: 'item_3',
        menuId: 'menu_header_main',
        parentId: null,
        title: 'سامانه‌های الکترونیک',
        titleEn: 'E-Services',
        itemType: 'internal',
        internalSource: 'Services',
        targetUrl: '/e-services',
        target: '_self',
        displayType: 'dropdown',
        sortOrder: 3,
        status: 'active',
        settings: {
          icon: 'Layers',
          badge: { enabled: true, text: 'جدید', type: 'New' },
          accessRules: ['Public User', 'Student', 'Employee', 'Administrator']
        },
        children: [
          {
            id: 'item_3_1',
            menuId: 'menu_header_main',
            parentId: 'item_3',
            title: 'پورتال جامع دانشجویی (سما)',
            itemType: 'internal',
            internalSource: 'Services',
            targetUrl: '/services/sama',
            target: '_blank',
            displayType: 'simple',
            sortOrder: 1,
            status: 'active',
            settings: {
              icon: 'User',
              description: 'انتخاب واحد، مشاهده کارنامه و نمرات',
              accessRules: ['Student', 'Administrator']
            }
          },
          {
            id: 'item_3_2',
            menuId: 'menu_header_main',
            parentId: 'item_3',
            title: 'سامانه تغذیه و رزرو غذا (سلف)',
            itemType: 'internal',
            internalSource: 'Services',
            targetUrl: '/services/food',
            target: '_self',
            displayType: 'simple',
            sortOrder: 2,
            status: 'active',
            settings: {
              icon: 'Utensils',
              description: 'رزرو هفتگی، شارژ کارت تغذیه',
              accessRules: ['Student', 'Employee', 'Administrator']
            }
          },
          {
            id: 'item_3_3',
            menuId: 'menu_header_main',
            parentId: 'item_3',
            title: 'سامانه مدیریت یادگیری (LMS)',
            itemType: 'external',
            targetUrl: 'https://lms.university.ac.ir',
            target: '_blank',
            rel: 'noopener',
            displayType: 'simple',
            sortOrder: 3,
            status: 'active',
            settings: {
              icon: 'BookOpen',
              description: 'کلاس‌های آنلاین و تکالیف دروس',
              badge: { enabled: true, text: 'بروز', type: 'Hot' },
              accessRules: ['Student', 'Employee', 'Administrator']
            }
          }
        ]
      },
      {
        id: 'item_4',
        menuId: 'menu_header_main',
        parentId: null,
        title: 'اخبار و رویدادها',
        titleEn: 'News & Events',
        itemType: 'internal',
        internalSource: 'News',
        targetUrl: '/news',
        target: '_self',
        displayType: 'simple',
        sortOrder: 4,
        status: 'active',
        settings: {
          icon: 'Newspaper',
          accessRules: ['Public User', 'Student', 'Employee', 'Administrator']
        }
      },
      {
        id: 'item_5',
        menuId: 'menu_header_main',
        parentId: null,
        title: 'ارتباط با ما',
        titleEn: 'Contact Us',
        itemType: 'internal',
        internalSource: 'CMS Pages',
        targetUrl: '/contact',
        target: '_self',
        displayType: 'simple',
        sortOrder: 5,
        status: 'active',
        settings: {
          icon: 'PhoneCall',
          accessRules: ['Public User', 'Student', 'Employee', 'Administrator']
        }
      }
    ]
  },
  {
    id: 'menu_header_top',
    name: 'منوی بالایی هدر (Header Top Navigation)',
    slug: 'header-top-navigation',
    location: 'Header Top Menu',
    language: 'fa',
    status: 'active',
    version: 1,
    createdBy: 'مدیر محتوا',
    createdAt: '۱۴۰۵/۰۲/۰۱',
    updatedAt: '۱۴۰۵/۰۴/۱۵',
    items: [
      {
        id: 'top_1',
        menuId: 'menu_header_top',
        parentId: null,
        title: 'ورود به پورتال سازمانی',
        itemType: 'custom',
        targetUrl: '/login',
        target: '_self',
        displayType: 'simple',
        sortOrder: 1,
        status: 'active',
        settings: {
          icon: 'Lock',
          badge: { enabled: true, text: 'SSO', type: 'Custom' },
          accessRules: ['Public User', 'Student', 'Employee', 'Administrator']
        }
      },
      {
        id: 'top_2',
        menuId: 'menu_header_top',
        parentId: null,
        title: 'کتابخانه دیجیتال و اسناد',
        itemType: 'internal',
        internalSource: 'CMS Pages',
        targetUrl: '/library',
        target: '_self',
        displayType: 'simple',
        sortOrder: 2,
        status: 'active',
        settings: {
          icon: 'BookOpen',
          accessRules: ['Public User', 'Student', 'Employee', 'Administrator']
        }
      },
      {
        id: 'top_3',
        menuId: 'menu_header_top',
        parentId: null,
        title: 'English Portal',
        titleEn: 'English',
        itemType: 'external',
        targetUrl: 'https://en.university.ac.ir',
        target: '_blank',
        displayType: 'simple',
        sortOrder: 3,
        status: 'active',
        settings: {
          icon: 'Globe',
          accessRules: ['Public User']
        }
      }
    ]
  },
  {
    id: 'menu_footer_1',
    name: 'فوتر - ستون ۱ (دسترسی سریع)',
    slug: 'footer-column-1',
    location: 'Footer Menu 1',
    language: 'fa',
    status: 'active',
    version: 1,
    createdBy: 'مدیر طراحی',
    createdAt: '۱۴۰۵/۰۱/۱۰',
    updatedAt: '۱۴۰۵/۰۴/۲۰',
    items: [
      {
        id: 'f1_1',
        menuId: 'menu_footer_1',
        parentId: null,
        title: 'معرفی دانشگاه و هیئت رئیسه',
        itemType: 'internal',
        targetUrl: '/about',
        target: '_self',
        displayType: 'simple',
        sortOrder: 1,
        status: 'active',
        settings: { accessRules: ['Public User'] }
      },
      {
        id: 'f1_2',
        menuId: 'menu_footer_1',
        parentId: null,
        title: 'دانشکده‌ها و گروه‌ها',
        itemType: 'internal',
        targetUrl: '/faculties',
        target: '_self',
        displayType: 'simple',
        sortOrder: 2,
        status: 'active',
        settings: { accessRules: ['Public User'] }
      },
      {
        id: 'f1_3',
        menuId: 'menu_footer_1',
        parentId: null,
        title: 'فرصت‌های شغلی و جذب هیئت علمی',
        itemType: 'internal',
        targetUrl: '/careers',
        target: '_self',
        displayType: 'simple',
        sortOrder: 3,
        status: 'active',
        settings: { accessRules: ['Public User'] }
      }
    ]
  },
  {
    id: 'menu_mobile',
    name: 'منوی اختصاصی اپلیکیشن و موبایل (Mobile Drawer)',
    slug: 'mobile-navigation-menu',
    location: 'Mobile Menu',
    language: 'fa',
    status: 'active',
    version: 2,
    createdBy: 'تیم UI/UX',
    createdAt: '۱۴۰۵/۰۳/۰۱',
    updatedAt: '۱۴۰۵/۰۵/۰۱',
    mobileBehavior: 'Slide Menu',
    items: [
      {
        id: 'mob_1',
        menuId: 'menu_mobile',
        parentId: null,
        title: 'صفحه اصلی موبایل',
        itemType: 'internal',
        targetUrl: '/',
        target: '_self',
        displayType: 'simple',
        sortOrder: 1,
        status: 'active',
        settings: { icon: 'Home', accessRules: ['Public User'] }
      },
      {
        id: 'mob_2',
        menuId: 'menu_mobile',
        parentId: null,
        title: 'خدمات سریع دانشجویی',
        itemType: 'internal',
        targetUrl: '/student-services',
        target: '_self',
        displayType: 'dropdown',
        sortOrder: 2,
        status: 'active',
        settings: { icon: 'Smartphone', accessRules: ['Student'] },
        children: [
          {
            id: 'mob_2_1',
            menuId: 'menu_mobile',
            parentId: 'mob_2',
            title: 'کارت شناسایی دیجیتال',
            itemType: 'internal',
            targetUrl: '/id-card',
            target: '_self',
            displayType: 'simple',
            sortOrder: 1,
            status: 'active',
            settings: { icon: 'CreditCard', accessRules: ['Student'] }
          },
          {
            id: 'mob_2_2',
            menuId: 'menu_mobile',
            parentId: 'mob_2',
            title: 'برنامه هفتگی و امتحان',
            itemType: 'internal',
            targetUrl: '/schedule',
            target: '_self',
            displayType: 'simple',
            sortOrder: 2,
            status: 'active',
            settings: { icon: 'Calendar', accessRules: ['Student'] }
          }
        ]
      }
    ]
  }
];

export const sampleVersionHistory: MenuVersionHistory[] = [
  {
    id: 'ver_3',
    menuId: 'menu_header_main',
    version: 3,
    changedBy: 'مدیر کل CMS',
    timestamp: '۱۴۰۵/۰۵/۱۰ - ۱۱:۴۵',
    changeSummary: 'افزودن مگا منوی پیشرفته ۳ ستونه برای «آموزش و پژوهش» همراه با تصویر و بنر',
    itemsSnapshot: sampleNavigationMenus[0].items
  },
  {
    id: 'ver_2',
    menuId: 'menu_header_main',
    version: 2,
    changedBy: 'کارشناس فناوری اطلاعات',
    timestamp: '۱۴۰۵/۰۴/۱۵ - ۰۹:۲۰',
    changeSummary: 'اصلاح لینک‌های سامانه تغذیه و اضافه‌کردن بج «جدید» روی سامانه‌ها',
    itemsSnapshot: []
  },
  {
    id: 'ver_1',
    menuId: 'menu_header_main',
    version: 1,
    changedBy: 'مدیر طراحی',
    timestamp: '۱۴۰۵/۰۱/۱۵ - ۱۰:۰۰',
    changeSummary: 'ایجاد اولیه ساختار منوی اصلی سایت',
    itemsSnapshot: []
  }
];
