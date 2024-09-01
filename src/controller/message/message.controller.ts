import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { Request } from 'express';
import { Roles } from 'src/guard/roles/roles.decorator';
import { Role } from 'src/guard/roles/roles.enum';
import { RolesGuard } from 'src/guard/roles/roles.guard';
import { Conversation, Message, MessageDto } from 'src/model/message/conversation.dto';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { UtilityService } from 'src/services/utility.service';

@Controller('message')
@UseGuards(RolesGuard)
export class MessageController {
  constructor(
    private prismaService: PrismaService,
    private utilityService: UtilityService,
  ) {}

  //#region Conversation
  @Get('conversation/:idConversation')
  @Roles([Role.SUPERADMIN, Role.ADMIN, Role.MENTOR, Role.MEMBER])
  async getMessageByConversation(@Req() request: Request, @Param('idConversation') idConversation: string) {
    const user = request.user;
    const dbUser = await this.prismaService.user.findUnique({
      where: { Id: user.id },
    });

    if (!dbUser) {
      return this.utilityService.globalResponse({
        statusCode: 400,
        message: 'User not found',
      });
    }

    const dbConversation = await this.prismaService.conversation.findUnique({
      where: {
        Id: idConversation,
      },
      include: {
        Member: true,
        Message: true,
      },
    });

    if (!dbConversation) {
      return this.utilityService.globalResponse({
        statusCode: 404,
        message: 'Conversation not found',
      });
    }

    const isUserMember = dbConversation.Member.some((member) => member.IdUser === user.id);

    if (!isUserMember || user.role === RoleType.ADMIN || user.role === RoleType.SUPERADMIN) {
      return this.utilityService.globalResponse({
        statusCode: 403,
        message: 'Access denied: You are not a member of this conversation',
      });
    }

    const conversation: Conversation = {
      id: dbConversation.Id,
      name: dbConversation.Name,
      type: dbConversation.Type,
    };

    const message: Message[] = dbConversation.Message.map((message) => ({
      id: message.Id,
      dateCreated: message.DateCreate,
      dateUpdate: message.DateUpdate,
      message: message.Message,
      attachment: message.Attachment,
    }));

    return this.utilityService.globalResponse({
      data: { conversation, message },
      message: 'Success Get List Message by Id Conversation',
      statusCode: 200,
    });
  }
  //#endregion

  //#region Save
  @Post('save')
  @Roles([Role.SUPERADMIN, Role.ADMIN, Role.MENTOR, Role.MEMBER])
  async saveMessage(@Req() request: Request, @Body() body: MessageDto) {
    const user = request.user;
    const dbUser = await this.prismaService.user.findUnique({
      where: { Id: user.id },
    });

    if (!dbUser) {
      return this.utilityService.globalResponse({
        statusCode: 400,
        message: 'User not found',
      });
    }

    const dbMessage = await this.prismaService.message.findUnique({
      where: {
        Id: body.id ?? '',
      },
    });
    const messageId = dbMessage ? dbMessage.Id : this.utilityService.generateId();

    const dbConversation = await this.prismaService.conversation.findUnique({
      where: {
        Id: body.idConversation,
      },
      include: {
        Member: true,
      },
    });

    if (!dbConversation) {
      return this.utilityService.globalResponse({
        statusCode: 404,
        message: 'Conversation not found',
      });
    }

    const isUserMember = dbConversation.Member.some((member) => member.IdUser === user.id);

    if (!isUserMember) {
      return this.utilityService.globalResponse({
        statusCode: 403,
        message: 'Access denied: You are not a member of this conversation',
      });
    }

    const message = await this.prismaService.message.upsert({
      where: {
        Id: messageId,
      },
      update: {
        Message: body.message,
        Attachment: body.attachment,
        IdUser: body.idUSer,
        IdConversation: body.idConversation,
      },
      create: {
        Id: this.utilityService.generateId(),
        Message: body.message,
        Attachment: body.attachment,
        IdUser: body.idUSer,
        IdConversation: body.idConversation,
      },
    });

    return this.utilityService.globalResponse({
      statusCode: 200,
      message: `Success ${body.id ? 'Update' : 'Create'} Message`,
      data: { id: message.Id },
    });
  }
  //#endregion
}
