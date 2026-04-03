import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GardenService } from '../services/garden.service';
export declare class GardenGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly gardenService;
    private readonly jwtService;
    server: Server;
    private userSockets;
    constructor(gardenService: GardenService, jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleThrowBug(data: {
        targetUserId: string;
        userTreeId: string;
    }, client: Socket): Promise<{
        event: string;
        data: {
            attackerId: string;
            targetId: string;
            targetTreeId: string;
            userTreeId: string;
            level: number;
            oxygenEarned: number;
            isDamaged: boolean;
        };
    } | undefined>;
    getSocketIdByUserId(userId: string): string | undefined;
    emitToUser(userId: string, event: string, data: unknown): void;
}
