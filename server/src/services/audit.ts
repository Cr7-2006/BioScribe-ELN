import crypto from 'crypto';
import { dbManager } from '../config/db';
import { AuditLogModel } from '../models';
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
  const id =
    'aud-' +
    (crypto.randomUUID ? crypto.randomUUID().substring(0, 8) : Math.random().toString(36).substring(2, 10));
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

  // Persist to MongoDB Audit Ledger when active
  if (dbManager.isMongo) {
    try {
      await AuditLogModel.create(auditRecord);
    } catch (err) {
      console.error('Failed to insert audit log into MongoDB:', err);
    }
  }

  // Always keep state up to date
  dbManager.db.auditLogs.unshift(auditRecord);
  dbManager.saveLocalData();

  return auditRecord;
}
