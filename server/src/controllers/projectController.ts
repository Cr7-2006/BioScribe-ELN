import { Response } from 'express';
import { dbManager } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { recordAuditLog } from '../services/audit';
import { Project } from '../types';

export async function getProjects(req: AuthRequest, res: Response) {
  const projects = dbManager.db.projects.map((p) => {
    const expCount = dbManager.db.experiments.filter((e) => e.projectCode === p.code).length;
    return {
      ...p,
      experimentsCount: expCount,
    };
  });

  return res.json({ projects });
}

export async function createProject(req: AuthRequest, res: Response) {
  const { code, name, description, therapeuticArea } = req.body;
  const user = req.user!;

  if (!code || !name) {
    return res.status(400).json({ message: 'Project code and title are required.' });
  }

  const existing = dbManager.db.projects.find((p) => p.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    return res.status(400).json({ message: 'A project with this code already exists.' });
  }

  const newProject: Project = {
    id: 'prj-' + Math.random().toString(36).substring(2, 9),
    code: code.toUpperCase(),
    name,
    description: description || '',
    therapeuticArea: therapeuticArea || 'General Science',
    leadId: user.id,
    leadName: user.name,
    createdAt: new Date().toISOString(),
  };

  dbManager.db.projects.push(newProject);
  dbManager.saveLocalData();

  await recordAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'CREATE',
    entityType: 'experiment',
    entityId: newProject.id,
    details: `Project ${newProject.code} created: "${newProject.name}"`,
  });

  return res.status(201).json({ project: newProject });
}
