"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WifiSessionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const wifi_sessions_controller_1 = require("./controllers/wifi-sessions.controller");
const wifi_sessions_service_1 = require("./services/wifi-sessions.service");
const wifi_session_entity_1 = require("../../database/entities/wifi-session.entity");
const wifi_config_entity_1 = require("../../database/entities/wifi-config.entity");
const user_resource_entity_1 = require("../../database/entities/user-resource.entity");
const resource_entity_1 = require("../../database/entities/resource.entity");
const points_module_1 = require("../points/points.module");
const cache_service_1 = require("../../services/cache.service");
const socket_service_1 = require("../../services/socket.service");
let WifiSessionsModule = class WifiSessionsModule {
};
exports.WifiSessionsModule = WifiSessionsModule;
exports.WifiSessionsModule = WifiSessionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([wifi_session_entity_1.WifiSession, wifi_config_entity_1.WifiConfig, user_resource_entity_1.UserResource, resource_entity_1.Resource]),
            points_module_1.PointsModule,
        ],
        controllers: [wifi_sessions_controller_1.WifiSessionsController],
        providers: [wifi_sessions_service_1.WifiSessionsService, cache_service_1.CacheService, socket_service_1.SocketService],
        exports: [wifi_sessions_service_1.WifiSessionsService],
    })
], WifiSessionsModule);
//# sourceMappingURL=wifi-sessions.module.js.map