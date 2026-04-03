type DbError = {
    code?: string;
    detail?: string;
    message?: string;
};
export declare class DatabaseExceptionMapper {
    static map(error: DbError, entity?: string): never;
}
export {};
