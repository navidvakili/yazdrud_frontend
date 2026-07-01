// ============================================================
// TutsModule — Course Filter Bar Component
// ============================================================

import { Search, Filter, LayoutGrid, List, Layers, User, Plus } from 'lucide-react';

interface CourseFilterBarProps {
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    selectedCategory: string;
    setSelectedCategory: (v: string) => void;
    categories: string[];
    viewMode: 'grid' | 'list';
    setViewMode: (v: 'grid' | 'list') => void;
    currentUserRole: string;
    setIsCategoryModalOpen: (v: boolean) => void;
    setIsInstructorManagementOpen: (v: boolean) => void;
    setIsNewCourseModalOpen: (v: boolean) => void;
    setListPage: (v: number) => void;
}

export default function CourseFilterBar({
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    categories, viewMode, setViewMode,
    currentUserRole,
    setIsCategoryModalOpen, setIsInstructorManagementOpen,
    setIsNewCourseModalOpen, setListPage,
}: CourseFilterBarProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 dark:text-gray-500">
                    <Search className="w-4 h-4" />
                </span>
                <input
                    type="text"
                    placeholder="جستجوی عنوان کارگاه مهارتی، نام مدرس یا سرفصل آموزشی..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setListPage(1); }}
                    className="w-full text-xs pr-10 pl-3.5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                />
            </div>

            <div className="relative min-w-[220px]">
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                    <Filter className="w-4 h-4" />
                </span>
                <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setListPage(1); }}
                    className="w-full text-xs pr-10 pl-3.5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 appearance-none font-sans"
                >
                    <option value="">دپارتمان و گروه‌های درسی (همه)</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-2xl p-1 shrink-0">
                <button
                    onClick={() => {
                        setViewMode('grid');
                        localStorage.setItem('tuts_view_mode', 'grid');
                    }}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'grid'
                        ? 'bg-teal-500 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    title="نمایش گرید"
                >
                    <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                    onClick={() => {
                        setViewMode('list');
                        localStorage.setItem('tuts_view_mode', 'list');
                    }}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${viewMode === 'list'
                        ? 'bg-teal-500 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    title="نمایش لیستی"
                >
                    <List className="w-4 h-4" />
                </button>
            </div>

            {currentUserRole === 'admin' && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="px-5 py-3.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                        title="مدیریت گروه‌ها و دپارتمان‌ها"
                    >
                        <Layers className="w-4 h-4 text-teal-600" />
                        تعریف گروه‌ها
                    </button>

                    <button
                        onClick={() => setIsInstructorManagementOpen(true)}
                        className="px-5 py-3.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                        title="مدیریت اساتید"
                    >
                        <User className="w-4 h-4 text-teal-600" />
                        مدیریت اساتید
                    </button>

                    <button
                        onClick={() => setIsNewCourseModalOpen(true)}
                        className="px-5 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        تعریف کارگاه جدید
                    </button>
                </div>
            )}
        </div>
    );
}
