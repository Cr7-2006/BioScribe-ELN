import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbManager } from '../config/db';
import { recordAuditLog } from '../services/audit';
import { AuthRequest } from '../middleware/auth';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'bioscribe-super-secret-scientific-eln-token-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = dbManager.db.users.find((u) => {
    const uEmail = u.email.toLowerCase();
    if (uEmail === normalizedEmail) return true;
    if ((normalizedEmail === 'kamalesh' || normalizedEmail === 'dr. kamalesh' || normalizedEmail === 'dr kamalesh') && u.id === 'usr-elena') return true;
    if ((normalizedEmail === 'thameem' || normalizedEmail === 'dr. thameem' || normalizedEmail === 'dr thameem') && u.id === 'usr-marcus') return true;
    if ((normalizedEmail === 'subbu' || normalizedEmail === 'dr. subbu' || normalizedEmail === 'dr subbu') && u.id === 'usr-sarah') return true;
    if (normalizedEmail === 'elena.vance@bioscribe.io' && u.id === 'usr-elena') return true;
    if (normalizedEmail === 'marcus.chen@bioscribe.io' && u.id === 'usr-marcus') return true;
    if (normalizedEmail === 'sarah.jenkins@bioscribe.io' && u.id === 'usr-sarah') return true;
    return false;
  });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ message: 'Invalid scientific credentials.' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid scientific credentials.' });
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
      role: user.role,
      department: user.department,
    },
  });
}

export async function register(req: Request, res: Response) {
  const { name, email, password, role = 'researcher', department = 'General Research' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const existing = dbManager.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ message: 'A researcher with this email is already registered.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: 'usr-' + Math.random().toString(36).substring(2, 9),
    name,
    email: email.toLowerCase(),
    role,
    department,
    passwordHash,
    createdAt: new Date().toISOString(),
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
    details: `New user account created: ${newUser.name} with role ${newUser.role}.`,
  });

  const token = jwt.sign(
    {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
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
