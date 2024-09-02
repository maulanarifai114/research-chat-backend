import { RoleType } from '@prisma/client';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: RoleType;
}
