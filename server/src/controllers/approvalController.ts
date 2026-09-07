import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbManager } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { computeSignatureDigest } from '../services/crypto';
import { recordAuditLog } from '../services/audit';
import { Approval, ApprovalRole } from '../types';

function getParamStr(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

export async function getApprovals(req: AuthRequest, res: Response) {
  const status = getParamStr(req.query.status as any);
  const experimentId = getParamStr(req.query.experimentId as any);

  let approvals = [...dbManager.db.approvals];

  if (status && status !== 'all') {
    approvals = approvals.filter((a) => a.status === status);
  }

  if (experimentId) {
    approvals = approvals.filter((a) => a.experimentId === experimentId);
  }

  approvals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({ approvals });
}

export async function requestApproval(req: AuthRequest, res: Response) {
  const { experimentId, reviewerId, role = 'peer_review', reason } = req.body;
  const user = req.user!;

  const experiment = dbManager.db.experiments.find((e) => e.id === experimentId);
  if (!experiment) {
    return res.status(404).json({ message: 'Experiment not found.' });
  }

  const version = dbManager.db.experimentVersions.find((v) => v.id === experiment.currentVersionId);
  if (!version) {
    return res.status(400).json({ message: 'Active version snapshot not found.' });
  }

  let reviewerName = undefined;
  if (reviewerId) {
    const reviewer = dbManager.db.users.find((u) => u.id === reviewerId);
    if (reviewer) reviewerName = reviewer.name;
  }

  const approvalId = 'appr-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const newApproval: Approval = {
    id: approvalId,
    experimentId: experiment.id,
    experimentTitle: experiment.title,
    experimentNumber: experiment.experimentNumber,
    versionId: version.id,
    versionNumber: version.versionNumber,
    requesterId: user.id,
    requesterName: user.name,
    reviewerId,
    reviewerName,
    role: role as ApprovalRole,
    status: 'pending',
    signatureReason: reason || 'Review and sign-off for research notebook release.',
    createdAt: now,
  };

  experiment.status = 'in_review';
  experiment.updatedAt = now;

  dbManager.db.approvals.unshift(newApproval);
  dbManager.saveLocalData();

  await recordAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'UPDATE',
    entityType: 'approval',
    entityId: approvalId,
    details: `Approval requested for ${experiment.experimentNumber} (v${version.versionNumber}) by ${user.name}. Role: ${role}.`,
  });

  return res.status(201).json({ approval: newApproval });
}

export async function signApproval(req: AuthRequest, res: Response) {
  const id = getParamStr(req.params.id);
  const { password, decision = 'approve', comments, signatureReason } = req.body;
  const user = req.user!;

  const approval = dbManager.db.approvals.find((a) => a.id === id);
  if (!approval) {
    return res.status(404).json({ message: 'Approval request not found.' });
  }

  if (approval.status !== 'pending') {
    return res.status(400).json({ message: `This approval is already ${approval.status}.` });
  }

  // 21 CFR Part 11 Rule: Dual-factor authentication required at time of signature
  const userRecord = dbManager.db.users.find((u) => u.id === user.id);
  if (!userRecord || !userRecord.passwordHash) {
    return res.status(401).json({ message: 'Signer credentials verification failed.' });
  }

  if (!password) {
    return res.status(400).json({
      message: '21 CFR Part 11 Compliance: Password re-verification is required to execute an Electronic Signature.',
    });
  }

  const isPasswordValid = await bcrypt.compare(password, userRecord.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid signature authentication password. Signing ceremony aborted.' });
  }

  // 21 CFR Part 11 & GLP Segregation of Duties:
  // QA Compliance release must be executed by QA Manager or Admin
  if (approval.role === 'qa_compliance' && user.role !== 'qa_manager' && user.role !== 'admin') {
    return res.status(403).json({
      message: '21 CFR Part 11 Compliance Violation: QA Compliance signatures require QA Manager or Admin credentials.',
    });
  }

  // Designated reviewer check
  if (approval.reviewerId && approval.reviewerId !== user.id && user.role !== 'admin') {
    return res.status(403).json({
      message: 'Unauthorized. This approval was specifically designated to another reviewer.',
    });
  }

  const experiment = dbManager.db.experiments.find((e) => e.id === approval.experimentId);
  const version = dbManager.db.experimentVersions.find((v) => v.id === approval.versionId);

  if (!experiment || !version) {
    return res.status(404).json({ message: 'Referenced experiment or version record missing.' });
  }

  const now = new Date().toISOString();
  const effectiveReason = signatureReason || approval.signatureReason;

  if (decision === 'approve') {
    // Generate cryptographic signature digest over SHA-256 version hash
    const signatureDigest = computeSignatureDigest({
      versionHash: version.hashSha256,
      signerId: user.id,
      role: approval.role,
      reason: effectiveReason,
      timestamp: now,
    });

    approval.status = 'approved';
    approval.reviewerId = user.id;
    approval.reviewerName = user.name;
    approval.signatureReason = effectiveReason;
    approval.signatureDigest = signatureDigest;
    approval.comments = comments || 'Approved pursuant to 21 CFR Part 11 compliance standards.';
    approval.signedAt = now;

    // Lock the version immutably
    version.isLocked = true;
    experiment.status = 'approved';
    experiment.updatedAt = now;

    await recordAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'E_SIGNATURE',
      entityType: 'approval',
      entityId: approval.id,
      details: `21 CFR Part 11 E-Signature executed by ${user.name} for ${experiment.experimentNumber} (v${version.versionNumber}). Reason: "${effectiveReason}". Digest: ${signatureDigest.substring(0, 12)}...`,
      metadata: {
        experimentNumber: experiment.experimentNumber,
        versionNumber: version.versionNumber,
        signatureDigest,
      },
    });
  } else {
    // Rejection
    approval.status = 'rejected';
    approval.reviewerId = user.id;
    approval.reviewerName = user.name;
    approval.comments = comments || 'Rejected during review.';
    approval.signedAt = now;

    experiment.status = 'rejected';
    experiment.updatedAt = now;

    await recordAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE',
      entityType: 'approval',
      entityId: approval.id,
      details: `Approval rejected by ${user.name} for ${experiment.experimentNumber}. Comments: "${comments}"`,
    });
  }

  dbManager.saveLocalData();

  return res.json({
    message: decision === 'approve' ? '21 CFR Part 11 Electronic Signature recorded.' : 'Record rejected.',
    approval,
    experiment,
  });
}
