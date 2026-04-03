declare const _default: (() => {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string | undefined;
        pass: string | undefined;
    };
    from: {
        name: string;
        address: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string | undefined;
        pass: string | undefined;
    };
    from: {
        name: string;
        address: string;
    };
}>;
export default _default;
