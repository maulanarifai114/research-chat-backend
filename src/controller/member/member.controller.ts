import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ConversationType } from '@prisma/client';
import { Request } from 'express';
import { Roles } from 'src/guard/roles/roles.decorator';
import { Role } from 'src/guard/roles/roles.enum';
import { RolesGuard } from 'src/guard/roles/roles.guard';
import { Conversation, Member } from 'src/model/message/conversation.dto';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { UtilityService } from 'src/services/utility.service';

@Controller('member')
@UseGuards(RolesGuard)
export class MemberController {
  constructor(
    private prismaService: PrismaService,
    private utilityService: UtilityService,
  ) {}

  //#region Conversation
  @Get('conversation/:idConversation')
  @Roles([Role.SUPERADMIN, Role.ADMIN, Role.MENTOR, Role.MEMBER])
  async getMemberByConversation(@Req() request: Request, @Param('idConversation') idConversation: string) {
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

    const dbConversation = await this.prismaService.conversation.findFirst({
      where: {
        Id: idConversation,
      },
    });

    const conversation: Conversation = {
      id: dbConversation.Id,
      name: dbConversation.Name,
      type: dbConversation.Type,
    };

    const dbMember = await this.prismaService.member.findMany({
      where: {
        IdConversation: idConversation,
      },
      include: {
        User: true,
      },
    });

    const member: Member[] = dbMember.map((member) => ({
      id: member.User.Id,
      name: member.User.Name,
      email: member.User.Email,
      role: member.User.Role,
    }));

    return this.utilityService.globalResponse({
      data: {
        conversation,
        member,
      },
      message: 'Success Get List Member by ID Conversation',
      statusCode: 200,
    });
  }
  //#endregion

  //#region User
  @Get('user/:idUser')
  @Roles([Role.SUPERADMIN, Role.ADMIN, Role.MENTOR, Role.MEMBER])
  async getMemberByIdUser(@Req() request: Request, @Param('idUser') idUSer: string) {
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

    const dbMember = await this.prismaService.member.findMany({
      where: { IdUser: idUSer },
      include: {
        User: true,
        Conversation: {
          include: {
            Member: {
              include: {
                User: true,
              },
              where: {
                IdUser: {
                  not: idUSer,
                },
              },
            },
          },
        },
      },
    });

    const dbPrivateMember = dbMember.filter((member) => member.Conversation.Type == ConversationType.PRIVATE);
    const privateMember: Member[] = dbPrivateMember.map((member) => ({
      id: member.User.Id,
      name: member.User.Name,
      email: member.User.Email,
      role: member.User.Role,
    }));

    const dbGroupMember = dbMember.filter((member) => member.Conversation.Type === ConversationType.GROUP);
    const groupMember: Conversation[] = dbGroupMember.map((member) => ({
      id: member.Conversation.Id,
      name: member.Conversation.Name,
      type: member.Conversation.Type,
      member: member.Conversation.Member.map((member) => ({
        id: member.User.Id,
        name: member.User.Name,
        email: member.User.Email,
        role: member.User.Role,
      })),
    }));

    const dbBroadcastMember = dbMember.filter((member) => member.Conversation.Type === ConversationType.BROADCAST);
    const broadcastMember: Conversation[] = dbBroadcastMember.map((member) => ({
      id: member.Conversation.Id,
      name: member.Conversation.Name,
      type: member.Conversation.Type,
      member: member.Conversation.Member.filter((user) => user.User.Id !== idUSer).map((member) => ({
        id: member.User.Id,
        name: member.User.Name,
        email: member.User.Email,
        role: member.User.Role,
      })),
    }));

    return this.utilityService.globalResponse({
      data: {
        privateMember,
        groupMember,
        broadcastMember,
      },
      message: 'Success Get List Member by ID User',
      statusCode: 200,
    });
  }
  //#endregion
}
