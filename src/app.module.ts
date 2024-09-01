import { Module } from '@nestjs/common';
import { ChatGateway } from './gateway/chat.gateway';
import { PrismaService } from './services/prisma/prisma.service';
import { UserController } from './controller/user/user.controller';
import { MessageController } from './controller/message/message.controller';
import { UtilityService } from './services/utility.service';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from './services/jwt.service';
import { AuthController } from './controller/auth/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { MemberController } from './controller/member/member.controller';
import { ConversationController } from './controller/conversation/conversation.controller';

@Module({
  imports: [
    JwtModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
  ],
  controllers: [UserController, MessageController, AuthController, MemberController, ConversationController],
  providers: [ChatGateway, PrismaService, UtilityService, JwtService],
})
export class AppModule {}
