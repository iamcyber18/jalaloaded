import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IArtist extends Document {
  name: string;
  slug: string;
  image?: string;
  bio?: string;
  genre?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ArtistSchema = new Schema<IArtist>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, unique: true },
    image: { type: String },
    bio: { type: String },
    genre: { type: String },
  },
  { timestamps: true }
);

const Artist: Model<IArtist> = mongoose.models.Artist || mongoose.model<IArtist>('Artist', ArtistSchema);

export default Artist;
