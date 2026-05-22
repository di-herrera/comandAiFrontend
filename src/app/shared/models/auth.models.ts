export interface AdminUser {
  id: string;
  email: string;
  userName: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AdminSession {
  user: AdminUser;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}
