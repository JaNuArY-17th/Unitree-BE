"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conversation = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const enums_constant_1 = require("../../shared/constants/enums.constant");
const conversation_participant_entity_1 = require("./conversation-participant.entity");
const message_entity_1 = require("./message.entity");
let Conversation = class Conversation extends base_entity_1.BaseEntity {
    type;
    name;
    avatar;
    createdBy;
    lastMessageAt;
    isActive;
    participants;
    messages;
};
exports.Conversation = Conversation;
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_constant_1.ConversationType,
        default: enums_constant_1.ConversationType.DIRECT,
    }),
    __metadata("design:type", String)
], Conversation.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Conversation.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Conversation.prototype, "avatar", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Conversation.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_message_at', nullable: true }),
    __metadata("design:type", Date)
], Conversation.prototype, "lastMessageAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Conversation.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => conversation_participant_entity_1.ConversationParticipant, (participant) => participant.conversation),
    __metadata("design:type", Array)
], Conversation.prototype, "participants", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => message_entity_1.Message, (message) => message.conversation),
    __metadata("design:type", Array)
], Conversation.prototype, "messages", void 0);
exports.Conversation = Conversation = __decorate([
    (0, typeorm_1.Entity)('conversations')
], Conversation);
//# sourceMappingURL=conversation.entity.js.map