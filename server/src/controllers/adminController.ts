import { Response } from 'express';
import { dbManager } from '../config/db';
import { recordAuditLog } from '../services/audit';
import { AuthRequest } from '../middleware/auth';
import { getSafeIsoDate } from '../utils/date';

/**
 * Get all users for administration, optionally filtered by status
 */
export async function getAllUsers(req: AuthRequest, res: Response) {
  const { status } = req.query;

  let users = dbManager.db.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username || u.email.split('@')[0],
    role: u.role,
    department: u.department,
    status: u.status || 'active',
    justification: u.justification,
    approvedAt: u.approvedAt,
    approvedBy: u.approvedBy,
    createdAt: u.createdAt,
  }));

  if (status && typeof status === 'string' && status !== 'all') {
    users = users.filter((u) => u.status === status);
  }

  // Sort: pending_approval first, then newest
  users.sort((a, b) => {
    if (a.status === 'pending_approval' && b.status !== 'pending_approval') return -1;
    if (a.status !== 'pending_approval' && b.status === 'pending_approval') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return res.json({ users });
}

/**
 * Get count of users awaiting administrator verification
 */
export async function getPendingUsersCount(_req: AuthRequest, res: Response) {
  const count = dbManager.db.users.filter((u) => u.status === 'pending_approval').length;
  return res.json({ count });
}

/**
 * Approve and verify a newly registered user account (Electronic records access authorization)
 */
export async function approveUser(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const user = dbManager.db.users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ message: 'User account not found.' });
  }

  user.status = 'active';
  user.approvedAt = getSafeIsoDate();
  user.approvedBy = req.user?.name || 'Administrator';

  dbManager.saveLocalData();

  await recordAuditLog({
    userId: req.user?.id || 'admin',
    userName: req.user?.name || 'Administrator',
    userRole: req.user?.role || 'admin',
    action: 'UPDATE',
    entityType: 'auth',
    entityId: user.id,
    details: `Administrator ${req.user?.name || 'Admin'} verified and approved research terminal access for user ${user.name} (${user.email}) with role '${user.role}' in '${user.department}'.`,
  });

  return res.json({
    message: `User ${user.name} has been verified and activated. They can now log in.`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      department: user.department,
      status: user.status,
      approvedAt: user.approvedAt,
      approvedBy: user.approvedBy,
    },
  });
}

/**
 * Reject a user registration request
 */
export async function rejectUser(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { reason } = req.body;
  const user = dbManager.db.users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ message: 'User account not found.' });
  }

  user.status = 'rejected';
  dbManager.saveLocalData();

  await recordAuditLog({
    userId: req.user?.id || 'admin',
    userName: req.user?.name || 'Administrator',
    userRole: req.user?.role || 'admin',
    action: 'UPDATE',
    entityType: 'auth',
    entityId: user.id,
    details: `Administrator ${req.user?.name || 'Admin'} rejected registration for user ${user.name} (${user.email}). Reason: ${reason || 'Not specified'}.`,
  });

  return res.json({
    message: `User registration for ${user.name} was rejected.`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
}

/**
 * Deactivate a user account (revoking laboratory terminal access)
 */
export async function deactivateUser(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { reason } = req.body;
  const user = dbManager.db.users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ message: 'User account not found.' });
  }

  // Prevent administrator from deactivating their own active admin account
  if (user.id === req.user?.id) {
    return res.status(400).json({ message: 'You cannot deactivate your own active administrator account.' });
  }

  user.status = 'deactivated';
  dbManager.saveLocalData();

  await recordAuditLog({
    userId: req.user?.id || 'admin',
    userName: req.user?.name || 'Administrator',
    userRole: req.user?.role || 'admin',
    action: 'UPDATE',
    entityType: 'auth',
    entityId: user.id,
    details: `Administrator ${req.user?.name || 'Admin'} deactivated account for user ${user.name} (${user.email}). Reason: ${reason || 'Administrative policy'}.`,
  });

  return res.json({
    message: `Account for ${user.name} has been deactivated.`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
}

/**
 * Reactivate a previously deactivated or rejected user account
 */
export async function reactivateUser(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const user = dbManager.db.users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({ message: 'User account not found.' });
  }

  user.status = 'active';
  user.approvedAt = getSafeIsoDate();
  user.approvedBy = req.user?.name || 'Administrator';
  dbManager.saveLocalData();

  await recordAuditLog({
    userId: req.user?.id || 'admin',
    userName: req.user?.name || 'Administrator',
    userRole: req.user?.role || 'admin',
    action: 'UPDATE',
    entityType: 'auth',
    entityId: user.id,
    details: `Administrator ${req.user?.name || 'Admin'} reactivated user account for ${user.name} (${user.email}).`,
  });

  return res.json({
    message: `Account for ${user.name} has been reactivated.`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      approvedAt: user.approvedAt,
      approvedBy: user.approvedBy,
    },
  });
}
