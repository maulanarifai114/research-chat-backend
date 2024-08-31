import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type, Accept',
      credentials: true,
    },
    logger: ['log', 'error', 'warn', 'debug', 'verbose'], // Menambah log level
  });
  const configService: ConfigService = app.get<ConfigService>(ConfigService);

  app.use(cookieParser());
  app.setGlobalPrefix('v1');

  const port = configService.get('PORT');
  await app.listen(port);
}
bootstrap();
