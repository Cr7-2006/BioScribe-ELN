import mongoose, { Schema, Document } from 'mongoose';
import { ObservationCategory } from '../types';

export interface IObservationDocument extends Document {
  id: string;
  experimentId: string;
  timestamp: string;
  recordedById: string;
  recordedByName: string;
  category: ObservationCategory;
  parameter: string;
  value: number | string;
  unit: string;
  status: 'normal' | 'anomaly' | 'flagged';
  notes?: string;
  rawDataJson?: Record<string, any>;
  createdAt: string;
}

const ObservationSchema = new Schema<IObservationDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    experimentId: { type: String, required: true, index: true },
    timestamp: { type: String, default: () => new Date().toISOString() },
    recordedById: { type: String, required: true },
    recordedByName: { type: String, required: true },
    category: {
      type: String,
      enum: ['measurement', 'spectroscopy', 'chromatography', 'environmental', 'visual'],
      required: true,
    },
    parameter: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    unit: { type: String, default: '' },
    status: {
      type: String,
      enum: ['normal', 'anomaly', 'flagged'],
      default: 'normal',
    },
    notes: { type: String, default: '' },
    rawDataJson: { type: Schema.Types.Mixed, default: null },
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

export const ObservationModel =
  mongoose.models.Observation || mongoose.model<IObservationDocument>('Observation', ObservationSchema);
