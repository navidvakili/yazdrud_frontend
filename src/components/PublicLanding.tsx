// ============================================================
// PublicLanding — صفحه فرود عمومی
// ============================================================

import { motion } from 'motion/react';
import {
  BookOpen,
  Award,
  Users,
  GraduationCap,
  ArrowRightLeft,
} from 'lucide-react';

interface PublicLandingProps {
  onGoToLogin: () => void;
}

export default function PublicLanding({ onGoToLogin }: PublicLandingProps) {
  const news = [
    {
      id: 'n1',
      title: 'آغاز ثبت‌نام دوره تابستانه و انتخاب واحد نیمسال جدید',
      date: '۱۴۰۵/۰۳/۲۸',
      desc: 'دانشجویان محترم تمامی مقاطع تحصیلی می‌توانند بر اساس زمان‌بندی اعلام شده نسبت به ثبت‌نام اقدام نمایند.',
      category: 'آموزشی',
    },
    {
      id: 'n2',
      title: 'درخشش دانشجویان گروه هنر و معماری در جشنواره ملی خلاقیت',
      date: '۱۴۰۵/۰۳/۱۵',
      desc: 'دانشجویان دانشکده هنر دانشگاه علم و هنر موفق به کسب رتبه‌های نخست در شاخه‌های طراحی صنعتی و عکاسی شدند.',
      category: 'پژوهشی',
    },
    {
      id: 'n3',
      title: 'برگزاری کارگاه تخصصی هوش مصنوعی کاربردی در مهندسی',
      date: '۱۴۰۵/۰۳/۰۹',
      desc: 'کارگاه تعاملی هوش مصنوعی با حضور اساتید برجسته بین‌المللی روز دوشنبه در تالار شیخ بهایی برگزار می‌گردد.',
      category: 'کارگاه تخصصی',
    },
  ];

  const statistics = [
    { label: 'دانشجویان فعال', count: '+۶,۲۰۰', icon: Users, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40' },
    { label: 'اعضای هیئت علمی', count: '+۱۸۰', icon: GraduationCap, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' },
    { label: 'رشته‌های تحصیلی', count: '۵۴ دپارتمان', icon: BookOpen, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
    { label: 'افتخارات علمی کشوری', count: '+۹۵ رتبه برتر', icon: Award, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40' },
  ];

  const colleges = [
    { name: 'دانشکده هنر و معماری', desc: 'پیشرو در ارائه کارگاه‌های عملی هنر، مرمت، معماری و صنایع دستی با تکیه بر فرهنگ اصیل اسلامی ایرانی.' },
    { name: 'دانشکده فنی و مهندسی', desc: 'مجهز به کارگاه‌های مدرن برنامه نویسی، آزمایشگاه‌های پیشرفته و قطب محاسبات سریع ابری.' },
    { name: 'دانشکده علوم انسانی', desc: 'تحقیق و تدریس در دیسپلین‌های روانشناسی، حقوق، مدیریت بازرگانی و گردشگری پایدار.' },
  ];

  return (
    <div id="public-landing-container" className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300 pb-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-teal-500/10 via-indigo-500/5 to-transparent pt-12 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
            سامانه جامع آموزش، امور مالی و پژوهشی
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight mb-6"
          >
            پرتال جامع دانشگاهی کارانت <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-indigo-600 dark:from-teal-400 dark:to-indigo-400 text-3xl sm:text-4xl md:text-5xl block mt-2">
              ویژه دانشگاه علم و هنر
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-10"
          >
            به پرتال جامع دانشگاهی کارانت خوش آمدید؛ سامانه‌ای هوشمند، یکپارچه و پیشرفته که به طور اختصاصی ویژه دانشگاه علم و هنر توسعه یافته است تا تسهیل‌گر فرآیندهای آموزشی دانشجویان، هدایت درسی اساتید ارجمند و بازبینی دقیق گزارش‌های مالی باشد.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              id="cta-enter-portal"
              onClick={onGoToLogin}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all duration-300 shadow-lg shadow-teal-600/20 hover:shadow-teal-600/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowRightLeft className="w-5 h-5" />
              ورود به سیستم و پنل کاربری
            </button>
          </motion.div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statistics.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 text-center"
            >
              <div className={`inline-flex p-3 rounded-xl ${stat.color} mb-3`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">{stat.count}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* News Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 text-center">
          آخرین اخبار و اطلاعیه‌ها
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {news.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all"
            >
              <span className="inline-block px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-bold mb-3">
                {item.category}
              </span>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2 leading-relaxed">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                {item.desc}
              </p>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{item.date}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Colleges Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-8 text-center">
          دانشکده‌های دانشگاه
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {colleges.map((college, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800"
            >
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2">{college.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{college.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          © ۱۴۰۵ پرتال جامع دانشگاهی کارانت | تمامی حقوق محفوظ است
        </p>
      </footer>
    </div>
  );
}
