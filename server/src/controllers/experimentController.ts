import { Response } from 'express';
import { dbManager } from '../config/db';
import { cache } from '../config/redis';
import { AuthRequest } from '../middleware/auth';
import { computeVersionHash } from '../services/crypto';
import { recordAuditLog } from '../services/audit';
import { Experiment, ExperimentVersion, ProtocolStep } from '../types';

function getParamStr(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

export async function getExperiments(req: AuthRequest, res: Response) {
  const projectCode = getParamStr(req.query.projectCode as any);
  const status = getParamStr(req.query.status as any);
  const query = getParamStr(req.query.query as any);

  let experiments = [...dbManager.db.experiments];

  if (projectCode) {
    experiments = experiments.filter((e) => e.projectCode.toLowerCase() === projectCode.toLowerCase());
  }

  if (status && status !== 'all') {
    experiments = experiments.filter((e) => e.status === status);
  }

  if (query) {
    const q = query.toLowerCase();
    experiments = experiments.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.experimentNumber.toLowerCase().includes(q) ||
        e.objective.toLowerCase().includes(q) ||
        e.authorName.toLowerCase().includes(q)
    );
  }

  // Attach version counts and observation counts
  const results = experiments.map((exp) => {
    const vCount = dbManager.db.experimentVersions.filter((v) => v.experimentId === exp.id).length;
    const oCount = dbManager.db.observations.filter((o) => o.experimentId === exp.id).length;
    return {
      ...exp,
      versionsCount: vCount,
      observationsCount: oCount,
    };
  });

  return res.json({ experiments: results });
}

export async function getExperimentById(req: AuthRequest, res: Response) {
  const id = getParamStr(req.params.id);

  const experiment = dbManager.db.experiments.find((e) => e.id === id);
  if (!experiment) {
    return res.status(404).json({ message: 'Experiment record not found.' });
  }

  const versions = dbManager.db.experimentVersions
    .filter((v) => v.experimentId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const currentVersion = versions.find((v) => v.id === experiment.currentVersionId) || versions[0];
  const observations = dbManager.db.observations
    .filter((o) => o.experimentId === id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let formulation = null;
  if (experiment.formulationId) {
    formulation = dbManager.db.formulations.find((f) => f.id === experiment.formulationId) || null;
  }

  const approvals = dbManager.db.approvals.filter((a) => a.experimentId === id);

  return res.json({
    experiment,
    currentVersion,
    versions,
    observations,
    formulation,
    approvals,
  });
}

export async function createExperiment(req: AuthRequest, res: Response) {
  const { projectCode, title, objective, hypothesis, protocolSteps = [], formulationId } = req.body;
  const user = req.user!;

  if (!title || !projectCode) {
    return res.status(400).json({ message: 'Title and Project Code are required.' });
  }

  const expCount = dbManager.db.experiments.length + 1;
  const experimentNumber = `EXP-2026-${String(expCount).padStart(4, '0')}`;
  const experimentId = 'exp-' + Math.random().toString(36).substring(2, 9);
  const versionId = 'ver-' + Math.random().toString(36).substring(2, 9);

  const formattedSteps: ProtocolStep[] = protocolSteps.map((s: any, idx: number) => ({
    id: s.id || 'step-' + (idx + 1),
    stepNumber: idx + 1,
    title: s.title || `Protocol Step ${idx + 1}`,
    instruction: s.instruction || '',
    durationMinutes: s.durationMinutes ? Number(s.durationMinutes) : undefined,
    temperatureCelsius: s.temperatureCelsius !== undefined ? Number(s.temperatureCelsius) : undefined,
    criticalQualityAttribute: Boolean(s.criticalQualityAttribute),
    notes: s.notes || '',
    completed: Boolean(s.completed),
  }));

  const sha256 = computeVersionHash({
    experimentId,
    versionNumber: '1.0',
    title,
    objective: objective || '',
    hypothesis: hypothesis || '',
    protocolSteps: formattedSteps,
    authorId: user.id,
  });

  const now = new Date().toISOString();

  const initialVersion: ExperimentVersion = {
    id: versionId,
    experimentId,
    versionNumber: '1.0',
    title,
    objective: objective || '',
    hypothesis: hypothesis || '',
    protocolSteps: formattedSteps,
    authorId: user.id,
    authorName: user.name,
    changeSummary: 'Initial creation and baseline protocol definition.',
    hashSha256: sha256,
    isLocked: false,
    createdAt: now,
  };

  const newExperiment: Experiment = {
    id: experimentId,
    projectCode,
    experimentNumber,
    title,
    objective: objective || '',
    hypothesis: hypothesis || '',
    status: 'draft',
    currentVersionId: versionId,
    currentVersionNumber: '1.0',
    authorId: user.id,
    authorName: user.name,
    formulationId: formulationId || undefined,
    createdAt: now,
    updatedAt: now,
  };

  dbManager.db.experiments.unshift(newExperiment);
  dbManager.db.experimentVersions.unshift(initialVersion);
  dbManager.saveLocalData();

  await recordAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'CREATE',
    entityType: 'experiment',
    entityId: experimentId,
    details: `Created experiment ${experimentNumber}: "${title}" with baseline version 1.0 (SHA-256: ${sha256.substring(0, 10)}...)`,
  });

  return res.status(201).json({
    experiment: newExperiment,
    currentVersion: initialVersion,
  });
}

export async function commitNewVersion(req: AuthRequest, res: Response) {
  const id = getParamStr(req.params.id);
  const { title, objective, hypothesis, protocolSteps, conclusion, changeSummary, bumpType = 'minor' } = req.body;
  const user = req.user!;

  const experiment = dbManager.db.experiments.find((e) => e.id === id);
  if (!experiment) {
    return res.status(404).json({ message: 'Experiment not found.' });
  }

  if (experiment.status === 'approved') {
    return res.status(400).json({
      message: 'This experiment has been formally approved and locked under 21 CFR Part 11. Create a fork or amendment instead.',
    });
  }

  // Calculate next version string
  const currentVerStr = experiment.currentVersionNumber || '1.0';
  const [major, minor] = currentVerStr.split('.').map(Number);
  const nextVersionNumber = bumpType === 'major' ? `${major + 1}.0` : `${major}.${minor + 1}`;

  const formattedSteps: ProtocolStep[] = (protocolSteps || []).map((s: any, idx: number) => ({
    id: s.id || 'step-' + (idx + 1),
    stepNumber: idx + 1,
    title: s.title || `Protocol Step ${idx + 1}`,
    instruction: s.instruction || '',
    durationMinutes: s.durationMinutes ? Number(s.durationMinutes) : undefined,
    temperatureCelsius: s.temperatureCelsius !== undefined ? Number(s.temperatureCelsius) : undefined,
    criticalQualityAttribute: Boolean(s.criticalQualityAttribute),
    notes: s.notes || '',
    completed: Boolean(s.completed),
  }));

  const sha256 = computeVersionHash({
    experimentId: id,
    versionNumber: nextVersionNumber,
    title: title || experiment.title,
    objective: objective !== undefined ? objective : experiment.objective,
    hypothesis: hypothesis !== undefined ? hypothesis : experiment.hypothesis,
    protocolSteps: formattedSteps,
    conclusion,
    authorId: user.id,
  });

  const now = new Date().toISOString();
  const newVersionId = 'ver-' + Math.random().toString(36).substring(2, 9);

  // Lock previous versions
  dbManager.db.experimentVersions.forEach((v) => {
    if (v.experimentId === id) {
      v.isLocked = true;
    }
  });

  const newVersion: ExperimentVersion = {
    id: newVersionId,
    experimentId: id,
    versionNumber: nextVersionNumber,
    title: title || experiment.title,
    objective: objective !== undefined ? objective : experiment.objective,
    hypothesis: hypothesis !== undefined ? hypothesis : experiment.hypothesis,
    protocolSteps: formattedSteps,
    conclusion: conclusion || '',
    authorId: user.id,
    authorName: user.name,
    changeSummary: changeSummary || `Revision ${nextVersionNumber} committed by ${user.name}`,
    hashSha256: sha256,
    isLocked: false,
    createdAt: now,
  };

  experiment.title = newVersion.title;
  experiment.objective = newVersion.objective;
  experiment.hypothesis = newVersion.hypothesis;
  experiment.currentVersionId = newVersionId;
  experiment.currentVersionNumber = nextVersionNumber;
  experiment.updatedAt = now;

  dbManager.db.experimentVersions.unshift(newVersion);
  dbManager.saveLocalData();

  // Clear Redis draft cache
  await cache.del(`draft:${id}:${user.id}`);

  await recordAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'VERSION_COMMIT',
    entityType: 'experiment',
    entityId: id,
    details: `Committed version ${nextVersionNumber} for ${experiment.experimentNumber}. Summary: ${newVersion.changeSummary} (SHA-256: ${sha256.substring(0, 12)}...)`,
  });

  return res.status(201).json({
    experiment,
    version: newVersion,
  });
}

export async function getVersionDiff(req: AuthRequest, res: Response) {
  const id = getParamStr(req.params.id);
  const v1 = getParamStr(req.query.v1 as any);
  const v2 = getParamStr(req.query.v2 as any);

  const version1 = dbManager.db.experimentVersions.find((v) => v.id === v1 && v.experimentId === id);
  const version2 = dbManager.db.experimentVersions.find((v) => v.id === v2 && v.experimentId === id);

  if (!version1 || !version2) {
    return res.status(404).json({ message: 'One or both version snapshots could not be found.' });
  }

  // Compare Protocol Steps
  const stepsDiff = [];
  const maxSteps = Math.max(version1.protocolSteps.length, version2.protocolSteps.length);

  for (let i = 0; i < maxSteps; i++) {
    const s1 = version1.protocolSteps[i];
    const s2 = version2.protocolSteps[i];

    if (!s1 && s2) {
      stepsDiff.push({ status: 'added', stepNumber: s2.stepNumber, current: s2 });
    } else if (s1 && !s2) {
      stepsDiff.push({ status: 'removed', stepNumber: s1.stepNumber, previous: s1 });
    } else if (s1 && s2) {
      const isChanged =
        s1.title !== s2.title ||
        s1.instruction !== s2.instruction ||
        s1.temperatureCelsius !== s2.temperatureCelsius ||
        s1.durationMinutes !== s2.durationMinutes;

      stepsDiff.push({
        status: isChanged ? 'modified' : 'unchanged',
        stepNumber: s2.stepNumber,
        previous: s1,
        current: s2,
      });
    }
  }

  return res.json({
    v1: {
      id: version1.id,
      versionNumber: version1.versionNumber,
      createdAt: version1.createdAt,
      authorName: version1.authorName,
      hash: version1.hashSha256,
    },
    v2: {
      id: version2.id,
      versionNumber: version2.versionNumber,
      createdAt: version2.createdAt,
      authorName: version2.authorName,
      hash: version2.hashSha256,
    },
    titleChanged: version1.title !== version2.title,
    objectiveChanged: version1.objective !== version2.objective,
    hypothesisChanged: version1.hypothesis !== version2.hypothesis,
    conclusionChanged: version1.conclusion !== version2.conclusion,
    stepsDiff,
  });
}

// Redis Draft caching
export async function getDraft(req: AuthRequest, res: Response) {
  const id = getParamStr(req.params.id);
  const user = req.user!;
  const draft = await cache.get(`draft:${id}:${user.id}`);
  return res.json({ draft: draft ? JSON.parse(draft) : null });
}

export async function saveDraft(req: AuthRequest, res: Response) {
  const id = getParamStr(req.params.id);
  const user = req.user!;
  const { data } = req.body;

  // Cache in Redis for 48 hours
  await cache.set(`draft:${id}:${user.id}`, JSON.stringify(data), 172800);
  return res.json({ success: true, savedAt: new Date().toISOString() });
}
