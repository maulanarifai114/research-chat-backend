import { Controller, Get, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { Request } from 'express';
import { Roles } from 'src/guard/roles/roles.decorator';
import { Role } from 'src/guard/roles/roles.enum';
import { RolesGuard } from 'src/guard/roles/roles.guard';
import { Conversation, Message } from 'src/model/message/conversation.dto';
import { PrismaService } from 'src/services/prisma/prisma.service';
import { UtilityService } from 'src/services/utility.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

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
        Message: {
          include: {
            User: true,
          },
        },
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
      member: {
        id: message.User.Id,
        name: message.User.Name,
        email: message.User.Email,
        role: message.User.Role,
      },
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
  @UseInterceptors(
    FileInterceptor('attachment', {
      storage: diskStorage({
        destination: join(__dirname, '..', 'dist', 'uploads'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Unsupported file type'), false);
        }
      },
    }),
  )
  async saveMessage(@Req() request: Request, @UploadedFile() file?: Express.Multer.File) {
    const user = request.user;

    // Extracting message details from form-data
    const messageContent = request.body.message || '';
    const attachment = file ? `/uploads/${file.filename}` : request.body.attachment || '';
    const idConversation = request.body.idConversation;

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

    const dbMessage = await this.prismaService.message.findUnique({
      where: {
        Id: request.body.id ?? '',
      },
    });
    const messageId = dbMessage ? dbMessage.Id : this.utilityService.generateId();

    const message = await this.prismaService.message.upsert({
      where: {
        Id: messageId,
      },
      update: {
        Message: messageContent,
        Attachment: attachment,
        IdUser: user.id,
        IdConversation: idConversation,
      },
      create: {
        Id: this.utilityService.generateId(),
        Message: messageContent,
        Attachment: attachment,
        IdUser: user.id,
        IdConversation: idConversation,
      },
    });

    return this.utilityService.globalResponse({
      statusCode: 200,
      message: `Success ${request.body.id ? 'Update' : 'Create'} Message`,
      data: { id: message.Id },
    });
  }
  // async saveMessage(@Req() request: Request, @Body() body: MessageDto, @UploadedFiles() file?: Express.Multer.File) {
  //   const user = request.user;
  //   const dbUser = await this.prismaService.user.findUnique({
  //     where: { Id: user.id },
  //   });

  //   if (!dbUser) {
  //     return this.utilityService.globalResponse({
  //       statusCode: 400,
  //       message: 'User not found',
  //     });
  //   }

  //   const dbMessage = await this.prismaService.message.findUnique({
  //     where: {
  //       Id: body.id ?? '',
  //     },
  //   });
  //   const messageId = dbMessage ? dbMessage.Id : this.utilityService.generateId();

  //   const dbConversation = await this.prismaService.conversation.findUnique({
  //     where: {
  //       Id: body.idConversation,
  //     },
  //     include: {
  //       Member: true,
  //     },
  //   });

  //   if (!dbConversation) {
  //     return this.utilityService.globalResponse({
  //       statusCode: 404,
  //       message: 'Conversation not found',
  //     });
  //   }

  //   const isUserMember = dbConversation.Member.some((member) => member.IdUser === user.id);

  //   if (!isUserMember) {
  //     return this.utilityService.globalResponse({
  //       statusCode: 403,
  //       message: 'Access denied: You are not a member of this conversation',
  //     });
  //   }

  //   // Cek apakah file diupload
  //   const attachmentPath = file ? `/uploads/${file.filename}` : body.attachment;

  //   // Jika ada file, message dikosongkan
  //   const messageContent = file ? '' : body.message;

  //   const message = await this.prismaService.message.upsert({
  //     where: {
  //       Id: messageId,
  //     },
  //     update: {
  //       Message: messageContent,
  //       Attachment: attachmentPath,
  //       IdUser: user.id,
  //       IdConversation: body.idConversation,
  //     },
  //     create: {
  //       Id: this.utilityService.generateId(),
  //       Message: messageContent,
  //       Attachment: attachmentPath,
  //       IdUser: user.id,
  //       IdConversation: body.idConversation,
  //     },
  //   });

  //   return this.utilityService.globalResponse({
  //     statusCode: 200,
  //     message: `Success ${body.id ? 'Update' : 'Create'} Message`,
  //     data: { id: message.Id },
  //   });
  // }
  //#endregion
}
