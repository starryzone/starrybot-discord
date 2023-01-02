import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io } from 'socket.io-client';
import { GameDocument } from 'src/warcats/schema/game.schema';
import { AppModule } from '../app.module';

jest.setTimeout(30000);

describe('WarCatsGateway', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = (
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile()
    ).createNestApplication();
    app.listen(3000);
  });

  describe('root', () => {
    // const numUsers = 100;
    // it(`${numUsers} players should find a unique match`, async () => {
    //   const sockets = Array(numUsers).fill(0);
    //   console.log('connecting');
    //   const responses = await Promise.all(
    //     sockets.map(async (num, i) => {
    //       const socket = io('http://localhost:3000');
    //       console.log('added socket lister');
    //       socket.emit('find_game', { wallet: 'hello', signed: 'hi' });
    //       const response = await new Promise<GameDocument>((resolve) => {
    //         socket.on('found_game', (data: GameDocument) => {
    //           console.log('got data', data);
    //           socket.close();
    //           resolve(data);
    //         });
    //       });
    //       socket.close();
    //       return response;
    //     }),
    //   );
    //   console.log({ responses });
    //   for (const response of responses) {
    //     expect(
    //       responses
    //         .map((game) => game._id)
    //         .filter((res2) => res2 == response._id).length,
    //     ).toBe(2);
    //     console.log(JSON.stringify(response, null, 2));
    //   }
    // });
  });

  describe('test', () => {
    it(`a game's first turns should be able to be simulated`, async () => {
      const socket1 = io('http://localhost:3000');
      const socket2 = io('http://localhost:3000');

      let gameData = await new Promise<any>(async (resolve) => {
        socket1.on('found_game', (gameData) => {
          resolve(gameData);
        });
        socket1.emit('find_game', { wallet: 'hello', signed: 'hi' });
        socket2.emit('find_game', { wallet: 'hiya', signed: 'wassup' });
      });

      console.log('found game');

      const response = await new Promise<string>(async (resolve) => {
        socket1.on('moved_unit', (data) => {
          resolve(data);
        });
        socket1.emit('move_unit', {
          unitId: gameData.units[0]._id,
          position: { x: 1, y: 2 },
        });
      });

      expect(response).toBe('Moved unit');
    });
  });

  afterEach(() => {
    app.close();
  });
});
