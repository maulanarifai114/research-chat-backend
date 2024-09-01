import { ConversationType, RoleType } from '@prisma/client';

export class ConversationDto {
  id?: string;
  name?: string;
  type: ConversationType;
}

export interface ConversationList {
  id: string;
  name: string;
  type: ConversationType;
  member: Member[];
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: RoleType;
}
