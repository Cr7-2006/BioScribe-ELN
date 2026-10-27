import { Router } from 'express';
import { login, register, getCurrentUser, getSeedAccounts } from '../controllers/authController';
import { getProjects, createProject } from '../controllers/projectController';
import {
  getExperiments,
  getExperimentById,
  createExperiment,
  commitNewVersion,
  getVersionDiff,
  getDraft,
  saveDraft,
} from '../controllers/experimentController';
import {
  getObservations,
  addObservation,
  deleteObservation,
} from '../controllers/observationController';
import {
  getFormulations,
  getFormulationById,
  createFormulation,
  calculateBatchScale,
} from '../controllers/formulationController';
import { getApprovals, requestApproval, signApproval } from '../controllers/approvalController';
import { getAuditLogs } from '../controllers/auditController';
import { getStats } from '../controllers/statsController';
import {
  getAllUsers,
  getPendingUsersCount,
  approveUser,
  rejectUser,
  deactivateUser,
  reactivateUser,
} from '../controllers/adminController';
import { globalSearch } from '../controllers/searchController';
import { authenticate, requireRole } from '../middleware/auth';
import { authLimiter, signatureLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public Auth Endpoints
router.post('/auth/login', authLimiter, login);
router.post('/auth/register', register);
router.get('/auth/seed-accounts', getSeedAccounts);

// Protected Routes (Authenticate middleware)
router.use(authenticate);

// User Profile
router.get('/auth/me', getCurrentUser);

// Dashboard Metrics
router.get('/stats', getStats);

// Global Full-Text Search
router.get('/search', globalSearch);

// Projects
router.get('/projects', getProjects);
router.post('/projects', createProject);

// Experiments & Versions
router.get('/experiments', getExperiments);
router.post('/experiments', createExperiment);
router.get('/experiments/:id', getExperimentById);
router.post('/experiments/:id/versions', commitNewVersion);
router.get('/experiments/:id/diff', getVersionDiff);
router.get('/experiments/:id/draft', getDraft);
router.put('/experiments/:id/draft', saveDraft);

// Observations
router.get('/experiments/:experimentId/observations', getObservations);
router.post('/experiments/:experimentId/observations', addObservation);
router.delete('/observations/:id', deleteObservation);

// Formulations
router.get('/formulations', getFormulations);
router.get('/formulations/:id', getFormulationById);
router.post('/formulations', createFormulation);
router.post('/formulations/calculate', calculateBatchScale);

// Approvals & Electronic Signatures
router.get('/approvals', getApprovals);
router.post('/approvals/request', requestApproval);
router.post('/approvals/:id/sign', signatureLimiter, signApproval);

// Audit Trail
router.get('/audit-trail', getAuditLogs);

// Administration & User Access Verification
router.get('/admin/users', requireRole(['admin', 'qa_manager']), getAllUsers);
router.get('/admin/users/pending-count', requireRole(['admin', 'qa_manager']), getPendingUsersCount);
router.post('/admin/users/:id/approve', requireRole(['admin', 'qa_manager']), approveUser);
router.post('/admin/users/:id/reject', requireRole(['admin', 'qa_manager']), rejectUser);
router.post('/admin/users/:id/deactivate', requireRole(['admin']), deactivateUser);
router.post('/admin/users/:id/activate', requireRole(['admin']), reactivateUser);

export default router;
