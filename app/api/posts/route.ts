import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { slugify } from '@/lib/utils';
import { isAdminAuthenticated } from '@/lib/auth';

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

    const requiresAdmin = requestedStatus !== 'published';
    if (requiresAdmin && !(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const query: any = {};
    if (requestedStatus === 'draft') {
      query.status = 'draft';
    } else if (requestedStatus !== 'all') {
      query.status = 'published';
    }

    if (category && category !== 'All') {
      query.category = category;
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

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    
    // Auto-generate slug
    const baseSlug = slugify(body.title);
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug uniqueness
    while (await Post.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const newPost = new Post({ ...body, slug });
    await newPost.save();

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
