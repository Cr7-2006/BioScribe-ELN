import mongoose, { Schema, Document } from 'mongoose';
import { ApprovalRole, ApprovalStatus } from '../types';

export interface IApprovalDocument extends Document {
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
  signatureReason: string;
  signatureDigest?: string;
  comments?: string;
  signedAt?: string;
  createdAt: string;
}

const ApprovalSchema = new Schema<IApprovalDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    experimentId: { type: String, required: true, index: true },
    experimentTitle: { type: String, required: true },
    experimentNumber: { type: String, required: true },
    versionId: { type: String, required: true },
    versionNumber: { type: String, required: true },
    requesterId: { type: String, required: true, index: true },
    requesterName: { type: String, required: true },
    reviewerId: { type: String, index: true },
    reviewerName: { type: String },
    role: {
      type: String,
      enum: ['author_submission', 'peer_review', 'qa_compliance'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    signatureReason: { type: String, required: true },
    signatureDigest: { type: String },
    comments: { type: String, default: '' },
    signedAt: { type: String },
    createdAt: { type: String, default: () => new Date().toISOString() },
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

export const ApprovalModel =
  mongoose.models.Approval || mongoose.model<IApprovalDocument>('Approval', ApprovalSchema);
