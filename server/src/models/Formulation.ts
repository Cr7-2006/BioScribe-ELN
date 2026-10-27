import mongoose, { Schema, Document } from 'mongoose';
import { FormulationIngredient } from '../types';

export interface IFormulationDocument extends Document {
  id: string;
  code: string;
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

const FormulationIngredientSchema = new Schema(
  {
    id: { type: String, required: true },
    formulationId: { type: String, required: true },
    name: { type: String, required: true },
    casNumber: { type: String, default: '' },
    lotNumber: { type: String, default: '' },
    molecularWeight: { type: Number, default: 0 },
    purityPercentage: { type: Number, default: 100 },
    targetQuantity: { type: Number, required: true },
    unit: {
      type: String,
      enum: ['g', 'mg', 'mL', 'L', 'mM', 'µL'],
      required: true,
    },
    role: {
      type: String,
      enum: ['active_moiety', 'solvent', 'buffer', 'excipient', 'catalyst'],
      required: true,
    },
    hazards: { type: [String], default: [] },
  },
  { _id: false }
);

const FormulationSchema = new Schema<IFormulationDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    targetBatchSize: { type: Number, required: true },
    batchUnit: {
      type: String,
      enum: ['mL', 'L', 'g', 'kg'],
      required: true,
    },
    theoreticalYieldPercentage: { type: Number, default: 100 },
    actualYieldPercentage: { type: Number },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    ingredients: { type: [FormulationIngredientSchema], default: [] },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
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

export const FormulationModel =
  mongoose.models.Formulation || mongoose.model<IFormulationDocument>('Formulation', FormulationSchema);
