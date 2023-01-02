import { Controller, Get, Param } from '@nestjs/common';
import { WarCatsGameService } from '../service/warcats.game.service';
//import { WarCatsService } from '../service/warcats.matching.service';

@Controller()
export class WarCatsController {
  constructor(private readonly warcatsGameService: WarCatsGameService) {}

  @Get('/games/wallet/:wallet')
  async game(@Param('wallet') wallet: string) {
    const game = await this.warcatsGameService.findActiveGame(wallet);
    if (game == null) {
      return -1;
    }
    return game.player1.wallet == wallet
      ? game.player1.warcatTokenId
      : game.player2.wallet == wallet
      ? game.player2.warcatTokenId
      : -1;
  }
}
