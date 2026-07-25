// ============================================================
// AccountingModule — ماژول حسابداری و مدیریت بن‌های خرید
//
// این ماژول شامل مدیریت بن‌های تخفیف، فیش‌های بانکی و
// گزارشات مالی می‌باشد.
// ============================================================

interface AccountingModuleProps {
  user: any;
  activeTabId?: string;
  moduleId?: string;
  onOpenTab?: (id: string, title: string, iconName: string, forceNewInstance?: boolean) => void;
}

export default function AccountingModule(_props: AccountingModuleProps) {
  return (
    <div className="py-2.5 relative">
      <div className="text-center py-20 text-gray-400">
        <p className="text-sm font-bold">ماژول حسابداری</p>
        <p className="text-xs mt-2">به زودی...</p>
      </div>
    </div>
  );
}
