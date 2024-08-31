import { RoleType } from '@prisma/client';

export class AuthDto {
  email: string;
  password: string;
  name: string;
  role: RoleType;
  refreshToken?: string | null;
}
