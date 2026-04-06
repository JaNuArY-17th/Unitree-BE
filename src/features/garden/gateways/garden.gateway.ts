import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '../../../shared/utils/logger.util';
import { JwtService } from '@nestjs/jwt';
import { Inject, forwardRef } from '@nestjs/common';
import { GardenService } from '../services/garden.service';

@WebSocketGateway({
  namespace: '/garden',
  cors: {
    origin: '*',
  },
})
export class GardenGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private userSockets: Map<string, string> = new Map();

  constructor(
    @Inject(forwardRef(() => GardenService))
    private readonly gardenService: GardenService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.emit('error', { message: 'Unauthorized' });
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      this.userSockets.set(userId, client.id);
      client.data.userId = userId;

      Logger.log(
        `Garden: Client connected ${client.id} for user ${userId}`,
        'GardenGateway',
      );
    } catch (error) {
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.userSockets.delete(client.data.userId);
      Logger.log(`Garden: Client disconnected ${client.id}`, 'GardenGateway');
    }
  }

  @SubscribeMessage('sync_oxy')
  async handleSyncOxy(@ConnectedSocket() client: Socket) {
    const userId = String(client.data.userId || '');

    if (!userId) {
      client.emit('sync_error', {
        message: 'Unauthorized',
      });
      return;
    }

    try {
      const result = await this.gardenService.syncAllOxygen(userId);
      client.emit('sync_result', result);

      return {
        event: 'sync_result',
        data: result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      Logger.warn(
        `Garden sync_oxy failed for user ${userId}: ${message}`,
        'GardenGateway',
      );

      client.emit('sync_error', {
        message,
      });
    }
  }

  @SubscribeMessage('throw_bug')
  async handleThrowBug(
    @MessageBody() data: { targetUserId: string; userTreeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;

    try {
      const result = await this.gardenService.throwBug(
        userId,
        data.targetUserId,
        data.userTreeId,
      );

      this.emitToUser(data.targetUserId, 'under_attack', {
        attackerId: userId,
        userTreeId: result.userTreeId,
        level: result.level,
        isDamaged: result.isDamaged,
        message: 'Cây của bạn đang bị sâu bướm tấn công!',
      });

      return {
        event: 'attack_result',
        data: result,
      };
    } catch (error) {
      client.emit('attack_error', {
        message: error instanceof Error ? error.message : 'Attack failed',
      });
    }
  }

  getSocketIdByUserId(userId: string): string | undefined {
    return this.userSockets.get(userId);
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    const socketId = this.userSockets.get(userId);
    if (!socketId) {
      return;
    }

    this.server.to(socketId).emit(event, data);
  }
}
