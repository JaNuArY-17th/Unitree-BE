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
exports.ConversationParticipant = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("./base.entity");
const user_entity_1 = require("./user.entity");
const conversation_entity_1 = require("./conversation.entity");
let ConversationParticipant = class ConversationParticipant extends base_entity_1.BaseEntity {
    conversationId;
    userId;
    joinedAt;
    lastReadAt;
    isAdmin;
    isMuted;
    leftAt;
    conversation;
    user;
};
exports.ConversationParticipant = ConversationParticipant;
__decorate([
    (0, typeorm_1.Column)({ name: 'conversation_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ConversationParticipant.prototype, "conversationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ConversationParticipant.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'joined_at' }),
    __metadata("design:type", Date)
], ConversationParticipant.prototype, "joinedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_read_at', nullable: true }),
    __metadata("design:type", Date)
], ConversationParticipant.prototype, "lastReadAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_admin', default: false }),
    __metadata("design:type", Boolean)
], ConversationParticipant.prototype, "isAdmin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_muted', default: false }),
    __metadata("design:type", Boolean)
], ConversationParticipant.prototype, "isMuted", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'left_at', nullable: true }),
    __metadata("design:type", Date)
], ConversationParticipant.prototype, "leftAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => conversation_entity_1.Conversation, (conversation) => conversation.participants),
    (0, typeorm_1.JoinColumn)({ name: 'conversation_id' }),
    __metadata("design:type", conversation_entity_1.Conversation)
], ConversationParticipant.prototype, "conversation", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], ConversationParticipant.prototype, "user", void 0);
exports.ConversationParticipant = ConversationParticipant = __decorate([
    (0, typeorm_1.Entity)('conversation_participants'),
    (0, typeorm_1.Index)(['conversationId', 'userId'], { unique: true })
], ConversationParticipant);
//# sourceMappingURL=conversation-participant.entity.js.map