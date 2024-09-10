import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ConversationType, RoleType } from '@prisma/client';
import { Request } from 'express';
import { Roles } from 'src/guard/roles/roles.decorator';
import { Role } from 'src/guard/roles/roles.enum';
import { RolesGuard } from 'src/guard/roles/roles.guard';
import { Conversation, Member, MemberDto } from 'src/model/message/conversation.dto';
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
      where: {
        IdUser: {
          not: idUSer,
        },
      },
      include: {
        User: true,
        Conversation: {
          include: {
            Member: {
              include: {
                User: true,
              },
            },
          },
        },
      },
    });

    const dbPrivateMember = dbMember.filter((member) => member.Conversation.Type === ConversationType.PRIVATE && member.Conversation.Member.some((convMember) => convMember.User.Id === idUSer));
    const uniquePrivateMembers = new Map<string, Member>();
    dbPrivateMember.forEach((member) => {
      if (!uniquePrivateMembers.has(member.User.Id)) {
        uniquePrivateMembers.set(member.User.Id, {
          id: member.User.Id,
          name: member.User.Name,
          email: member.User.Email,
          role: member.User.Role,
          idConversation: member.IdConversation,
        });
      }
    });
    const privateMember: Member[] = Array.from(uniquePrivateMembers.values());

    const dbGroupMember = dbMember.filter((member) => member.Conversation.Type === ConversationType.GROUP);
    const uniqueGroupMembers = new Map<string, Conversation>();
    dbGroupMember.forEach((member) => {
      if (!uniqueGroupMembers.has(member.Conversation.Id)) {
        uniqueGroupMembers.set(member.Conversation.Id, {
          id: member.Conversation.Id,
          name: member.Conversation.Name,
          type: member.Conversation.Type,
          member: member.Conversation.Member.map((member) => ({
            id: member.User.Id,
            name: member.User.Name,
            email: member.User.Email,
            role: member.User.Role,
          })),
        });
      }
    });
    const groupMember: Conversation[] = Array.from(uniqueGroupMembers.values());

    const dbBroadcastMember = dbMember.filter((member) => member.Conversation.Type === ConversationType.BROADCAST);
    const uniqueBroadcastMembers = new Map<string, Conversation>();
    dbBroadcastMember.forEach((member) => {
      if (!uniqueBroadcastMembers.has(member.Conversation.Id)) {
        uniqueBroadcastMembers.set(member.Conversation.Id, {
          id: member.Conversation.Id,
          name: member.Conversation.Name,
          type: member.Conversation.Type,
          member: member.Conversation.Member.filter((user) => user.User.Id !== idUSer).map((member) => ({
            id: member.User.Id,
            name: member.User.Name,
            email: member.User.Email,
            role: member.User.Role,
          })),
        });
      }
    });
    const broadcastMember: Conversation[] = Array.from(uniqueBroadcastMembers.values());

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

  //#region List User
  @Get('member/:userId')
  @Roles([Role.SUPERADMIN, Role.ADMIN, Role.MENTOR, Role.MEMBER])
  async getUsersOutsidePrivateConversationsByUserId(@Req() request: Request, @Param('userId') userId: string) {
    try {
      const allUsers = await this.prismaService.user.findMany({
        where: {
          Role: {
            not: 'SUPERADMIN',
          },
          Id: {
            not: userId,
          },
        },
      });

      const privateConversations = await this.prismaService.conversation.findMany({
        where: {
          Type: 'PRIVATE',
          Member: {
            some: {
              IdUser: userId,
            },
          },
        },
        include: {
          Member: {
            include: {
              User: true,
            },
          },
        },
      });

      const usersInPrivateConversations = new Set<string>();
      privateConversations.forEach((conversation) => {
        conversation.Member.forEach((member) => {
          if (member.User.Id !== userId) {
            usersInPrivateConversations.add(member.User.Id);
          }
        });
      });

      const usersOutsidePrivateConversations = allUsers.filter((user) => !usersInPrivateConversations.has(user.Id));

      const member = usersOutsidePrivateConversations.map((user) => ({
        id: user.Id,
        name: user.Name,
        email: user.Email,
        role: user.Role,
      }));

      return this.utilityService.globalResponse({
        data: member,
        message: "Success Get Users Outside of User's PRIVATE Conversations",
        statusCode: 200,
      });
    } catch (error) {
      return this.utilityService.globalResponse({
        statusCode: 500,
        message: 'Internal Server Error',
      });
    }
  }
  //#endregion

  //#region Roles
  @Get('list/user')
  @Roles([Role.SUPERADMIN, Role.ADMIN, Role.MENTOR, Role.MEMBER])
  async getUsersByRoles(@Query('roles') roles: RoleType[] = []) {
    try {
      // Ensure roles is an array and filter out empty strings
      const filteredRoles = Array.isArray(roles) ? roles.filter((role) => role) : [roles];

      const users = await this.prismaService.user.findMany({
        where: {
          Role: {
            in: filteredRoles, // Ensure this is always an array
          },
        },
        select: {
          Id: true,
          Name: true,
          Email: true,
          Role: true,
        },
      });

      return this.utilityService.globalResponse({
        data: users,
        message: 'Success Get Users by Roles',
        statusCode: 200,
      });
    } catch (error) {
      console.error(error); // Log the error for debugging
      return this.utilityService.globalResponse({
        statusCode: 500,
        message: 'Internal Server Error',
      });
    }
  }
  //#endregion

  //#region Save
  @Post('save')
  @Roles([Role.SUPERADMIN, Role.ADMIN, Role.MENTOR, Role.MEMBER])
  async saveMember(@Req() request: Request, @Body() body: MemberDto) {
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

    const dbMember = await this.prismaService.member.findUnique({
      where: {
        Id: body?.id,
      },
    });
    const memberId = dbMember ? dbMember.Id : this.utilityService.generateId();

    const existMember = await this.prismaService.member.count({
      where: {
        IdUser: body?.id,
        IdConversation: body.idConversation,
      },
    });

    if (existMember) {
      return this.utilityService.globalResponse({
        statusCode: 400,
        message: 'User available on the conversation',
      });
    }

    const member = await this.prismaService.member.upsert({
      where: {
        Id: memberId,
      },
      update: {
        IdUser: body.idUser,
        IdConversation: body.idConversation,
      },
      create: {
        Id: this.utilityService.generateId(),
        IdUser: body.idUser,
        IdConversation: body.idConversation,
        IsAllowed: body.idUser === dbUser.Id,
      },
    });

    return this.utilityService.globalResponse({
      statusCode: 200,
      message: `Success ${body.id ? 'Update' : 'Create'} Member`,
      data: { id: member.Id },
    });
  }
  //#endregion

  //#region Bulk create
  @Post('bulk')
  @Roles([Role.SUPERADMIN, Role.ADMIN, Role.MENTOR, Role.MEMBER])
  async createBulkMembers(@Req() request: Request, @Body() body: { idUsers: string[]; idConversation: string }) {
    const user = request.user;

    // Check if the current user exists
    const dbUser = await this.prismaService.user.findUnique({
      where: { Id: user.id },
    });

    if (!dbUser) {
      return this.utilityService.globalResponse({
        statusCode: 400,
        message: 'User not found',
      });
    }

    // Validate if the conversation exists
    const dbConversation = await this.prismaService.conversation.findUnique({
      where: { Id: body.idConversation },
    });

    if (!dbConversation) {
      return this.utilityService.globalResponse({
        statusCode: 400,
        message: 'Conversation not found',
      });
    }

    // Filter out users that are already members of the conversation
    const existingMembers = await this.prismaService.member.findMany({
      where: {
        IdConversation: body.idConversation,
        IdUser: { in: body.idUsers },
      },
    });

    const existingUserIds = existingMembers.map((member) => member.IdUser);
    const newUserIds = body.idUsers.filter((idUser) => !existingUserIds.includes(idUser));

    if (newUserIds.length === 0) {
      return this.utilityService.globalResponse({
        statusCode: 400,
        message: 'All users are already members of the conversation',
      });
    }

    // Prepare data for bulk insert
    const membersData: any[] = newUserIds.map((idUser) => ({
      Id: this.utilityService.generateId(),
      IdUser: idUser,
      IsAllowed: idUser === dbUser.Id,
      IdConversation: body.idConversation,
      DateCreate: new Date(),
      DateUpdate: new Date(),
    }));

    // Perform bulk insert using createMany
    await this.prismaService.member.createMany({
      data: membersData,
      skipDuplicates: true,
    });

    return this.utilityService.globalResponse({
      statusCode: 200,
      message: `Successfully added ${membersData.length} members to the conversation`,
      data: { membersCount: membersData.length },
    });
  }
  //#endregion
}
