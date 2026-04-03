import { ConfigService } from '@nestjs/config';
export type UploadedFile = {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
    destination?: string;
    filename?: string;
    path?: string;
};
export declare class StorageService {
    private configService;
    constructor(configService: ConfigService);
    uploadImage(file: UploadedFile, folder?: string): Promise<string>;
    uploadImages(files: UploadedFile[], folder?: string): Promise<string[]>;
    deleteImage(url: string): Promise<void>;
    private extractPublicId;
}
