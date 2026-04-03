"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GardenModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const garden_gateway_1 = require("./gateways/garden.gateway");
const garden_service_1 = require("./services/garden.service");
const garden_controller_1 = require("./controllers/garden.controller");
const user_tree_entity_1 = require("../../database/entities/user-tree.entity");
const tree_entity_1 = require("../../database/entities/tree.entity");
const user_resource_entity_1 = require("../../database/entities/user-resource.entity");
const resource_entity_1 = require("../../database/entities/resource.entity");
const wifi_session_entity_1 = require("../../database/entities/wifi-session.entity");
const economy_log_entity_1 = require("../../database/entities/economy-log.entity");
let GardenModule = class GardenModule {
};
exports.GardenModule = GardenModule;
exports.GardenModule = GardenModule = __decorate([
    (0, common_1.Module)({
        controllers: [garden_controller_1.GardenController],
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_tree_entity_1.UserTree,
                tree_entity_1.Tree,
                user_resource_entity_1.UserResource,
                resource_entity_1.Resource,
                wifi_session_entity_1.WifiSession,
                economy_log_entity_1.EconomyLog,
            ]),
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
            }),
        ],
        providers: [garden_gateway_1.GardenGateway, garden_service_1.GardenService],
        exports: [garden_service_1.GardenService, garden_gateway_1.GardenGateway],
    })
], GardenModule);
//# sourceMappingURL=garden.module.js.map