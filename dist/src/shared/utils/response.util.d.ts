export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: any[];
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}
export declare class ResponseUtil {
    static success<T>(data: T, message?: string): ApiResponse<T>;
    static error(message: string, errors?: any[]): ApiResponse;
    static paginated<T>(data: T[], page: number, limit: number, total: number, message?: string): ApiResponse<T[]>;
}
