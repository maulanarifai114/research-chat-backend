import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatGateway } from './gateway/chat.gateway';
import { PrismaService } from './services/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ChatGateway, PrismaService],
})
export class AppModule {}
