import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extract Cloudinary public ID and resource type from a Cloudinary URL
 */
export function extractPublicId(url: string): { publicId: string; resourceType: 'image' | 'video' | 'raw' } | null {
  try {
    const parsedUrl = new URL(url);
    const pathname = decodeURIComponent(parsedUrl.pathname);
    const segments = pathname.split('/').filter(Boolean);

    const resourceType = segments[1] === 'video' || segments[1] === 'raw' ? segments[1] : 'image';
    const uploadIndex = segments.indexOf('upload');

    if (uploadIndex === -1) return null;

    let publicIdParts = segments.slice(uploadIndex + 1);

    if (publicIdParts.length === 0) return null;

    if (publicIdParts[0].startsWith('v') && /^v\d+$/i.test(publicIdParts[0])) {
      publicIdParts = publicIdParts.slice(1);
    }

    if (publicIdParts.length === 0) return null;

    const publicId = publicIdParts.join('/').replace(/\.[^.]+$/, '');

    return publicId ? { publicId, resourceType } : null;
  } catch {
    return null;
  }
}

/**
 * Delete a single file from Cloudinary
 */
export async function deleteCloudinaryFile(url: string): Promise<boolean> {
  try {
    const asset = extractPublicId(url);
    if (!asset) return false;

    const result = await cloudinary.uploader.destroy(asset.publicId, {
      resource_type: asset.resourceType,
    });
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
