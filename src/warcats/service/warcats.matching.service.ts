import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { IRedisProvider } from '../redis/warcats.redis';
import {
  UnitPath,
  UnitTeam,
  BuildingPath,
  MapPosition,
  Unit,
  IGame,
  IPlayer,
  IUnit,
} from 'warcats-common';

export const startingGold = 1000;

const makeBuilding = (path: BuildingPath, pos: number[]) => {
  const position = new MapPosition();
  position.x = pos[0];
  position.y = pos[1];
  return { path, position, health: 10, didSpawn: false };
};

export const makeUnit = (path: UnitPath, pos: number[], didMove: boolean) => {
  const position = new MapPosition();
  position.x = pos[0];
  position.y = pos[1];

  return {
    path: path,
    position,
    didMove,
    health: 10,
    fuel: 100,
  } as IUnit;
};

@Injectable()
export class WarCatsMatchingService {
  constructor(
    @Inject('REDIS')
    private readonly redis: IRedisProvider,
    @InjectModel('Game') private gameModel: Model<IGame>,
  ) {}

  // async addToMatchmaking(
  //   socket: Socket,
  //   wallet: string,
  //   warcatTokenId: number,
  // ) {
  //   const si = socket.id;
  //   const ri = require('crypto').randomBytes(128).toString('hex');

  //   const game = await new Promise<IGame>(async (resolve) => {
  //     this.redis.sub.on('confirm_game', async (si1, si2, gameId) => {
  //       if (si1 == si || si2 == si) {
  //         console.log('confirming', si, si1, si2, gameId);
  //         const game = await this.gameModel.findById(gameId);
  //         if (game == null) {
  //           throw new Error('Bad game');
  //         }
  //         resolve(game);
  //       }
  //     });

  //     this.redis.sub.on('found_game', async (maybeOurId, otherId) => {
  //       if (maybeOurId == si) {
  //         console.log('confirming game', { maybeOurId, otherId });
  //         const ourSearchPayload = await this.redis.sub.get(maybeOurId);
  //         const theirSearchPayload = await this.redis.sub.get(otherId);
  //         if (ourSearchPayload == null || theirSearchPayload == null) {
  //           throw new Error('Something with redis messed up');
  //         }

  //         const { wallet: ourWallet, warcatTokenId: ourWarCatTokenId } =
  //           JSON.parse(ourSearchPayload);
  //         const { wallet: theirWallet, warcatTokenId: theirWarCatTokenId } =
  //           JSON.parse(theirSearchPayload);

  //         const game = await this.createGame(
  //           maybeOurId,
  //           ourWallet,
  //           otherId,
  //           theirWallet,
  //           ourWarCatTokenId,
  //           theirWarCatTokenId,
  //         );
  //         await this.redis.pub.del(maybeOurId);
  //         await this.redis.pub.del(otherId);

  //         this.redis.pub.lRem('match_queue', 1, otherId);
  //         this.redis.pub.lRem('match_queue', 1, maybeOurId);

  //         this.redis.sub.emit('confirm_game', maybeOurId, otherId, game._id);
  //         this.redis.sub.emit('new_candidate');
  //       }
  //     });

  //     this.redis.sub.on('new_candidate', async () => {
  //       const next = (await this.redis.sub.lRange('match_queue', 0, 1))[0];
  //       if (next == si) {
  //         const si2 = (await this.redis.sub.lRange('match_queue', 1, 2))[0];
  //         if (si2 == null) {
  //           return;
  //         }
  //         const ourMatchKey = `match_lock_${si}_${ri}`;
  //         const lt = await this.redis.pub.setNX(ourMatchKey, '0');
  //         await this.redis.pub.expire(ourMatchKey, 60);
  //         if (lt) {
  //           this.redis.sub.emit('found_game', si, si2);
  //         }
  //       }
  //     });

  //     console.log('emitted to queue', new Date().toString());
  //     const result = await this.redis.pub.set(si, JSON.stringify({ wallet, warcatTokenId }));
  //     await this.redis.pub.rPush('match_queue', si);
  //     this.redis.sub.emit('new_candidate');
  //   });

  //   console.log('got game id', game);

  //   this.redis.sub.emit('new_candidate');
  //   return game;
  // }

  async addToMatchmaking(
    socket: Socket,
    wallet: string,
    warcatTokenId: number,
  ) {
    const game = await new Promise<IGame>(async (resolve) => {
      this.redis.sub.on('confirm_game', async (warcat1, warcat2, gameId) => {
        if (warcatTokenId == warcat1 || warcatTokenId == warcat2) {
          console.log('confirming', wallet, warcat1, warcat2, gameId);
          const game = await this.gameModel.findById(gameId);
          if (game == null) {
            throw new Error('Bad game');
          }
          resolve(game);
        }
      });

      this.redis.sub.on('found_game', async (warcat1, warcat2) => {
        if (warcat1 == warcatTokenId) {
          console.log('confirming game', { warcat1, warcat2 });
          const ourWallet = await this.redis.sub.get(warcat1);
          const theirWallet = await this.redis.sub.get(warcat2);
          if (ourWallet == null || theirWallet == null) {
            throw new Error('Something with redis messed up');
          }

          const game = await this.createGame(
            ourWallet,
            theirWallet,
            warcat1,
            warcat2,
          );
          await this.redis.pub.del(warcat1);
          await this.redis.pub.del(warcat2);
          await this.redis.pub.sRem('search', warcat1);
          await this.redis.pub.sRem('search', warcat2);

          await this.redis.pub.lRem('match_queue', 1, warcat1);
          await this.redis.pub.lRem('match_queue', 1, warcat2);

          this.redis.sub.emit('confirm_game', warcat1, warcat2, game._id);
          this.redis.sub.emit('new_candidate');
        }
      });

      this.redis.sub.on('new_candidate', async () => {
        const warcat1 = (await this.redis.sub.lRange('match_queue', 0, 1))[0];
        if (warcat1 == `${warcatTokenId}`) {
          const warcat2 = (await this.redis.sub.lRange('match_queue', 1, 2))[0];
          if (warcat2 == null) {
            return;
          }
          const foundGameKey = `found_game_${warcatTokenId}`;
          const lt = await this.redis.pub.setNX(foundGameKey, '0');
          await this.redis.pub.expire(foundGameKey, 60);
          if (lt) {
            this.redis.sub.emit('found_game', warcat1, warcat2);
          }
        }
      });

      console.log('emitted to queue', new Date().toString());
      const setResult = await this.redis.pub.sAdd('search', `${warcatTokenId}`);
      if (setResult == 1) {
        const result = await this.redis.pub.set(`${warcatTokenId}`, wallet);
        await this.redis.pub.rPush('match_queue', `${warcatTokenId}`);
        this.redis.sub.emit('new_candidate');
      }
    });

    console.log('got game id', game);

    this.redis.sub.emit('new_candidate');
    return game;
  }

  async createGame(
    player1Wallet: string,
    player2Wallet: string,
    player1WarcatTokenId: number,
    player2WarcatTokenId: number,
  ) {
    const buildings = [
      makeBuilding(BuildingPath.RedB2, [1, 3]),
      makeBuilding(BuildingPath.RedB4, [1, 5]),
      makeBuilding(BuildingPath.RedB4, [1, 6]),
      makeBuilding(BuildingPath.RedB1, [2, 6]),
      makeBuilding(BuildingPath.RedB4, [2, 7]),
      makeBuilding(BuildingPath.RedB3, [3, 7]),
      makeBuilding(BuildingPath.RedB2, [4, 5]),
      makeBuilding(BuildingPath.RedB2, [5, 8]),
      makeBuilding(BuildingPath.GreyB2, [2, 3]),
      makeBuilding(BuildingPath.GreyB2, [9, 4]),
      makeBuilding(BuildingPath.GreyB2, [12, 8]),
      makeBuilding(BuildingPath.GreyB2, [13, 8]),
      makeBuilding(BuildingPath.PurpleB4, [13, 1]),
      makeBuilding(BuildingPath.PurpleB4, [13, 2]),
      makeBuilding(BuildingPath.PurpleB4, [13, 3]),
      makeBuilding(BuildingPath.PurpleB1, [12, 2]),
      makeBuilding(BuildingPath.PurpleB3, [11, 1]),
      makeBuilding(BuildingPath.PurpleB2, [13, 5]),
      makeBuilding(BuildingPath.PurpleB2, [11, 4]),
      makeBuilding(BuildingPath.PurpleB2, [9, 2]),
    ];
    const units = [
      makeUnit(UnitPath.PurpleJet1, [5, 5], false),
      makeUnit(UnitPath.PurpleJet2, [6, 5], false),
      makeUnit(UnitPath.PurpleHeli1, [7, 5], false),
      makeUnit(UnitPath.PurpleHeli2, [8, 5], false),
      makeUnit(UnitPath.PurpleTank1, [9, 5], false),
      makeUnit(UnitPath.PurpleTank2, [10, 5], false),
      makeUnit(UnitPath.PurpleAA, [6, 6], false),
      makeUnit(UnitPath.PurpleTank3, [5, 7], false),
      makeUnit(UnitPath.PurpleInf1, [7, 7], false),
      makeUnit(UnitPath.PurpleInf2, [11, 5], false),
      makeUnit(UnitPath.RedTank2, [3, 5], false),
      makeUnit(UnitPath.RedInf1, [11, 2], false),
      makeUnit(UnitPath.RedHeli2, [4, 7], false),
      makeUnit(UnitPath.RedInf1, [3, 4], false),
      makeUnit(UnitPath.RedInf2, [3, 3], false),
      makeUnit(UnitPath.RedWarCat, [2, 2], false),
      makeUnit(UnitPath.PurpleWarCat, [3, 2], false),
    ];

    const player1 = {
      wallet: player1Wallet,
      team: UnitTeam.Red,
      warcatTokenId: player1WarcatTokenId,
      gold: startingGold,
    };
    const player2 = {
      wallet: player2Wallet,
      team: UnitTeam.Purple,
      warcatTokenId: player2WarcatTokenId,
      gold: startingGold,
    };

    try {
      const game = await this.gameModel.create({
        turn: UnitTeam.Red,
        player1,
        player2,
        buildings,
        units,
        gameOver: false,
      });
      return game;
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  }
}
