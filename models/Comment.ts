import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IComment extends Document {
  postId: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  body: string;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment' }, // null for top-level comments
    name: { type: String, required: true },
    email: { type: String },
    body: { type: String, required: true },
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Comment: Model<IComment> = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
