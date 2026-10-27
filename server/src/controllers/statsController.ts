import { Response } from 'express';
import { dbManager } from '../config/db';
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
  const totalUsers = dbManager.db.users.length;
  const pendingUsers = dbManager.db.users.filter((u) => u.status === 'pending_approval').length;

  const payload = {
    metrics: {
      totalUsers,
      pendingUsers,
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
      integrityStandard: 'SHA-256 Cryptographic Audit Ledger',
      cryptographicHashing: 'SHA-256',
      backendRuntime: 'Node.js + Express REST API (MERN)',
      databaseStorage: dbManager.isMongo
        ? 'MongoDB 7.0 Engine (MERN Stack)'
        : 'Resilient Local Store (MongoDB Offline Mode)',
    },
  };

  return res.json(payload);
}
