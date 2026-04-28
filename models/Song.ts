import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISong extends Document {
  title: string;
  artist: string;
  slug: string;
  genre: 'Afrobeats' | 'Amapiano' | 'Highlife' | 'R&B' | 'Gospel' | 'Hip-hop' | 'Other';
  year: number;
  featured: boolean;
  mediaUrl: string;
  streamUrl?: string;
  downloadUrl?: string;
  coverUrl?: string;
  duration?: number;
  fileSize?: string;
  plays: number;
  downloads: number;
  likes: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SongSchema = new Schema<ISong>(
  {
    title: { type: String, required: true },
    artist: { type: String, required: true },
    slug: { type: String, unique: true },
    genre: {
      type: String,
      enum: ['Afrobeats', 'Amapiano', 'Highlife', 'R&B', 'Gospel', 'Hip-hop', 'Other'],
      default: 'Afrobeats',
    },
    year: { type: Number, default: () => new Date().getFullYear() },
    featured: { type: Boolean, default: false },
    mediaUrl: { type: String, required: true },
    streamUrl: { type: String },
    downloadUrl: { type: String },
    coverUrl: { type: String },
    duration: { type: Number },
    fileSize: { type: String },
    plays: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    description: { type: String },
  },
  { timestamps: true }
);

// Auto-generate slug from title + artist before saving
SongSchema.pre('save', function (next) {
  if (!this.slug || this.isModified('title') || this.isModified('artist')) {
    const base = `${this.artist}-${this.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    this.slug = `${base}-${Date.now().toString(36)}`;
  }
  next();
});

const Song: Model<ISong> = mongoose.models.Song || mongoose.model<ISong>('Song', SongSchema);

export default Song;
