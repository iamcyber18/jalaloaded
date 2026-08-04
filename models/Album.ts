import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAlbum extends Document {
  title: string;
  artist: string;
  slug: string;
  type: 'EP' | 'Album';
  coverUrl?: string;
  year: number;
  genre?: string;
  description?: string;
  trackCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AlbumSchema = new Schema<IAlbum>(
  {
    title: { type: String, required: true },
    artist: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    type: { type: String, enum: ['EP', 'Album'], default: 'Album' },
    coverUrl: { type: String },
    year: { type: Number, default: () => new Date().getFullYear() },
    genre: { type: String, default: 'Afrobeats' },
    description: { type: String },
    trackCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Album: Model<IAlbum> = mongoose.models.Album || mongoose.model<IAlbum>('Album', AlbumSchema);

export default Album;
