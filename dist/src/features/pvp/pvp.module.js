"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PvpModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const pvp_controller_1 = require("./controllers/pvp.controller");
const pvp_service_1 = require("./services/pvp.service");
const user_resource_entity_1 = require("../../database/entities/user-resource.entity");
const user_tree_entity_1 = require("../../database/entities/user-tree.entity");
const pvp_action_log_entity_1 = require("../../database/entities/pvp-action-log.entity");
const economy_log_entity_1 = require("../../database/entities/economy-log.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const resource_entity_1 = require("../../database/entities/resource.entity");
const tree_entity_1 = require("../../database/entities/tree.entity");
let PvpModule = class PvpModule {
};
exports.PvpModule = PvpModule;
exports.PvpModule = PvpModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_resource_entity_1.UserResource,
                user_tree_entity_1.UserTree,
                pvp_action_log_entity_1.PvpActionLog,
                economy_log_entity_1.EconomyLog,
                user_entity_1.User,
                resource_entity_1.Resource,
                tree_entity_1.Tree,
            ]),
        ],
        controllers: [pvp_controller_1.PvpController],
        providers: [pvp_service_1.PvpService],
        exports: [pvp_service_1.PvpService],
    })
], PvpModule);
//# sourceMappingURL=pvp.module.js.map