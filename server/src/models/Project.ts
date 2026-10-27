import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectDocument extends Document {
  id: string;
  code: string;
  name: string;
  description: string;
  therapeuticArea: string;
  leadId: string;
  leadName: string;
  createdAt: string;
}

const ProjectSchema = new Schema<IProjectDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    therapeuticArea: { type: String, default: '' },
    leadId: { type: String, required: true },
    leadName: { type: String, required: true },
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

export const ProjectModel = mongoose.models.Project || mongoose.model<IProjectDocument>('Project', ProjectSchema);
