// ============================================================
// NewsManagement — سیستم مدیریت اخبار و اطلاعیه‌ها
// شامل: آرشیو، ویرایشگر، دسته‌بندی‌ها، آمار و تحلیل
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Newspaper, Plus, Search, Filter, Eye, Heart, Pin, Edit3,
  Trash2, Calendar, User as UserIcon, Tag, Clock, Sparkles,
  Share2, FileText, Download, MessageSquare, BarChart2, Layers,
  CheckCircle2, X, Send, SlidersHorizontal, LayoutGrid, List,
  Flame, AlertCircle, ExternalLink, Info, Loader2, Upload,
} from 'lucide-react';
import type { NewsItem, NewsCategory, User } from '@/src/shared-types';
import ToastNotification from '@/src/shared-components/ToastNotification';
import WysiwygEditor from '@/src/shared-components/WysiwygEditor';
import TagInput from '@/src/shared-components/TagInput';
import MediaManager from '@/src/shared-components/MediaManager';
import {
  fetchNews, fetchNewsById, createNews, updateNews, deleteNews,
  togglePin, incrementViews,
  fetchCategories, createCategory, updateCategory, deleteCategory,
  fetchAnalytics,
} from './api';
import { useAppPermissions } from '@/src/shared-utils/PermissionsContext';

interface NewsManagementProps {
  user?: User | null;
  activeTabId?: string;
  moduleId?: string;
  onOpenTab?: (id: string, title: string, iconName: string) => void;
}

type SubTab = 'list' | 'editor' | 'categories' | 'analytics';

export default function NewsManagement({ user, activeTabId, moduleId }: NewsManagementProps) {
  const { can } = useAppPermissions();
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('support');
  const isEditor = user?.roles?.includes('editor');
  const roleCanEdit = isAdmin || isEditor;
  const permCanEdit = can('news.create') || can('news.edit');
  const permCanDelete = can('news.delete');
  const canEdit = roleCanEdit || permCanEdit;
  const canDelete = roleCanEdit || permCanDelete;

  // ===== Sub-tab state =====
  const [activeTab, setActiveTab] = useState<SubTab>(() => {
    if (moduleId === 'news-create') return 'editor';
    if (moduleId === 'news-categories') return 'categories';
    if (moduleId === 'news-analytics') return 'analytics';
    return 'list';
  });

  // ===== Data state =====
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalNews, setTotalNews] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ===== Filter state =====
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState<number | 'all'>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'views' | 'likes'>('newest');

  // ===== Reader Modal State =====
  const [activeReaderItem, setActiveReaderItem] = useState<NewsItem | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  // ===== Editor State =====
  const [editingNewsId, setEditingNewsId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | null>(null);
  const [formStatus, setFormStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formMessage, setFormMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // ===== New Category State =====
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30');
  const [catLoading, setCatLoading] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [editCatColor, setEditCatColor] = useState('');
  const [editCatLoading, setEditCatLoading] = useState(false);

  // ===== Toast state =====
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ===== Delete Confirmation Modal state =====
  const [deleteNewsId, setDeleteNewsId] = useState<number | null>(null);
  const [deleteCatId, setDeleteCatId] = useState<number | null>(null);

  // ===== Analytics state =====
  const [analytics, setAnalytics] = useState<any>(null);

  // ===== Fetch data =====
  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        per_page: 12,
        sort: sortBy,
      };
      if (searchQuery) params.search = searchQuery;
      if (selectedCatFilter !== 'all') params.category_id = selectedCatFilter;
      if (selectedStatusFilter !== 'all') params.status = selectedStatusFilter;

      const data = await fetchNews(params);
      setNewsList(data.data);
      setTotalPages(data.last_page);
      setTotalNews(data.total);
    } catch (err: any) {
      console.error('Error loading news:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, searchQuery, selectedCatFilter, selectedStatusFilter]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories();
      setCategories(data.data);
    } catch (err: any) {
      console.error('Error loading categories:', err);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadNews();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCatFilter, selectedStatusFilter, sortBy]);

  // ===== Handlers =====
  const handleOpenReader = async (item: NewsItem) => {
    try {
      await incrementViews(item.id);
      setActiveReaderItem({ ...item, views_count: item.views_count + 1 });
    } catch {
      setActiveReaderItem(item);
    }
  };

  const handleTogglePin = async (itemId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await togglePin(itemId);
      setNewsList(prev => prev.map(n => n.id === itemId ? { ...n, is_pinned: !n.is_pinned } : n));
      if (activeReaderItem?.id === itemId) {
        setActiveReaderItem(prev => prev ? { ...prev, is_pinned: !prev.is_pinned } : null);
      }
    } catch (err) {
      console.error('Toggle pin error:', err);
    }
  };

  const confirmDeleteNews = async () => {
    if (!deleteNewsId) return;
    try {
      await deleteNews(deleteNewsId);
      setNewsList(prev => prev.filter(n => n.id !== deleteNewsId));
      if (activeReaderItem?.id === deleteNewsId) setActiveReaderItem(null);
      showToast('خبر با موفقیت حذف شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف خبر', 'error');
    } finally {
      setDeleteNewsId(null);
    }
  };

  const handleStartEdit = async (item: NewsItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormMessage(null);
    setActiveTab('editor');
    setFormLoading(true);
    try {
      const { data } = await fetchNewsById(item.id);
      setEditingNewsId(data.id);
      setFormTitle(data.title);
      setFormSummary(data.summary || '');
      setFormContent(data.content || '');
      setFormCategoryId(data.category_id ? Number(data.category_id) : null);
      setFormStatus(data.status);
      setFormIsPinned(data.is_pinned);
      setFormImageUrl(data.image_url || '');
      setFormTags(data.tags || []);
    } catch (err: any) {
      // Fallback to list item if detail fetch fails
      setEditingNewsId(item.id);
      setFormTitle(item.title);
      setFormSummary(item.summary || '');
      setFormContent(item.content || '');
      setFormCategoryId(item.category_id ? Number(item.category_id) : null);
      setFormStatus(item.status);
      setFormIsPinned(item.is_pinned);
      setFormImageUrl(item.image_url || '');
      setFormTags(item.tags || []);
      showToast(err.message || 'خطا در بارگذاری جزئیات خبر', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetForm = () => {
    setEditingNewsId(null);
    setFormTitle('');
    setFormSummary('');
    setFormContent('');
    setFormCategoryId(null);
    setFormStatus('published');
    setFormIsPinned(false);
    setFormImageUrl('');
    setFormTags([]);
    setFormMessage(null);
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      setFormMessage({ text: 'لطفاً عنوان خبر و متن اصلی را وارد نمایید.', type: 'error' });
      return;
    }

    const tagArray = formTags;
    setFormLoading(true);

    try {
      const payload = {
        title: formTitle,
        summary: formSummary || formTitle.slice(0, 120),
        content: formContent,
        category_id: formCategoryId,
        image_url: formImageUrl || undefined,
        status: formStatus,
        target_audience: 'all' as const,
        is_pinned: formIsPinned,
        tags: tagArray,
      };

      if (editingNewsId) {
        await updateNews(editingNewsId, payload);
        setFormMessage({ text: 'تغییرات خبر با موفقیت ذخیره گردید.', type: 'success' });
      } else {
        await createNews(payload);
        setFormMessage({ text: 'خبر جدید با موفقیت منتشر شد.', type: 'success' });
      }

      setTimeout(() => {
        setActiveTab('list');
        handleResetForm();
        loadNews();
      }, 1200);
    } catch (err: any) {
      if (err.errors) {
        const firstErr = Object.values(err.errors).flat()[0];
        setFormMessage({ text: firstErr as string, type: 'error' });
      } else {
        setFormMessage({ text: err.message || 'خطا در ذخیره خبر', type: 'error' });
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatLoading(true);
    try {
      await createCategory({
        name: newCatName,
        color: newCatColor,
        description: newCatDesc || undefined,
      });
      await loadCategories();
      setNewCatName('');
      setNewCatDesc('');
      showToast('دسته‌بندی با موفقیت ایجاد شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در ایجاد دسته‌بندی', 'error');
    } finally {
      setCatLoading(false);
    }
  };

  const handleStartEditCategory = (cat: NewsCategory) => {
    setEditingCategoryId(cat.id);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || '');
    setEditCatColor(cat.color || 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30');
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditCatName('');
    setEditCatDesc('');
    setEditCatColor('');
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryId || !editCatName.trim()) return;
    setEditCatLoading(true);
    try {
      await updateCategory(editingCategoryId, {
        name: editCatName.trim(),
        description: editCatDesc || undefined,
        color: editCatColor || undefined,
      });
      await loadCategories();
      handleCancelEditCategory();
      showToast('عنوان دسته‌بندی با موفقیت به‌روزرسانی شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در ویرایش دسته‌بندی', 'error');
    } finally {
      setEditCatLoading(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCatId) return;
    try {
      await deleteCategory(deleteCatId);
      await loadCategories();
      if (selectedCatFilter === deleteCatId) setSelectedCatFilter('all');
      showToast('دسته‌بندی با موفقیت حذف شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف دسته‌بندی', 'error');
    } finally {
      setDeleteCatId(null);
    }
  };

  // ===== Helper to get category name by id =====
  const getCategoryName = (id: number | null): string => {
    if (!id) return 'بدون دسته‌بندی';
    return categories.find(c => c.id === id)?.name || 'نامشخص';
  };

  // ===== Filtered news (client-side for existing items) =====
  const filteredNews = newsList; // server handles filtering

  // ===== Analytics metrics =====
  const publishedCount = newsList.filter(n => n.status === 'published').length;
  const totalViews = newsList.reduce((sum, n) => sum + n.views_count, 0);
  const totalLikes = newsList.reduce((sum, n) => sum + n.likes_count, 0);
  const pinnedCount = newsList.filter(n => n.is_pinned).length;

  // Load analytics when tab is analytics
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics().then(data => setAnalytics(data.data)).catch(() => {});
    }
  }, [activeTab]);

  // ===== Category color map for display =====
  const CATEGORY_COLORS: Record<string, string> = {
    'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30': 'teal',
    'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30': 'indigo',
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30': 'amber',
    'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30': 'rose',
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30': 'emerald',
    'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30': 'purple',
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-right rtl">
      {/* ===== Module Header Banner ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-teal-500/20">
        <div className="absolute top-0 left-0 translate-x-[-10%] translate-y-[-20%] w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
              <Newspaper className="w-4 h-4" />
              <span>سامانه خبررسانی و اطلاعیه‌های رسمی</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              پرتال مدیریت اخبار و اطلاعیه‌ها
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              انتشار، آرشیو، دسته‌بندی و تحلیل بازخورد اطلاعیه‌های آموزشی، پژوهشی، فرهنگی و رویدادهای تخصصی
            </p>
          </div>

          {canEdit && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => { handleResetForm(); setActiveTab('editor'); }}
                className="px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-black text-xs shadow-lg shadow-teal-500/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>انتشار خبر جدید</span>
              </button>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{totalNews}</div>
              <div className="text-[11px] text-gray-300">کل اخبار ثبت‌شده</div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{publishedCount}</div>
              <div className="text-[11px] text-gray-300">منتشر شده</div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{totalViews.toLocaleString('fa-IR')}</div>
              <div className="text-[11px] text-gray-300">بازدید کاربران</div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300">
              <Pin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{pinnedCount}</div>
              <div className="text-[11px] text-gray-300">اخبار ویژه</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Sub-Navigation Bar ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto p-1">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'list' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>آرشیو و لیست اخبار</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">{filteredNews.length}</span>
          </button>

          {canEdit && (
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'editor' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>{editingNewsId ? 'ویرایش خبر' : 'ارسال خبر جدید'}</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'categories' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>دسته‌بندی‌های خبری</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'analytics' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>آمار و تحلیل بازدیدها</span>
            </button>
          )}
        </div>

        {activeTab === 'list' && (
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
              title="نمایش کارتی"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
              title="نمایش جدولی"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ===== TAB 1: LIST & SEARCH ===== */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="جستجو در عنوان، متن یا برچسب اخبار..."
                  className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 transition-all placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute left-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="md:col-span-3">
                <select
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="published">منتشر شده</option>
                  <option value="draft">پیش‌نویس</option>
                  <option value="archived">آرشیو شده</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <select
                  value={selectedCatFilter === 'all' ? 'all' : String(selectedCatFilter)}
                  onChange={e => setSelectedCatFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full py-2.5 px-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="all">همه دسته‌بندی‌ها</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-gray-400 shrink-0 font-semibold text-[11px] flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                فیلتر سریع:
              </span>
              <button
                onClick={() => setSelectedCatFilter('all')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCatFilter === 'all' ? 'bg-teal-500 text-white shadow-xs' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                همه ({totalNews})
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatFilter(cat.id)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCatFilter === cat.id ? 'bg-teal-500 text-white shadow-xs' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.count !== undefined && <span className="opacity-75 font-mono text-[10px]">({cat.count})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
          )}

          {/* Grid View */}
          {!loading && viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map(item => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={item.id}
                  onClick={() => handleOpenReader(item)}
                  className={`group bg-white dark:bg-gray-900 rounded-3xl border ${
                    item.is_pinned ? 'border-amber-400/60 dark:border-amber-500/40 shadow-lg shadow-amber-500/5' : 'border-gray-100 dark:border-gray-800 shadow-xs'
                  } hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer relative`}
                >
                  {/* Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500/10 to-indigo-500/10">
                        <Newspaper className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-950/20 to-transparent" />

                    {item.is_pinned && (
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500 text-amber-950 font-black text-[10px] shadow-md flex items-center gap-1">
                        <Pin className="w-3 h-3 fill-current" />
                        <span>خبر ویژه</span>
                      </div>
                    )}

                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-teal-600/90 text-white font-bold text-[11px] backdrop-blur-md shadow-xs">
                      {item.category_name || 'عمومی'}
                    </div>

                    {item.status !== 'published' && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-600 text-white font-bold text-[10px]">
                        {item.status === 'draft' ? 'پیش‌نویس' : 'آرشیو شده'}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-teal-500" />
                          {item.published_at ? new Date(item.published_at).toLocaleDateString('fa-IR') : new Date(item.created_at).toLocaleDateString('fa-IR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                          {item.author_name || item.author_username}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {(item.tags || []).slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-semibold">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-[11px]" title="بازدید">
                        <Eye className="w-3.5 h-3.5 text-teal-500" />
                        <span className="font-mono">{item.views_count}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[11px]" title="پسندها">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span className="font-mono">{item.likes_count}</span>
                      </span>
                    </div>

                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => handleTogglePin(item.id, e)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            item.is_pinned ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'
                          }`}
                          title={item.is_pinned ? 'برداشتن از ویژه' : 'سنجاق به ویژه'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => handleStartEdit(item, e)}
                          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-teal-600 dark:text-teal-400 transition-colors cursor-pointer"
                          title="ویرایش"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={e => { e.stopPropagation(); setDeleteNewsId(item.id); }}
                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Table View */}
          {!loading && viewMode === 'table' && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                    <th className="py-3.5 px-4 font-bold">عنوان خبر</th>
                    <th className="py-3.5 px-4 font-bold">دسته‌بندی</th>
                    <th className="py-3.5 px-4 font-bold">تاریخ</th>
                    <th className="py-3.5 px-4 font-bold">نویسنده</th>
                    <th className="py-3.5 px-4 font-bold text-center">بازدید</th>
                    <th className="py-3.5 px-4 font-bold text-center">پسندها</th>
                    <th className="py-3.5 px-4 font-bold text-center">وضعیت</th>
                    <th className="py-3.5 px-4 font-bold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredNews.map(item => (
                    <tr key={item.id} onClick={() => handleOpenReader(item)} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                      <td className="py-3.5 px-4 font-extrabold text-gray-900 dark:text-white max-w-xs truncate">
                        <div className="flex items-center gap-2">
                          {item.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          <span>{item.title}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold text-[10px]">
                          {item.category_name || 'عمومی'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-500 dark:text-gray-400">
                        {item.published_at ? new Date(item.published_at).toLocaleDateString('fa-IR') : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">{item.author_name || item.author_username}</td>
                      <td className="py-3.5 px-4 font-mono text-center text-teal-600 dark:text-teal-400">{item.views_count}</td>
                      <td className="py-3.5 px-4 font-mono text-center text-rose-500">{item.likes_count}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {item.status === 'published' ? 'منتشر شده' : item.status === 'draft' ? 'پیش‌نویس' : 'آرشیو'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleOpenReader(item)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" title="مطالعه">
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <>
                              <button onClick={e => handleStartEdit(item, e)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-teal-600" title="ویرایش">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {canDelete && (
                                <button onClick={e => { e.stopPropagation(); setDeleteNewsId(item.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="حذف">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    page === currentPage ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredNews.length === 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center space-y-3 border border-gray-100 dark:border-gray-800">
              <Newspaper className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
              <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">هیچ خبری یافت نشد</h3>
              <p className="text-xs text-gray-400">عبارت دیگری جستجو کنید یا فیلترها را تغییر دهید.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 2: EDITOR ===== */}
      {activeTab === 'editor' && canEdit && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>{editingNewsId ? 'ویرایش خبر موجود' : 'ارسال و انتشار خبر جدید'}</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">اطلاعات، متن اصلی، عکس و پیوست‌ها را تنظیم نمایید.</p>
            </div>
            {editingNewsId && (
              <button onClick={handleResetForm} className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200">
                انصراف و خبر جدید
              </button>
            )}
          </div>

          {formMessage && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              formMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200'
            }`}>
              <Info className="w-4 h-4 shrink-0" />
              <span>{formMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveNews} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Fields */}
              <div className="lg:col-span-8 space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5">
                    عنوان خبر / اطلاعیه <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" required value={formTitle} onChange={e => setFormTitle(e.target.value)}
                    placeholder="مثال: آغاز ثبت‌نام دوره تابستانه"
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5">خلاصه خبر</label>
                  <textarea
                    rows={2} value={formSummary} onChange={e => setFormSummary(e.target.value)}
                    placeholder="توضیح کوتاه در کارت خبر..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5">
                    متن کامل خبر <span className="text-red-500">*</span>
                  </label>
                  <WysiwygEditor
                    content={formContent}
                    onChange={setFormContent}
                    placeholder="متن کامل خبر را بنویسید..."
                    minHeight="320px"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-teal-500" />
                    <span>برچسب‌ها</span>
                  </label>
                  <TagInput
                    tags={formTags}
                    onChange={setFormTags}
                    placeholder="برچسب را تایپ کنید و Enter بزنید..."
                    maxTags={15}
                  />
                </div>
              </div>

              {/* Sidebar Settings */}
              <div className="lg:col-span-4 space-y-5 bg-gray-50/50 dark:bg-gray-800/40 p-5 rounded-3xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-black text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">تنظیمات انتشار</h3>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">دسته‌بندی</label>
                  <select
                    value={formCategoryId || ''} onChange={e => setFormCategoryId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="">بدون دسته‌بندی</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">وضعیت</label>
                  <select
                    value={formStatus} onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="published">منتشر شده</option>
                    <option value="draft">پیش‌نویس</option>
                    <option value="archived">آرشیو شده</option>
                  </select>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={formIsPinned} onChange={e => setFormIsPinned(e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                      <Pin className="w-3.5 h-3.5 text-amber-500" />
                      خبر ویژه / سنجاق
                    </span>
                  </label>
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">تصویر شاخص</label>
                  <div className="space-y-2">
                    {formImageUrl ? (
                      <div className="relative h-32 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
                        <img src={formImageUrl} alt="پیش‌نمایش" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowMediaSelector(true)}
                            className="px-3 py-1.5 rounded-lg bg-white text-gray-800 text-xs font-bold cursor-pointer hover:bg-gray-100"
                          >
                            تغییر
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormImageUrl('')}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold cursor-pointer hover:bg-red-600"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowMediaSelector(true)}
                        className="w-full h-32 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-teal-500 hover:text-teal-500 transition-all cursor-pointer"
                      >
                        <Upload className="w-6 h-6" />
                        <span className="text-xs font-bold">انتخاب تصویر</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <button
                    type="submit" disabled={formLoading}
                    className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{editingNewsId ? 'ذخیره تغییرات' : 'انتشار خبر'}</span>
                  </button>
                  <button type="button" onClick={() => setActiveTab('list')} className="w-full py-2.5 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-300 cursor-pointer">
                    انصراف
                  </button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      )}

      {/* Media Manager for form image */}
      <MediaManager
        open={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={(url) => {
          setFormImageUrl(url);
        }}
        filter="image"
        title="انتخاب تصویر شاخص"
      />

      {/* ===== TAB 3: CATEGORIES ===== */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xs">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-600" />
                  <span>فهرست دسته‌بندی‌های فعال</span>
                </h3>
                <div className="space-y-3">
                  {categories.map(cat => (
                    <div key={cat.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60">
                      {editingCategoryId === cat.id ? (
                        <form onSubmit={handleUpdateCategory} className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">عنوان دسته‌بندی</label>
                            <input
                              type="text"
                              required
                              value={editCatName}
                              onChange={e => setEditCatName(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">توضیحات</label>
                            <textarea
                              rows={2}
                              value={editCatDesc}
                              onChange={e => setEditCatDesc(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">رنگ</label>
                            <select
                              value={editCatColor}
                              onChange={e => setEditCatColor(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-bold"
                            >
                              <option value="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30">سبز فیروزه‌ای</option>
                              <option value="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30">نیلی</option>
                              <option value="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">طلایی</option>
                              <option value="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">رز</option>
                              <option value="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">بنفش</option>
                              <option value="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">سبز</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={handleCancelEditCategory}
                              className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-900 text-xs font-bold text-gray-600 border border-gray-200 dark:border-gray-700 cursor-pointer"
                            >
                              انصراف
                            </button>
                            <button
                              type="submit"
                              disabled={editCatLoading}
                              className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {editCatLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              ذخیره عنوان
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${cat.color || 'bg-gray-100 text-gray-700'}`}>
                                {cat.name}
                              </span>
                              <span className="text-[11px] font-mono text-gray-400">({cat.count ?? 0} خبر)</span>
                            </div>
                            {cat.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{cat.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => { setSelectedCatFilter(cat.id); setActiveTab('list'); }}
                              className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-900 text-xs font-bold text-teal-600 border border-gray-200 dark:border-gray-700 hover:bg-teal-50"
                            >
                              مشاهده اخبار
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => handleStartEditCategory(cat)}
                                className="p-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/30 text-teal-600 cursor-pointer"
                                title="ویرایش عنوان دسته‌بندی"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => setDeleteCatId(cat.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
                                title="حذف دسته‌بندی"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="lg:col-span-4 bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <Plus className="w-4 h-4 text-teal-600" />
                  <span>تعریف دسته‌بندی جدید</span>
                </h3>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">عنوان</label>
                    <input
                      type="text" required value={newCatName} onChange={e => setNewCatName(e.target.value)}
                      placeholder="مثال: روابط بین‌الملل"
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">توضیحات</label>
                    <textarea
                      rows={2} value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)}
                      placeholder="توضیح مختصر..."
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">رنگ</label>
                    <select value={newCatColor} onChange={e => setNewCatColor(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold">
                      <option value="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30">سبز فیروزه‌ای</option>
                      <option value="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30">نیلی</option>
                      <option value="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">طلایی</option>
                      <option value="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">رز</option>
                      <option value="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">بنفش</option>
                      <option value="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">سبز</option>
                    </select>
                  </div>
                  <button
                    type="submit" disabled={catLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {catLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    افزودن دسته‌بندی
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB 4: ANALYTICS ===== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {!analytics ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Viewed */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <span>پربازدیدترین اخبار</span>
                </h3>
                <div className="space-y-3">
                  {analytics.top_viewed?.map((item: any, idx: number) => (
                    <div key={item.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 transition-all">
                      <div className="flex items-center gap-3 max-w-xs">
                        <span className="w-7 h-7 rounded-full bg-teal-500/10 text-teal-600 font-black text-xs flex items-center justify-center font-mono">#{idx + 1}</span>
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.title}</h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />{item.views_count}
                        </span>
                        <span className="text-xs font-mono font-bold text-rose-500 flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" />{item.likes_count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Liked */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <span>پربیشترین پسند</span>
                </h3>
                <div className="space-y-3">
                  {analytics.top_liked?.map((item: any, idx: number) => (
                    <div key={item.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 transition-all">
                      <div className="flex items-center gap-3 max-w-xs">
                        <span className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-600 font-black text-xs flex items-center justify-center font-mono">#{idx + 1}</span>
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.title}</h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono font-bold text-rose-500 flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" />{item.likes_count}
                        </span>
                        <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />{item.views_count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <BarChart2 className="w-5 h-5 text-indigo-500" />
                  <span>توزیع اخبار بر اساس دسته‌بندی</span>
                </h3>
                <div className="space-y-4 pt-2">
                  {analytics.category_distribution?.map((cat: any) => (
                    <div key={cat.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-800 dark:text-gray-200">{cat.name}</span>
                        <span className="font-mono text-gray-400">{cat.count} خبر ({cat.percentage}٪)</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div className="h-full rounded-full bg-teal-500 transition-all duration-500" style={{ width: `${cat.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                  {analytics.uncategorized_count > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-800 dark:text-gray-200">بدون دسته‌بندی</span>
                        <span className="font-mono text-gray-400">{analytics.uncategorized_count} خبر</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Toast Notification ===== */}
      <ToastNotification toast={toast} />

      {/* ===== Delete News Confirmation Modal ===== */}
      <AnimatePresence>
        {deleteNewsId !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setDeleteNewsId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-md pointer-events-auto text-center">
                <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">حذف خبر</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  آیا از حذف این خبر اطمینان دارید؟
                  <br />
                  <span className="text-rose-500 text-xs">این عمل قابل بازگشت نیست.</span>
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setDeleteNewsId(null)}
                    className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={confirmDeleteNews}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors cursor-pointer"
                  >
                    حذف خبر
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== Delete Category Confirmation Modal ===== */}
      <AnimatePresence>
        {deleteCatId !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setDeleteCatId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-md pointer-events-auto text-center">
                <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">حذف دسته‌بندی</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  آیا از حذف این دسته‌بندی اطمینان دارید؟
                  <br />
                  <span className="text-amber-500 text-xs">خبرهای این دسته بدون دسته‌بندی می‌شوند.</span>
                  <br />
                  <span className="text-rose-500 text-xs">این عمل قابل بازگشت نیست.</span>
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setDeleteCatId(null)}
                    className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={confirmDeleteCategory}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors cursor-pointer"
                  >
                    حذف دسته‌بندی
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== READER MODAL ===== */}
      <AnimatePresence>
        {activeReaderItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl max-w-3xl w-full border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col text-right"
            >
              {/* Banner */}
              <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-gray-950 shrink-0">
                {activeReaderItem.image_url ? (
                  <img src={activeReaderItem.image_url} alt={activeReaderItem.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500/20 to-indigo-500/20">
                    <Newspaper className="w-20 h-20 text-gray-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
                <button
                  onClick={() => setActiveReaderItem(null)}
                  className="absolute top-4 left-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-6 right-6 left-6 space-y-2 text-white">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-teal-600 font-bold text-xs shadow-xs">
                      {activeReaderItem.category_name || 'عمومی'}
                    </span>
                    {activeReaderItem.is_pinned && (
                      <span className="px-3 py-1 rounded-xl bg-amber-500 text-amber-950 font-black text-xs flex items-center gap-1 shadow-xs">
                        <Pin className="w-3.5 h-3.5" />خبر ویژه
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black leading-snug">{activeReaderItem.title}</h1>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
                <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-teal-600" />
                      {activeReaderItem.published_at ? new Date(activeReaderItem.published_at).toLocaleDateString('fa-IR') : new Date(activeReaderItem.created_at).toLocaleDateString('fa-IR')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <UserIcon className="w-4 h-4 text-indigo-500" />
                      {activeReaderItem.author_name || activeReaderItem.author_username}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-bold">
                      <Eye className="w-4 h-4" />{activeReaderItem.views_count} بازدید
                    </span>
                    <span className="flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-500/10 text-rose-600 font-bold">
                      <Heart className="w-4 h-4 fill-current" />
                      <span>{activeReaderItem.likes_count} پسند</span>
                    </span>
                  </div>
                </div>

                {activeReaderItem.summary && (
                  <div className="p-4 rounded-2xl bg-teal-500/5 dark:bg-teal-500/10 border-r-4 border-teal-500 text-xs sm:text-sm font-semibold text-teal-900 dark:text-teal-200 leading-relaxed">
                    {activeReaderItem.summary}
                  </div>
                )}

                <div
                  className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed space-y-4 font-sans prose-content"
                  dangerouslySetInnerHTML={{ __html: activeReaderItem.content }}
                />

                {/* Tags */}
                {activeReaderItem.tags && activeReaderItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                    {activeReaderItem.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[11px] font-semibold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs shrink-0">
                <span className="text-gray-400 text-[11px]">پرتال مدیریت اخبار</span>
                <button onClick={() => setActiveReaderItem(null)} className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold cursor-pointer">
                  بستن پنجره
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
