"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationMiddleware = void 0;
const common_1 = require("@nestjs/common");
const validators_util_1 = require("../utils/validators.util");
let ValidationMiddleware = class ValidationMiddleware {
    use(req, res, next) {
        if (req.body && typeof req.body === 'object') {
            this.sanitizeObject(req.body);
        }
        if (req.query && typeof req.query === 'object') {
            this.sanitizeObject(req.query);
        }
        next();
    }
    sanitizeObject(obj) {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = validators_util_1.Validators.sanitizeInput(obj[key]);
            }
            else if (typeof obj[key] === 'object' && obj[key] !== null) {
                this.sanitizeObject(obj[key]);
            }
        }
    }
};
exports.ValidationMiddleware = ValidationMiddleware;
exports.ValidationMiddleware = ValidationMiddleware = __decorate([
    (0, common_1.Injectable)()
], ValidationMiddleware);
//# sourceMappingURL=validation.middleware.js.map