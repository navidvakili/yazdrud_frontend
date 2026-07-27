// ============================================================
// Permissions Hook — بررسی دسترسی کاربر بر اساس نقش و مجوزها
// ============================================================

import { useMemo } from 'react';
import type { User } from '@/src/shared-types';

export interface PermissionChecker {
  /** Check if user has a specific permission (e.g. 'users.create') */
  can: (permission: string) => boolean;
  /** Check if user has any of the given permissions */
  canAny: (permissions: string[]) => boolean;
  /** Check if user has all of the given permissions */
  canAll: (permissions: string[]) => boolean;
  /** Check if user has a specific role */
  hasRole: (role: string) => boolean;
  /** Check if user has any of the given roles */
  hasAnyRole: (roles: string[]) => boolean;
  /** Get all permissions */
  permissions: string[];
  /** Get all roles */
  roles: string[];
}

/**
 * Hook for checking user permissions throughout the app.
 *
 * Usage:
 * ```tsx
 * const { can, hasRole } = usePermissions(user);
 *
 * if (can('users.create')) {
 *   // Show create button
 * }
 *
 * if (hasRole('admin')) {
 *   // Show admin panel
 * }
 * ```
 */
export function usePermissions(user: User | null): PermissionChecker {
  return useMemo(() => {
    const permissions = user?.permissions ?? [];
    const roles = user?.roles ?? [];

    return {
      can: (permission: string) => permissions.includes(permission),
      canAny: (perms: string[]) => perms.some(p => permissions.includes(p)),
      canAll: (perms: string[]) => perms.every(p => permissions.includes(p)),
      hasRole: (role: string) => roles.includes(role),
      hasAnyRole: (r: string[]) => r.some(role => roles.includes(role)),
      permissions,
      roles,
    };
  }, [user?.permissions, user?.roles]);
}

/**
 * Module-to-permission mapping.
 * Maps module types to their required permissions.
 */
export const MODULE_PERMISSIONS: Record<string, { view: string; create?: string; edit?: string; delete?: string; approve?: string }> = {
  users:        { view: 'users.view',        create: 'users.create',        edit: 'users.edit',        delete: 'users.delete' },
  roles:        { view: 'roles.view',        create: 'roles.create',        edit: 'roles.edit',        delete: 'roles.delete' },
  navigation:   { view: 'navigation.view',   create: 'navigation.create',   edit: 'navigation.edit',   delete: 'navigation.delete' },
  library:      { view: 'library.view',      create: 'library.create',      edit: 'library.edit',      delete: 'library.delete',      approve: 'library.approve' },
  news:         { view: 'news.view',         create: 'news.create',         edit: 'news.edit',         delete: 'news.delete',         approve: 'news.approve' },
  services:     { view: 'services.view',     create: 'services.create',     edit: 'services.edit',     delete: 'services.delete' },
  urban:        { view: 'urban.view',        create: 'urban.create',        edit: 'urban.edit',        delete: 'urban.delete' },
  roads:        { view: 'roads.view',        create: 'roads.create',        edit: 'roads.edit',        delete: 'roads.delete' },
  land:         { view: 'land.view',         create: 'land.create',         edit: 'land.edit',         delete: 'land.delete' },
  sessions:     { view: 'sessions.view',     delete: 'sessions.delete' },
  settings:     { view: 'settings.view',     edit: 'settings.edit' },
};
