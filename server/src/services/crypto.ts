import crypto from 'crypto';

export function computeVersionHash(data: {
  experimentId: string;
  versionNumber: string;
  title: string;
  objective: string;
  hypothesis: string;
  protocolSteps: any[];
  conclusion?: string;
  authorId: string;
}): string {
  const payload = JSON.stringify({
    experimentId: data.experimentId,
    versionNumber: data.versionNumber,
    title: data.title.trim(),
    objective: data.objective.trim(),
    hypothesis: data.hypothesis.trim(),
    protocolSteps: data.protocolSteps,
    conclusion: (data.conclusion || '').trim(),
    authorId: data.authorId,
  });

  return crypto.createHash('sha256').update(payload).digest('hex');
}

export function computeSignatureDigest(data: {
  versionHash: string;
  signerId: string;
  role: string;
  reason: string;
  timestamp: string;
}): string {
  const payload = `${data.versionHash}:${data.signerId}:${data.role}:${data.reason}:${data.timestamp}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export function computeAuditChecksum(data: {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  entityId: string;
  details: string;
}): string {
  const payload = `${data.id}|${data.timestamp}|${data.userId}|${data.action}|${data.entityId}|${data.details}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}
