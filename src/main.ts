import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type, Accept',
      credentials: true,
    },
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const configService: ConfigService = app.get<ConfigService>(ConfigService);
  app.use(cookieParser());
  app.setGlobalPrefix('v1');

  const port = configService.get('PORT');
  await app.listen(port);
}
bootstrap();
