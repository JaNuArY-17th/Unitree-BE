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
exports.UserInfoDto = void 0;
const class_transformer_1 = require("class-transformer");
const roles_constant_1 = require("../../../shared/constants/roles.constant");
const swagger_1 = require("@nestjs/swagger");
let UserInfoDto = class UserInfoDto {
    id;
    username;
    email;
    fullname;
    studentId;
    student;
    avatar;
    role;
    referralCode;
    referredById;
    referredByUsername;
    referredByAvatarUrl;
};
exports.UserInfoDto = UserInfoDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserInfoDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserInfoDto.prototype, "username", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ nullable: true }),
    (0, class_transformer_1.Transform)(({ obj }) => obj.student?.email ?? obj.email ?? null),
    __metadata("design:type", String)
], UserInfoDto.prototype, "email", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ nullable: true }),
    (0, class_transformer_1.Transform)(({ obj }) => obj.student?.fullName),
    __metadata("design:type", String)
], UserInfoDto.prototype, "fullname", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ nullable: true }),
    (0, class_transformer_1.Transform)(({ obj }) => obj.student?.studentId),
    __metadata("design:type", String)
], UserInfoDto.prototype, "studentId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({
        nullable: true,
        example: { studentId: 'SE171234', fullName: 'Nguyen Van A' },
    }),
    (0, class_transformer_1.Transform)(({ obj }) => obj.student
        ? {
            studentId: obj.student.studentId,
            fullName: obj.student.fullName,
        }
        : null),
    __metadata("design:type", Object)
], UserInfoDto.prototype, "student", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "avatar", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ enum: roles_constant_1.UserRole }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "role", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", String)
], UserInfoDto.prototype, "referralCode", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ nullable: true }),
    (0, class_transformer_1.Transform)(({ obj }) => obj.referredBy?.id ?? null),
    __metadata("design:type", String)
], UserInfoDto.prototype, "referredById", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ nullable: true }),
    (0, class_transformer_1.Transform)(({ obj }) => obj.referredBy?.username ?? null),
    __metadata("design:type", String)
], UserInfoDto.prototype, "referredByUsername", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, swagger_1.ApiProperty)({ nullable: true }),
    (0, class_transformer_1.Transform)(({ obj }) => obj.referredBy?.avatar ?? null),
    __metadata("design:type", String)
], UserInfoDto.prototype, "referredByAvatarUrl", void 0);
exports.UserInfoDto = UserInfoDto = __decorate([
    (0, class_transformer_1.Exclude)()
], UserInfoDto);
//# sourceMappingURL=user-info.dto.js.map