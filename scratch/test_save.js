import mongoose from 'mongoose';
import Post from '../models/Post';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const newPost = new Post({
    title: 'Test publishedAt',
    slug: 'test-published-at-' + Date.now(),
    author: 'bot',
    status: 'published',
    publishedAt: new Date(),
  });
  
  await newPost.save();
  console.log('Saved post:', newPost);
  
  const found = await Post.findById(newPost._id).lean();
  console.log('Found post publishedAt:', found.publishedAt);
  
  process.exit(0);
}

check();
