// ============================================================
// AccountingModule — ماژول حسابداری و مدیریت بن‌های خرید
//
// این ماژول شامل مدیریت بن‌های تخفیف، فیش‌های بانکی و
// گزارشات مالی می‌باشد.
// ============================================================

import { StandaloneTutsVouchers } from '@/src/apps/tuts/vouchers';

interface AccountingModuleProps {
  user: any;
  activeTabId?: string;
  moduleId?: string;
  onOpenTab?: (id: string, title: string, iconName: string, forceNewInstance?: boolean) => void;
}

export default function AccountingModule(_props: AccountingModuleProps) {
  return (
    <div className="py-2.5 relative">
      <StandaloneTutsVouchers />
    </div>
  );
}
