declare const _default: (() => {
    name: string;
    port: number;
    nodeEnv: string;
    apiPrefix: string;
    corsOrigins: string[];
    throttleTtl: number;
    throttleLimit: number;
    defaultPageSize: number;
    maxPageSize: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    name: string;
    port: number;
    nodeEnv: string;
    apiPrefix: string;
    corsOrigins: string[];
    throttleTtl: number;
    throttleLimit: number;
    defaultPageSize: number;
    maxPageSize: number;
}>;
export default _default;
