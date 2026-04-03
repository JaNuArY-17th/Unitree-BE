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
exports.GoogleLoginDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class GoogleLoginDto {
    idToken;
    email;
    picture;
    name;
}
exports.GoogleLoginDto = GoogleLoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'eyJhbGciOiJSUzI1NiIsImtp...',
        description: 'Firebase ID token received from Google Sign-In on client side',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GoogleLoginDto.prototype, "idToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'user@gmail.com',
        description: 'Google account email resolved by frontend OAuth flow. Used as identity source when idToken is not provided.',
    }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], GoogleLoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'https://lh3.googleusercontent.com/a/photo.jpg',
        description: 'Google avatar URL from frontend OAuth response',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1024),
    __metadata("design:type", String)
], GoogleLoginDto.prototype, "picture", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'John Doe',
        description: 'Display name from frontend OAuth response',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], GoogleLoginDto.prototype, "name", void 0);
//# sourceMappingURL=google-login.dto.js.map