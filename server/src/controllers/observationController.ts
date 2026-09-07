import { Response } from 'express';
import { dbManager } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/audit';
import { Observation } from '../types';

function getParamStr(param: string | string[] | undefined): string {
  if (!param) return '';
  return Array.isArray(param) ? param[0] : param;
}

export async function getObservations(req: AuthRequest, res: Response) {
  const experimentId = getParamStr(req.params.experimentId);
  const observations = dbManager.db.observations
    .filter((o) => o.experimentId === experimentId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return res.json({ observations });
}

export async function addObservation(req: AuthRequest, res: Response) {
  const experimentId = getParamStr(req.params.experimentId);
  const { category, parameter, value, unit, status = 'normal', notes, rawDataJson, timestamp } = req.body;
  const user = req.user!;

  const experiment = dbManager.db.experiments.find((e) => e.id === experimentId);
  if (!experiment) {
    return res.status(404).json({ message: 'Experiment not found.' });
  }

  if (experiment.status === 'approved') {
    return res.status(400).json({
      message: 'Cannot attach observations to an approved/locked laboratory notebook entry.',
    });
  }

  if (!parameter || value === undefined) {
    return res.status(400).json({ message: 'Parameter name and measurement value are required.' });
  }

  const observation: Observation = {
    id: 'obs-' + Math.random().toString(36).substring(2, 9),
    experimentId,
    timestamp: timestamp || new Date().toISOString(),
    recordedById: user.id,
    recordedByName: user.name,
    category: category || 'measurement',
    parameter,
    value,
    unit: unit || '',
    status,
    notes: notes || '',
    rawDataJson: rawDataJson || {},
    createdAt: new Date().toISOString(),
  };

  dbManager.db.observations.push(observation);
  experiment.updatedAt = new Date().toISOString();
  dbManager.saveLocalData();

  await recordAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'CREATE',
    entityType: 'observation',
    entityId: observation.id,
    details: `Observation recorded for ${experiment.experimentNumber}: ${parameter} = ${value} ${unit || ''} [Status: ${status}]`,
  });

  return res.status(201).json({ observation });
}

export async function deleteObservation(req: AuthRequest, res: Response) {
  const id = getParamStr(req.params.id);
  const user = req.user!;

  const obsIndex = dbManager.db.observations.findIndex((o) => o.id === id);
  if (obsIndex === -1) {
    return res.status(404).json({ message: 'Observation not found.' });
  }

  const obs = dbManager.db.observations[obsIndex];
  const experiment = dbManager.db.experiments.find((e) => e.id === obs.experimentId);
  if (experiment && experiment.status === 'approved') {
    return res.status(400).json({
      message: 'Cannot delete observation from an approved/locked notebook entry.',
    });
  }

  dbManager.db.observations.splice(obsIndex, 1);
  dbManager.saveLocalData();

  await recordAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'DELETE',
    entityType: 'observation',
    entityId: id,
    details: `Observation ${id} (${obs.parameter}) deleted by ${user.name}`,
  });

  return res.json({ message: 'Observation removed successfully.' });
}
