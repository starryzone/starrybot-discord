import { Injectable } from '@nestjs/common';

@Injectable()
export class WarCatsService {
  getHello(): string {
    return 'Hello World!';
  }
}
