"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const common_1 = require("@nestjs/common");
const logger_util_1 = require("../shared/utils/logger.util");
let SocketService = class SocketService {
    server;
    userSockets = new Map();
    setServer(server) {
        this.server = server;
    }
    addUserSocket(userId, socketId) {
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)?.add(socketId);
        logger_util_1.Logger.log(`User ${userId} connected with socket ${socketId}`, 'SocketService');
    }
    removeUserSocket(userId, socketId) {
        const sockets = this.userSockets.get(userId);
        if (sockets) {
            sockets.delete(socketId);
            if (sockets.size === 0) {
                this.userSockets.delete(userId);
            }
        }
        logger_util_1.Logger.log(`User ${userId} disconnected socket ${socketId}`, 'SocketService');
    }
    getUserSockets(userId) {
        return Array.from(this.userSockets.get(userId) || []);
    }
    isUserOnline(userId) {
        const sockets = this.userSockets.get(userId);
        return this.userSockets.has(userId) && !!sockets && sockets.size > 0;
    }
    emitToUser(userId, event, data) {
        const sockets = this.getUserSockets(userId);
        sockets.forEach((socketId) => {
            this.server.to(socketId).emit(event, data);
        });
    }
    emitToUsers(userIds, event, data) {
        userIds.forEach((userId) => {
            this.emitToUser(userId, event, data);
        });
    }
    emitToRoom(room, event, data) {
        this.server.to(room).emit(event, data);
    }
    joinRoom(socketId, room) {
        this.server.in(socketId).socketsJoin(room);
    }
    leaveRoom(socketId, room) {
        this.server.in(socketId).socketsLeave(room);
    }
};
exports.SocketService = SocketService;
exports.SocketService = SocketService = __decorate([
    (0, common_1.Injectable)()
], SocketService);
//# sourceMappingURL=socket.service.js.map