"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OtpRedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpRedisService = exports.OtpType = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const cache_service_1 = require("../../../services/cache.service");
var OtpType;
(function (OtpType) {
    OtpType["EMAIL_VERIFICATION"] = "email_verification";
    OtpType["PHONE_VERIFICATION"] = "phone_verification";
    OtpType["PASSWORD_RESET"] = "password_reset";
    OtpType["DEVICE_VERIFICATION"] = "device_verification";
    OtpType["TWO_FACTOR_AUTH"] = "two_factor_auth";
})(OtpType || (exports.OtpType = OtpType = {}));
let OtpRedisService = OtpRedisService_1 = class OtpRedisService {
    cacheService;
    logger = new common_1.Logger(OtpRedisService_1.name);
    TTL = {
        [OtpType.EMAIL_VERIFICATION]: 300,
        [OtpType.PHONE_VERIFICATION]: 300,
        [OtpType.PASSWORD_RESET]: 600,
        [OtpType.DEVICE_VERIFICATION]: 300,
        [OtpType.TWO_FACTOR_AUTH]: 300,
    };
    MAX_ATTEMPTS = 5;
    constructor(cacheService) {
        this.cacheService = cacheService;
    }
    async generateOTP(type, identifier, userId, metadata) {
        const code = this.generateRandomCode(6);
        const hashedCode = await bcrypt.hash(code, 10);
        const key = this.buildKey(type, identifier, userId);
        const otpData = {
            code: hashedCode,
            attempts: 0,
            userId,
            createdAt: Date.now(),
            metadata: metadata || null,
        };
        const ttl = this.getTTL(type);
        await this.cacheService.set(key, otpData, ttl);
        this.logger.log(`OTP generated for ${type}:${identifier} (TTL: ${ttl}s)`);
        return code;
    }
    async verifyOTP(type, identifier, code, userId) {
        const key = this.buildKey(type, identifier, userId);
        const data = await this.cacheService.get(key);
        if (!data) {
            this.logger.warn(`OTP not found or expired: ${key}`);
            throw new common_1.BadRequestException('OTP expired or not found');
        }
        if (data.attempts >= this.MAX_ATTEMPTS) {
            await this.cacheService.del(key);
            this.logger.warn(`Max attempts reached for ${key}`);
            throw new common_1.BadRequestException('Too many failed attempts. Please request a new OTP.');
        }
        const isValid = await bcrypt.compare(code, data.code);
        if (!isValid) {
            data.attempts++;
            const ttl = await this.cacheService.ttl(key);
            await this.cacheService.set(key, data, ttl > 0 ? ttl : this.getTTL(type));
            this.logger.warn(`Invalid OTP attempt ${data.attempts}/${this.MAX_ATTEMPTS} for ${key}`);
            throw new common_1.BadRequestException(`Invalid OTP code. ${this.MAX_ATTEMPTS - data.attempts} attempts remaining.`);
        }
        await this.cacheService.del(key);
        this.logger.log(`OTP verified and deleted: ${key}`);
        return true;
    }
    async getOtpTTL(type, identifier, userId) {
        const key = this.buildKey(type, identifier, userId);
        const exists = await this.cacheService.get(key);
        if (!exists) {
            return null;
        }
        const ttl = await this.cacheService.ttl(key);
        return ttl > 0 ? ttl : null;
    }
    async deleteOTP(type, identifier, userId) {
        const key = this.buildKey(type, identifier, userId);
        await this.cacheService.del(key);
        this.logger.log(`OTP deleted: ${key}`);
    }
    buildKey(type, identifier, userId) {
        switch (type) {
            case OtpType.EMAIL_VERIFICATION:
                return `otp:email_verification:${identifier.toLowerCase()}`;
            case OtpType.PHONE_VERIFICATION:
                return `otp:phone_verification:${identifier}`;
            case OtpType.PASSWORD_RESET:
                return `otp:password_reset:${identifier.toLowerCase()}`;
            case OtpType.DEVICE_VERIFICATION:
                if (!userId) {
                    throw new Error('userId required for device verification OTP');
                }
                return `otp:device_verification:${userId}:${identifier}`;
            case OtpType.TWO_FACTOR_AUTH:
                if (!userId) {
                    throw new Error('userId required for 2FA OTP');
                }
                return `otp:two_factor_auth:${userId}`;
            default:
                throw new Error(`Invalid OTP type: ${String(type)}`);
        }
    }
    getTTL(type) {
        return this.TTL[type] || 300;
    }
    generateRandomCode(length) {
        const digits = '0123456789';
        let code = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto.randomInt(0, digits.length);
            code += digits[randomIndex];
        }
        return code;
    }
    async generateToken(type, userId, data, ttl = 86400) {
        const token = crypto.randomBytes(32).toString('hex');
        const key = `token:${type}:${token}`;
        await this.cacheService.set(key, {
            userId,
            ...data,
            createdAt: Date.now(),
        }, ttl);
        this.logger.log(`Token generated: ${type} for user ${userId} (TTL: ${ttl}s)`);
        return token;
    }
    async verifyToken(type, token) {
        const key = `token:${type}:${token}`;
        const data = await this.cacheService.get(key);
        if (!data) {
            this.logger.warn(`Token not found or expired: ${key}`);
            throw new common_1.BadRequestException('Token expired or invalid');
        }
        await this.cacheService.del(key);
        this.logger.log(`Token verified and deleted: ${key}`);
        return data;
    }
    async deleteToken(type, token) {
        const key = `token:${type}:${token}`;
        await this.cacheService.del(key);
        this.logger.log(`Token deleted: ${key}`);
    }
};
exports.OtpRedisService = OtpRedisService;
exports.OtpRedisService = OtpRedisService = OtpRedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cache_service_1.CacheService])
], OtpRedisService);
//# sourceMappingURL=otp-redis.service.js.map