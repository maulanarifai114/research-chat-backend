import { Module } from '@nestjs/common';
import { ChatGateway } from './gateway/chat.gateway';
import { PrismaService } from './services/prisma/prisma.service';
import { UserController } from './controller/user/user.controller';
import { MessageController } from './controller/message/message.controller';
import { UtilityService } from './services/utility.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
  ],
  controllers: [UserController, MessageController],
  providers: [ChatGateway, PrismaService, UtilityService],
})
export class AppModule {}
