// ============================================================
// NewCourseDialog — فرم ایجاد دوره آموزشی جدید
// ============================================================

import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Upload } from 'lucide-react';
import { JalaliDatepicker } from '../../shared/JalaliDatepicker';
import type { TutCourse, Instructor } from '../../shared/types';

interface NewCourseDialogProps {
  isOpen: boolean;
  // Form state
  title: string;
  setTitle: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  instructorSearch: string;
  setInstructorSearch: (v: string) => void;
  instructorOpen: boolean;
  setInstructorOpen: (v: boolean) => void;
  instructorId: string;
  setInstructorId: (v: string) => void;
  section: string[];
  setSection: (v: string[]) => void;
  active: boolean;
  setActive: (v: boolean) => void;
  duration: string;
  setDuration: (v: string) => void;
  capacity: string;
  setCapacity: (v: string) => void;
  cost: string;
  setCost: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  regStartDate: string;
  setRegStartDate: (v: string) => void;
  regEndDate: string;
  setRegEndDate: (v: string) => void;
  image: File | null;
  setImage: (v: File | null) => void;
  imagePreview: string | null;
  setImagePreview: (v: string | null) => void;
  description: string;
  setDescription: (v: string) => void;
  prerequisites: string;
  setPrerequisites: (v: string) => void;
  daysOfWeek: string[];
  setDaysOfWeek: (v: string[]) => void;
  courseTime: string;
  setCourseTime: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  // Data
  categories: string[];
  instructors: Instructor[];
  filteredInstructors: Instructor[];
  // Handlers
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  formatCostInput: (v: string) => string;
}

export default function NewCourseDialog({
  isOpen,
  title, setTitle,
  category, setCategory,
  instructorSearch, setInstructorSearch,
  instructorOpen, setInstructorOpen,
  instructorId, setInstructorId,
  section, setSection,
  active, setActive,
  duration, setDuration,
  capacity, setCapacity,
  cost, setCost,
  startDate, setStartDate,
  endDate, setEndDate,
  regStartDate, setRegStartDate,
  regEndDate, setRegEndDate,
  image, setImage,
  imagePreview, setImagePreview,
  description, setDescription,
  prerequisites, setPrerequisites,
  daysOfWeek, setDaysOfWeek,
  courseTime, setCourseTime,
  location, setLocation,
  categories,
  instructors,
  filteredInstructors,
  onSubmit,
  onClose,
  formatCostInput,
}: NewCourseDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto pt-8 pb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-6xl p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-gray-900 dark:text-white leading-snug mb-4 flex items-center gap-1.5">
              <Plus className="w-5 h-5 text-teal-600" />
              تعریف و انتشار دوره آموزشی مهارتی جدید
            </h3>

            <form onSubmit={onSubmit} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">عنوان کامل کارگاه آموزشی *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: کارگاه تخصصی پایتون در پردازش تصویر"
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">دپارتمان یا حوزه علمی</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none appearance-none font-sans"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مدرس منتسب (از لیست اساتید)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={instructorSearch}
                      onChange={(e) => setInstructorSearch(e.target.value)}
                      onFocus={() => setInstructorOpen(true)}
                      onBlur={() => setTimeout(() => setInstructorOpen(false), 200)}
                      placeholder="جستجوی نام استاد..."
                      className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                    />
                    {instructorOpen && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredInstructors.length === 0 ? (
                          <div className="p-3 text-xs text-gray-400 text-center">موردی یافت نشد</div>
                        ) : (
                          filteredInstructors.map((inst) => (
                            <button
                              key={inst.id}
                              type="button"
                              onMouseDown={() => {
                                setInstructorSearch(inst.name);
                                setInstructorId(String(inst.id));
                                setInstructorOpen(false);
                              }}
                              className={`w-full text-right px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 ${
                                String(inst.id) === instructorId ? 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300' : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-[10px] shrink-0">
                                {inst.name.charAt(0)}
                              </span>
                              <span>{inst.name}</span>
                              {inst.specialty && <span className="text-[10px] text-gray-400">({inst.specialty})</span>}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {instructorId && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-lg">
                        {instructors.find(i => String(i.id) === instructorId)?.name || 'مدرس انتخاب شد'}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setInstructorSearch(''); setInstructorId(''); }}
                        className="text-gray-400 hover:text-red-500 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">محل نمایش در صفحه اصلی</label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {[
                      { value: 'normal', label: 'عادی' },
                      { value: 'featured', label: 'پیشنهاد ویژه' },
                      { value: 'pre_register', label: 'پیش ثبت نام' },
                      { value: 'free', label: 'رایگان' },
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          value={value}
                          checked={section.includes(value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSection([...section, value]);
                            } else {
                              setSection(section.filter(v => v !== value));
                            }
                          }}
                          className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">وضعیت دوره</label>
                  <div className="flex items-center gap-2 pr-1 pt-1.5">
                    <button
                      type="button"
                      dir="ltr"
                      onClick={() => setActive(!active)}
                      className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className={`text-xs font-bold ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                      {active ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">طول دوره (ساعت)</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="مثال: ۲۴ ساعت"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ظرفیت پذیرش (نفر)</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="مثال: ۳۰"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">شهریه ثبت‌نام (ریال) *</label>
                  <input
                    type="text"
                    required
                    value={cost}
                    onChange={(e) => setCost(formatCostInput(e.target.value))}
                    placeholder="مثال: ۴,۵۰۰,۰۰۰"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ شروع دوره *</label>
                  <JalaliDatepicker
                    value={startDate}
                    onChange={(date) => setStartDate(date)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ پایان دوره</label>
                  <JalaliDatepicker
                    value={endDate}
                    onChange={(date) => setEndDate(date)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مهلت شروع ثبت‌نام</label>
                  <JalaliDatepicker
                    value={regStartDate}
                    onChange={(date) => setRegStartDate(date)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مهلت پایان ثبت‌نام</label>
                  <JalaliDatepicker
                    value={regEndDate}
                    onChange={(date) => setRegEndDate(date)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تصویر دوره</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center p-2.5 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-950 hover:border-teal-400 dark:hover:border-teal-600 transition-all cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImage(file);
                            setImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                      <div className="flex items-center gap-1">
                        <Upload className="w-4 h-4 text-gray-400" />
                        <span className="text-[10px] text-gray-400">آپلود</span>
                      </div>
                    </label>
                    {imagePreview && (
                      <div className="relative w-12 h-8 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                        <img
                          src={imagePreview}
                          alt="پیش نمایش"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => { setImage(null); setImagePreview(null); }}
                          className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-full"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">توضیحات و سرفصل تفصیلی</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="سرفصل‌های آموزشی، پیشنیازها و اهداف دوره..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none resize-none font-sans"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">پیشنیازها</label>
                  <input
                    type="text"
                    value={prerequisites}
                    onChange={(e) => setPrerequisites(e.target.value)}
                    placeholder="مثال: پایتون مقدماتی"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ساعت برگزاری دوره</label>
                  <input
                    type="text"
                    value={courseTime}
                    onChange={(e) => setCourseTime(e.target.value)}
                    placeholder="مثال: ۱۴:۰۰ - ۱۸:۰۰"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مکان برگزاری</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="مثال: سالن کنفرانس شماره ۲"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">روزهای برگزاری</label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {[
                    { value: 'شنبه', label: 'شنبه' },
                    { value: 'یکشنبه', label: 'یکشنبه' },
                    { value: 'دوشنبه', label: 'دوشنبه' },
                    { value: 'سه‌شنبه', label: 'سه‌شنبه' },
                    { value: 'چهارشنبه', label: 'چهارشنبه' },
                    { value: 'پنجشنبه', label: 'پنجشنبه' },
                    { value: 'جمعه', label: 'جمعه' },
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        value={value}
                        checked={daysOfWeek.includes(value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDaysOfWeek([...daysOfWeek, value]);
                          } else {
                            setDaysOfWeek(daysOfWeek.filter(v => v !== value));
                          }
                        }}
                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  تعریف و انتشار رسمی دوره
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}