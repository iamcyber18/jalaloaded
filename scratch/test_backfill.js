import mongoose from 'mongoose';
import Post from '../models/Post';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const res = await Post.collection.updateMany(
    {
      status: 'published',
      $or: [{ publishedAt: { $exists: false } }, { publishedAt: null }],
    },
    [
      {
        $set: {
          publishedAt: {
            $ifNull: ['$updatedAt', '$createdAt'],
          },
        },
      },
    ]
  );
  
  console.log('Update result:', res);
  process.exit(0);
}

check();
