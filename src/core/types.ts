export type FieldType = 'text' | 'number' | 'select' | 'richtext' | 'file' | 'location';

export interface FieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

export interface FieldSchema {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[]; // For 'select' type
  validation?: FieldValidation;
  roles?: string[]; // RBAC level: roles allowed to modify/write this field
  defaultValue?: any;
}

export interface ModuleSchema {
  id: string; // matches backend table name/endpoint (e.g. 'products')
  title: string;
  icon: string; // Lucide icon name
  allowedRoles: string[]; // Access roles
  fields: FieldSchema[];
  description?: string;
}

export type PageViewMode = 'list' | 'create' | 'edit' | 'detail' | 'import_export';

export interface AppNavigationState {
  moduleId: string;
  viewMode: PageViewMode;
  selectedItemId?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'HR_MANAGER' | 'SALES_REP' | 'VIEWER';
  name: string;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  action?: ToastAction;
  duration?: number;
}
