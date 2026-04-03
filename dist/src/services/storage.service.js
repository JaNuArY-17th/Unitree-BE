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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cloudinary_1 = require("cloudinary");
const logger_util_1 = require("../shared/utils/logger.util");
let StorageService = class StorageService {
    configService;
    constructor(configService) {
        this.configService = configService;
        const cloudinaryConfig = this.configService.get('cloudinary');
        cloudinary_1.v2.config({
            cloud_name: cloudinaryConfig.cloudName,
            api_key: cloudinaryConfig.apiKey,
            api_secret: cloudinaryConfig.apiSecret,
        });
    }
    async uploadImage(file, folder) {
        try {
            const cloudinaryFolder = folder || this.configService.get('cloudinary.folder');
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                    folder: cloudinaryFolder,
                    resource_type: 'auto',
                }, (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    else if (result) {
                        resolve(result.secure_url);
                    }
                    else {
                        reject(new Error('Upload failed - no result'));
                    }
                });
                uploadStream.end(file.buffer);
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.stack : JSON.stringify(error);
            logger_util_1.Logger.error('Failed to upload image', errorMessage, 'StorageService');
            throw error;
        }
    }
    async uploadImages(files, folder) {
        const uploadPromises = files.map((file) => this.uploadImage(file, folder));
        return Promise.all(uploadPromises);
    }
    async deleteImage(url) {
        try {
            const publicId = this.extractPublicId(url);
            await cloudinary_1.v2.uploader.destroy(publicId);
            logger_util_1.Logger.log(`Deleted image: ${publicId}`, 'StorageService');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.stack : JSON.stringify(error);
            logger_util_1.Logger.error('Failed to delete image', errorMessage, 'StorageService');
            throw error;
        }
    }
    extractPublicId(url) {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        return filename.split('.')[0];
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map