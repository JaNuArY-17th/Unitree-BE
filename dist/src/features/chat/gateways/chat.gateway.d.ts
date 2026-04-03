import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleMessage(data: unknown): {
        event: string;
        data: unknown;
    };
}
