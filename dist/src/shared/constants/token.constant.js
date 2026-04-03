"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserHashFields = exports.TokenPrefixes = exports.TOKEN_EXPIRATION_TIME = void 0;
exports.TOKEN_EXPIRATION_TIME = {
    ACCESS_TOKEN: 60 * 15,
    REFRESH_TOKEN: 60 * 60 * 24 * 7,
};
var TokenPrefixes;
(function (TokenPrefixes) {
    TokenPrefixes["USER"] = "users:";
})(TokenPrefixes || (exports.TokenPrefixes = TokenPrefixes = {}));
var UserHashFields;
(function (UserHashFields) {
    UserHashFields["PROFILE"] = "profile";
    UserHashFields["REFRESH_TOKENS"] = "refresh_tokens";
    UserHashFields["GARDEN_STATE"] = "garden_state";
})(UserHashFields || (exports.UserHashFields = UserHashFields = {}));
//# sourceMappingURL=token.constant.js.map