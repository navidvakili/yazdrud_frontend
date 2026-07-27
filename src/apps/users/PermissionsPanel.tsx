// ============================================================
// PermissionsPanel — مدیریت نقش‌ها و دسترسی‌ها
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  Lock,
  Eye,
  Edit3,
  Trash,
  CheckCircle,
  Settings,
} from 'lucide-react';
import { API } from '@/src/shared-utils/functions';

// ===== Types =====

interface PermissionItem {
  id: number;
  name: string;
  guard_name: string;
}

interface RoleItem {
  id: number;
  name: string;
  guard_name: string;
  permissions: PermissionItem[];
  users_count: number;
  created_at: string;
  updated_at: string;
}

interface PermissionsByModule {
  [module: string]: PermissionItem[];
}

interface ApiResponse<T> {
  data: T;
}

// ===== Constants =====

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'داشبورد',
  land: 'امور اراضی',
  library: 'کتابخانه',
  navigation: 'ناوبری',
  news: 'اخبار',
  roads: '道路 و حمل‌ونقل',
  roles: 'نقش‌ها',
  services: 'خدمات',
  sessions: 'نشست‌ها',
  settings: 'تنظیمات',
  urban: 'شهرسازی',
  users: 'کاربران',
};

const PERMISSION_LABELS: Record<string, string> = {
  view: 'مشاهده',
  create: 'ایجاد',
  edit: 'ویرایش',
  delete: 'حذف',
  approve: 'تائید',
};

const PERMISSION_ICONS: Record<string, typeof Eye> = {
  view: Eye,
  create: Plus,
  edit: Edit3,
  delete: Trash,
  approve: CheckCircle,
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  editor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  support: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  user: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
};

// ===== Main Component =====

export default function PermissionsPanel() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionsByModule>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editing state
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [editingPerms, setEditingPerms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Create role modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [creating, setCreating] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form errors
  const [formError, setFormError] = useState<string | null>(null);

  // ===== Fetch Data =====
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        API<ApiResponse<RoleItem[]>>('admin/roles'),
        API<ApiResponse<PermissionsByModule>>('admin/permissions'),
      ]);
      setRoles(rolesRes.data);
      setAllPermissions(permsRes.data);
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // ===== Edit Role Permissions =====
  const startEditing = (role: RoleItem) => {
    setEditingRoleId(role.id);
    setEditingPerms(new Set(role.permissions.map(p => p.name)));
    setExpandedModules(new Set(Object.keys(allPermissions)));
    setFormError(null);
  };

  const cancelEditing = () => {
    setEditingRoleId(null);
    setEditingPerms(new Set());
    setFormError(null);
  };

  const togglePerm = (permName: string) => {
    setEditingPerms(prev => {
      const next = new Set(prev);
      if (next.has(permName)) {
        next.delete(permName);
      } else {
        next.add(permName);
      }
      return next;
    });
  };

  const toggleModule = (module: string) => {
    setEditingPerms(prev => {
      const next = new Set(prev);
      const modulePerms = allPermissions[module] || [];
      const allSelected = modulePerms.every(p => next.has(p.name));
      modulePerms.forEach(p => {
        if (allSelected) {
          next.delete(p.name);
        } else {
          next.add(p.name);
        }
      });
      return next;
    });
  };

  const savePermissions = async () => {
    if (editingRoleId === null) return;
    setSaving(true);
    setFormError(null);
    try {
      await API(`admin/roles/${editingRoleId}`, {
        permissions: Array.from(editingPerms),
      }, 'PUT');
      showSuccess('دسترسی‌های نقش با موفقیت بروزرسانی شد');
      cancelEditing();
      fetchData();
    } catch (err: any) {
      if (err.errors) {
        const firstErr = Object.values(err.errors).flat()[0];
        setFormError(firstErr as string);
      } else {
        setFormError(err.message || 'خطا در ذخیره دسترسی‌ها');
      }
    } finally {
      setSaving(false);
    }
  };

  // ===== Create Role =====
  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    setCreating(true);
    setFormError(null);
    try {
      await API('admin/roles', { name: newRoleName.trim() }, 'POST');
      setShowCreateModal(false);
      setNewRoleName('');
      showSuccess('نقش جدید با موفقیت ایجاد شد');
      fetchData();
    } catch (err: any) {
      if (err.errors) {
        const firstErr = Object.values(err.errors).flat()[0];
        setFormError(firstErr as string);
      } else {
        setFormError(err.message || 'خطا در ایجاد نقش');
      }
    } finally {
      setCreating(false);
    }
  };

  // ===== Delete Role =====
  const handleDeleteRole = async (roleId: number) => {
    try {
      await API(`admin/roles/${roleId}`, {}, 'DELETE');
      setDeleteConfirmId(null);
      showSuccess('نقش با موفقیت حذف شد');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'خطا در حذف نقش');
      setTimeout(() => setError(null), 3000);
    }
  };

  const toggleModule_ = (module: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(module)) {
        next.delete(module);
      } else {
        next.add(module);
      }
      return next;
    });
  };

  // ===== Render =====
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Success Toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-700">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 rounded-xl">
            <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">مدیریت نقش‌ها و دسترسی‌ها</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">تعریف نقش‌ها و تخصیص دسترسی به هر نقش</p>
          </div>
        </div>
        <button
          onClick={() => { setNewRoleName(''); setFormError(null); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          نقش جدید
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-xs font-medium text-rose-700">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {roles.map(role => {
            const isEditing = editingRoleId === role.id;
            const roleColor = ROLE_COLORS[role.name] || ROLE_COLORS.user;
            const permCount = role.permissions.length;
            const totalPerms = Object.values(allPermissions).flat().length;

            return (
              <motion.div
                key={role.id}
                layout
                className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden shadow-sm transition-colors ${
                  isEditing
                    ? 'border-purple-300 dark:border-purple-700 ring-2 ring-purple-500/20'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                {/* Role Header */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  onClick={() => {
                    if (!isEditing) {
                      startEditing(role);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-full text-xs font-black border ${roleColor}`}>
                      {role.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {permCount} / {totalPerms} دسترسی
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {role.users_count} کاربر
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); savePermissions(); }}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          ذخیره
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); cancelEditing(); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          انصراف
                        </button>
                      </>
                    ) : (
                      <>
                        {role.name !== 'admin' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(role.id); }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 transition-colors cursor-pointer"
                            title="حذف نقش"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isEditing ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </div>
                </div>

                {/* Permission Grid (expanded when editing) */}
                {isEditing && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-100 dark:border-gray-800"
                  >
                    {/* Form Error */}
                    {formError && (
                      <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span className="text-xs font-medium text-rose-700">{formError}</span>
                      </div>
                    )}

                    <div className="p-5 space-y-4">
                      {Object.entries(allPermissions).map(([module, perms]) => {
                        const moduleLabel = MODULE_LABELS[module] || module;
                        const allSelected = perms.every(p => editingPerms.has(p.name));
                        const someSelected = perms.some(p => editingPerms.has(p.name));
                        const isExpanded = expandedModules.has(module);

                        return (
                          <div key={module} className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                            {/* Module Header */}
                            <div
                              className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              onClick={() => toggleModule_(module)}
                            >
                              <div className="flex items-center gap-3">
                                <label
                                  className="flex items-center gap-2 cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(el) => {
                                      if (el) el.indeterminate = someSelected && !allSelected;
                                    }}
                                    onChange={() => toggleModule(module)}
                                    className="w-4 h-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500/40 cursor-pointer"
                                  />
                                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{moduleLabel}</span>
                                </label>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                  {perms.filter(p => editingPerms.has(p.name)).length} / {perms.length}
                                </span>
                              </div>
                              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>

                            {/* Permission Checkboxes */}
                            {isExpanded && (
                              <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                {perms.map(perm => {
                                  const action = perm.name.split('.')[1] || '';
                                  const label = PERMISSION_LABELS[action] || action;
                                  const Icon = PERMISSION_ICONS[action] || Settings;
                                  const checked = editingPerms.has(perm.name);

                                  return (
                                    <label
                                      key={perm.name}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                                        checked
                                          ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => togglePerm(perm.name)}
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-purple-500 focus:ring-purple-500/40 cursor-pointer"
                                      />
                                      <Icon className="w-3.5 h-3.5 shrink-0" />
                                      <span>{label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {roles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Shield className="w-12 h-12 mb-3 opacity-40" />
              <span className="text-sm">هیچ نقشی تعریف نشده است</span>
            </div>
          )}
        </div>
      )}

      {/* ===== Create Role Modal ===== */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-sm pointer-events-auto">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">نقش جدید</h3>
                  <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {formError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-xs font-medium text-rose-700">{formError}</span>
                  </div>
                )}

                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">نام نقش (انگلیسی)</label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="مثلاً: moderator"
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateRole(); }}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleCreateRole}
                    disabled={creating || !newRoleName.trim()}
                    className="px-5 py-2 text-sm font-bold text-white bg-purple-500 hover:bg-purple-600 rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    ایجاد نقش
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== Delete Confirmation Modal ===== */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setDeleteConfirmId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-sm pointer-events-auto text-center">
                <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">حذف نقش</h3>
                <p className="text-sm text-gray-500 mb-6">
                  آیا مطمئن هستید که می‌خواهید این نقش را حذف کنید؟
                  <br />
                  <span className="text-rose-500 text-xs">کاربران دارای این نقش، دسترسی‌های آن را از دست خواهند داد.</span>
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={() => handleDeleteRole(deleteConfirmId)}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors cursor-pointer"
                  >
                    حذف نقش
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
