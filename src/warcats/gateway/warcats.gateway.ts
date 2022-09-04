import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WarCatsService } from '../service/warcats.service';

@WebSocketGateway()
export class WarCatsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly warcatService: WarCatsService) {}

  async handleConnection(socket: Socket) {
    await this.warcatService.addUser(socket);
  }

  @SubscribeMessage('send_message')
  async listenForMessages(
    @MessageBody() content: string,
    @ConnectedSocket() socket: Socket,
  ) {
    const author = await this.chatService.getUserFromSocket(socket);

    const event = 'tesst';
    const data = 1;
    return { event, data } as WsResponse<number>;
  }
}
