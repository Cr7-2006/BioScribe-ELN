import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbManager } from '../config/db';
import { recordAuditLog } from '../services/audit';
import { AuthRequest } from '../middleware/auth';
import { User } from '../types';
import { getSafeIsoDate } from '../utils/date';

const JWT_SECRET = process.env.JWT_SECRET || 'bioscribe-super-secret-scientific-eln-token-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email or username and password are required.' });
  }

  const normalizedInput = email.toLowerCase().trim();
  const user = dbManager.db.users.find((u) => {
    const uEmail = u.email.toLowerCase();
    const uUsername = (u.username || '').toLowerCase();
    if (uEmail === normalizedInput) return true;
    if (uUsername && uUsername === normalizedInput) return true;
    if ((normalizedInput === 'kamalesh' || normalizedInput === 'dr. kamalesh' || normalizedInput === 'dr kamalesh') && u.id === 'usr-elena') return true;
    if ((normalizedInput === 'thameem' || normalizedInput === 'dr. thameem' || normalizedInput === 'dr thameem') && u.id === 'usr-marcus') return true;
    if ((normalizedInput === 'subbu' || normalizedInput === 'dr. subbu' || normalizedInput === 'dr subbu') && u.id === 'usr-sarah') return true;
    if ((normalizedInput === 'admin' || normalizedInput === 'administrator' || normalizedInput === 'admin@bioscribe.io') && u.id === 'usr-admin') return true;
    if (normalizedInput === 'elena.vance@bioscribe.io' && u.id === 'usr-elena') return true;
    if (normalizedInput === 'marcus.chen@bioscribe.io' && u.id === 'usr-marcus') return true;
    if (normalizedInput === 'sarah.jenkins@bioscribe.io' && u.id === 'usr-sarah') return true;
    return false;
  });

  if (!user || !user.passwordHash) {
    return res.status(401).json({ message: 'Invalid scientific credentials.' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid scientific credentials.' });
  }

  // Enforce administrator verification before enabling system access
  if (user.status === 'pending_approval') {
    return res.status(403).json({
      message: 'Account Pending Verification: An administrator must review and approve your registration before you can log in.',
      status: 'pending_approval',
    });
  }

  if (user.status === 'deactivated') {
    return res.status(403).json({
      message: 'Account Deactivated: Your account has been deactivated by the laboratory administrator. Please contact your administrator.',
      status: 'deactivated',
    });
  }

  if (user.status === 'rejected') {
    return res.status(403).json({
      message: 'Account Rejected: Your registration was not approved by the laboratory administrator.',
      status: 'rejected',
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  await recordAuditLog({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'CREATE',
    entityType: 'auth',
    entityId: user.id,
    details: `User ${user.name} (${user.role}) logged in to BioScribe ELN session.`,
  });

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      department: user.department,
      status: user.status || 'active',
    },
  });
}

export async function register(req: Request, res: Response) {
  const {
    name,
    email,
    username,
    password,
    role = 'researcher',
    department = 'General Research',
    justification,
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Full name, email address, and password are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanUsername = (username || cleanEmail.split('@')[0]).toLowerCase().trim();

  const existing = dbManager.db.users.find(
    (u) =>
      u.email.toLowerCase() === cleanEmail ||
      (u.username && u.username.toLowerCase() === cleanUsername)
  );

  if (existing) {
    return res.status(400).json({
      message: 'A user with this email or username is already registered in the laboratory records.',
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: 'usr-' + Math.random().toString(36).substring(2, 9),
    name: name.trim(),
    email: cleanEmail,
    username: cleanUsername,
    role,
    department: department.trim(),
    status: 'pending_approval',
    justification: justification?.trim() || 'Access requested for laboratory notebook research',
    passwordHash,
    createdAt: getSafeIsoDate(),
  };

  dbManager.db.users.push(newUser);
  dbManager.saveLocalData();

  await recordAuditLog({
    userId: newUser.id,
    userName: newUser.name,
    userRole: newUser.role,
    action: 'CREATE',
    entityType: 'auth',
    entityId: newUser.id,
    details: `New user registration request submitted for ${newUser.name} (${newUser.email}), role: ${newUser.role}, department: ${newUser.department}. Status: PENDING_APPROVAL.`,
  });

  return res.status(201).json({
    message: 'Registration submitted successfully. Your account must be verified by the Laboratory Administrator before you can log in.',
    status: 'pending_approval',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
      department: newUser.department,
      status: newUser.status,
      createdAt: newUser.createdAt,
    },
  });
}

export async function getCurrentUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  return res.json({ user: req.user });
}

export async function getSeedAccounts(_req: Request, res: Response) {
  // Returns available seed accounts for quick-switching in demo/development
  const accounts = dbManager.db.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
  }));
  return res.json({ accounts });
}
