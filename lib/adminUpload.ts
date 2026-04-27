export type CloudinaryUploadKind = 'image' | 'video';

type UploadSignature = {
  apiKey: string;
  cloudName: string;
  folder: string;
  resourceType: CloudinaryUploadKind;
  signature: string;
  timestamp: number;
};

type CloudinaryUploadResponse = {
  duration?: number;
  public_id: string;
  resource_type: CloudinaryUploadKind;
  secure_url: string;
};

export type DirectUploadResult = {
  duration?: number;
  publicId: string;
  thumbnailUrl?: string;
  type: CloudinaryUploadKind;
  url: string;
};

function buildVideoThumbnailUrl(cloudName: string, publicId: string) {
  return `https://res.cloudinary.com/${cloudName}/video/upload/so_0/${publicId}.jpg`;
}

async function getUploadSignature(resourceType: CloudinaryUploadKind) {
  const res = await fetch('/api/upload/signature', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resourceType }),
  });

  const data = (await res.json().catch(() => null)) as UploadSignature | { error?: string } | null;

  if (!res.ok || !data || !('signature' in data)) {
    throw new Error((data && 'error' in data && data.error) || 'Unable to prepare upload');
  }

  return data;
}

export async function uploadAdminAsset(
  file: File,
  resourceType: CloudinaryUploadKind,
  onProgress?: (progress: number) => void
): Promise<DirectUploadResult> {
  const signature = await getUploadSignature(resourceType);
  const formData = new FormData();

  formData.append('file', file);
  formData.append('api_key', signature.apiKey);
  formData.append('timestamp', String(signature.timestamp));
  formData.append('signature', signature.signature);
  formData.append('folder', signature.folder);

  return new Promise<DirectUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`
    );

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) {
        return;
      }

      const nextProgress = Math.min(100, Math.round((event.loaded / event.total) * 100));
      onProgress?.(nextProgress);
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed. Please try again.'));
    });

    xhr.addEventListener('load', () => {
      const response = (JSON.parse(xhr.responseText || '{}') || {}) as
        | CloudinaryUploadResponse
        | { error?: { message?: string } };

      if (xhr.status < 200 || xhr.status >= 300 || !('secure_url' in response)) {
        reject(
          new Error(
            ('error' in response && response.error?.message) || 'Upload failed. Please try again.'
          )
        );
        return;
      }

      resolve({
        duration: response.duration,
        publicId: response.public_id,
        thumbnailUrl:
          resourceType === 'video'
            ? buildVideoThumbnailUrl(signature.cloudName, response.public_id)
            : response.secure_url,
        type: response.resource_type,
        url: response.secure_url,
      });
    });

    xhr.send(formData);
  });
}
