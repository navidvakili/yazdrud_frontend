// ============================================================
// UserManagement — سیستم مدیریت کاربران
// شامل: لیست، ایجاد، ویرایش، تغییر رمز، تخصیص نقش، مدیریت دسترسی‌ها
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  Plus,
  Edit3,
  Trash2,
  Key,
  Shield,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  RefreshCw,
  Lock,
  LogIn,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { API } from '@/src/shared-utils/functions';
import { loginApi } from '@/src/login';
import { useAppPermissions } from '@/src/shared-utils/PermissionsContext';
import PermissionsPanel from './PermissionsPanel';

// ===== Types =====

interface UserItem {
  username: string;
  fname: string;
  lname: string;
  full_name: string;
  email: string;
  mobile: string;
  role: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserDetail extends UserItem {
  kodmeli: string;
  permissions: string[];
}

interface RoleOption {
  id: number;
  name: string;
  permissions_count: number;
}

interface PaginatedResponse {
  data: UserItem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface UserForm {
  username: string;
  fname: string;
  lname: string;
  kodmeli: string;
  mobile: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: string;
}

const emptyForm: UserForm = {
  username: '',
  fname: '',
  lname: '',
  kodmeli: '',
  mobile: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'user',
};

const ROLE_LABELS: Record<string, string> = {
  support: 'پشتیبان',
  admin: 'مدیر سامانه',
  editor: 'ویرایشگر',
  user: 'کاربر',
};

const ROLE_COLORS: Record<string, string> = {
  support: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  editor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  user: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

// ===== Main Component =====

export default function UsersModule() {
  const { can } = useAppPermissions();
  const canManageUsers = can('users.view');
  const canViewRoles = can('roles.view');

  // Tab state — if user only has roles.view, default to permissions tab
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>(canManageUsers ? 'users' : 'permissions');

  // Support user impersonation
  const isSupport = loginApi.isSupportUser();
  const [impersonating, setImpersonating] = useState(false);
  const [impersonateTarget, setImpersonateTarget] = useState<string | null>(null);

  // List state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Available roles
  const [roles, setRoles] = useState<RoleOption[]>([]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Track initial mount to avoid duplicate fetch on first render
  const initialMount = useRef(true);

  // Form state
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);

  // Password form
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  // Role assignment
  const [roleUser, setRoleUser] = useState<UserDetail | null>(null);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  // Success message
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ===== Impersonate User =====
  const handleImpersonate = async (username: string) => {
    setImpersonating(true);
    try {
      await loginApi.impersonateUser(username);
      // Reload the page to fully switch to the impersonated user's context
      window.location.reload();
    } catch (err: any) {
      setImpersonating(false);
      setError(err.message || 'خطا در ورود به حساب کاربر');
    }
  };

  // ===== Fetch Users =====
  const fetchUsers = useCallback(async (page = 1, search = '', role = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('per_page', '15');
      if (search) params.set('search', search);
      if (role) params.set('role', role);

      const data = await API<PaginatedResponse>(`admin/users?${params.toString()}`);
      setUsers(data.data);
      setCurrentPage(data.current_page);
      setTotalPages(data.last_page);
      setTotalItems(data.total);
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت لیست کاربران');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const data = await API<{ data: RoleOption[] }>('admin/users/roles');
      setRoles(data.data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
      fetchRoles();
    }
  }, [canManageUsers, fetchUsers, fetchRoles]);

  // Refetch roles when switching back to users tab (roles may have been
  // added/deleted in the PermissionsPanel tab). Skip initial mount since
  // the useEffect above already fetches roles on first render.
  useEffect(() => {
    if (!canManageUsers) return;
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    if (activeTab === 'users') {
      fetchRoles();
    }
  }, [activeTab, fetchRoles, canManageUsers]);

  // Debounced search
  useEffect(() => {
    if (!canManageUsers) return;
    const timer = setTimeout(() => {
      fetchUsers(1, searchQuery, filterRole);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, filterRole, fetchUsers, canManageUsers]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // ===== Create User =====
  const handleCreate = async () => {
    setFormLoading(true);
    setFormError(null);
    try {
      await API('admin/users', {
        username: form.username,
        fname: form.fname,
        lname: form.lname,
        kodmeli: form.kodmeli,
        mobile: form.mobile,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        role: form.role,
      }, 'POST');
      setShowCreateModal(false);
      setForm(emptyForm);
      fetchUsers(currentPage, searchQuery, filterRole);
      showSuccess('کاربر جدید با موفقیت ایجاد شد');
    } catch (err: any) {
      if (err.errors) {
        const firstErr = Object.values(err.errors).flat()[0];
        setFormError(firstErr as string);
      } else {
        setFormError(err.message || 'خطا در ایجاد کاربر');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // ===== Edit User =====
  const openEdit = async (username: string) => {
    try {
      const data = await API<{ data: UserDetail }>(`admin/users/${username}`);
      setSelectedUser(data.data);
      setForm({
        username: data.data.username,
        fname: data.data.fname,
        lname: data.data.lname,
        kodmeli: data.data.kodmeli || '',
        mobile: data.data.mobile || '',
        email: data.data.email,
        password: '',
        password_confirmation: '',
        role: data.data.role,
      });
      setShowEditModal(true);
      setFormError(null);
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت اطلاعات کاربر');
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    setFormLoading(true);
    setFormError(null);
    try {
      await API(`admin/users/${selectedUser.username}`, {
        fname: form.fname,
        lname: form.lname,
        kodmeli: form.kodmeli,
        mobile: form.mobile,
        email: form.email,
      }, 'PUT');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers(currentPage, searchQuery, filterRole);
      showSuccess('اطلاعات کاربر با موفقیت به‌روزرسانی شد');
    } catch (err: any) {
      if (err.errors) {
        const firstErr = Object.values(err.errors).flat()[0];
        setFormError(firstErr as string);
      } else {
        setFormError(err.message || 'خطا در ویرایش کاربر');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // ===== Change Password =====
  const openPassword = async (username: string) => {
    try {
      const data = await API<{ data: UserDetail }>(`admin/users/${username}`);
      setSelectedUser(data.data);
      setNewPassword('');
      setNewPasswordConfirm('');
      setShowPasswordModal(true);
      setFormError(null);
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت اطلاعات کاربر');
    }
  };

  const handlePasswordChange = async () => {
    if (!selectedUser) return;
    setFormLoading(true);
    setFormError(null);
    try {
      await API(`admin/users/${selectedUser.username}/password`, {
        password: newPassword,
        password_confirmation: newPasswordConfirm,
      }, 'PUT');
      setShowPasswordModal(false);
      setSelectedUser(null);
      showSuccess('رمز عبور کاربر با موفقیت تغییر یافت');
    } catch (err: any) {
      if (err.errors) {
        const firstErr = Object.values(err.errors).flat()[0];
        setFormError(firstErr as string);
      } else {
        setFormError(err.message || 'خطا در تغییر رمز عبور');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // ===== Role Assignment =====
  const openRoles = async (username: string) => {
    try {
      const data = await API<{ data: UserDetail }>(`admin/users/${username}`);
      setRoleUser(data.data);
      setAvailableRoles(data.data.roles || []);
      setShowRoleModal(true);
      setFormError(null);
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت اطلاعات کاربر');
    }
  };

  const handleAssignRole = async (roleName: string) => {
    if (!roleUser) return;
    try {
      await API('admin/users/assign-role', { username: roleUser.username, role: roleName }, 'POST');
      setAvailableRoles(prev => [...prev, roleName]);
      showSuccess(`نقش «${ROLE_LABELS[roleName] || roleName}» به کاربر اختصاص یافت`);
    } catch (err: any) {
      setFormError(err.message || 'خطا در تخصیص نقش');
    }
  };

  const handleRemoveRole = async (roleName: string) => {
    if (!roleUser) return;
    try {
      await API('admin/users/remove-role', { username: roleUser.username, role: roleName }, 'POST');
      setAvailableRoles(prev => prev.filter(r => r !== roleName));
      showSuccess(`نقش «${ROLE_LABELS[roleName] || roleName}» از کاربر حذف شد`);
    } catch (err: any) {
      setFormError(err.message || 'خطا در حذف نقش');
    }
  };

  // ===== Delete User =====
  const handleDelete = async (username: string) => {
    try {
      await API(`admin/users/${username}`, {}, 'DELETE');
      setShowDeleteConfirm(null);
      fetchUsers(currentPage, searchQuery, filterRole);
      showSuccess('کاربر با موفقیت حذف شد');
    } catch (err: any) {
      setError(err.message || 'خطا در حذف کاربر');
    }
  };

  // ===== Toggle Active Status =====
  const handleToggleActive = async (username: string) => {
    try {
      const data = await API<{ message: string; data: { is_active: boolean } }>(
        `admin/users/${username}/toggle-active`,
        {},
        'PUT'
      );
      setUsers(prev => prev.map(u => u.username === username ? { ...u, is_active: data.data.is_active } : u));
      showSuccess(data.message);
    } catch (err: any) {
      setError(err.message || 'خطا در تغییر وضعیت کاربر');
    }
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
          <div className="p-2.5 bg-indigo-500/10 rounded-xl">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">مدیریت کاربران</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">ایجاد، ویرایش و مدیریت دسترسی کاربران</p>
          </div>
        </div>
        {activeTab === 'users' && (
          <button
            onClick={() => { setForm(emptyForm); setFormError(null); setShowCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            کاربر جدید
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {canManageUsers && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            لیست کاربران
          </button>
        )}
        {canViewRoles && (
          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            نقش‌ها و دسترسی‌ها
          </button>
        )}
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

      {/* ===== Users Tab Content ===== */}
      {activeTab === 'users' && (
        <>
          {/* Search & Filters */}
          <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو بر اساس نام، نام کاربری، ایمیل یا موبایل..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
        >
          <option value="">همه نقش‌ها</option>
          {roles.map(r => (
            <option key={r.name} value={r.name}>{ROLE_LABELS[r.name] || r.name}</option>
          ))}
        </select>
        <button
          onClick={() => fetchUsers(currentPage, searchQuery, filterRole)}
          className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          title="بازخوانی"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="w-12 h-12 mb-3 opacity-40" />
            <span className="text-sm">کاربری یافت نشد</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-400 text-xs">نام</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-400 text-xs">نام کاربری</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-400 text-xs">ایمیل</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-400 text-xs">موبایل</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-400 text-xs">نقش‌ها</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600 dark:text-gray-400 text-xs">وضعیت</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600 dark:text-gray-400 text-xs">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.username} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900 dark:text-white">{u.full_name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{u.username}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs" dir="ltr">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs" dir="ltr">{u.mobile || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map(role => (
                          <span key={role} className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ROLE_COLORS[role] || ROLE_COLORS.user}`}>
                            {ROLE_LABELS[role] || role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleToggleActive(u.username)}
                          disabled={u.username === 'support'}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            u.is_active
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                          title={u.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                        >
                          {u.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          {u.is_active ? 'فعال' : 'غیرفعال'}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {isSupport && u.username !== 'support' && (
                          <button
                            onClick={() => handleImpersonate(u.username)}
                            disabled={impersonating}
                            className="p-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 text-teal-500 transition-colors cursor-pointer disabled:opacity-50"
                            title="ورود به حساب کاربر"
                          >
                            {impersonating && impersonateTarget === u.username ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <LogIn className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(u.username)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors cursor-pointer"
                          title="ویرایش"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openPassword(u.username)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 transition-colors cursor-pointer"
                          title="تغییر رمز عبور"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openRoles(u.username)}
                          className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-500 transition-colors cursor-pointer"
                          title="تخصیص نقش"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(u.username)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 transition-colors cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-500">
              صفحه {currentPage} از {totalPages} — مجموع: {totalItems} کاربر
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchUsers(currentPage - 1, searchQuery, filterRole)}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => fetchUsers(currentPage + 1, searchQuery, filterRole)}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}
      </div>
        </>
      )}

      {/* ===== Permissions Tab Content ===== */}
      {activeTab === 'permissions' && (
        <PermissionsPanel />
      )}

      {/* ===== Modals ===== */}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <Modal onClose={() => { setShowCreateModal(false); setShowEditModal(false); setSelectedUser(null); }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                {showCreateModal ? 'کاربر جدید' : `ویرایش کاربر: ${selectedUser?.username}`}
              </h3>
              <button onClick={() => { setShowCreateModal(false); setShowEditModal(false); setSelectedUser(null); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-rose-700">{formError}</span>
              </div>
            )}

            <div className="space-y-4">
              {showCreateModal && (
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="نام کاربری" value={form.username} onChange={v => setForm(f => ({ ...f, username: v }))} dir="ltr" />
                  <SelectField label="نقش پیش‌فرض" value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} options={roles.map(r => ({ value: r.name, label: ROLE_LABELS[r.name] || r.name }))} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <InputField label="نام" value={form.fname} onChange={v => setForm(f => ({ ...f, fname: v }))} />
                <InputField label="نام خانوادگی" value={form.lname} onChange={v => setForm(f => ({ ...f, lname: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="کد ملی" value={form.kodmeli} onChange={v => setForm(f => ({ ...f, kodmeli: v }))} dir="ltr" />
                <InputField label="موبایل" value={form.mobile} onChange={v => setForm(f => ({ ...f, mobile: v }))} dir="ltr" />
              </div>
              <InputField label="ایمیل" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} dir="ltr" type="email" />

              {showCreateModal && (
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="رمز عبور" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} dir="ltr" type="password" />
                  <InputField label="تکرار رمز عبور" value={form.password_confirmation} onChange={v => setForm(f => ({ ...f, password_confirmation: v }))} dir="ltr" type="password" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); setSelectedUser(null); }}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={showCreateModal ? handleCreate : handleEdit}
                disabled={formLoading}
                className="px-5 py-2 text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {showCreateModal ? 'ایجاد کاربر' : 'ذخیره تغییرات'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && selectedUser && (
          <Modal onClose={() => { setShowPasswordModal(false); setSelectedUser(null); }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                تغییر رمز عبور: {selectedUser.full_name}
              </h3>
              <button onClick={() => { setShowPasswordModal(false); setSelectedUser(null); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-rose-700">{formError}</span>
              </div>
            )}

            <div className="space-y-4">
              <InputField label="رمز عبور جدید" value={newPassword} onChange={setNewPassword} dir="ltr" type="password" />
              <InputField label="تکرار رمز عبور جدید" value={newPasswordConfirm} onChange={setNewPasswordConfirm} dir="ltr" type="password" />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowPasswordModal(false); setSelectedUser(null); }}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={formLoading}
                className="px-5 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <Key className="w-4 h-4" />
                تغییر رمز عبور
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Role Assignment Modal */}
      <AnimatePresence>
        {showRoleModal && roleUser && (
          <Modal onClose={() => { setShowRoleModal(false); setRoleUser(null); }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                مدیریت نقش‌ها: {roleUser.full_name}
              </h3>
              <button onClick={() => { setShowRoleModal(false); setRoleUser(null); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-rose-700">{formError}</span>
              </div>
            )}

            {/* Current Roles */}
            <div className="mb-5">
              <h4 className="text-xs font-bold text-gray-500 mb-2">نقش‌های فعلی</h4>
              {availableRoles.length === 0 ? (
                <p className="text-xs text-gray-400">هیچ نقشی اختصاص داده نشده</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableRoles.map(role => (
                    <div key={role} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${ROLE_COLORS[role] || ROLE_COLORS.user}`}>
                      <span>{ROLE_LABELS[role] || role}</span>
                      <button
                        onClick={() => handleRemoveRole(role)}
                        className="p-0.5 rounded-full hover:bg-black/10 cursor-pointer"
                        title="حذف نقش"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Roles to Assign */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 mb-2">اختصاص نقش جدید</h4>
              <div className="flex flex-wrap gap-2">
                {roles.filter(r => !availableRoles.includes(r.name)).map(role => (
                  <button
                    key={role.name}
                    onClick={() => handleAssignRole(role.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    {ROLE_LABELS[role.name] || role.name}
                    <span className="text-[9px] opacity-50">({role.permissions_count})</span>
                  </button>
                ))}
                {roles.filter(r => !availableRoles.includes(r.name)).length === 0 && (
                  <p className="text-xs text-gray-400">تمام نقش‌ها اختصاص داده شده</p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => { setShowRoleModal(false); setRoleUser(null); }}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <Modal onClose={() => setShowDeleteConfirm(null)}>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">حذف کاربر</h3>
              <p className="text-sm text-gray-500 mb-6">
                آیا مطمئن هستید که می‌خواهید کاربر <strong>{showDeleteConfirm}</strong> را حذف کنید؟
                <br />
                <span className="text-rose-500 text-xs">این عمل قابل بازگشت نیست.</span>
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors cursor-pointer"
                >
                  حذف کاربر
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== Shared Modal Component =====

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto">
          {children}
        </div>
      </motion.div>
    </>
  );
}

// ===== Shared Form Components =====

function InputField({ label, value, onChange, dir, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; dir?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer transition-all"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
