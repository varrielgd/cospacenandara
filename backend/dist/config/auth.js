"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_EMAILS = exports.JWT_EXPIRES_IN = exports.JWT_SECRET = void 0;
exports.JWT_SECRET = process.env.JWT_SECRET || "ciis-production-secret-2026-nandara";
exports.JWT_EXPIRES_IN = "7d";
exports.ALLOWED_EMAILS = [
    "nandaranusamontierra@gmail.com",
    "nandalatifanibudiarti97@gmail.com"
];
//# sourceMappingURL=auth.js.map