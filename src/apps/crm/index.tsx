// ============================================================
// CRMModule — ماژول مدیریت ارتباط با مشتری (CRM)
//
// شامل مدیریت دانشجویان، اساتید و نشست‌های ادمین
// ============================================================

import StudentManagement from '@/src/components/StudentManagement';
import ProfessorManagement from '@/src/components/ProfessorManagement';
import AdminSessionsPanel from '@/src/components/AdminSessionsPanel';

interface CRMModuleProps {
  user: any;
  activeTabId?: string;
  moduleId?: string;
  onOpenTab?: (id: string, title: string, iconName: string, forceNewInstance?: boolean) => void;
}

export default function CRMModule({ moduleId }: CRMModuleProps) {
  switch (moduleId) {
    case 'students':
      return <StudentManagement />;
    case 'professors':
      return <ProfessorManagement />;
    case 'admin-sessions':
      return <AdminSessionsPanel />;
    default:
      return (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <span>ماژول مورد نظر یافت نشد</span>
        </div>
      );
  }
}
