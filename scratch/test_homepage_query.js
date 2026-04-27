import mongoose from 'mongoose';
import Post from '../models/Post';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const recentPosts = await Post.find({ status: 'published' })
    .sort({ publishedAt: -1, createdAt: -1, _id: -1 })
    .limit(10)
    .lean();
    
  console.log(`Found ${recentPosts.length} recent posts`);
  for (const p of recentPosts) {
    console.log(`- ${p.title} (ID: ${p._id}) - publishedAt: ${p.publishedAt}, createdAt: ${p.createdAt}`);
  }
  
  process.exit(0);
}

check();
