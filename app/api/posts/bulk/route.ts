import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { action, ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No post IDs provided' }, { status: 400 });
    }

    // Sub-admin ownership restriction check
    const filter: any = { _id: { $in: ids } };
    if (session.role === 'sub-admin') {
      filter.createdByUsername = session.username;
    }

    if (action === 'publish') {
      const now = new Date();
      await Post.updateMany(filter, { 
        $set: { 
          status: 'published', 
          publishedAt: now 
        } 
      });

      // Fetch updated slugs and notify search engine indexers
      const publishedPosts = await Post.find(filter).select('slug').lean();
      const urls = publishedPosts.map((p: any) => `/blog/${p.slug}`);
      import('@/lib/searchIndexPing')
        .then(({ notifySearchEngines }) => notifySearchEngines(urls))
        .catch(() => {});

      return NextResponse.json({ success: true, message: `Published ${ids.length} posts` });
    }


    if (action === 'draft') {
      await Post.updateMany(filter, { 
        $set: { status: 'draft' } 
      });
      return NextResponse.json({ success: true, message: `Set ${ids.length} posts to draft` });
    }

    if (action === 'delete') {
      const result = await Post.deleteMany(filter);
      return NextResponse.json({ success: true, message: `Deleted ${result.deletedCount} posts` });
    }

    return NextResponse.json({ error: 'Invalid bulk action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
