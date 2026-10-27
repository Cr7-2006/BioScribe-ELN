import mongoose, { Schema, Document } from 'mongoose';
import { ExperimentStatus } from '../types';

export interface IExperimentDocument extends Document {
  id: string;
  projectCode: string;
  experimentNumber: string;
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

const ExperimentSchema = new Schema<IExperimentDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    projectCode: { type: String, required: true, index: true },
    experimentNumber: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    objective: { type: String, default: '' },
    hypothesis: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'in_review', 'approved', 'rejected'],
      default: 'draft',
      index: true,
    },
    currentVersionId: { type: String, required: true },
    currentVersionNumber: { type: String, required: true },
    authorId: { type: String, required: true, index: true },
    authorName: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
    formulationId: { type: String, default: null },
    versionsCount: { type: Number, default: 1 },
    observationsCount: { type: Number, default: 0 },
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

export const ExperimentModel =
  mongoose.models.Experiment || mongoose.model<IExperimentDocument>('Experiment', ExperimentSchema);
