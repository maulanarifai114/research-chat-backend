import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type, Accept',
      credentials: true,
    },
  });
  const configService: ConfigService = app.get<ConfigService>(ConfigService);

  app.setGlobalPrefix('v1');

  const port = configService.get('PORT');
  await app.listen(port);
}
bootstrap();
