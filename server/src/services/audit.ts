import crypto from 'crypto';
import { dbManager } from '../config/db';
import { AuditLog, UserRole } from '../types';
import { computeAuditChecksum } from './crypto';

export async function recordAuditLog(entry: {
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditLog['action'];
  entityType: AuditLog['entityType'];
  entityId: string;
  details: string;
  metadata?: Record<string, any>;
}): Promise<AuditLog> {
  const id = 'aud-' + (crypto.randomUUID ? crypto.randomUUID().substring(0, 8) : Math.random().toString(36).substring(2, 10));
  const timestamp = new Date().toISOString();

  const checksum = computeAuditChecksum({
    id,
    timestamp,
    userId: entry.userId,
    action: entry.action,
    entityId: entry.entityId,
    details: entry.details,
  });

  const auditRecord: AuditLog = {
    id,
    timestamp,
    userId: entry.userId,
    userName: entry.userName,
    userRole: entry.userRole,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    details: entry.details,
    metadata: entry.metadata,
    checksum,
  };

  if (dbManager.isPostgres && dbManager.pool) {
    try {
      await dbManager.pool.query(
        `INSERT INTO audit_logs (id, timestamp, user_id, user_name, user_role, action, entity_type, entity_id, details, metadata, checksum)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          auditRecord.id,
          auditRecord.timestamp,
          auditRecord.userId,
          auditRecord.userName,
          auditRecord.userRole,
          auditRecord.action,
          auditRecord.entityType,
          auditRecord.entityId,
          auditRecord.details,
          JSON.stringify(auditRecord.metadata || {}),
          auditRecord.checksum,
        ]
      );
    } catch (err) {
      console.error('Failed to insert audit log into Postgres:', err);
    }
  }

  // Always keep local in-memory/JSON store up to date
  dbManager.db.auditLogs.unshift(auditRecord);
  dbManager.saveLocalData();

  return auditRecord;
}
