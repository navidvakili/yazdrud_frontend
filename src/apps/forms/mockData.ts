import { FormTheme } from './types';

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
