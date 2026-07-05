// ============================================================
// LibraryModule — ماژول کتابخانه خدمات الکترونیکی پورتال
//
// این ماژول به عنوان fallback برای تمام moduleType هایی که
// به صورت اختصاصی در App دیگری تعریف نشده‌اند استفاده می‌شود.
// ============================================================

import LegacyModules from '@/src/components/LegacyModules';

interface LibraryModuleProps {
  user: any;
  activeTabId?: string;
  moduleId?: string;
  onOpenTab?: (id: string, title: string, iconName: string, forceNewInstance?: boolean) => void;
  moduleIdLabel?: string;
}

export default function LibraryModule({ moduleId, moduleIdLabel }: LibraryModuleProps) {
  return (
    <LegacyModules
      moduleId={moduleId || ''}
      moduleIdLabel={moduleIdLabel || 'خدمات الکترونیکی پورتال'}
    />
  );
}
