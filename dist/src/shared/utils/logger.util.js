"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const common_1 = require("@nestjs/common");
class Logger {
    static instance;
    static getInstance(context) {
        if (!this.instance) {
            this.instance = new common_1.Logger(context || 'Application');
        }
        return this.instance;
    }
    static log(message, context) {
        const logger = this.getInstance(context);
        logger.log(message);
    }
    static error(message, trace, context) {
        const logger = this.getInstance(context);
        logger.error(message, trace);
    }
    static warn(message, context) {
        const logger = this.getInstance(context);
        logger.warn(message);
    }
    static debug(message, context) {
        const logger = this.getInstance(context);
        logger.debug(message);
    }
    static verbose(message, context) {
        const logger = this.getInstance(context);
        logger.verbose(message);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.util.js.map