import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAdminUser extends Document {
  username: string;
  displayName: string;
  passwordHash: string;
  role: 'admin' | 'sub-admin';
  profileImageUrl?: string;
  active: boolean;
  createdByUsername: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'sub-admin'], default: 'sub-admin' },
    profileImageUrl: { type: String },
    active: { type: Boolean, default: true },
    createdByUsername: { type: String, required: true, trim: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

const AdminUser: Model<IAdminUser> =
  mongoose.models.AdminUser || mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);

export default AdminUser;
