import type { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { GoogleLoginDto } from '../dto/google-login.dto';
import { LoginWithDeviceDto } from '../dto/login-with-device.dto';
import { VerifyDeviceDto } from '../dto/verify-device.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<import("../../../shared/utils/response.util").ApiResponse<{
        access_token: string;
        refresh_token: string;
        user: import("../../users/dto/user-info.dto").UserInfoDto;
    }>>;
    googleLogin(googleLoginDto: GoogleLoginDto): Promise<import("../../../shared/utils/response.util").ApiResponse<{
        access_token: string;
        refresh_token: string;
        user: import("../../users/dto/user-info.dto").UserInfoDto;
    }>>;
    refresh(refreshTokenDto: RefreshTokenDto): Promise<import("../../../shared/utils/response.util").ApiResponse<{
        access_token: string;
        refresh_token: string;
    }>>;
    getProfile(userId: string): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../users/dto/user-info.dto").UserInfoDto>>;
    logout(userId: string): Promise<import("../../../shared/utils/response.util").ApiResponse<null>>;
    loginWithDevice(loginDto: LoginWithDeviceDto, req: Request): Promise<import("../../../shared/utils/response.util").ApiResponse<{
        requireOtp: boolean;
        userId: string;
        deviceId: string;
    }> | import("../../../shared/utils/response.util").ApiResponse<{
        deviceId: string;
        access_token: string;
        refresh_token: string;
        user: import("../../users/dto/user-info.dto").UserInfoDto;
    } | {
        requireOtp: boolean;
        message: string | undefined;
        userId: string;
        deviceId: string;
    }>>;
    verifyDevice(verifyDto: VerifyDeviceDto, req: Request): Promise<import("../../../shared/utils/response.util").ApiResponse<{
        deviceId: string;
        access_token: string;
        refresh_token: string;
        user: import("../../users/dto/user-info.dto").UserInfoDto;
    }>>;
    getUserDevices(userId: string): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/user-device.entity").UserDevice[]>>;
    getActiveSessions(userId: string): Promise<import("../../../shared/utils/response.util").ApiResponse<import("../../../database/entities/user-device.entity").UserDevice[]>>;
    logoutDevice(userId: string, deviceId: string): Promise<import("../../../shared/utils/response.util").ApiResponse<null>>;
}
