import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Logger } from '../shared/utils/logger.util';

@Injectable()
export class SocketService {
  private server: Server;
  private readonly userSockets: Map<string, Set<string>> = new Map();

  setServer(server: Server): void {
    this.server = server;
  }

  addUserSocket(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)?.add(socketId);
    Logger.log(`User ${userId} connected with socket ${socketId}`, 'SocketService');
  }

  removeUserSocket(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    Logger.log(`User ${userId} disconnected socket ${socketId}`, 'SocketService');
  }

  getUserSockets(userId: string): string[] {
    return Array.from(this.userSockets.get(userId) || []);
  }

  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return this.userSockets.has(userId) && !!sockets && sockets.size > 0;
  }

  emitToUser(userId: string, event: string, data: any): void {
    const sockets = this.getUserSockets(userId);
    sockets.forEach((socketId) => {
      this.server.to(socketId).emit(event, data);
    });
  }

  emitToUsers(userIds: string[], event: string, data: any): void {
    userIds.forEach((userId) => {
      this.emitToUser(userId, event, data);
    });
  }

  emitToRoom(room: string, event: string, data: any): void {
    this.server.to(room).emit(event, data);
  }

  joinRoom(socketId: string, room: string): void {
    this.server.in(socketId).socketsJoin(room);
  }

  leaveRoom(socketId: string, room: string): void {
    this.server.in(socketId).socketsLeave(room);
  }
}
