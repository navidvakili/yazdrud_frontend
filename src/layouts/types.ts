// ============================================================
// Layout Types — انواع مربوط به چیدمان، منو و ناوبری
// ============================================================

export interface Tab {
  id: string;
  title: string;
  iconName: string;
  moduleType?: string;
}

export interface NavChild {
  title: string;
  url: string;
  icon: string;
}

export interface NavItem {
  id: number;
  title: string;
  url: string;
  icon: string;
  ordering: number;
  children: NavChild[];
}

export interface NavResponse {
  data: NavItem[];
}

export interface PermissionItem {
  id: number;
  parent: string | number;
  title: string;
  url: string;
  icon: string;
  roles: string;
  ordering: number;
  active: number;
}

export interface PermissionsResponse {
  data: PermissionItem[];
}

export interface PortalNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}
