import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layers,
  Plus,
  Search,
  History,
  Eye,
  Code,
  CheckCircle,
  Copy,
  Trash2,
  FolderTree,
  Sparkles,
  Shield,
  Save,
  Sliders,
  FileText,
  Newspaper,
  BookOpen,
  Calendar,
  HardDrive,
  Download,
  Award,
  Link as LinkIcon,
  RotateCcw,
  PlusCircle,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Globe2,
  MapPin,
  Building2
} from 'lucide-react';

import {
  NavigationMenu,
  NavigationItem,
  MenuLocation,
  InternalSource,
  CmsSourceScope,
  MenuVersionHistory,
  CmsSourceItem
} from './types';
import { sampleVersionHistory } from './mockData';
import { NavigationTreeItem } from './NavigationTreeItem';
import { MenuItemEditorModal } from './MenuItemEditorModal';
import { MegaMenuDesignerModal } from './MegaMenuDesignerModal';
import { LiveNavigationPreview } from './LiveNavigationPreview';
import { ApiHeadlessPreviewModal } from './ApiHeadlessPreviewModal';
import { FooterAddressTreeItem } from './FooterAddressTreeItem';
import { isFooterAddressItem } from './footerAddressUtils';
import { useLanguage } from '@/src/shared-utils/LanguageContext';
import {
  fetchSiteMenus,
  fetchMenuByLocation,
  saveSiteMenu,
  publishSiteMenu,
  fetchCmsSources,
  deleteSiteMenu
} from './api';
import { BACKEND_API_URL } from '@/src/shared-constants';


export const NavigationBuilderStudio: React.FC = () => {
  // زبان سیستم از ساختار اصلی مدیریت (چندزبانه) گرفته می‌شود — بدون سوییچر داخلی
  const { currentLang } = useLanguage();

  // Navigation Menus State
  const [menus, setMenus] = useState<NavigationMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuLocations, setMenuLocations] = useState<{ id: MenuLocation; label: string; icon: any; sortOrder?: number }[]>([]);
  const [activeLocation, setActiveLocation] = useState<MenuLocation>('Header Main Menu');
  const [draggedLocation, setDraggedLocation] = useState<MenuLocation | null>(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [locationLabelDraft, setLocationLabelDraft] = useState('');
  const [versionHistory, setVersionHistory] = useState<MenuVersionHistory[]>(sampleVersionHistory);

  // CMS Source Palette (داده‌های واقعی از وب‌سرویس)
  const [cmsSources, setCmsSources] = useState<CmsSourceItem[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);

  // نقشه‌ی شناسه‌ی سرور برای هر موقعیت منو (برای جلوگیری از رکورد تکراری)
  const serverIdsRef = useRef<Record<string, number>>({});

  // Modals & Panels State
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  const [megaMenuEditingItem, setMegaMenuEditingItem] = useState<NavigationItem | null>(null);
  const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false);
  const [publicBrandName, setPublicBrandName] = useState<string | null>(null);
  const [isApiPreviewOpen, setIsApiPreviewOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  // Search & Filters inside current tree
  const [treeSearchTerm, setTreeSearchTerm] = useState('');
  const [cmsSourceCategory, setCmsSourceCategory] = useState<InternalSource | 'ALL'>('ALL');
  const [paletteScopeFilter, setPaletteScopeFilter] = useState<'all' | CmsSourceScope>('all');
  const [sourceSearch, setSourceSearch] = useState('');

  // Bulk selection for tree items
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteMenuDialog, setDeleteMenuDialog] = useState<{ location: MenuLocation; menuId?: number } | null>(null);
  const [deleteItemDialog, setDeleteItemDialog] = useState<{ itemId: string; itemTitle: string } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // بارگذاری منوها و منابع CMS از وب‌سرویس با تغییر زبان
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSourcesLoading(true);
    setMenus([]);
    setCmsSources([]);
    serverIdsRef.current = {};

    (async () => {
      try {
        const [menuData, sourcesData] = await Promise.all([
          fetchSiteMenus(currentLang),
          fetchCmsSources(currentLang)
        ]);
        if (cancelled) return;
        setMenus(menuData);
        menuData.forEach(m => {
          if (typeof m.id === 'number') serverIdsRef.current[m.location] = m.id;
        });

        setMenuLocations(
          [...menuData]
            .sort((a, b) => {
              const aOrder = Number(a.sortOrder ?? a.sort_order ?? 0);
              const bOrder = Number(b.sortOrder ?? b.sort_order ?? 0);
              if (aOrder !== bOrder) return aOrder - bOrder;
              return String(a.location).localeCompare(String(b.location), 'fa');
            })
            .map(menu => ({
              id: menu.location as MenuLocation,
              label: menu.name || menu.location,
              icon: FolderTree,
              sortOrder: Number(menu.sortOrder ?? menu.sort_order ?? 0),
            }))
        );

        setCmsSources(sourcesData);
      } catch (e) {
        console.error(e);
        if (!cancelled) showToast('خطا در دریافت داده‌ها از وب‌سرویس');
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSourcesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentLang, showToast]);

  // اگر برای موقعیت فعال هنوز منویی وجود نداشته باشد، از وب‌سرویس گرفته می‌شود (ایجاد خودکار)
  useEffect(() => {
    if (loading) return;
    const exists = menus.some(
      m => m.location === activeLocation && (m.language === currentLang || !m.language)
    );
    if (exists) return;

    let cancelled = false;
    (async () => {
      try {
        const menu = await fetchMenuByLocation(activeLocation, currentLang);
        if (cancelled) return;
        if (typeof menu.id === 'number') serverIdsRef.current[menu.location] = menu.id;
        setMenus(prev => {
          if (prev.some(m => (typeof m.id === 'number' && m.id === menu.id))) return prev;
          if (prev.some(m => m.location === menu.location && (m.language === currentLang || !m.language))) return prev;
          return [...prev, menu];
        });
      } catch (e) {
        console.warn(e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeLocation, currentLang, loading, menus]);

  // Get or initialize active menu for current location & language
  const activeMenu = menus.find(
    m => m.location === activeLocation && (m.language === currentLang || !m.language)
  ) || {
    id: '' as string | number,
    name: `منوی ${activeLocation}`,
    slug: activeLocation.toLowerCase().replace(/ /g, '-'),
    location: activeLocation,
    language: currentLang,
    status: 'draft',
    version: 1,
    items: []
  };

  useEffect(() => {
    setLocationLabelDraft(activeMenu.name || activeLocation);
  }, [activeLocation, activeMenu.name]);

  const handleAddMenuLocation = () => {
    const rawName = newLocationName.trim();
    if (!rawName) return;
    const generatedLocation = rawName.replace(/\s+/g, ' ');
    const normalizedLocation = generatedLocation.length > 0 ? generatedLocation : 'New Menu';

    const exists = menuLocations.some(loc => loc.id === normalizedLocation as MenuLocation);
    if (exists) {
      setActiveLocation(normalizedLocation as MenuLocation);
      setNewLocationName('');
      return;
    }

    const nextSortOrder = menuLocations.reduce((max, loc) => Math.max(max, Number(loc.sortOrder ?? 0)), 0) + 1;
    const newLocation = {
      id: normalizedLocation as MenuLocation,
      label: normalizedLocation,
      icon: FolderTree,
      sortOrder: nextSortOrder,
    };

    setMenuLocations(prev => [...prev, newLocation].sort((a, b) => (Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))));
    setActiveLocation(normalizedLocation as MenuLocation);
    setNewLocationName('');
    showToast(`موقعیت جدید «${normalizedLocation}» اضافه شد`);
  };

  const reorderMenuLocations = useCallback((fromId: MenuLocation, toId: MenuLocation) => {
    if (!fromId || !toId || fromId === toId) return;

    const currentIndex = menuLocations.findIndex(loc => loc.id === fromId);
    const targetIndex = menuLocations.findIndex(loc => loc.id === toId);
    if (currentIndex < 0 || targetIndex < 0) return;

    const reordered = [...menuLocations];
    const [draggedItem] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    const normalized = reordered.map((loc, index) => ({
      ...loc,
      sortOrder: index + 1,
    }));

    setMenuLocations(normalized);

    void (async () => {
      try {
        await Promise.all(
          normalized.map(async (loc, index) => {
            const found = menus.find(m => m.location === loc.id && (m.language === currentLang || !m.language));
            if (!found) return null;
            const updated: NavigationMenu = {
              ...found,
              sortOrder: index + 1,
              sort_order: index + 1,
            };
            return saveSiteMenu(updated, currentLang);
          })
        );

        setMenus(prev => prev.map(menu => {
          const index = normalized.findIndex(loc => loc.id === menu.location && (menu.language === currentLang || !menu.language));
          if (index < 0) return menu;
          return {
            ...menu,
            sortOrder: index + 1,
            sort_order: index + 1,
          };
        }));

        showToast('ترتیب موقعیت‌ها با Drag & Drop به‌روزرسانی شد');
      } catch (error: any) {
        console.error(error);
        showToast(error?.message || 'به‌روزرسانی ترتیب موقعیت‌ها با خطا مواجه شد');
      }
    })();
  }, [currentLang, menuLocations, menus, showToast]);

  const handleRenameCurrentMenuLabel = async () => {
    const trimmed = locationLabelDraft.trim();
    if (!trimmed) return;

    try {
      const menuToSave = {
        ...activeMenu,
        name: trimmed,
      } as NavigationMenu;

      const saved = await saveSiteMenu(menuToSave, currentLang);
      setMenus(prev => prev.map(m => (m.id === saved.id || (m.location === activeLocation && (m.language === currentLang || !m.language))) ? { ...m, ...saved, name: trimmed } : m));
      setMenuLocations(prev => prev.map(loc => loc.id === activeLocation ? { ...loc, label: trimmed } : loc));
      showToast(`عنوان موقعیت «${trimmed}» ذخیره شد`);
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || 'ذخیره عنوان موقعیت با خطا مواجه شد');
    }
  };

  const handleRemoveCurrentMenuLocation = () => {
    if (menuLocations.length <= 1) {
      showToast('حداقل باید یک موقعیت منو وجود داشته باشد');
      return;
    }

    const targetMenu = menus.find(
      m => m.location === activeLocation && (m.language === currentLang || !m.language)
    );

    setDeleteMenuDialog({
      location: activeLocation,
      menuId: typeof targetMenu?.id === 'number' ? targetMenu.id : undefined,
    });
  };

  const confirmDeleteMenuLocation = async () => {
    if (!deleteMenuDialog) return;

    const { location, menuId } = deleteMenuDialog;

    try {
      if (typeof menuId === 'number') {
        await deleteSiteMenu(menuId);
      }

      const remaining = menuLocations.filter(loc => loc.id !== location);
      if (remaining.length === 0) {
        setDeleteMenuDialog(null);
        return;
      }

      setMenus(prev => prev.filter(
        m => !(m.location === location && (m.language === currentLang || !m.language))
      ));
      setMenuLocations(remaining);
      setActiveLocation(remaining[0].id);
      delete serverIdsRef.current[location];
      showToast(`موقعیت «${location}» حذف شد`);
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || 'حذف موقعیت منو با خطا مواجه شد');
    } finally {
      setDeleteMenuDialog(null);
    }
  };

  // ذخیره‌ی منو در وب‌سرویس (ایجاد خودکار رکورد در صورت نبودن)
  const persistMenu = useCallback(
    async (menu: NavigationMenu) => {
      try {
        let id = typeof menu.id === 'number' ? menu.id : serverIdsRef.current[menu.location];
        if (!id) {
          const existing = await fetchMenuByLocation(menu.location, currentLang);
          id = existing.id as number;
          serverIdsRef.current[menu.location] = id;
        }
        const saved = await saveSiteMenu({ ...menu, id }, currentLang);
        if (typeof saved.id === 'number') serverIdsRef.current[menu.location] = saved.id;
        setMenus(prev =>
          prev.map(m =>
            (typeof m.id === 'number' && m.id === id) ||
            (typeof m.id !== 'number' && m.location === saved.location)
              ? { ...m, ...saved, items: m.items }
              : m
          )
        );
        return saved;
      } catch (e: any) {
        console.error(e);
        showToast(e?.message || 'خطا در ذخیره‌ی منو در وب‌سرویس');
        return null;
      }
    },
    [currentLang, showToast]
  );

  // Helper to update items in active menu (با ذخیره‌ی خودکار)
  const updateActiveMenuItems = (newItems: NavigationItem[]) => {
    const updatedMenu: NavigationMenu = {
      ...activeMenu,
      updatedAt: new Date().toLocaleDateString('fa-IR'),
      items: newItems
    };

    setMenus(prev => {
      const exists = prev.some(
        m => m.id === activeMenu.id || (m.location === activeLocation && (m.language === currentLang || !m.language))
      );
      return exists
        ? prev.map(m =>
            m.id === activeMenu.id || (m.location === activeLocation && (m.language === currentLang || !m.language))
              ? { ...m, ...updatedMenu }
              : m
          )
        : [...prev, updatedMenu];
    });

    // ذخیره‌ی خودکار در پس‌زمینه (بدون مسدود کردن رابط کاربری)
    void persistMenu(updatedMenu);
  };

  // Add Item to Menu (Root level or child)
  const handleAddItem = (parentId: string | null = null, defaultTitle?: string, defaultUrl?: string, defaultSource?: InternalSource) => {
    const newItem: NavigationItem = {
      id: `item_${Date.now()}`,
      menuId: String(activeMenu.id),
      parentId,
      title: defaultTitle || 'آیتم جدید منو',
      itemType: defaultSource ? 'internal' : 'custom',
      internalSource: defaultSource,
      targetUrl: defaultUrl || '/new-page',
      target: '_self',
      displayType: 'simple',
      sortOrder: (activeMenu.items.length || 0) + 1,
      status: 'active',
      settings: {
        accessRules: ['Public User', 'Student', 'Employee', 'Administrator']
      }
    };

    if (parentId) {
      // Recursive helper to insert as child
      const insertChild = (items: NavigationItem[]): NavigationItem[] => {
        return items.map(item => {
          if (item.id === parentId) {
            return {
              ...item,
              displayType: item.displayType === 'simple' ? 'dropdown' : item.displayType,
              children: [...(item.children || []), newItem]
            };
          }
          if (item.children) {
            return { ...item, children: insertChild(item.children) };
          }
          return item;
        });
      };
      updateActiveMenuItems(insertChild(activeMenu.items));
    } else {
      updateActiveMenuItems([...activeMenu.items, newItem]);
    }

    showToast('آیتم جدید به ساختار منو اضافه شد');
  };

  // Quick Add from CMS Source Palette
  const handleAddFromCmsSource = (source: CmsSourceItem) => {
    handleAddItem(null, source.title, source.url, source.type);
  };

  const isFooterAddressMenu = activeLocation.includes('Footer');

  // Save Item from MenuItemEditorModal
  const handleSaveItemModal = (updatedItem: NavigationItem) => {
    const updateRecursive = (items: NavigationItem[]): NavigationItem[] => {
      return items.map(item => {
        if (item.id === updatedItem.id) {
          return updatedItem;
        }
        if (item.children) {
          return { ...item, children: updateRecursive(item.children) };
        }
        return item;
      });
    };

    updateActiveMenuItems(updateRecursive(activeMenu.items));
    setEditingItem(null);
    showToast('تغییرات آیتم منو با موفقیت ذخیره شد');
  };

  // Save Mega Menu Config from MegaMenuDesignerModal
  const handleSaveMegaMenuModal = (updatedItem: NavigationItem) => {
    handleSaveItemModal(updatedItem);
    setMegaMenuEditingItem(null);
    showToast('پیکربندی مگا منو به‌روزرسانی گردید');
  };

  // Delete Item recursively
  const handleDeleteItem = (itemId: string) => {
    const deleteRecursive = (items: NavigationItem[]): NavigationItem[] => {
      return items
        .filter(item => item.id !== itemId)
        .map(item => ({
          ...item,
          children: item.children ? deleteRecursive(item.children) : undefined
        }));
    };

    updateActiveMenuItems(deleteRecursive(activeMenu.items));
    showToast('آیتم از ساختار منو حذف شد');
  };

  const openDeleteItemDialog = (itemId: string, itemTitle: string) => {
    setDeleteItemDialog({ itemId, itemTitle });
  };

  const confirmDeleteItem = () => {
    if (!deleteItemDialog) return;
    handleDeleteItem(deleteItemDialog.itemId);
    setDeleteItemDialog(null);
  };

  // Duplicate Item
  const handleDuplicateItem = (item: NavigationItem) => {
    const duplicated: NavigationItem = {
      ...item,
      id: `item_dup_${Date.now()}`,
      title: `${item.title} (کپی)`,
      sortOrder: item.sortOrder + 1
    };
    updateActiveMenuItems([...activeMenu.items, duplicated]);
    showToast('تکثیر آیتم انجام شد');
  };

  // Toggle Item Status
  const handleToggleStatus = (itemId: string) => {
    const toggleRecursive = (items: NavigationItem[]): NavigationItem[] => {
      return items.map(item => {
        if (item.id === itemId) {
          return { ...item, status: item.status === 'active' ? 'inactive' : 'active' };
        }
        if (item.children) {
          return { ...item, children: toggleRecursive(item.children) };
        }
        return item;
      });
    };
    updateActiveMenuItems(toggleRecursive(activeMenu.items));
  };

  // Reorder Item Up/Down
  const handleMoveUp = (itemId: string) => {
    const index = activeMenu.items.findIndex(i => i.id === itemId);
    if (index <= 0) return;
    const newItems = [...activeMenu.items];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    updateActiveMenuItems(newItems);
  };

  const handleMoveDown = (itemId: string) => {
    const index = activeMenu.items.findIndex(i => i.id === itemId);
    if (index < 0 || index >= activeMenu.items.length - 1) return;
    const newItems = [...activeMenu.items];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    updateActiveMenuItems(newItems);
  };

  // Indent (Make child of previous sibling)
  const handleIndent = (itemId: string) => {
    const index = activeMenu.items.findIndex(i => i.id === itemId);
    if (index <= 0) return; // Cannot indent first item
    const targetItem = activeMenu.items[index];
    const prevItem = activeMenu.items[index - 1];

    const updatedPrevItem = {
      ...prevItem,
      displayType: prevItem.displayType === 'simple' ? 'dropdown' : prevItem.displayType,
      children: [...(prevItem.children || []), { ...targetItem, parentId: prevItem.id }]
    };

    const newItems = activeMenu.items.filter(i => i.id !== itemId).map(i => (i.id === prevItem.id ? updatedPrevItem : i));
    updateActiveMenuItems(newItems);
  };

  // Outdent (Promote child to parent level)
  const handleOutdent = (itemId: string) => {
    // For root level, nothing happens
    showToast('آیتم در سطح اصلی قرار دارد');
  };

  // Save & Publish Menu Version (ذخیره در وب‌سرویس + انتشار)
  const handlePublishMenu = async () => {
    try {
      let id = typeof activeMenu.id === 'number' ? activeMenu.id : serverIdsRef.current[activeLocation];
      if (!id) {
        const existing = await fetchMenuByLocation(activeLocation, currentLang);
        id = existing.id as number;
        serverIdsRef.current[activeLocation] = id;
      }
      const saved = await saveSiteMenu({ ...activeMenu, id }, currentLang);
      if (typeof saved.id === 'number') serverIdsRef.current[activeLocation] = saved.id;
      const published = await publishSiteMenu(saved.id as number);

      const newVer = published.version || activeMenu.version + 1;
      const publishedMenu: NavigationMenu = {
        ...published,
        items: activeMenu.items
      };

      setMenus(prev =>
        prev.map(m =>
          (typeof m.id === 'number' && m.id === published.id) ||
          (m.location === activeLocation && (m.language === currentLang || !m.language))
            ? publishedMenu
            : m
        )
      );

      const newHistoryEntry: MenuVersionHistory = {
        id: `ver_${Date.now()}`,
        menuId: String(published.id),
        version: newVer,
        changedBy: 'مدیر کل CMS',
        timestamp: `${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
        changeSummary: `انتشار نسخه ${newVer} با ${activeMenu.items.length} آیتم ناوبری`,
        itemsSnapshot: activeMenu.items
      };

      setVersionHistory([newHistoryEntry, ...versionHistory]);
      showToast(`نسخه جدید منو (${newVer}) با موفقیت در وب‌سرویس منتشر شد!`);
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || 'خطا در انتشار منو در وب‌سرویس');
    }
  };

  // ذخیره‌ی پیش‌نویس منو (بدون انتشار)
  const handleSaveDraft = async () => {
    try {
      let id = typeof activeMenu.id === 'number' ? activeMenu.id : serverIdsRef.current[activeLocation];
      if (!id) {
        const existing = await fetchMenuByLocation(activeLocation, currentLang);
        id = existing.id as number;
        serverIdsRef.current[activeLocation] = id;
      }
      await saveSiteMenu({ ...activeMenu, id, status: 'draft' }, currentLang);
      showToast('پیش‌نویس منو با موفقیت ذخیره شد');
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || 'خطا در ذخیره‌ی پیش‌نویس');
    }
  };

  // Filtered CMS Sources for Palette (از داده‌های واقعی وب‌سرویس)
  const filteredPaletteSources = cmsSources.filter(s => {
    const matchesCategory = cmsSourceCategory === 'ALL' || s.type === cmsSourceCategory;
    const matchesScope = paletteScopeFilter === 'all' || s.scope === paletteScopeFilter;
    const matchesSearch =
      s.title.toLowerCase().includes(sourceSearch.toLowerCase()) ||
      (s.categoryPath && s.categoryPath.toLowerCase().includes(sourceSearch.toLowerCase()));
    return matchesCategory && matchesScope && matchesSearch;
  });

  const filteredVersionHistory = versionHistory.filter(entry => {
    if (!activeMenu.id) return true;
    return String(entry.menuId) === String(activeMenu.id) || !entry.menuId;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-4 sm:p-6 space-y-6" dir="rtl">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 px-4 py-3 bg-teal-600 text-white font-bold text-xs rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Studio Header Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black shadow-md">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                ماژول مدیریت و ساخت ناوبری سایت (Navigation Builder)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                Enterprise CMS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مدیریت یکپارچه منوهای هدر، فوتر، مگامنوها و موبایل — زبان بر اساس ساختار چندزبانه‌ی اصلی سیستم تعیین می‌شود
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {loading && (
            <span className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              همگام‌سازی با وب‌سرویس...
            </span>
          )}

          {/* Version History Button */}
          <button
            onClick={() => setIsVersionHistoryOpen(!isVersionHistoryOpen)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <History className="w-4 h-4 text-teal-600" />
            <span>تاریخچه نسخه‌ها ({activeMenu.version})</span>
          </button>

          {/* Headless API Endpoint JSON Button */}
          <button
            onClick={() => setIsApiPreviewOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Code className="w-4 h-4 text-teal-600" />
            <span>Headless API</span>
          </button>

          {/* Frontend Live Preview Button */}
          <button
            onClick={() => setIsLivePreviewOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>پیش‌نمایش فرانت‌اند</span>
          </button>

          {/* Save Draft */}
          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>ذخیره پیش‌نویس</span>
          </button>

          {/* Publish Changes */}
          <button
            onClick={handlePublishMenu}
            disabled={loading}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            <span>ذخیره و انتشار منو</span>
          </button>
        </div>
      </div>

      {/* Menu Locations Bar (بدون سوییچر زبان — زبان از ساختار اصلی سیستم) */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-teal-600" />
            موقعیت منو در پوسته سایت (Navigation Location):
          </span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5" />
            زبان فعال: {currentLang === 'fa' ? 'فارسی' : currentLang === 'en' ? 'English' : currentLang === 'ar' ? 'العربية' : currentLang}
          </span>
        </div>

        {/* Location Tabs Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {menuLocations.map(loc => {
            const isSelected = activeLocation === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                draggable
                onDragStart={() => setDraggedLocation(loc.id)}
                onDragOver={event => event.preventDefault()}
                onDrop={() => {
                  if (draggedLocation && draggedLocation !== loc.id) {
                    reorderMenuLocations(draggedLocation, loc.id);
                  }
                  setDraggedLocation(null);
                }}
                onDragEnd={() => setDraggedLocation(null)}
                onClick={() => setActiveLocation(loc.id)}
                className={`px-4 py-2.5 rounded-2xl font-bold flex items-center gap-2 whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                } ${draggedLocation === loc.id ? 'opacity-60 scale-[0.98]' : ''}`}
              >
                <loc.icon className="w-4 h-4" />
                <span>{loc.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <input
            type="text"
            value={newLocationName}
            onChange={e => setNewLocationName(e.target.value)}
            placeholder="نام موقعیت جدید منو ..."
            className="flex-1 min-w-[180px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
          />
          <button
            type="button"
            onClick={handleAddMenuLocation}
            className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
          >
            افزودن موقعیت جدید
          </button>
          <button
            type="button"
            onClick={() => setIsLivePreviewOpen(true)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            پیش‌نمایش زنده
          </button>
          <button
            type="button"
            onClick={handleRemoveCurrentMenuLocation}
            className="px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold"
          >
            حذف موقعیت فعلی
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <input
            type="text"
            value={locationLabelDraft}
            onChange={e => setLocationLabelDraft(e.target.value)}
            placeholder="عنوان نمایش داده‌شده برای این موقعیت..."
            className="flex-1 min-w-[220px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
          />
          <button
            type="button"
            onClick={handleRenameCurrentMenuLabel}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
          >
            ذخیره عنوان
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Left CMS Palette, Center Tree Builder, Right Version Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CMS Source Link Palette / Footer Address Palette */}
        <div className="lg:col-span-3 space-y-4">
          {isFooterAddressMenu ? (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
                  محتوای فوتر به‌صورت دستی
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                هر آیتم فوتر را به‌صورت دستی با متن، آیکون، لینک، دکمه و تصویر تعریف کنید؛ بدون نیاز به بلوک‌های از پیش‌ساخته.
              </p>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-[10px] text-blue-800 dark:text-blue-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold"><MapPin className="w-3.5 h-3.5" /> متن با آیکون</div>
                <div className="flex items-center gap-1.5 font-bold"><MapPin className="w-3.5 h-3.5" /> دکمه و لینک</div>
                <div className="flex items-center gap-1.5 font-bold"><MapPin className="w-3.5 h-3.5" /> تصویر و شبکه اجتماعی</div>
              </div>
              <button onClick={() => handleAddItem(null)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> افزودن آیتم فوتر
              </button>
            </div>
          ) : (
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-teal-600" />
                پالت منابع محتوایی CMS
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              با کلیک روی هر آیتم، به منوی فعال اضافه می‌شود:
            </p>

            {/* Source Category Picker */}
            <select
              value={cmsSourceCategory}
              onChange={e => setCmsSourceCategory(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            >
              <option value="ALL">✨ تمامی منابع CMS</option>
              <option value="CMS Pages">📄 صفحات اصلی CMS</option>
              <option value="Page Builder">🧩 صفحه‌ساز (Page Builder)</option>
              <option value="News">📰 اخبار (خبر منفرد)</option>
              <option value="News Categories">📂 دسته‌بندی اخبار (گروه خبری)</option>
              <option value="Announcements">📣 اطلاعیه‌ها (اطلاعیه منفرد)</option>
              <option value="Announcement Categories">📂 دسته‌بندی اطلاعیه‌ها</option>
              <option value="Articles">📚 مقالات (مقاله منفرد)</option>
              <option value="Article Categories">📂 دسته‌بندی مقالات</option>
              <option value="Events">📅 رویدادها</option>
              <option value="Services">🛠️ خدمات الکترونیک</option>
              <option value="Downloads">📥 آیین‌نامه‌ها و دانلودها</option>
              <option value="Forms">📝 فرم‌ها</option>
              <option value="Categories">📁 سایر دسته‌بندی‌ها</option>
              <option value="Tags">🏷️ تگ‌ها و برچسب‌ها</option>
            </select>

            {/* Scope Filter Tabs in Palette */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold">
              {[
                { id: 'all', label: 'همه' },
                { id: 'single_item', label: '📄 منفرد' },
                { id: 'category_group', label: '📁 دسته‌بندی/گروه' },
                { id: 'page_builder', label: '🧩 صفحه‌ساز' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setPaletteScopeFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap ${
                    paletteScopeFilter === tab.id
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="جستجو در محتوا..."
                value={sourceSearch}
                onChange={e => setSourceSearch(e.target.value)}
                className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            {/* List of Palette Items */}
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {sourcesLoading && filteredPaletteSources.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Loader2 className="w-6 h-6 text-teal-600 mx-auto animate-spin" />
                  <p className="text-[11px] text-slate-400">در حال دریافت منابع CMS از وب‌سرویس...</p>
                </div>
              ) : filteredPaletteSources.length === 0 ? (
                <p className="p-4 text-center text-slate-400 text-[11px]">
                  محتوایی یافت نشد
                </p>
              ) : (
                filteredPaletteSources.map(source => (
                  <button
                    key={source.id}
                    onClick={() => handleAddFromCmsSource(source)}
                    className="w-full text-right p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-slate-200 dark:border-slate-800 flex flex-col gap-1 text-xs transition-all group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                        {source.title}
                      </span>
                      <Plus className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0 mr-1" />
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span
                        className={`px-1.5 py-0.2 rounded font-bold ${
                          source.scope === 'category_group'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : source.scope === 'page_builder'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : source.scope === 'tag'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {source.scope === 'category_group'
                          ? '📁 دسته‌بندی'
                          : source.scope === 'page_builder'
                          ? '🧩 صفحه‌ساز'
                          : source.scope === 'tag'
                          ? '🏷️ تگ'
                          : '📄 منفرد'}
                      </span>

                      {source.itemCount !== undefined && (
                        <span className="text-slate-400 font-mono">
                          ({source.itemCount} مورد)
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Add Custom Blank Item */}
            <button
              onClick={() => handleAddItem()}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4 text-teal-600" />
              افزودن آیتم جدید سفارشی
            </button>
          </div>
          )}
        </div>

        {/* CENTER COLUMN: Interactive Drag & Drop Tree Structure Builder */}
        <div className="lg:col-span-9 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {/* Tree Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-teal-600" />
                  ساختار درختی ناوبری: {activeMenu.name}
                </h3>
                <p className="text-xs text-slate-400">
                  تعداد کل آیتم‌ها: {activeMenu.items.length} | وضعیت: {activeMenu.status === 'active' ? 'فعال' : 'پیش‌نویس'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddItem(null)}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" /> افزودن به ریشه منو
                </button>
              </div>
            </div>

            {/* Tree Items List */}
            {loading ? (
              <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <Loader2 className="w-8 h-8 text-teal-600 mx-auto animate-spin" />
                <p className="text-xs font-bold text-slate-500">در حال بارگذاری منوها از وب‌سرویس...</p>
              </div>
            ) : activeMenu.items.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">
                  هنوز هیچ آیتمی برای این منو ایجاد نشده است.
                </p>
                <p className="text-[11px] text-slate-400">
                  از پالت سمت راست یا دکمه «افزودن به ریشه منو» استفاده کنید.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeMenu.items.map((item, idx) =>
                  isFooterAddressMenu && isFooterAddressItem(item) ? (
                    <FooterAddressTreeItem
                      key={item.id ?? `menu_${activeMenu.location}_${idx}`}
                      item={item}
                      onEdit={setEditingItem}
                      onDelete={(itemId, itemTitle) => openDeleteItemDialog(itemId, itemTitle || 'این آیتم')}
                      onDuplicate={handleDuplicateItem}
                      onToggleStatus={handleToggleStatus}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      isFirst={idx === 0}
                      isLast={idx === activeMenu.items.length - 1}
                    />
                  ) : (
                    <NavigationTreeItem
                      key={item.id ?? `menu_${activeMenu.location}_${idx}`}
                      item={item}
                      level={0}
                      onEdit={setEditingItem}
                      onEditMegaMenu={setMegaMenuEditingItem}
                      onDelete={(itemId, itemTitle) => openDeleteItemDialog(itemId, itemTitle || 'این آیتم')}
                      onDuplicate={handleDuplicateItem}
                      onAddChild={parentId => handleAddItem(parentId)}
                      onToggleStatus={handleToggleStatus}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onIndent={handleIndent}
                      onOutdent={handleOutdent}
                      isFirst={idx === 0}
                      isLast={idx === activeMenu.items.length - 1}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: MenuItemEditorModal / FooterAddressEditorModal */}
      {editingItem && (
        <MenuItemEditorModal
          item={editingItem}
          menuLocation={activeLocation}
          cmsSources={cmsSources}
          sourcesLoading={sourcesLoading}
          onSave={handleSaveItemModal}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* MODAL 2: MegaMenuDesignerModal */}
      {megaMenuEditingItem && (
        <MegaMenuDesignerModal
          item={megaMenuEditingItem}
          onSave={handleSaveMegaMenuModal}
          onClose={() => setMegaMenuEditingItem(null)}
        />
      )}

      {deleteMenuDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">حذف موقعیت منو</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">این عملیات غیرقابل بازگشت است</p>
              </div>
            </div>

            <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">
              آیا از حذف موقعیت «{deleteMenuDialog.location}» و رکورد مرتبط آن در دیتابیس مطمئن هستید؟
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteMenuDialog(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={confirmDeleteMenuLocation}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                حذف موقعیت
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteItemDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">حذف آیتم منو</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">این عملیات غیرقابل بازگشت است</p>
              </div>
            </div>

            <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">
              آیا از حذف آیتم «{deleteItemDialog.itemTitle}» مطمئن هستید؟
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteItemDialog(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={confirmDeleteItem}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                حذف آیتم
              </button>
            </div>
          </div>
        </div>
      )}

      {isVersionHistoryOpen && (
        <div className="fixed left-4 top-4 bottom-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">تاریخچه نسخه‌ها</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{activeMenu.name}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsVersionHistoryOpen(false)}
              className="rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              بستن
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto pr-1 max-h-[calc(100vh-8rem)]">
            {filteredVersionHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                هنوز نسخه‌ای برای این منو ثبت نشده است.
              </div>
            ) : (
              filteredVersionHistory.map(entry => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-extrabold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      نسخه {entry.version}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{entry.timestamp}</span>
                  </div>

                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{entry.changeSummary}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>تغییر دهنده: {entry.changedBy}</span>
                    <span className="font-mono">#{entry.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Live Frontend Preview */}
      {isLivePreviewOpen && (
        <LiveNavigationPreview
          menus={menus}
          activeMenuId={String(activeMenu.id)}
          activeMenu={activeMenu}
          brandName={publicBrandName || undefined}
          onClose={() => {
            setIsLivePreviewOpen(false);
            setPublicBrandName(null);
          }}
        />
      )}

      {/* MODAL 4: ApiHeadlessPreviewModal */}
      {isApiPreviewOpen && (
        <ApiHeadlessPreviewModal
          menus={menus}
          onClose={() => setIsApiPreviewOpen(false)}
        />
      )}
    </div>
  );
};
export default NavigationBuilderStudio;
