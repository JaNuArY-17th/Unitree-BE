import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger } from '../../shared/utils/logger.util';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  handleConnection(client: Socket) {
    Logger.log(`Client connected: ${client.id}`, 'ChatGateway');
  }

  handleDisconnect(client: Socket) {
    Logger.log(`Client disconnected: ${client.id}`, 'ChatGateway');
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    return { event: 'message', data };
  }
}
