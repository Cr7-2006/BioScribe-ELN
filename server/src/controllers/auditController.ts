import { Response } from 'express';
import { dbManager } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { computeAuditChecksum } from '../services/crypto';

export async function getAuditLogs(req: AuthRequest, res: Response) {
  const { action, entityType, userId, query } = req.query;

  let logs = [...dbManager.db.auditLogs];

  if (action && action !== 'all') {
    logs = logs.filter((l) => l.action === action);
  }

  if (entityType && entityType !== 'all') {
    logs = logs.filter((l) => l.entityType === entityType);
  }

  if (userId) {
    logs = logs.filter((l) => l.userId === userId);
  }

  if (query) {
    const q = (query as string).toLowerCase();
    logs = logs.filter(
      (l) =>
        l.details.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q)
    );
  }

  // Verify checksum validity on the fly
  const verifiedLogs = logs.map((log) => {
    const expectedChecksum = computeAuditChecksum({
      id: log.id,
      timestamp: log.timestamp,
      userId: log.userId,
      action: log.action,
      entityId: log.entityId,
      details: log.details,
    });

    return {
      ...log,
      isValid: log.checksum === expectedChecksum,
    };
  });

  return res.json({
    totalCount: verifiedLogs.length,
    allIntegrityValid: verifiedLogs.every((l) => l.isValid),
    logs: verifiedLogs,
  });
}
