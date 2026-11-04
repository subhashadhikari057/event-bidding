import type { UserRole } from '../generated/prisma/enums';

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  vendorId: string | null;
  isActive: boolean;
}
