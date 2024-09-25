import { ConversationType, RoleType } from '@prisma/client';

export class ConversationDto {
  id?: string;
  name?: string;
  type: ConversationType;
}

export interface Conversation {
  id: string;
  name: string;
  type: ConversationType;
  member?: Member[];
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  idConversation?: string;
  isAllowed?: boolean;
}

export interface MemberDto {
  id?: string;
  idUser: string;
  idConversation: string;
}

export interface Message {
  id: string;
  dateCreated: Date;
  dateUpdate: Date;
  message: string;
  attachment: string;
  member?: Member;
}

export interface MessageDto {
  id?: string;
  message?: string;
  attachment?: string;
  idConversation: string;
  idUser: string;
}
