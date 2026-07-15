"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = void 0;
const index_js_1 = require("../index.js");
const getAuditLogs = async (req, res) => {
    try {
        const logs = await index_js_1.prisma.auditLog.findMany({
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(logs);
    }
    catch (error) {
        index_js_1.logger.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAuditLogs = getAuditLogs;
//# sourceMappingURL=audit.controller.js.map