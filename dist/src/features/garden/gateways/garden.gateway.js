"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GardenGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const logger_util_1 = require("../../../shared/utils/logger.util");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
const garden_service_1 = require("../services/garden.service");
let GardenGateway = class GardenGateway {
    gardenService;
    jwtService;
    server;
    userSockets = new Map();
    constructor(gardenService, jwtService) {
        this.gardenService = gardenService;
        this.jwtService = jwtService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token ||
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
            logger_util_1.Logger.log(`Garden: Client connected ${client.id} for user ${userId}`, 'GardenGateway');
        }
        catch (error) {
            client.emit('error', { message: 'Invalid token' });
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.data.userId) {
            this.userSockets.delete(client.data.userId);
            logger_util_1.Logger.log(`Garden: Client disconnected ${client.id}`, 'GardenGateway');
        }
    }
    async handleThrowBug(data, client) {
        const userId = client.data.userId;
        try {
            const result = await this.gardenService.throwBug(userId, data.targetUserId, data.userTreeId);
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
        }
        catch (error) {
            client.emit('attack_error', {
                message: error.message || 'Attack failed',
            });
        }
    }
    getSocketIdByUserId(userId) {
        return this.userSockets.get(userId);
    }
    emitToUser(userId, event, data) {
        const socketId = this.userSockets.get(userId);
        if (!socketId) {
            return;
        }
        this.server.to(socketId).emit(event, data);
    }
};
exports.GardenGateway = GardenGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GardenGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('throw_bug'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], GardenGateway.prototype, "handleThrowBug", null);
exports.GardenGateway = GardenGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/garden',
        cors: {
            origin: '*',
        },
    }),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => garden_service_1.GardenService))),
    __metadata("design:paramtypes", [garden_service_1.GardenService,
        jwt_1.JwtService])
], GardenGateway);
//# sourceMappingURL=garden.gateway.js.map