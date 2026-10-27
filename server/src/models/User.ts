import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, UserStatus } from '../types';

export interface IUserDocument extends Document {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  justification?: string;
  approvedAt?: string;
  approvedBy?: string;
  passwordHash?: string;
  createdAt: string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    username: { type: String, index: true },
    role: {
      type: String,
      enum: ['researcher', 'reviewer', 'qa_manager', 'admin'],
      required: true,
      default: 'researcher',
    },
    department: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'pending_approval', 'rejected', 'deactivated'],
      default: 'active',
      index: true,
    },
    justification: { type: String },
    approvedAt: { type: String },
    approvedBy: { type: String },
    passwordHash: { type: String },
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

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
