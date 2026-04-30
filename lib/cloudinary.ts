import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extract Cloudinary public ID from a Cloudinary URL
 */
export function extractPublicId(url: string): string | null {
  try {
    // Match Cloudinary URL patterns
    const match = url.match(/\/(?:v\d+\/)?([^/.]+)(?:\.[^.]+)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Delete a single file from Cloudinary
 */
export async function deleteCloudinaryFile(url: string): Promise<boolean> {
  try {
    const publicId = extractPublicId(url);
    if (!publicId) return false;

    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Failed to delete Cloudinary file:', error);
    return false;
  }
}

/**
 * Delete multiple files from Cloudinary
 */
export async function deleteCloudinaryFiles(urls: string[]): Promise<{ success: number; failed: number }> {
  const results = await Promise.allSettled(
    urls.map(url => deleteCloudinaryFile(url))
  );

  const success = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failed = results.length - success;

  return { success, failed };
}

export default cloudinary;
