import { DevicesService } from '../services/devices.service';
export declare class DevicesController {
    private readonly devicesService;
    constructor(devicesService: DevicesService);
    getActiveSessions(user: {
        id: string;
    }): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/user-device.entity").UserDevice[]>>;
    getUserDevices(user: {
        id: string;
    }): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/user-device.entity").UserDevice[]>>;
    logoutAllDevices(user: {
        id: string;
    }): Promise<import("../../../shared/utils/response.util").ApiResponse<null>>;
    removeDevice(user: {
        id: string;
    }, deviceId: string): Promise<import("../../../shared/utils/response.util").ApiResponse<null>>;
}
