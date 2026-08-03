import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://jalaloaded.vercel.app';

  // 1. Static Routes (always available)
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/blog',
    '/music',
    '/videos',
    '/live',
    '/contact',
    '/privacy',
    '/upcoming',
  ].map((route) => ({

    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  try {
    const dbConnect = (await import('@/lib/mongodb')).default;
    await dbConnect();

    // 2. Fetch all Blog Posts
    const Post = (await import('@/models/Post')).default;
    const posts = await Post.find({ status: 'published' }).select('slug updatedAt').lean();
    const postRoutes: MetadataRoute.Sitemap = posts.map((post: any) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // 3. Fetch all Songs
    const Song = (await import('@/models/Song')).default;
    const songs = await Song.find().select('slug updatedAt').lean();
    const songRoutes: MetadataRoute.Sitemap = songs.map((song: any) => ({
      url: `${baseUrl}/music/${song.slug}`,
      lastModified: song.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // 4. Fetch all Artists
    const Artist = (await import('@/models/Artist')).default;
    const artists = await Artist.find().select('slug updatedAt').lean();
    const artistRoutes: MetadataRoute.Sitemap = artists.map((artist: any) => ({
      url: `${baseUrl}/music/artist/${artist.slug}`,
      lastModified: artist.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));

    return [...staticRoutes, ...postRoutes, ...songRoutes, ...artistRoutes];
  } catch (error) {
    console.error('Sitemap DB error:', error);
    // Return at least the static routes if DB fails
    return staticRoutes;
  }
}
