import mongoose, { Schema, Document } from 'mongoose';
import { ProtocolStep } from '../types';

export interface IExperimentVersionDocument extends Document {
  id: string;
  experimentId: string;
  versionNumber: string;
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

const ProtocolStepSchema = new Schema(
  {
    id: { type: String, required: true },
    stepNumber: { type: Number, required: true },
    title: { type: String, required: true },
    instruction: { type: String, default: '' },
    durationMinutes: { type: Number },
    temperatureCelsius: { type: Number },
    criticalQualityAttribute: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const ExperimentVersionSchema = new Schema<IExperimentVersionDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    experimentId: { type: String, required: true, index: true },
    versionNumber: { type: String, required: true },
    title: { type: String, required: true },
    objective: { type: String, default: '' },
    hypothesis: { type: String, default: '' },
    protocolSteps: { type: [ProtocolStepSchema], default: [] },
    conclusion: { type: String, default: '' },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    changeSummary: { type: String, default: '' },
    hashSha256: { type: String, required: true },
    isLocked: { type: Boolean, default: false },
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

export const ExperimentVersionModel =
  mongoose.models.ExperimentVersion ||
  mongoose.model<IExperimentVersionDocument>('ExperimentVersion', ExperimentVersionSchema);
