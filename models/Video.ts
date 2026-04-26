import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVideo extends Document {
  title: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  description?: string;
  author: 'jalal' | 'co-friend';
  views: number;
  likes: number;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new Schema<IVideo>(
  {
    title: { type: String, required: true },
    mediaUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    duration: { type: Number },
    description: { type: String },
    author: { type: String, enum: ['jalal', 'co-friend'] },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    category: { type: String },
  },
  { timestamps: true }
);

const Video: Model<IVideo> = mongoose.models.Video || mongoose.model<IVideo>('Video', VideoSchema);

export default Video;
