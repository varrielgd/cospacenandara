"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const index_1 = require("../index");
class AuditService {
    static async log(userId, action, entity, entityId, details, ipAddress) {
        try {
            await index_1.prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    entity,
                    entityId,
                    details,
                    ipAddress
                }
            });
        }
        catch (error) {
            console.error('Audit logging failed:', error);
        }
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=audit.service.js.map