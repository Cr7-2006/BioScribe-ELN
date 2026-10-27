import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

export interface IAuditLogDocument extends Document {
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

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    timestamp: { type: String, default: () => new Date().toISOString(), index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userRole: {
      type: String,
      enum: ['researcher', 'reviewer', 'qa_manager', 'admin'],
      required: true,
    },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'VERSION_COMMIT', 'E_SIGNATURE', 'EXPORT', 'RESTORE'],
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['experiment', 'observation', 'formulation', 'approval', 'auth'],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    details: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: null },
    checksum: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const AuditLogModel =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
