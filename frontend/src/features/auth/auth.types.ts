export type UserRole = "ADMIN" | "VENDOR";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  vendorId: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
