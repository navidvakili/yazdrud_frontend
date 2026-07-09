// ============================================================
// CRM Types — انواع مربوط به دانشجویان و اساتید
// ============================================================

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  nationalCode: string;
  major: string;
  entryYear: number;
  status: 'active' | 'graduated' | 'suspended' | 'dropped';
  gpa?: number;
  supervisor?: string;
}

export interface Professor {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
  degree: string;
  specialization: string;
  status: 'active' | 'inactive' | 'retired';
}
