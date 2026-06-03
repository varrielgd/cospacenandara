import { prisma } from '../index';

export class AuditService {
  static async log(userId: string | null, action: string, entity: string, entityId?: string, details?: string, ipAddress?: string) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          entity,
          entityId,
          details,
          ipAddress
        }
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }
}
