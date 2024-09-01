import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ConversationType } from '@prisma/client';
import { Request } from 'express';
import { Roles } from 'src/guard/roles/roles.decorator';
import { Role } from 'src/guard/roles/roles.enum';
import { RolesGuard } from 'src/guard/roles/roles.guard';
import { ConversationDto } from 'src/model/message/conversation.dto';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { UtilityService } from 'src/services/utility.service';

@Controller('conversation')
@UseGuards(RolesGuard)
export class ConversationController {
  constructor(
    private prismaService: PrismaService,
    private utilityService: UtilityService,
  ) {}

  //#region List
  @Get('list')
  @Roles([Role.SUPERADMIN, Role.ADMIN])
  async getListConversation(@Req() request: Request) {
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

    const dbConversation = await this.prismaService.conversation.findMany({
      include: {
        Member: true,
      },
    });

    return this.utilityService.globalResponse({
      data: dbConversation,
      message: 'Success Get List Conversation',
      statusCode: 200,
    });
  }
  //#endregion

  //#region Save
  @Post('save')
  @Roles([Role.SUPERADMIN, Role.ADMIN, Role.MENTOR, Role.MEMBER])
  async saveConversation(@Req() request: Request, @Body() body: ConversationDto) {
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
        Id: body.id ?? '',
      },
    });

    const conversationId = dbConversation ? dbConversation.Id : this.utilityService.generateId();

    const conversation = await this.prismaService.conversation.upsert({
      where: {
        Id: conversationId,
      },
      update: {
        Name: body.name,
        Type: body.type as ConversationType,
      },
      create: {
        Id: this.utilityService.generateId(),
        Name: body.name,
        Type: body.type as ConversationType,
      },
    });

    return this.utilityService.globalResponse({
      statusCode: 200,
      message: `Success ${body.id ? 'Update' : 'Create'} Conversation`,
      data: { id: conversation.Id },
    });
  }
  //#endregion

  //#region Delete
  @Post('delete/:id')
  @Roles([Role.SUPERADMIN, Role.ADMIN])
  async deleteConversation(@Req() request: Request, @Param('id') id: string) {
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

    if (user.role !== Role.ADMIN && user.role !== Role.SUPERADMIN) {
      throw new BadRequestException(
        this.utilityService.globalResponse({
          statusCode: 400,
          message: 'You are not authorized to delete this conversation',
        }),
      );
    }

    const dbConversation = await this.prismaService.conversation.findFirst({
      where: {
        Id: id,
      },
      include: {
        Member: true,
        Message: true,
      },
    });
    if (!dbConversation) {
      throw new BadRequestException(
        this.utilityService.globalResponse({
          statusCode: 400,
          message: 'Conversation not found',
        }),
      );
    }

    if (dbConversation.Member.length > 0 || dbConversation.Message.length > 0) {
      throw new BadRequestException(
        this.utilityService.globalResponse({
          statusCode: 400,
          message: 'You cannot delete conversation that has member or message',
        }),
      );
    }

    await this.prismaService.$transaction([
      this.prismaService.member.deleteMany({
        where: {
          IdConversation: id,
        },
      }),
      this.prismaService.message.deleteMany({
        where: {
          IdConversation: id,
        },
      }),
      this.prismaService.conversation.delete({
        where: {
          Id: dbConversation.Id,
        },
      }),
    ]);

    return this.utilityService.globalResponse({
      statusCode: 200,
      message: 'Converation deleted successfully',
    });
  }
  //#endregion
}
