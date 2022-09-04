import { Module } from '@nestjs/common';
import { StarrybotController } from './starrybot/controller/starrybot.controller';

import { WarCatsController } from './warcats/controller/warcats.controller';
import { WarCatsService } from './warcats/service/warcats.service';
import { ConfigModule } from '@nestjs/config';
import { WarCatsGateway } from './warcats/gateway/warcats.gateway';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [StarrybotController, WarCatsController],
  providers: [WarCatsService, WarCatsGateway],
})
export class AppModule {}
