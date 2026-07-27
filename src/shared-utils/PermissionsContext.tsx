// ============================================================
// PermissionsContext — Context for sharing permissions across components
// ============================================================

import { createContext, useContext, useMemo } from 'react';
import type { User } from '@/src/shared-types';
import { usePermissions, MODULE_PERMISSIONS, type PermissionChecker } from './permissions';

const PermissionsContext = createContext<PermissionChecker | null>(null);

export function PermissionsProvider({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  const permissions = usePermissions(user);

  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
}

/**
 * Hook to access the permission checker from context.
 * Must be used inside a <PermissionsProvider>.
 */
export function useAppPermissions(): PermissionChecker {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    // Fallback for components used outside the provider
    return {
      can: () => false,
      canAny: () => false,
      canAll: () => false,
      hasRole: () => false,
      hasAnyRole: () => false,
      permissions: [],
      roles: [],
    };
  }
  return ctx;
}

export { MODULE_PERMISSIONS };
