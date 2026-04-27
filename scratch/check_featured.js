import mongoose from 'mongoose';
import Post from '../models/Post';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const posts = await Post.find({ status: 'published' }).sort({ _id: -1 }).limit(10).lean();
  for (const p of posts) {
    console.log('featured=' + p.featured + ', title=' + p.title);
  }
  process.exit(0);
}

check();
