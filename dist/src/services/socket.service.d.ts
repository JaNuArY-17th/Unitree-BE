import { Server } from 'socket.io';
export declare class SocketService {
    private server;
    private readonly userSockets;
    setServer(server: Server): void;
    addUserSocket(userId: string, socketId: string): void;
    removeUserSocket(userId: string, socketId: string): void;
    getUserSockets(userId: string): string[];
    isUserOnline(userId: string): boolean;
    emitToUser(userId: string, event: string, data: unknown): void;
    emitToUsers(userIds: string[], event: string, data: unknown): void;
    emitToRoom(room: string, event: string, data: unknown): void;
    joinRoom(socketId: string, room: string): void;
    leaveRoom(socketId: string, room: string): void;
}
