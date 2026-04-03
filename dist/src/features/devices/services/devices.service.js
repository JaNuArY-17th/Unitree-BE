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
var DevicesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_device_entity_1 = require("../../../database/entities/user-device.entity");
const otp_redis_service_1 = require("../../auth/services/otp-redis.service");
const tokens_service_1 = require("../../tokens/services/tokens.service");
const email_service_1 = require("../../../services/email.service");
let DevicesService = DevicesService_1 = class DevicesService {
    deviceRepository;
    otpRedisService;
    tokensService;
    emailService;
    logger = new common_1.Logger(DevicesService_1.name);
    constructor(deviceRepository, otpRedisService, tokensService, emailService) {
        this.deviceRepository = deviceRepository;
        this.otpRedisService = otpRedisService;
        this.tokensService = tokensService;
        this.emailService = emailService;
    }
    async isDeviceRecognized(userId, deviceId) {
        const device = await this.deviceRepository.findOne({
            where: { userId, deviceId },
        });
        return !!device;
    }
    async hasActiveDevice(userId, currentDeviceId) {
        const activeDevice = await this.deviceRepository.findOne({
            where: {
                userId,
                isActive: true,
            },
            order: { lastActive: 'DESC' },
        });
        if (activeDevice && activeDevice.deviceId !== currentDeviceId) {
            return activeDevice;
        }
        return null;
    }
    async handleDeviceLogin(userId, userEmail, deviceInfo) {
        const { deviceId } = deviceInfo;
        const isRecognized = await this.isDeviceRecognized(userId, deviceId);
        if (isRecognized) {
            this.logger.log(`Device ${deviceId} is recognized for user ${userId}`);
            const activeDevice = await this.hasActiveDevice(userId, deviceId);
            if (activeDevice) {
                await this.logoutDevice(activeDevice.deviceId);
                this.logger.log(`Logged out device ${activeDevice.deviceId} due to single device policy`);
            }
            await this.updateDeviceActivity(deviceId);
            return {
                requireOtp: false,
                message: 'Device recognized, login allowed',
            };
        }
        this.logger.log(`New device ${deviceId} detected for user ${userId}`);
        const otpCode = await this.otpRedisService.generateOTP(otp_redis_service_1.OtpType.DEVICE_VERIFICATION, `${userId}:${deviceId}`, userId, { email: userEmail, deviceId });
        try {
            await this.emailService.sendDeviceVerificationEmail(userEmail, otpCode);
            this.logger.log(`OTP email sent to ${userEmail} for device verification`);
        }
        catch (error) {
            this.logger.error(`Failed to send OTP email to ${userEmail}:`, error);
        }
        return {
            requireOtp: true,
            otpSent: true,
            message: 'OTP sent to email for device verification',
        };
    }
    async verifyAndRegisterDevice(userId, userEmail, deviceInfo, otpCode) {
        const { deviceId } = deviceInfo;
        await this.otpRedisService.verifyOTP(otp_redis_service_1.OtpType.DEVICE_VERIFICATION, `${userId}:${deviceId}`, otpCode, userId);
        const activeDevice = await this.hasActiveDevice(userId, deviceId);
        if (activeDevice) {
            await this.logoutDevice(activeDevice.deviceId);
            this.logger.log(`Logged out device ${activeDevice.deviceId} for new device`);
        }
        const device = await this.registerDevice(userId, deviceInfo);
        this.logger.log(`Device ${deviceId} verified and registered for user ${userId}`);
        return device;
    }
    async registerDevice(userId, deviceInfo) {
        let device = await this.deviceRepository.findOne({
            where: { userId, deviceId: deviceInfo.deviceId },
        });
        if (device) {
            device.deviceName = deviceInfo.deviceName;
            device.deviceType = deviceInfo.deviceType;
            device.deviceOs = deviceInfo.deviceOs;
            device.deviceModel = deviceInfo.deviceModel;
            device.browser = deviceInfo.browser;
            device.ipAddress = deviceInfo.ipAddress;
            device.isActive = true;
            device.lastActive = new Date();
            device.loggedOutAt = null;
        }
        else {
            device = this.deviceRepository.create({
                userId,
                deviceId: deviceInfo.deviceId,
                deviceName: deviceInfo.deviceName,
                deviceType: deviceInfo.deviceType,
                deviceOs: deviceInfo.deviceOs,
                deviceModel: deviceInfo.deviceModel,
                browser: deviceInfo.browser,
                ipAddress: deviceInfo.ipAddress,
                isActive: true,
                lastActive: new Date(),
            });
        }
        return this.deviceRepository.save(device);
    }
    async logoutDevice(deviceId) {
        const device = await this.deviceRepository.findOne({
            where: { deviceId },
        });
        if (!device) {
            return;
        }
        device.isActive = false;
        device.loggedOutAt = new Date();
        await this.deviceRepository.save(device);
        await this.tokensService.revokeUserTokens(device.userId);
        this.logger.log(`Device ${deviceId} logged out`);
    }
    async logoutAllDevices(userId) {
        await this.deviceRepository.update({ userId, isActive: true }, {
            isActive: false,
            loggedOutAt: new Date(),
        });
        await this.tokensService.revokeUserTokens(userId);
        this.logger.log(`All devices logged out for user ${userId}`);
    }
    async getActiveSessions(userId) {
        return this.deviceRepository.find({
            where: { userId, isActive: true },
            order: { lastActive: 'DESC' },
        });
    }
    async getUserDevices(userId) {
        return this.deviceRepository.find({
            where: { userId },
            order: { lastActive: 'DESC' },
        });
    }
    async updateDeviceActivity(deviceId) {
        await this.deviceRepository.update({ deviceId }, { lastActive: new Date() });
    }
    async updateFcmToken(userId, deviceId, fcmToken) {
        await this.deviceRepository.update({ userId, deviceId }, { fcmToken });
        this.logger.log(`FCM token updated for device ${deviceId}`);
    }
    async removeDevice(userId, deviceId) {
        const device = await this.deviceRepository.findOne({
            where: { userId, deviceId },
        });
        if (!device) {
            throw new common_1.BadRequestException('Device not found');
        }
        await this.deviceRepository.softRemove(device);
        if (device.isActive) {
            await this.tokensService.revokeUserTokens(userId);
        }
        this.logger.log(`Device ${deviceId} removed for user ${userId}`);
    }
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = DevicesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_device_entity_1.UserDevice)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        otp_redis_service_1.OtpRedisService,
        tokens_service_1.TokensService,
        email_service_1.EmailService])
], DevicesService);
//# sourceMappingURL=devices.service.js.map