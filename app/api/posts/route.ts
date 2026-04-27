import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { slugify } from '@/lib/utils';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const requestedStatus = searchParams.get('status') || 'published';
    const queryText = searchParams.get('q')?.trim();
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const session = requestedStatus !== 'published' ? await getSession() : null;

    const requiresAdmin = requestedStatus !== 'published';
    if (requiresAdmin && !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const query: {
      status?: 'draft' | 'published';
      category?: string;
      createdByUsername?: string;
      $or?: Array<Record<string, RegExp>>;
    } = {};
    if (requestedStatus === 'draft') {
      query.status = 'draft';
    } else if (requestedStatus !== 'all') {
      query.status = 'published';
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (session?.role === 'sub-admin') {
      query.createdByUsername = session.username;
    }

    if (queryText) {
      const regex = new RegExp(queryText, 'i');
      query.$or = [
        { title: regex },
        { slug: regex },
        { body: regex },
        { introduction: regex },
        { mainContent: regex },
        { conclusion: regex },
        { tags: regex },
      ];
    }

    const publicSort: Record<string, 1 | -1> = { publishedAt: -1, createdAt: -1, _id: -1 };
    const adminSort: Record<string, 1 | -1> = requestedStatus === 'draft' ? { updatedAt: -1, createdAt: -1, _id: -1 } : publicSort;

    const posts = await Post.find(query)
      .sort(adminSort)
      .skip(skip)
      .limit(limit)
      .lean();
      
    const total = await Post.countDocuments(query);

    return NextResponse.json({
      posts: JSON.parse(JSON.stringify(posts)),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalPosts: total
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const nextStatus = body.status === 'draft' ? 'draft' : 'published';
    
    // Auto-generate slug
    const baseSlug = slugify(body.title);
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug uniqueness
    while (await Post.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const postAuthor =
      session.role === 'sub-admin'
        ? (session.displayName || session.username)
        : (body.author || 'jalal');

    const newPost = new Post({
      ...body,
      status: nextStatus,
      slug,
      author: postAuthor,
      publishedAt: nextStatus === 'published' ? new Date() : undefined,
      createdByUsername: session.username,
      createdByRole: session.role,
    });
    await newPost.save();

    // Removed the logic that unfeatures all other posts so multiple posts can be featured

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
