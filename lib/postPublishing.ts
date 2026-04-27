import Post from '@/models/Post';

let publishedAtBackfillPromise: Promise<void> | null = null;

export async function ensurePublishedAtBackfill() {
  if (publishedAtBackfillPromise) {
    return publishedAtBackfillPromise;
  }

  publishedAtBackfillPromise = Post.collection
    .updateMany(
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
    )
    .then(() => undefined)
    .catch((error) => {
      publishedAtBackfillPromise = null;
      throw error;
    });

  return publishedAtBackfillPromise;
}
