"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinigamesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const minigames_controller_1 = require("./controllers/minigames.controller");
const minigames_service_1 = require("./services/minigames.service");
const spin_reward_entity_1 = require("../../database/entities/spin-reward.entity");
const user_resource_entity_1 = require("../../database/entities/user-resource.entity");
const economy_log_entity_1 = require("../../database/entities/economy-log.entity");
const resource_entity_1 = require("../../database/entities/resource.entity");
const user_game_state_entity_1 = require("../../database/entities/user-game-state.entity");
const cache_service_1 = require("../../services/cache.service");
let MinigamesModule = class MinigamesModule {
};
exports.MinigamesModule = MinigamesModule;
exports.MinigamesModule = MinigamesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                spin_reward_entity_1.SpinReward,
                user_resource_entity_1.UserResource,
                economy_log_entity_1.EconomyLog,
                resource_entity_1.Resource,
                user_game_state_entity_1.UserGameState,
            ]),
        ],
        controllers: [minigames_controller_1.MinigamesController],
        providers: [minigames_service_1.MinigamesService, cache_service_1.CacheService],
        exports: [minigames_service_1.MinigamesService],
    })
], MinigamesModule);
//# sourceMappingURL=minigames.module.js.map