import { ConversationType } from '@prisma/client';

export class ConversationDto {
  id?: string;
  name?: string;
  type: ConversationType;
}
