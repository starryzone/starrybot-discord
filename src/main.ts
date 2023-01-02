import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WarCatsGameService } from './warcats/service/warcats.game.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const gameService = app.get(WarCatsGameService);
  await gameService.flushdb();
  console.log('flushed db');

  await app.listen(3001);
}
bootstrap();
