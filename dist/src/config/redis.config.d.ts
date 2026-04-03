declare const _default: (() => {
    host: string;
    port: number;
    password: string | undefined;
    db: number;
    keyPrefix: string;
    ttl: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    password: string | undefined;
    db: number;
    keyPrefix: string;
    ttl: number;
}>;
export default _default;
