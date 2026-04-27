import mongoose from 'mongoose';
import Post from '../models/Post';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const posts = await Post.find().sort({ _id: -1 }).limit(5).lean();
  console.log('Latest 5 posts:');
  for (const p of posts) {
    console.log(`- ID: ${p._id}, Title: ${p.title}, Status: ${p.status}, PublishedAt: ${p.publishedAt}, CreatedAt: ${p.createdAt}, Author: ${p.author}, CreatedBy: ${p.createdByUsername}`);
  }
  process.exit(0);
}

check();
