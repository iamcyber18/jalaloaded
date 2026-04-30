import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUpcomingMusic extends Document {
  title: string;
  artist: string; // The artist's name
  coverUrl?: string; // Optional cover art
  releaseDate: Date; // The exact date/time it drops
  description?: string; // Hype text
  snippetUrl?: string; // Optional audio teaser
  createdAt: Date;
  updatedAt: Date;
}

const UpcomingMusicSchema = new Schema<IUpcomingMusic>(
  {
    title: { type: String, required: true },
    artist: { type: String, required: true },
    coverUrl: { type: String },
    releaseDate: { type: Date, required: true },
    description: { type: String },
    snippetUrl: { type: String },
  },
  { timestamps: true }
);

const UpcomingMusic: Model<IUpcomingMusic> = mongoose.models.UpcomingMusic || mongoose.model<IUpcomingMusic>('UpcomingMusic', UpcomingMusicSchema);

export default UpcomingMusic;
