'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { uploadAdminAsset } from '@/lib/adminUpload';
import { IMediaItem } from '@/models/Post';

interface UploaderProps {
  media: IMediaItem[];
  onChange: (media: IMediaItem[]) => void;
}

type UploadStatus = 'signing' | 'uploading' | 'done' | 'error';

type UploadQueueItem = {
  id: string;
  name: string;
  progress: number;
  status: UploadStatus;
  type: 'photo' | 'video';
};

const MAX_MEDIA_ITEMS = 8;
const MAX_PHOTOS = 5;
const MAX_VIDEOS = 3;

function formatDuration(duration?: number) {
  if (!duration) {
    return null;
  }

  const minutes = Math.floor(duration / 60);
  const seconds = Math.round(duration % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function buildUploadId(file: File, index: number) {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

function CloudArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M7 18a4 4 0 1 1 .4-8A5.5 5.5 0 0 1 18 8.5h.2A3.8 3.8 0 1 1 18 20H7" />
      <path d="M12 10v7" />
      <path d="m9.5 12.5 2.5-2.5 2.5 2.5" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m20 16-4.5-4.5-4 4-2-2L4 19" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <rect x="3.5" y="5" width="13" height="14" rx="2.5" />
      <path d="m16.5 10.5 4-2v7l-4-2" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 13" />
      <path d="M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 0 1-7-7L7 11" />
    </svg>
  );
}

function ReorderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <circle cx="9" cy="8" r="1.2" />
      <circle cx="15" cy="8" r="1.2" />
      <circle cx="9" cy="12" r="1.2" />
      <circle cx="15" cy="12" r="1.2" />
      <circle cx="9" cy="16" r="1.2" />
      <circle cx="15" cy="16" r="1.2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M4 7h16" />
      <path d="M9 7V4.5h6V7" />
      <path d="M7 7.5 8 19a2 2 0 0 0 2 1.8h4A2 2 0 0 0 16 19l1-11.5" />
      <path d="M10 11.5v5" />
      <path d="M14 11.5v5" />
    </svg>
  );
}

export default function PostMediaUploader({ media, onChange }: UploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [ytUrl, setYtUrl] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoCount = media.filter((item) => item.type === 'photo').length;
  const videoCount = media.filter((item) => item.type === 'video').length;
  const remainingSlots = Math.max(0, MAX_MEDIA_ITEMS - media.length);

  const updateQueueItem = (id: string, patch: Partial<UploadQueueItem>) => {
    setUploadQueue((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const validateFiles = (files: File[]) => {
    if (!files.length) {
      return false;
    }

    let newPhotos = 0;
    let newVideos = 0;

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        newPhotos += 1;
      } else if (file.type.startsWith('video/')) {
        newVideos += 1;
      } else {
        toast.error(`${file.name} is not a supported image or video file.`);
        return false;
      }
    }

    if (media.length + files.length > MAX_MEDIA_ITEMS) {
      toast.error(`You can upload up to ${MAX_MEDIA_ITEMS} media items per post.`);
      return false;
    }

    if (photoCount + newPhotos > MAX_PHOTOS) {
      toast.error(`You can upload up to ${MAX_PHOTOS} photos.`);
      return false;
    }

    if (videoCount + newVideos > MAX_VIDEOS) {
      toast.error(`You can upload up to ${MAX_VIDEOS} videos.`);
      return false;
    }

    return true;
  };

  const uploadFiles = async (files: File[]) => {
    if (!validateFiles(files)) {
      return;
    }

    setIsUploading(true);
    const queueItems = files.map((file, index) => ({
      id: buildUploadId(file, index),
      name: file.name,
      progress: 0,
      status: 'signing' as UploadStatus,
      type: file.type.startsWith('image/') ? 'photo' : 'video',
    }));

    setUploadQueue(queueItems);

    const results = await Promise.allSettled(
      files.map(async (file, index) => {
        const queueId = queueItems[index].id;
        const resourceType = file.type.startsWith('image/') ? 'image' : 'video';

        try {
          const uploaded = await uploadAdminAsset(file, resourceType, (progress) => {
            updateQueueItem(queueId, {
              progress: Math.max(progress, 5),
              status: 'uploading',
            });
          });

          updateQueueItem(queueId, { progress: 100, status: 'done' });

          return {
            index,
            item: {
              duration: uploaded.duration,
              order: media.length + index,
              source: 'upload' as const,
              thumbnailUrl: uploaded.thumbnailUrl,
              type: resourceType === 'image' ? 'photo' : 'video',
              url: uploaded.url,
            },
          };
        } catch (error) {
          updateQueueItem(queueId, { status: 'error' });
          throw error;
        }
      })
    );

    const uploadedMedia = results
      .filter(
        (result): result is PromiseFulfilledResult<{ index: number; item: IMediaItem }> =>
          result.status === 'fulfilled'
      )
      .map((result) => result.value)
      .sort((a, b) => a.index - b.index)
      .map((result) => result.item);

    const failedCount = results.filter((result) => result.status === 'rejected').length;

    if (uploadedMedia.length > 0) {
      onChange(
        [...media, ...uploadedMedia].map((item, index) => ({
          ...item,
          order: index,
        }))
      );
      toast.success(
        uploadedMedia.length === 1
          ? 'Media uploaded successfully.'
          : `${uploadedMedia.length} files uploaded successfully.`
      );
    }

    if (failedCount > 0) {
      toast.error(
        failedCount === 1
          ? '1 file failed to upload. Please try again.'
          : `${failedCount} files failed to upload. Please try again.`
      );
    }

    setIsUploading(false);
    window.setTimeout(() => setUploadQueue([]), 1200);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      return;
    }

    await uploadFiles(Array.from(event.target.files));
    event.target.value = '';
  };

  const handleAddYouTube = () => {
    if (!ytUrl.trim()) {
      return;
    }

    if (media.length >= MAX_MEDIA_ITEMS) {
      toast.error(`You can upload up to ${MAX_MEDIA_ITEMS} media items per post.`);
      return;
    }

    if (videoCount >= MAX_VIDEOS) {
      toast.error(`You can upload up to ${MAX_VIDEOS} videos.`);
      return;
    }

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = ytUrl.match(regExp);
    const ytId = match && match[2].length === 11 ? match[2] : null;

    if (!ytId) {
      toast.error('Enter a valid YouTube URL.');
      return;
    }

    onChange([
      ...media,
      {
        order: media.length,
        source: 'youtube',
        thumbnailUrl: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
        type: 'video',
        url: ytUrl,
      },
    ]);
    setYtUrl('');
    toast.success('YouTube video added.');
  };

  const removeItem = (index: number) => {
    const nextMedia = media
      .filter((_, itemIndex) => itemIndex !== index)
      .map((item, itemIndex) => ({ ...item, order: itemIndex }));
    onChange(nextMedia);
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
      return;
    }

    const items = [...media];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    onChange(items.map((item, index) => ({ ...item, order: index })));
  };

  return (
    <section className="overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
      <div className="border-b border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(255,107,0,0.16),transparent_38%)] px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#FF6B00]">
              Photos and Media
            </div>
            <div className="font-syne text-[22px] font-extrabold leading-tight text-white">
              Build a clean visual story for this post
            </div>
            <p className="max-w-2xl text-[12px] leading-6 text-white/60">
              Upload photos and videos directly, then drag the cards below to control the display
              order. The slow upload bottleneck has been replaced with direct Cloudinary transfers.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[290px]">
            <div className="rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/[0.45]">Total</div>
              <div className="mt-1 flex items-end gap-2">
                <span className="font-syne text-[24px] font-bold text-white">{media.length}</span>
                <span className="pb-1 text-[11px] text-white/50">/ {MAX_MEDIA_ITEMS}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/[0.45]">
                <PhotoIcon />
                Photos
              </div>
              <div className="mt-1 flex items-end gap-2">
                <span className="font-syne text-[24px] font-bold text-white">{photoCount}</span>
                <span className="pb-1 text-[11px] text-white/50">/ {MAX_PHOTOS}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/[0.45]">
                <VideoIcon />
                Videos
              </div>
              <div className="mt-1 flex items-end gap-2">
                <span className="font-syne text-[24px] font-bold text-white">{videoCount}</span>
                <span className="pb-1 text-[11px] text-white/50">/ {MAX_VIDEOS}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 md:p-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
          <div
            className={`relative overflow-hidden rounded-[22px] border ${
              isDragActive ? 'border-[#FF6B00] bg-[#FF6B00]/10' : 'border-white/10 bg-black/20'
            } p-5 transition-colors`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
                return;
              }
              setIsDragActive(false);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragActive(true);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragActive(false);
              void uploadFiles(Array.from(event.dataTransfer.files));
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/mp4"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />

            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF6B00]/[0.14] text-[#FF6B00]">
                  <CloudArrowIcon />
                </div>
                <div className="space-y-2">
                  <div className="font-syne text-[18px] font-bold text-white">
                    {isUploading ? 'Uploading directly to Cloudinary...' : 'Drop files here or browse'}
                  </div>
                  <p className="max-w-xl text-[12px] leading-6 text-white/60">
                    Uploads now go straight from the browser to Cloudinary, which removes the slow
                    app-server relay. Add up to {remainingSlots} more item
                    {remainingSlots === 1 ? '' : 's'} in this post.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || remainingSlots === 0}
                  className="rounded-full bg-[#FF6B00] px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#ff7f29] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Choose files'}
                </button>
                <div className="rounded-full border border-white/10 px-4 py-2.5 text-[11px] font-medium text-white/[0.55]">
                  JPG, PNG, WEBP, MP4
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-black/20 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white/70">
                <LinkIcon />
              </div>
              <div className="space-y-1">
                <div className="font-syne text-[18px] font-bold text-white">Embed YouTube</div>
                <p className="text-[12px] leading-6 text-white/60">
                  Paste a YouTube link if you want a hosted video without uploading a local file.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <input
                type="url"
                value={ytUrl}
                onChange={(event) => setYtUrl(event.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full rounded-2xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-[12px] text-white outline-none transition focus:border-[#FF6B00]"
              />
              <button
                type="button"
                onClick={handleAddYouTube}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[12px] font-semibold text-white transition hover:border-[#FF6B00] hover:text-[#FF6B00]"
              >
                Add YouTube video
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-black/20 p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-syne text-[18px] font-bold text-white">Media layout</div>
              <p className="text-[12px] leading-6 text-white/60">
                Drag cards to reorder them. Use the first slot for the strongest visual.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[11px] text-white/[0.55]">
              <ReorderIcon />
              Drag to reorder
            </div>
          </div>

          {uploadQueue.length > 0 && (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {uploadQueue.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-semibold text-white">{item.name}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/[0.45]">
                        {item.type} / {item.status}
                      </div>
                    </div>
                    <div className="text-[12px] font-semibold text-[#FF6B00]">{item.progress}%</div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.status === 'error' ? 'bg-red-500' : 'bg-[#FF6B00]'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {media.length === 0 ? (
            <div className="mt-5 rounded-[22px] border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/[0.55]">
                <PhotoIcon />
              </div>
              <div className="mt-4 font-syne text-[18px] font-bold text-white">No media added yet</div>
              <p className="mx-auto mt-2 max-w-md text-[12px] leading-6 text-white/[0.55]">
                Upload images or videos to create a stronger post preview and a more polished story
                layout.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {media.map((item, index) => (
                <div
                  key={`${item.url}-${index}`}
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggedIndex !== null) {
                      moveItem(draggedIndex, index);
                    }
                    setDraggedIndex(null);
                  }}
                  onDragEnd={() => setDraggedIndex(null)}
                  className={`group overflow-hidden rounded-[20px] border bg-[#0f0f0f] transition ${
                    draggedIndex === index
                      ? 'border-[#FF6B00] shadow-[0_0_0_1px_rgba(255,107,0,0.3)]'
                      : 'border-white/10 hover:border-[#FF6B00]/50'
                  }`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-black">
                    {item.type === 'photo' || item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl || item.url}
                        alt="Uploaded media preview"
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,107,0,0.18),transparent_45%)] text-white/60">
                        <VideoIcon />
                      </div>
                    )}

                    <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-black/[0.65] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                          {item.type}
                        </span>
                        <span className="rounded-full border border-white/[0.15] bg-black/[0.45] px-2.5 py-1 text-[10px] font-medium text-white/70">
                          {item.source}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.65] text-white/70 transition hover:bg-red-500 hover:text-white"
                        aria-label={`Remove media item ${index + 1}`}
                      >
                        <TrashIcon />
                      </button>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3">
                      <div className="rounded-full border border-white/[0.12] bg-black/[0.45] px-3 py-1 text-[10px] font-medium text-white/75">
                        Slot {index + 1}
                      </div>
                      {item.type === 'video' && (
                        <div className="rounded-full bg-black/[0.65] px-3 py-1 text-[10px] font-medium text-white/75">
                          {item.source === 'youtube' ? 'YouTube' : formatDuration(item.duration) || 'Video'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-semibold text-white">
                        {item.source === 'youtube'
                          ? 'YouTube embed'
                          : item.type === 'photo'
                            ? 'Uploaded photo'
                            : 'Uploaded video'}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/40">
                        {item.source === 'upload' ? 'Cloudinary direct upload' : 'External embed'}
                      </div>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50">
                      <ReorderIcon />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
