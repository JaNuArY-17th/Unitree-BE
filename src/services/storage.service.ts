import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Logger } from '../shared/utils/logger.util';

@Injectable()
export class StorageService {
  constructor(private configService: ConfigService) {
    const cloudinaryConfig = this.configService.get('cloudinary');
    
    cloudinary.config({
      cloud_name: cloudinaryConfig.cloudName,
      api_key: cloudinaryConfig.apiKey,
      api_secret: cloudinaryConfig.apiSecret,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<string> {
    try {
      const cloudinaryFolder = folder || this.configService.get('cloudinary.folder');
      
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: cloudinaryFolder,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve(result.secure_url);
            } else {
              reject(new Error('Upload failed - no result'));
            }
          },
        );

        uploadStream.end(file.buffer);
      });
    } catch (error) {
      Logger.error('Failed to upload image', error.stack, 'StorageService');
      throw error;
    }
  }

  async uploadImages(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteImage(url: string): Promise<void> {
    try {
      const publicId = this.extractPublicId(url);
      await cloudinary.uploader.destroy(publicId);
      Logger.log(`Deleted image: ${publicId}`, 'StorageService');
    } catch (error) {
      Logger.error('Failed to delete image', error.stack, 'StorageService');
      throw error;
    }
  }

  private extractPublicId(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
  }
}
