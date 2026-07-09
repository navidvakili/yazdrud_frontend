// ============================================================
// AuthModule — ماژول احراز هویت و مدیریت حساب کاربری
//
// شامل پروفایل کاربری، تغییر رمز عبور و داشبورد کاربر
// ============================================================

import { ProfileModule, ChangePasswordModule } from '@/src/login';
import type { User as UserType } from '@/src/shared-types';
import type { RoleInfo } from '@/src/login/types';

interface AuthModuleProps {
  user: UserType | null;
  activeTabId?: string;
  moduleId?: string;
  onOpenTab?: (id: string, title: string, iconName: string, forceNewInstance?: boolean) => void;
  userRoles?: RoleInfo[];
  onUpdateUser?: (user: UserType) => void;
}

export default function AuthModule({ user, moduleId, userRoles, onUpdateUser }: AuthModuleProps) {
  switch (moduleId) {
    case 'profile':
      return user ? (
        <ProfileModule
          user={user}
          userRoles={userRoles || []}
          onUpdateUser={(updated) => {
            if (onUpdateUser) onUpdateUser(updated);
          }}
        />
      ) : null;
    case 'change-password':
      return <ChangePasswordModule />;
    default:
      return (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <span>ماژول مورد نظر یافت نشد</span>
        </div>
      );
  }
}
