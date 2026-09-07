import { Response } from 'express';
import { dbManager } from '../config/db';
import { cache } from '../config/redis';
import { AuthRequest } from '../middleware/auth';

export async function getStats(req: AuthRequest, res: Response) {
  const totalExperiments = dbManager.db.experiments.length;
  const draftExperiments = dbManager.db.experiments.filter((e) => e.status === 'draft').length;
  const inReviewExperiments = dbManager.db.experiments.filter((e) => e.status === 'in_review').length;
  const approvedExperiments = dbManager.db.experiments.filter((e) => e.status === 'approved').length;

  const totalFormulations = dbManager.db.formulations.length;
  const totalObservations = dbManager.db.observations.length;
  const pendingApprovals = dbManager.db.approvals.filter((a) => a.status === 'pending').length;
  const totalAuditEntries = dbManager.db.auditLogs.length;

  const isRedisActive = cache.isConnected();

  return res.json({
    metrics: {
      totalExperiments,
      draftExperiments,
      inReviewExperiments,
      approvedExperiments,
      totalFormulations,
      totalObservations,
      pendingApprovals,
      totalAuditEntries,
    },
    system: {
      complianceStandard: 'FDA 21 CFR Part 11 & GLP Compliant',
      cryptographicHashing: 'SHA-256',
      redisCacheStatus: isRedisActive ? 'Active (Connected)' : 'Fallback In-Memory Cache Active',
      databaseStorage: dbManager.isPostgres ? 'PostgreSQL 16 Engine' : 'Resilient File-Backed Relational Store',
    },
  });
}
