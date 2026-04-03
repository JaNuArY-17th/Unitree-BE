"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const trees_controller_1 = require("./controllers/trees.controller");
const trees_service_1 = require("./services/trees.service");
const user_tree_entity_1 = require("../../database/entities/user-tree.entity");
const tree_entity_1 = require("../../database/entities/tree.entity");
const user_resource_entity_1 = require("../../database/entities/user-resource.entity");
const resource_entity_1 = require("../../database/entities/resource.entity");
const economy_log_entity_1 = require("../../database/entities/economy-log.entity");
const wifi_session_entity_1 = require("../../database/entities/wifi-session.entity");
const garden_module_1 = require("../garden/garden.module");
let TreesModule = class TreesModule {
};
exports.TreesModule = TreesModule;
exports.TreesModule = TreesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_tree_entity_1.UserTree,
                tree_entity_1.Tree,
                user_resource_entity_1.UserResource,
                resource_entity_1.Resource,
                economy_log_entity_1.EconomyLog,
                wifi_session_entity_1.WifiSession,
            ]),
            garden_module_1.GardenModule,
        ],
        controllers: [trees_controller_1.TreesController],
        providers: [trees_service_1.TreesService],
        exports: [trees_service_1.TreesService],
    })
], TreesModule);
//# sourceMappingURL=trees.module.js.map