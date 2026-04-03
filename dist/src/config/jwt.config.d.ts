declare const _default: (() => {
    secret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    algorithm: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    secret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    algorithm: string;
}>;
export default _default;
