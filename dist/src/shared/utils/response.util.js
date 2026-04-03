"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseUtil = void 0;
class ResponseUtil {
    static success(data, message) {
        return {
            success: true,
            data,
            message,
        };
    }
    static error(message, errors) {
        return {
            success: false,
            message,
            errors,
        };
    }
    static paginated(data, page, limit, total, message) {
        return {
            success: true,
            data,
            message,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
exports.ResponseUtil = ResponseUtil;
//# sourceMappingURL=response.util.js.map