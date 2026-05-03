import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILiveStream extends Document {
  title: string;
  platform: 'youtube' | 'facebook';
  url: string;
  isActive: boolean;
  startTime?: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LiveStreamSchema = new Schema<ILiveStream>(
  {
    title: { type: String, required: true },
    platform: { type: String, enum: ['youtube', 'facebook'], required: true },
    url: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    startTime: { type: Date },
    description: { type: String },
  },
  { timestamps: true }
);

const LiveStream: Model<ILiveStream> = mongoose.models.LiveStream || mongoose.model<ILiveStream>('LiveStream', LiveStreamSchema);

export default LiveStream;
