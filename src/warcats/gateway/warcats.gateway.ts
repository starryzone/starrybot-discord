import { Inject } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IGame } from 'warcats-common';
import { IRedisProvider } from '../redis/warcats.redis';
import { WarCatsGameService } from '../service/warcats.game.service';
import { WarCatsMatchingService } from '../service/warcats.matching.service';

@WebSocketGateway({ cors: true })
export class WarCatsGateway
  implements OnGatewayConnection<Socket>, OnGatewayInit<Server>
{
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject('REDIS')
    private readonly redis: IRedisProvider,
    private readonly warcatMatchingService: WarCatsMatchingService,
    private readonly warcatGameService: WarCatsGameService,
  ) {}
  afterInit(server: Server) {
    server.use((socket, next) => {
      const isValid = true;
      if (isValid) {
        next();
      } else {
        throw new Error('Bad request');
      }
    });
  }

  async handleConnection(socket: Socket) {
    console.log('got connection', socket.id);
  }

  async registerWalletToSocket(socket: Socket, wallet: string) {
    await this.redis.pub.set('socket:' + wallet, socket.id);
  }

  @SubscribeMessage('find_game')
  async handleFindGame(
    @ConnectedSocket() socket: Socket,
    @MessageBody('warcatTokenId') warcatTokenId: number,
    @MessageBody('wallet') wallet: string,
    @MessageBody('signed') signed: string,
  ): Promise<WsResponse<IGame>> {
    await this.registerWalletToSocket(socket, wallet);
    console.log('looking for game');
    const maybeGame = await this.warcatGameService.findActiveGame(wallet);
    if (maybeGame != null) {
      return { event: 'found_game', data: maybeGame };
    }

    const game = await this.warcatMatchingService.addToMatchmaking(
      socket,
      wallet,
      warcatTokenId,
    );
    console.log('got game id with ', game._id);
    return { event: 'found_game', data: game };
  }

  @SubscribeMessage('move_unit')
  async moveUnit(
    @ConnectedSocket() socket: Socket,
    @MessageBody('gameId') gameId: string,
    @MessageBody('unitId') unitId: string,
    @MessageBody('position') position: { x: number; y: number },
    @MessageBody('wallet') wallet: string,
    @MessageBody('signed') signed: string,
  ): Promise<WsResponse<any>> {
    await this.registerWalletToSocket(socket, wallet);

    console.log('received move unit', unitId, position);
    const { otherSocketId, response } = await this.warcatGameService.moveUnit(
      wallet,
      gameId,
      unitId,
      position,
    );
    console.log('response', response);
    await this.transmitEventToOtherSocket(
      otherSocketId,
      'moved_unit',
      response,
    );

    return { event: 'moved_unit', data: response };
  }

  @SubscribeMessage('attack_unit')
  async attackUnit(
    @ConnectedSocket() socket: Socket,
    @MessageBody('gameId') gameId: string,
    @MessageBody('unitId') unitId: string,
    @MessageBody('position') position: { x: number; y: number },
    @MessageBody('wallet') wallet: string,
    @MessageBody('signed') signed: string,
  ): Promise<WsResponse<any>> {
    await this.registerWalletToSocket(socket, wallet);

    console.log('received attack unit', unitId, position);
    const { eventName, otherSocketId, response } =
      await this.warcatGameService.attackUnit(wallet, gameId, unitId, position);
    await this.transmitEventToOtherSocket(otherSocketId, eventName, response);

    console.log('response', eventName, response);
    return { event: eventName, data: response };
  }

  @SubscribeMessage('purchase_unit')
  async purchaseUnit(
    @ConnectedSocket() socket: Socket,
    @MessageBody('gameId') gameId: string,
    @MessageBody('buildingId') buildingId: string,
    @MessageBody('position') position: { x: number; y: number },
    @MessageBody('unitPath') unitPath: string,
    @MessageBody('wallet') wallet: string,
    @MessageBody('signed') signed: string,
  ): Promise<WsResponse<any>> {
    await this.registerWalletToSocket(socket, wallet);

    const { otherSocketId, response } = await this.warcatGameService.spawnUnit(
      wallet,
      gameId,
      position,
      unitPath,
      buildingId,
    );
    await this.transmitEventToOtherSocket(
      otherSocketId,
      'spawned_unit',
      response,
    );

    console.log('response', response);
    return { event: 'spawned_unit', data: response };
  }

  @SubscribeMessage('end_turn')
  async endTurn(
    @ConnectedSocket() socket: Socket,
    @MessageBody('gameId') gameId: string,
    @MessageBody('wallet') wallet: string,
    @MessageBody('signed') signed: string,
  ): Promise<WsResponse<any>> {
    await this.registerWalletToSocket(socket, wallet);

    console.log('received end turn ', wallet);
    const { otherSocketId, response } = await this.warcatGameService.endTurn(
      wallet,
      gameId,
    );
    await this.transmitEventToOtherSocket(
      otherSocketId,
      'ended_turn',
      response,
    );
    console.log('response', response);
    return { event: 'ended_turn', data: response };
  }

  async transmitEventToOtherSocket(
    otherWallet: string,
    event: string,
    response: any,
  ) {
    const socketId = await this.redis.sub.get('socket:' + otherWallet);
    if (socketId == null) {
      return;
    }
    const otherSocket = this.server.sockets.sockets.get(socketId);
    if (otherSocket != null) {
      otherSocket.emit(event, response);
    }
  }
}
