import { MediaAsset, Folder, Album, Category, Tag } from './types';

export const initialFolders: Folder[] = [
  { id: 'f-root', name: 'مخزن اصلی دارایی‌ها', parentId: null, color: '#0d9488', iconName: 'Folder' },
  { id: 'f-news', name: 'تصاویر و رسانه‌های خبری', parentId: 'f-root', color: '#0284c7', iconName: 'Newspaper' },
  { id: 'f-events', name: 'آلبوم همایش‌ها و رویدادها', parentId: 'f-root', color: '#8b5cf6', iconName: 'Sparkles' },
  { id: 'f-docs', name: 'اسناد، بخشنامه‌ها و فرم‌ها', parentId: 'f-root', color: '#f59e0b', iconName: 'FileText' },
  { id: 'f-branding', name: 'هویت بصری و لوگوها', parentId: 'f-root', color: '#ec4899', iconName: 'Building' },
  { id: 'f-videos', name: 'تیزرها و ویدیوهای آموزشی', parentId: 'f-root', color: '#10b981', iconName: 'Video' },
];

export const initialCategories: Category[] = [
  { id: 'cat-news', name: 'اخبار و رویدادها', slug: 'news-events', color: '#0284c7', count: 12 },
  { id: 'cat-edu', name: 'آموزشی و پژوهشی', slug: 'education', color: '#0d9488', count: 8 },
  { id: 'cat-brand', name: 'برندینگ و لوگو', slug: 'branding', color: '#ec4899', count: 5 },
  { id: 'cat-doc', name: 'فرم‌ها و بخشنامه‌ها', slug: 'forms-docs', color: '#f59e0b', count: 9 },
  { id: 'cat-media', name: 'چندرسانه‌ای و تیزر', slug: 'multimedia', color: '#8b5cf6', count: 6 },
];

export const initialTags: Tag[] = [
  { id: 't-1', name: 'دانشگاه', color: '#0284c7', count: 15 },
  { id: 't-2', name: 'همایش ملی', color: '#8b5cf6', count: 9 },
  { id: 't-3', name: 'استاد تمام', color: '#0d9488', count: 7 },
  { id: 't-4', name: 'فرمت HD', color: '#10b981', count: 12 },
  { id: 't-5', name: 'هوش مصنوعی', color: '#ec4899', count: 6 },
  { id: 't-6', name: 'تایید رسمی', color: '#f59e0b', count: 11 },
  { id: 't-7', name: 'پایان‌نامه', color: '#6366f1', count: 5 },
];

export const initialAlbums: Album[] = [
  {
    id: 'alb-1',
    name: 'آلبوم نخبگان و چهره‌های علمی',
    description: 'مجموعه پرتره‌ها و تصاویر رسمی اساتید و پژوهشگران برجسته',
    coverUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    type: 'photo',
    isSmart: false,
    isPublic: true,
    assetCount: 8,
    createdAt: '۱۴۰۵/۰۲/۱۰'
  },
  {
    id: 'alb-2',
    name: 'گالری تصویری همایش بین‌المللی AI',
    description: 'عکس‌های منتخب افتتاحیه و سخنرانی‌های کلیدی کنفرانس',
    coverUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80',
    type: 'mixed',
    isSmart: false,
    isPublic: true,
    assetCount: 14,
    createdAt: '۱۴۰۵/۰۳/۰۱'
  },
  {
    id: 'alb-smart-alt',
    name: 'هوشمند: فایل‌های بدون Alt Text',
    description: 'آلبوم پویا برای اصلاح سئوی تصاویر فاقد متن جایگزین',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    type: 'photo',
    isSmart: true,
    smartCondition: 'altText == ""',
    isPublic: false,
    assetCount: 3,
    createdAt: '۱۴۰۵/۰۳/۱۵'
  }
];

export const initialAssets: MediaAsset[] = [
  {
    id: 'ast-1',
    name: 'تصویر پرتره رسمی پروفسور محمدی - رییس دپارتمان',
    fileName: 'prof-mohammadi-hd.jpg',
    fileType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 2450000,
    sizeFormatted: '۲.۴۵ مگابایت',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    width: 3840,
    height: 2560,
    dpi: 300,
    folderId: 'f-news',
    categoryId: 'cat-news',
    albumIds: ['alb-1'],
    tags: ['استاد تمام', 'دانشگاه', 'تایید رسمی'],
    altText: 'پرتره رسمی پروفسور محمدی استاد برجسته دانشگاه',
    title: 'پرتره پروفسور محمدی',
    caption: 'عضو هیئت علمی نمونه و پژوهشگر برتر سال ۱۴۰۵',
    copyright: '© کلیه حقوق برای دانشگاه محفوظ است',
    photographer: 'رضا علوی',
    source: 'روابط عمومی کل',
    license: 'All Rights Reserved',
    exif: {
      camera: 'Canon EOS R5',
      lens: 'RF 85mm F1.2 L USM',
      iso: 100,
      aperture: 'f/2.0',
      exposure: '1/250 sec',
      focalLength: '85mm',
      flash: 'Did not fire',
      dateTaken: '۱۴۰۵/۰۲/۱۴ - ۱۰:۳۰',
      gpsLocationName: 'تهران، دانشکده مهندسی'
    },
    ai: {
      autoAltText: 'مرد لبخندزن با کت و شلوار رسمی در محیط دانشگاهی',
      autoCaption: 'تصویر باکیفیت پرتره رسمی استاد هیئت علمی',
      detectedObjects: ['شخص', 'کت و شلوار', 'عینک', 'محیط داخلی'],
      faceCount: 1,
      dominantColors: ['#1e293b', '#e2e8f0', '#0d9488'],
      extractedOcrText: 'دانشگاه جامع - سال ۱۴۰۵',
      safetyScore: 'safe'
    },
    versions: [
      { id: 'v1', presetName: 'اصلی (Ultra HD)', width: 3840, height: 2560, sizeBytes: 2450000, sizeFormatted: '۲.۴۵ MB', format: 'jpeg', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80' },
      { id: 'v2', presetName: 'وب‌پک فشرده WebP', width: 1920, height: 1280, sizeBytes: 380000, sizeFormatted: '۳۸۰ KB', format: 'webp', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80' },
      { id: 'v3', presetName: 'بندانگشتی Thumbnail', width: 400, height: 266, sizeBytes: 45000, sizeFormatted: '۴۵ KB', format: 'webp', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' }
    ],
    usages: [
      { id: 'u1', moduleName: 'اخبار و اطلاعیه‌ها', targetTitle: 'انتصاب پروفسور محمدی به سمت مدیریت پژوهش', targetUrl: '/news/101', usedAt: '۱۴۰۵/۰۲/۱۵' },
      { id: 'u2', moduleName: 'صفحه‌ساز هوشمند', targetTitle: 'صفحه معرفی هیئت علمی دانشگاه', targetUrl: '/pages/faculty', usedAt: '۱۴۰۵/۰۲/۱۸' }
    ],
    likesCount: 34,
    viewsCount: 1240,
    downloadsCount: 88,
    rating: 4.9,
    status: 'published',
    createdAt: '۱۴۰۵/۰۲/۱۴',
    updatedAt: '۱۴۰۵/۰۳/۰۱',
    fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    isFavorite: true
  },
  {
    id: 'ast-2',
    name: 'نمای سراسری سالن اصلی کنفرانس و همایش ملی',
    fileName: 'hall-conference-main.jpg',
    fileType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 4100000,
    sizeFormatted: '۴.۱۰ مگابایت',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80',
    width: 4000,
    height: 2250,
    dpi: 300,
    folderId: 'f-events',
    categoryId: 'cat-news',
    albumIds: ['alb-2'],
    tags: ['همایش ملی', 'دانشگاه', 'هوش مصنوعی'],
    altText: 'سالن بزرگ همایش‌های بین‌المللی با حضور حضار و نورپردازی استیج',
    title: 'افتتاحیه کنفرانس هوش مصنوعی',
    caption: 'حضور بیش از ۱۲۰۰ نفر از پژوهشگران کشوری و بین‌المللی',
    copyright: '© دانشگاه علوم و فناوری',
    photographer: 'امیر حسینی',
    source: 'دبیرخانه همایش',
    license: 'CC BY 4.0',
    exif: {
      camera: 'Sony A7 IV',
      lens: 'FE 24-70mm F2.8 GM',
      iso: 800,
      aperture: 'f/2.8',
      exposure: '1/125 sec',
      focalLength: '24mm',
      flash: 'Off',
      dateTaken: '۱۴۰۵/۰۳/۰۱ - ۰۹:۱۵',
      gpsLocationName: 'مرکز همایش‌های بین‌المللی'
    },
    ai: {
      autoAltText: 'محیط آمفی‌تئاتر بزرگ با استیج و صفحات نمایش عریض',
      autoCaption: 'تصویر پانورامیک از مراسم افتتاحیه سمینار علمی',
      detectedObjects: ['سالن همایش', 'صحنه نمایش', 'نورپردازی', 'جمعیت'],
      faceCount: 45,
      dominantColors: ['#0f172a', '#3b82f6', '#f59e0b'],
      extractedOcrText: 'همایش ملی فناوری‌های نوین - ۱۴۰۵',
      safetyScore: 'safe'
    },
    versions: [
      { id: 'v1', presetName: 'اصلی 4K', width: 4000, height: 2250, sizeBytes: 4100000, sizeFormatted: '۴.۱۰ MB', format: 'jpeg', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80' },
      { id: 'v2', presetName: 'WebP بهینه‌سازی شده', width: 1920, height: 1080, sizeBytes: 420000, sizeFormatted: '۴۲۰ KB', format: 'webp', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80' }
    ],
    usages: [
      { id: 'u1', moduleName: 'اسلایدر اصلی', targetTitle: 'اسلایدر هدر صفحه اول پرتال', targetUrl: '/slider', usedAt: '۱۴۰۵/۰۳/۰۲' }
    ],
    likesCount: 52,
    viewsCount: 2300,
    downloadsCount: 140,
    rating: 5.0,
    status: 'published',
    createdAt: '۱۴۰۵/۰۳/۰۱',
    updatedAt: '۱۴۰۵/۰۳/۰۲',
    fileHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    isFavorite: true
  },
  {
    id: 'ast-3',
    name: 'ویدیو تیزر معرفی امکانات آزمایشگاه‌های رباتیک',
    fileName: 'robotics-lab-intro-1080p.mp4',
    fileType: 'video',
    mimeType: 'video/mp4',
    sizeBytes: 45800000,
    sizeFormatted: '۴۵.۸۰ مگابایت',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-details-4148-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    durationSeconds: 145,
    width: 1920,
    height: 1080,
    folderId: 'f-videos',
    categoryId: 'cat-media',
    albumIds: ['alb-2'],
    tags: ['فرمت HD', 'هوش مصنوعی', 'آموزشی'],
    altText: 'ویدیو HD رباتیک و مدارهای الکترونیکی هوشمند آزمایشگاه مرکزی',
    title: 'تیزر آزمایشگاه رباتیک',
    caption: 'معرفی تجهیزات جدید تست سخت‌افزاری و هوش مصنوعی',
    copyright: '© مرکز فناوری اطلاعات',
    photographer: 'استودیو رسانه دانشگاه',
    source: 'معاونت پژوهشی',
    license: 'All Rights Reserved',
    ai: {
      autoAltText: 'نمای نزدیک از برد مدارهای الکترونیکی و قطعات روباتیک',
      autoCaption: 'ویدیو باکیفیت کیفیت Full HD از آزمایشگاه رباتیک',
      detectedObjects: ['برد الکترونیکی', 'ربات', 'تجهیزات آزمایشگاهی'],
      dominantColors: ['#0d9488', '#0284c7'],
      safetyScore: 'safe'
    },
    versions: [
      { id: 'v1', presetName: '1080p Full HD', width: 1920, height: 1080, sizeBytes: 45800000, sizeFormatted: '۴۵.۸ MB', format: 'mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-details-4148-large.mp4' },
      { id: 'v2', presetName: '720p HD Compact', width: 1280, height: 720, sizeBytes: 18200000, sizeFormatted: '۱۸.۲ MB', format: 'mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-details-4148-large.mp4' }
    ],
    usages: [
      { id: 'u1', moduleName: 'دوره‌های آموزشی', targetTitle: 'دوره کارگاهی ساخت روبات‌های صنعتی', targetUrl: '/tuts/12', usedAt: '۱۴۰۵/۰۳/۱۰' }
    ],
    likesCount: 89,
    viewsCount: 3400,
    downloadsCount: 210,
    rating: 4.8,
    status: 'published',
    createdAt: '۱۴۰۵/۰۲/۲۸',
    updatedAt: '۱۴۰۵/۰۳/۰۵',
    fileHash: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    isFavorite: false
  },
  {
    id: 'ast-4',
    name: 'آیین‌نامه جدید انتخاب واحد و تقویم آموزشی نیمسال',
    fileName: 'academic-regulations-1405.pdf',
    fileType: 'document',
    mimeType: 'application/pdf',
    sizeBytes: 3200000,
    sizeFormatted: '۳.۲۰ مگابایت',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    thumbnailUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=400&q=80',
    folderId: 'f-docs',
    categoryId: 'cat-doc',
    albumIds: [],
    tags: ['تایید رسمی', 'دانشگاه'],
    altText: 'فایل PDF سند آیین‌نامه امتحانات و تقویم نیمسال تحصیلی',
    title: 'دستورالعمل جامع آموزشی ۱۴۰۵',
    caption: 'مصوب شورای عالی آموزش کل دانشگاه',
    copyright: '© حوزه معاونت آموزشی',
    photographer: 'دبیرخانه مرکزی',
    source: 'مدیریت آموزش',
    license: 'Public Domain',
    ai: {
      extractedOcrText: 'جمهوری اسلامی ایران - آیین نامه جامع آموزشی نیمسال تحصیلی ۱۴۰۵-۱۴۰۶',
      autoCaption: 'سند رسمی PDF مقررات آموزشی',
      safetyScore: 'safe'
    },
    versions: [
      { id: 'v1', presetName: 'سند PDF اصلی', width: 0, height: 0, sizeBytes: 3200000, sizeFormatted: '۳.۲۰ MB', format: 'pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
    ],
    usages: [
      { id: 'u1', moduleName: 'اخبار و اطلاعیه‌ها', targetTitle: 'اطلاعیه تمدید مهلت انتخاب واحد', targetUrl: '/news/nt-1', usedAt: '۱۴۰۵/۰۳/۱۹' }
    ],
    likesCount: 18,
    viewsCount: 5600,
    downloadsCount: 1420,
    rating: 4.7,
    status: 'published',
    createdAt: '۱۴۰۵/۰۱/۲۰',
    updatedAt: '۱۴۰۵/۰۳/۱۲',
    fileHash: '4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
    isFavorite: true
  },
  {
    id: 'ast-5',
    name: 'لوگوی رسمی دانشگاه با کیفیت وکتور SVG بی‌پک',
    fileName: 'university-official-logo-vector.svg',
    fileType: 'image',
    mimeType: 'image/svg+xml',
    sizeBytes: 120000,
    sizeFormatted: '۱۲۰ کیلوبایت',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
    width: 800,
    height: 800,
    folderId: 'f-branding',
    categoryId: 'cat-brand',
    albumIds: [],
    tags: ['هویت بصری', 'وکتور', 'تایید رسمی'],
    altText: 'لوگوی شفاف رسمی دانشگاه برای استفاده در بنرها و هدرها',
    title: 'لوگو رسمی دانشگاه (SVG)',
    caption: 'نسخه استاندارد وکتور قابل بزرگنمایی بدون افت کیفیت',
    copyright: '© اداره روابط عمومی و برندینگ',
    photographer: 'واحد گرافیک',
    source: 'روابط عمومی',
    license: 'Editorial Use Only',
    ai: {
      autoAltText: 'لوگوی هندسی تقارنی آبی‌رنگ با خطوط مدرن',
      dominantColors: ['#0284c7', '#0d9488'],
      safetyScore: 'safe'
    },
    versions: [
      { id: 'v1', presetName: 'SVG وکتور', width: 800, height: 800, sizeBytes: 120000, sizeFormatted: '۱۲۰ KB', format: 'svg', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg' },
      { id: 'v2', presetName: 'PNG با پس‌زمینه شفاف', width: 2000, height: 2000, sizeBytes: 340000, sizeFormatted: '۳۴۰ KB', format: 'png', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg' }
    ],
    usages: [
      { id: 'u1', moduleName: 'صفحه‌ساز هوشمند', targetTitle: 'هدر کلیه صفحات وب‌سایت', targetUrl: '/pages/global-header', usedAt: '۱۴۰۵/۰۱/۰۱' }
    ],
    likesCount: 110,
    viewsCount: 8900,
    downloadsCount: 3200,
    rating: 5.0,
    status: 'published',
    createdAt: '۱۴۰۵/۰۱/۰۱',
    updatedAt: '۱۴۰۵/۰۱/۰۱',
    fileHash: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
    isFavorite: true
  },
  {
    id: 'ast-6',
    name: 'تصویر بدون Alt Text - کارگاه تخصصی پردازش تصویر',
    fileName: 'image-processing-workshop-photo.jpg',
    fileType: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 1850000,
    sizeFormatted: '۱.۸۵ مگابایت',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=80',
    width: 3000,
    height: 2000,
    folderId: 'f-news',
    categoryId: 'cat-news',
    albumIds: ['alb-smart-alt'],
    tags: ['همایش ملی', 'هوش مصنوعی'],
    altText: '', // Empty Alt Text for testing smart filter & audit!
    title: 'کارگاه عملی پردازش تصویر با پایتون',
    caption: 'دانشجویان در حال کدنویسی تعاملی روی مانیتورها',
    copyright: '© انجمن علمی مهندسی',
    photographer: 'علی کاظمی',
    source: 'دانشکده برق و کامپیوتر',
    license: 'CC BY 4.0',
    exif: {
      camera: 'Nikon Z6 II',
      iso: 400,
      aperture: 'f/4.0',
      dateTaken: '۱۴۰۵/۰۳/۰۴'
    },
    ai: {
      autoAltText: 'گروهی از دانشجویان در لابراتوار کامپیوتر در حال بررسی دیاگرام‌ها',
      autoCaption: 'کارگاه آموزشی کدنویسی روی لپ‌تاپ‌ها',
      detectedObjects: ['دانشجو', 'لپ‌تاپ', 'میز کار', 'نمایشگر'],
      faceCount: 3,
      dominantColors: ['#1e293b', '#38bdf8'],
      safetyScore: 'safe'
    },
    versions: [
      { id: 'v1', presetName: 'اصلی', width: 3000, height: 2000, sizeBytes: 1850000, sizeFormatted: '۱.۸۵ MB', format: 'jpeg', url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80' }
    ],
    usages: [], // Unused asset for testing unused filter!
    likesCount: 12,
    viewsCount: 310,
    downloadsCount: 15,
    rating: 4.2,
    status: 'published',
    createdAt: '۱۴۰۵/۰۳/۰۴',
    updatedAt: '۱۴۰۵/۰۳/۰۴',
    fileHash: '8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c',
    isFavorite: false
  }
];
