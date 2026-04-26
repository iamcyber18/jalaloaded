import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMediaItem {
  type: 'photo' | 'video';
  url: string;
  source: 'upload' | 'youtube' | 'external';
  thumbnailUrl?: string;
  caption?: string;
  duration?: number;
  order: number;
}

export interface IPost extends Document {
  title: string;
  slug: string;
  body: string;
  introduction?: string;
  mainContent?: string;
  conclusion?: string;
  author: 'jalal' | 'co-friend';
  category: 'General' | 'Music' | 'Sports' | 'Fashion' | 'Lifestyle' | 'News' | 'Opinion' | 'Events' | 'Politics' | 'Entertainment';
  tags: string[];
  media: IMediaItem[];
  status: 'draft' | 'published';
  views: number;
  likes: number;
  allowComments: boolean;
  featured: boolean;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MediaItemSchema = new Schema<IMediaItem>({
  type: { type: String, enum: ['photo', 'video'], required: true },
  url: { type: String, required: true },
  source: { type: String, enum: ['upload', 'youtube', 'external'], default: 'upload' },
  thumbnailUrl: { type: String },
  caption: { type: String },
  duration: { type: Number },
  order: { type: Number, required: true },
});

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    body: { type: String }, // Legacy compatibility
    introduction: { type: String },
    mainContent: { type: String },
    conclusion: { type: String },
    author: { type: String, required: true },
    category: {
      type: String,
      enum: ['General', 'Music', 'Sports', 'Fashion', 'Lifestyle', 'News', 'Opinion', 'Events', 'Politics', 'Entertainment'],
      default: 'General',
    },
    tags: [{ type: String }],
    media: [MediaItemSchema],
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    allowComments: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    metaDescription: { type: String },
  },
  { timestamps: true }
);

// Prevent re-compilation of models in dev
const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);

export default Post;
