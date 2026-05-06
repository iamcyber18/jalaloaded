import { MetadataRoute } from 'next';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import Song from '@/models/Song';
import Artist from '@/models/Artist';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await dbConnect();

  const baseUrl = 'https://www.jalaloaded.com';

  // 1. Static Routes
  const staticRoutes = [
    '',
    '/blog',
    '/music',
    '/videos',
    '/live',
    '/about',
    '/contact',
    '/privacy',
    '/upcoming',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Fetch all Blog Posts
  const posts = await Post.find({ status: 'published' }).select('slug updatedAt').lean();
  const postRoutes = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 3. Fetch all Songs
  const songs = await Song.find().select('slug updatedAt').lean();
  const songRoutes = songs.map((song) => ({
    url: `${baseUrl}/music/${song.slug}`,
    lastModified: song.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // 4. Fetch all Artists
  const artists = await Artist.find().select('slug updatedAt').lean();
  const artistRoutes = artists.map((artist) => ({
    url: `${baseUrl}/music/artist/${artist.slug}`,
    lastModified: artist.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...postRoutes, ...songRoutes, ...artistRoutes];
}
