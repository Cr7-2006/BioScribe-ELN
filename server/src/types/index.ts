export type UserRole = 'researcher' | 'reviewer' | 'qa_manager' | 'admin';
export type UserStatus = 'active' | 'pending_approval' | 'rejected' | 'deactivated';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  department: string;
  status?: UserStatus;
  justification?: string;
  approvedAt?: string;
  approvedBy?: string;
  passwordHash?: string;
  createdAt: string;
}

export type ExperimentStatus = 'draft' | 'in_review' | 'approved' | 'rejected';

export interface ProtocolStep {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  durationMinutes?: number;
  temperatureCelsius?: number;
  criticalQualityAttribute?: boolean;
  notes?: string;
  completed?: boolean;
}

export interface ExperimentVersion {
  id: string;
  experimentId: string;
  versionNumber: string; // e.g., '1.0', '1.1', '2.0'
  title: string;
  objective: string;
  hypothesis: string;
  protocolSteps: ProtocolStep[];
  conclusion?: string;
  authorId: string;
  authorName: string;
  changeSummary: string;
  hashSha256: string;
  isLocked: boolean;
  createdAt: string;
}

export interface Experiment {
  id: string;
  projectCode: string;
  experimentNumber: string; // e.g. 'EXP-2026-001'
  title: string;
  objective: string;
  hypothesis: string;
  status: ExperimentStatus;
  currentVersionId: string;
  currentVersionNumber: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  formulationId?: string;
  versionsCount?: number;
  observationsCount?: number;
}

export type ObservationCategory = 'measurement' | 'spectroscopy' | 'chromatography' | 'environmental' | 'visual';

export interface Observation {
  id: string;
  experimentId: string;
  timestamp: string;
  recordedById: string;
  recordedByName: string;
  category: ObservationCategory;
  parameter: string; // e.g. 'pH', 'Optical Density (OD600)', 'Temperature', 'Peak Area'
  value: number | string;
  unit: string;
  status: 'normal' | 'anomaly' | 'flagged';
  notes?: string;
  rawDataJson?: Record<string, any>;
  createdAt: string;
}

export interface FormulationIngredient {
  id: string;
  formulationId: string;
  name: string;
  casNumber: string;
  lotNumber: string;
  molecularWeight: number; // g/mol
  purityPercentage: number;
  targetQuantity: number;
  unit: 'g' | 'mg' | 'mL' | 'L' | 'mM' | 'µL';
  role: 'active_moiety' | 'solvent' | 'buffer' | 'excipient' | 'catalyst';
  hazards: string[]; // e.g. ['GHS07 Irritant', 'GHS02 Flammable']
}

export interface Formulation {
  id: string;
  code: string; // e.g. 'FORM-8902'
  name: string;
  description: string;
  targetBatchSize: number;
  batchUnit: 'mL' | 'L' | 'g' | 'kg';
  theoreticalYieldPercentage: number;
  actualYieldPercentage?: number;
  authorId: string;
  authorName: string;
  ingredients: FormulationIngredient[];
  createdAt: string;
  updatedAt: string;
}

export type ApprovalRole = 'author_submission' | 'peer_review' | 'qa_compliance';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Approval {
  id: string;
  experimentId: string;
  experimentTitle: string;
  experimentNumber: string;
  versionId: string;
  versionNumber: string;
  requesterId: string;
  requesterName: string;
  reviewerId?: string;
  reviewerName?: string;
  role: ApprovalRole;
  status: ApprovalStatus;
  signatureReason: string; // e.g., "I approve this data for formal laboratory release"
  signatureDigest?: string; // Cryptographic hash
  comments?: string;
  signedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VERSION_COMMIT' | 'E_SIGNATURE' | 'EXPORT' | 'RESTORE';
  entityType: 'experiment' | 'observation' | 'formulation' | 'approval' | 'auth';
  entityId: string;
  details: string;
  metadata?: Record<string, any>;
  checksum: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  therapeuticArea: string;
  leadId: string;
  leadName: string;
  createdAt: string;
}
