import { Controller, Get } from '@nestjs/common';
import { WarCatsService } from '../service/warcats.service';

@Controller()
export class WarCatsController {
  constructor(private readonly warcatsService: WarCatsService) {}

  @Get()
  getHello(): string {
    return this.warcatsService.getHello();
  }
}
