export interface AdminUser {
  id: string;
  email: string;
  userName: string;
  displayName: string;
  isActive: boolean;
  roles: AdminRole[];
  tenantId?: string | null;
  businessUnitId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export type AdminRole = 'SystemAdmin' | 'CompanyAdmin' | 'UnitAdmin';

export interface AdminSession {
  user: AdminUser;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface CreateAdminUserRequest {
  email: string;
  displayName: string;
  password: string;
  isActive: boolean;
}

export interface UpdateAdminUserRequest {
  email: string;
  displayName: string;
  isActive: boolean;
}

export interface SetAdminUserPasswordRequest {
  password: string;
}
