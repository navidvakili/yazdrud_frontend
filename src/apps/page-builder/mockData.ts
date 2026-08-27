import { SmartPageSchema, PageTemplate, SectionTemplate } from './builderTypes';

export interface AnnouncementItem {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  priority: 'urgent' | 'standard';
  category: string;
  link: string;
}

export interface NewsItemMock {
  id: string;
  title: string;
  publishDate: string;
  author: string;
  category: string;
  featuredImage: string;
  summary: string;
  views: number;
  tags: string[];
}

export interface MediaGalleryItem {
  id: string;
  title: string;
  url: string;
  album: string;
  dateAdded: string;
}

export interface AchievementItem {
  id: string;
  badgeLogo: string;
  title: string;
  year: string;
  issuingOrganization: string;
  description: string;
}

export interface FacultyMember {
  id: string;
  photo: string;
  fullName: string;
  titlePosition: string;
  department: string;
  email: string;
  bio: string;
}

export interface FileDocument {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'doc' | 'xls' | 'zip';
  size: string;
  uploadDate: string;
  downloadCount: number;
  folder: string;
  downloadUrl: string;
}

export const MOCK_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'anc-1',
    title: 'تمدید مهلت ثبت‌نام دروس ترم تابستان ۱۴۰۵',
    date: '۱۴۰۵/۰۵/۱۰',
    excerpt: 'به اطلاع کلیه دانشجویان می‌رساند مهلت انتخاب واحد و ثبت‌نام ترم تابستان تا روز پنج‌شنبه تمدید گردید.',
    priority: 'urgent',
    category: 'آموزشی',
    link: '#'
  },
  {
    id: 'anc-2',
    title: 'فراخوان دریافت ارزشیابی اساتید نیمسال دوم',
    date: '۱۴۰۵/۰۵/۰۸',
    excerpt: 'دانشجویان محترم جهت اخذ کارت ورود به جلسه آزمون پایانی ملزم به تکمیل فرم ارزشیابی در سامانه می‌باشند.',
    priority: 'urgent',
    category: 'آموزشی',
    link: '#'
  },
  {
    id: 'anc-3',
    title: 'برگزاری کارگاه تخصصی هوش مصنوعی در مهندسی نرم‌افزار',
    date: '۱۴۰۵/۰۵/۰۵',
    excerpt: 'کارگاه آموزشی دوره‌ای توسط انجمن علمی مهندسی کامپیوتر روز سه‌شنبه ساعت ۱۰ در سالن همایش برگزار می‌گردد.',
    priority: 'standard',
    category: 'پژوهشی',
    link: '#'
  },
  {
    id: 'anc-4',
    title: 'جدول زمان‌بندی توزیع وام‌های دانشجویی صندوق رفاه',
    date: '۱۴۰۵/۰۵/۰۱',
    excerpt: 'متقاضیان دریافت تسهیلات شهریه و مسکن می‌توانند مدارک خود را به امور دانشجویی تحویل نمایند.',
    priority: 'standard',
    category: 'رفاهی',
    link: '#'
  }
];

export const MOCK_NEWS: NewsItemMock[] = [
  {
    id: 'news-1',
    title: 'کسب رتبه اول مسابقات بین‌المللی رباتیک توسط تیم دانشکده مهندسی',
    publishDate: '۱۴۰۵/۰۵/۱۱',
    author: 'روابط عمومی دانشگاه',
    category: 'علمی',
    featuredImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    summary: 'تیم پژوهشی دانشگاه علم و هنر موفق به کسب مقام نخست در لیگ ربات‌های هوشمند مسابقات جهانی گردید.',
    views: 1420,
    tags: ['رباتیک', 'افتخارات', 'پژوهش']
  },
  {
    id: 'news-2',
    title: 'امضای تفاهم‌نامه همکاری بین‌المللی با دانشگاه‌های پیشرو منطقه',
    publishDate: '۱۴۰۵/۰۵/۰۷',
    author: 'دبیرخانه بین‌الملل',
    category: 'بین‌الملل',
    featuredImage: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80',
    summary: 'در راستای توسعه تبادلات علمی و فرصت‌های مطالعاتی، تفاهم‌نامه جدید پژوهشی به امضا رسید.',
    views: 980,
    tags: ['تفاهم‌نامه', 'بین‌الملل']
  },
  {
    id: 'news-3',
    title: 'افتتاح آزمایشگاه پیشرفته پردازش ابری و داده‌های عظیم',
    publishDate: '۱۴۰۵/۰۵/۰۲',
    author: 'معاونت پژوهشی',
    category: 'فناوری',
    featuredImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    summary: 'مرکز داده و آزمایشگاه جدید پردازش ابری با تجهیزات روز دنیا آماده ارائه خدمات به پژوهشگران شد.',
    views: 2150,
    tags: ['آزمایشگاه', 'پردازش ابری']
  },
  {
    id: 'news-4',
    title: 'برگزاری جشنواره فرهنگی هنری دانشجویان علم و هنر',
    publishDate: '۱۴۰۵/۰۴/۲۸',
    author: 'مدیریت فرهنگی',
    category: 'فرهنگی',
    featuredImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    summary: 'بیست و پنجمین دوره جشنواره فرهنگی با استقبال پرشور دانشجویان و ارائه آثار منتخب به کار خود پایان داد.',
    views: 1110,
    tags: ['جشنواره', 'فرهنگی']
  }
];

export const MOCK_GALLERY: MediaGalleryItem[] = [
  {
    id: 'gal-1',
    title: 'نمای بیرونی پردیس مهندسی',
    url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
    album: 'پردیس دانشگاه',
    dateAdded: '۱۴۰۵/۰۱/۱۵'
  },
  {
    id: 'gal-2',
    title: 'کتابخانه مرکزی و سالن مطالعه',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
    album: 'کتابخانه',
    dateAdded: '۱۴۰۵/۰۲/۱۰'
  },
  {
    id: 'gal-3',
    title: 'سمینار تخصصی مهندسی صنایع',
    url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
    album: 'همایش‌ها',
    dateAdded: '۱۴۰۵/۰۳/۰۴'
  },
  {
    id: 'gal-4',
    title: 'آزمایشگاه بیوتکنولوژی و نانو',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    album: 'آزمایشگاه‌ها',
    dateAdded: '۱۴۰۵/۰۴/۱۲'
  }
];

export const MOCK_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: 'ach-1',
    badgeLogo: '🏆',
    title: 'تندیس دانشگاه برتر هوشمند کشور',
    year: '۱۴۰۴',
    issuingOrganization: 'وزارت علوم، تحقیقات و فناوری',
    description: 'کسب عنوان دانشگاه پیشرو در پیاده‌سازی زیرساخت‌های یکپارچه آموزش الکترونیک و اتوماسیون.'
  },
  {
    id: 'ach-2',
    badgeLogo: '🥇',
    title: 'مقام نخست المپیاد علمی دانشجویی',
    year: '۱۴۰۴',
    issuingOrganization: 'دبیرخانه المپیاد علمی کشوری',
    description: 'درخشش دانشجویان رشته‌های مهندسی کامپیوتر و حقوق در بخش مرحله نهایی کشور.'
  },
  {
    id: 'ach-3',
    badgeLogo: '🎖️',
    title: 'نشان طلایی نوآوری و پژوهش کاربردی',
    year: '۱۴۰۳',
    issuingOrganization: 'بنیاد ملی نخبگان',
    description: 'تقدیر از مرکز رشد و واحدهای فناور مستقر در پارک علم و فناوری دانشگاه.'
  }
];

export const MOCK_STAFF: FacultyMember[] = [
  {
    id: 'st-1',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    fullName: 'دکتر مریم رضایی',
    titlePosition: 'رئیس دانشکده کامپیوتر و هوش مصنوعی',
    department: 'مهندسی کامپیوتر',
    email: 'm.rezaei@elm.ac.ir',
    bio: 'استاد تمام گروه مهندسی نرم‌افزار، دارای بیش از ۶۰ مقاله بین‌المللی در حوزه یادگیری عمیق.'
  },
  {
    id: 'st-2',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    fullName: 'دکتر علی کاظمی',
    titlePosition: 'معاون پژوهشی و فناوری',
    department: 'مهندسی برق',
    email: 'a.kazemi@elm.ac.ir',
    bio: 'دانشیار پژوهشی، متخصص سیستم‌های قدرت و پردازش سیگنال‌های دیجیتال.'
  },
  {
    id: 'st-3',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    fullName: 'دکتر سارا حسینی',
    titlePosition: 'مدیر گروه آموزش الکترونیکی',
    department: 'علوم پایه',
    email: 's.hoseini@elm.ac.ir',
    bio: 'استادیار حقوق و علوم اجتماعی، مشاور ارشد برنامه‌ریزی آموزشی دانشگاه.'
  }
];

export const MOCK_FILES: FileDocument[] = [
  {
    id: 'file-1',
    fileName: 'چارت_درسی_مهندسی_کامپیوتر_۱۴۰۵.pdf',
    fileType: 'pdf',
    size: '۲.۴ مگابایت',
    uploadDate: '۱۴۰۵/۰۴/۱۵',
    downloadCount: 1420,
    folder: 'آموزشی',
    downloadUrl: '#'
  },
  {
    id: 'file-2',
    fileName: 'دستورالعمل_نگارش_پایان_نامه_ارشد.docx',
    fileType: 'doc',
    size: '۱.۱ مگابایت',
    uploadDate: '۱۴۰۵/۰۳/۲۰',
    downloadCount: 890,
    folder: 'پژوهشی',
    downloadUrl: '#'
  },
  {
    id: 'file-3',
    fileName: 'فرم_درخواست_وام_شهریه_صندوق_رفاه.xlsx',
    fileType: 'xls',
    size: '۴۵۰ کیلوبایت',
    uploadDate: '۱۴۰۵/۰۵/۰۱',
    downloadCount: 650,
    folder: 'رفاهی',
    downloadUrl: '#'
  },
  {
    id: 'file-4',
    fileName: 'مجموعه_قوانین_و_مقررات_انضباطی.pdf',
    fileType: 'pdf',
    size: '۳.۸ مگابایت',
    uploadDate: '۱۴۰۵/۰۱/۱۰',
    downloadCount: 2100,
    folder: 'اداری',
    downloadUrl: '#'
  }
];

// Default Initial Smart Page Schema
export const INITIAL_SMART_PAGE: SmartPageSchema = {
  id: 'page-main-landing',
  title: 'صفحه اصلی پرتال دانشگاهی (Smart Portal Page)',
  slug: 'home-portal',
  status: 'published',
  seo: {
    title: 'پرتال دانشگاهی | صفحه اصلی',
    description: 'پرتال هوشمند دانشگاه — دسترسی سریع به اخبار، اطلاعیه‌ها، افتخارات و خدمات.',
    keywords: 'دانشگاه, پرتال, اخبار, اطلاعیه',
    og_image: '',
  },
  createdAt: '2026-08-01',
  updatedAt: '2026-08-02',
  version: 1,
  globalStyles: {
    primaryColor: '#0d9488', // teal-600
    secondaryColor: '#4f46e5', // indigo-600
    accentColor: '#f59e0b', // amber-500
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    fontFamily: 'Vazirmatn, sans-serif',
    containerMaxWidth: 1240,
    baseRadius: 16
  },
  versionHistory: [
    {
      id: 'v-1',
      timestamp: '۱۴۰۵/۰۵/۰۲ - ۱۰:۳۰',
      title: 'نسخه اولیه منتشر شده',
      note: 'ایجاد چیدمان هوشمند با ماژول‌های اخبار و اطلاعیه‌ها',
      schemaSnapshot: {} as any
    }
  ],
  sections: [
    {
      id: 'sec-hero',
      name: 'بخش هدر و خوش‌آمدگویی هوشمند',
      layout: 'boxed',
      backgroundColor: '#0f172a',
      backgroundGradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      paddingTop: 48,
      paddingBottom: 48,
      visibility: { desktop: true, tablet: true, mobile: true },
      conditionalDisplay: { enabled: false },
      columns: [
        {
          id: 'col-hero-1',
          width: 7,
          widgets: [
            {
              id: 'w-hero-title',
              type: 'heading',
              title: 'عنوان اصلی',
              content: 'سامانه هوشمند سازنده صفحات و مدیریت محتوای کارانت',
              settings: {
                style: {
                  textColor: '#ffffff',
                  fontSize: '32px',
                  fontWeight: '900',
                  textAlign: 'right',
                  marginBottom: 16
                },
                binding: { dataSource: 'none' },
                visibility: { desktop: true, tablet: true, mobile: true },
                conditionalDisplay: { enabled: false }
              }
            },
            {
              id: 'w-hero-desc',
              type: 'text',
              title: 'توضیحات هدر',
              content: 'طراحی، چیدمان و اتصال مستقیم اجزای بصری به داده‌های زنده ماژول‌های داخلی دانشگاه (اطلاعیه‌ها، اخبار، فایل‌ها، کادر علمی و افتخارات).',
              settings: {
                style: {
                  textColor: '#cbd5e1',
                  fontSize: '15px',
                  textAlign: 'right',
                  marginBottom: 24
                },
                binding: { dataSource: 'none' },
                visibility: { desktop: true, tablet: true, mobile: true },
                conditionalDisplay: { enabled: false }
              }
            },
            {
              id: 'w-hero-btn',
              type: 'button',
              title: 'دکمه اقدام',
              content: 'مشاهده دوره‌ها و خدمات',
              buttonText: 'ورود به سامانه خدمات الکترونیک',
              buttonUrl: '#',
              settings: {
                style: {
                  backgroundColor: '#0d9488',
                  textColor: '#ffffff',
                  borderRadius: 12,
                  paddingTop: 12,
                  paddingBottom: 12,
                  paddingLeft: 24,
                  paddingRight: 24,
                  fontWeight: '700'
                },
                binding: { dataSource: 'none' },
                visibility: { desktop: true, tablet: true, mobile: true },
                conditionalDisplay: { enabled: false }
              }
            }
          ]
        },
        {
          id: 'col-hero-2',
          width: 5,
          widgets: [
            {
              id: 'w-hero-img',
              type: 'image',
              title: 'تصویر اصلی',
              content: 'تصویر پردیس',
              imageUrl: '/placeholder-news.svg',
              settings: {
                style: {
                  borderRadius: 20,
                  shadow: 'lg',
                  borderColor: '#334155',
                  borderWidth: 1
                },
                binding: { dataSource: 'none' },
                visibility: { desktop: true, tablet: true, mobile: true },
                conditionalDisplay: { enabled: false }
              }
            }
          ]
        }
      ]
    },
    {
      id: 'sec-announcements',
      name: 'بخش اطلاعیه‌های مهم (ماژول هوشمند)',
      layout: 'boxed',
      backgroundColor: '#f8fafc',
      paddingTop: 40,
      paddingBottom: 40,
      visibility: { desktop: true, tablet: true, mobile: true },
      conditionalDisplay: { enabled: false },
      columns: [
        {
          id: 'col-anc-main',
          width: 12,
          widgets: [
            {
              id: 'w-anc-feed',
              type: 'announcements-feed',
              title: 'آخرین اطلاعیه‌های دانشگاهی',
              content: 'اطلاعیه‌های متصل به ماژول مدیریت اطلاعیه‌ها',
              settings: {
                style: {
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  paddingTop: 20,
                  paddingBottom: 20,
                  paddingLeft: 20,
                  paddingRight: 20,
                  shadow: 'sm'
                },
                binding: {
                  dataSource: 'announcements',
                  priorityFilter: 'all',
                  limit: 4,
                  displayMode: 'list'
                },
                visibility: { desktop: true, tablet: true, mobile: true },
                conditionalDisplay: { enabled: false }
              }
            }
          ]
        }
      ]
    },
    {
      id: 'sec-news-staff',
      name: 'بخش اخبار و اساتید هیئت علمی',
      layout: 'boxed',
      backgroundColor: '#ffffff',
      paddingTop: 40,
      paddingBottom: 40,
      visibility: { desktop: true, tablet: true, mobile: true },
      conditionalDisplay: { enabled: false },
      columns: [
        {
          id: 'col-news',
          width: 8,
          widgets: [
            {
              id: 'w-news-widget',
              type: 'news-feed',
              title: 'تازه‌ترین اخبار دانشگاه علم و هنر',
              content: 'اخبار متصل به ماژول خبر آنلاین',
              settings: {
                style: {
                  paddingTop: 10,
                  paddingBottom: 10
                },
                binding: {
                  dataSource: 'news',
                  limit: 4,
                  displayMode: 'grid',
                  columnsCount: 2
                },
                visibility: { desktop: true, tablet: true, mobile: true },
                conditionalDisplay: { enabled: false }
              }
            }
          ]
        },
        {
          id: 'col-staff',
          width: 4,
          widgets: [
            {
              id: 'w-staff-widget',
              type: 'staff-directory',
              title: 'اعضای هیئت علمی و مدیران',
              content: 'لیست اساتید متصل به سامانه پرسنلی',
              settings: {
                style: {
                  backgroundColor: '#f1f5f9',
                  borderRadius: 16,
                  paddingTop: 16,
                  paddingBottom: 16,
                  paddingLeft: 16,
                  paddingRight: 16
                },
                binding: {
                  dataSource: 'staff',
                  limit: 3,
                  displayMode: 'list'
                },
                visibility: { desktop: true, tablet: true, mobile: true },
                conditionalDisplay: { enabled: false }
              }
            }
          ]
        }
      ]
    },
    {
      id: 'sec-files-awards',
      name: 'بخش آرشیو اسناد و افتخارات',
      layout: 'boxed',
      backgroundColor: '#f8fafc',
      paddingTop: 40,
      paddingBottom: 40,
      visibility: { desktop: true, tablet: true, mobile: true },
      conditionalDisplay: { enabled: false },
      columns: [
        {
          id: 'col-files',
          width: 6,
          widgets: [
            {
              id: 'w-files-list',
              type: 'file-manager',
              title: 'مخزن فایل‌ها و فرم‌های اداری',
              content: 'مخزن فایل متصل به ماژول مدیریت فایل',
              settings: {
                style: {
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  paddingTop: 16,
                  paddingBottom: 16,
                  paddingLeft: 16,
                  paddingRight: 16,
                  shadow: 'sm'
                },
                binding: {
                  dataSource: 'files',
                  limit: 4,
                  displayMode: 'table'
                },
                visibility: { desktop: true, tablet: true, mobile: true },
                conditionalDisplay: { enabled: false }
              }
            }
          ]
        },
        {
          id: 'col-achievements',
          width: 6,
          widgets: [
            {
              id: 'w-achievements-list',
              type: 'achievements-timeline',
              title: 'افتخارات و جوایز دانشگاهی',
              content: 'ثبت دستاوردها و افتخارات ملی',
              settings: {
                style: {
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  paddingTop: 16,
                  paddingBottom: 16,
                  paddingLeft: 16,
                  paddingRight: 16,
                  shadow: 'sm'
                },
                binding: {
                  dataSource: 'awards',
                  limit: 3,
                  displayMode: 'timeline'
                },
                visibility: { desktop: true, tablet: true, mobile: true },
                conditionalDisplay: { enabled: false }
              }
            }
          ]
        }
      ]
    }
  ]
};

// Preset Templates
export const PRESET_PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'tmpl-landing-1',
    title: 'قالب جامع پرتال اصلی دانشگاه',
    category: 'صفحه اصلی',
    description: 'ترکیبی کامل از اطلاعیه‌های فوری، اخبار علمی، کادر اساتید و مخزن فایل‌های دانلود.',
    thumbnail: '/placeholder-news.svg',
    schema: INITIAL_SMART_PAGE
  },
  {
    id: 'tmpl-news-portal',
    title: 'قالب اختصاصی مجله خبری و اطلاعیه‌ها',
    category: 'اخبار و رسانه',
    description: 'تمرکز ویژه بر پوشش خبری چندرسانه‌ای، گالری تصاویر پردیس و اطلاعیه‌های مهم آموزشی.',
    thumbnail: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=600&q=80',
    schema: {
      ...INITIAL_SMART_PAGE,
      id: 'page-news-portal',
      title: 'مجله خبری و اطلاع‌رسانی علمی',
      slug: 'news-portal',
      sections: [
        {
          id: 'sec-news-hero',
          name: 'هدر مجله خبری',
          layout: 'boxed',
          backgroundColor: '#0f172a',
          paddingTop: 36,
          paddingBottom: 36,
          visibility: { desktop: true, tablet: true, mobile: true },
          conditionalDisplay: { enabled: false },
          columns: [
            {
              id: 'col-n-1',
              width: 12,
              widgets: [
                {
                  id: 'w-news-h',
                  type: 'heading',
                  title: 'عنوان مجله',
                  content: 'پایگاه اطلاع‌رسانی و رویدادهای دانشگاه علم و هنر',
                  settings: {
                    style: { textColor: '#ffffff', fontSize: '28px', textAlign: 'center' },
                    binding: { dataSource: 'none' },
                    visibility: { desktop: true, tablet: true, mobile: true },
                    conditionalDisplay: { enabled: false }
                  }
                }
              ]
            }
          ]
        },
        {
          id: 'sec-news-grid',
          name: 'شبکه اخبار زنده',
          layout: 'boxed',
          backgroundColor: '#ffffff',
          paddingTop: 30,
          paddingBottom: 30,
          visibility: { desktop: true, tablet: true, mobile: true },
          conditionalDisplay: { enabled: false },
          columns: [
            {
              id: 'col-n-2',
              width: 12,
              widgets: [
                {
                  id: 'w-news-grid-widget',
                  type: 'news-feed',
                  title: 'اخبار و مقالات پژوهشی',
                  content: '',
                  settings: {
                    style: { paddingTop: 10, paddingBottom: 10 },
                    binding: { dataSource: 'news', limit: 6, displayMode: 'grid', columnsCount: 3 },
                    visibility: { desktop: true, tablet: true, mobile: true },
                    conditionalDisplay: { enabled: false }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: 'tmpl-faculty-showcase',
    title: 'صفحه معرفی دانشکده و اعضای علمی',
    category: 'دانشکده‌ها',
    description: 'معرفی رزومه اساتید، چارت‌های آموزشی، افتخارات پژوهشی و فرم‌های دانشجویی.',
    thumbnail: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=600&q=80',
    schema: {
      ...INITIAL_SMART_PAGE,
      id: 'page-faculty',
      title: 'معرفی دانشکده مهندسی و هوش مصنوعی',
      slug: 'faculty-engineering',
      sections: [
        {
          id: 'sec-fac-hero',
          name: 'معرفی دانشکده',
          layout: 'boxed',
          backgroundColor: '#0d9488',
          paddingTop: 40,
          paddingBottom: 40,
          visibility: { desktop: true, tablet: true, mobile: true },
          conditionalDisplay: { enabled: false },
          columns: [
            {
              id: 'col-f-1',
              width: 12,
              widgets: [
                {
                  id: 'w-f-h',
                  type: 'heading',
                  title: 'عنوان دانشکده',
                  content: 'دانشکده مهندسی کامپیوتر، داده و هوش مصنوعی',
                  settings: {
                    style: { textColor: '#ffffff', fontSize: '30px', textAlign: 'center' },
                    binding: { dataSource: 'none' },
                    visibility: { desktop: true, tablet: true, mobile: true },
                    conditionalDisplay: { enabled: false }
                  }
                }
              ]
            }
          ]
        },
        {
          id: 'sec-fac-staff',
          name: 'اساتید و اعضای علمی',
          layout: 'boxed',
          backgroundColor: '#f8fafc',
          paddingTop: 36,
          paddingBottom: 36,
          visibility: { desktop: true, tablet: true, mobile: true },
          conditionalDisplay: { enabled: false },
          columns: [
            {
              id: 'col-f-2',
              width: 12,
              widgets: [
                {
                  id: 'w-staff-grid',
                  type: 'staff-directory',
                  title: 'کادر هیئت علمی',
                  content: '',
                  settings: {
                    style: { paddingTop: 10, paddingBottom: 10 },
                    binding: { dataSource: 'staff', limit: 6, displayMode: 'grid', columnsCount: 3 },
                    visibility: { desktop: true, tablet: true, mobile: true },
                    conditionalDisplay: { enabled: false }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  }
];
