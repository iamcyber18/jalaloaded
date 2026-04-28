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
type UploadQueueItem = { id: string; name: string; progress: number; status: UploadStatus; type: 'photo' | 'video'; };

const MAX_MEDIA_ITEMS = 8;
const MAX_PHOTOS = 5;
const MAX_VIDEOS = 3;

function formatDuration(duration?: number) {
  if (!duration) return null;
  const minutes = Math.floor(duration / 60);
  const seconds = Math.round(duration % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function buildUploadId(file: File, index: number) {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

// Inline style constants
const S = {
  section: { background: '#111', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' } as React.CSSProperties,
  header: { padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(135deg, rgba(255,107,0,0.08), transparent 50%)' } as React.CSSProperties,
  label: { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '2px', color: '#FF6B00', marginBottom: '6px' },
  heading: { fontFamily: '"Syne", sans-serif', fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '6px' },
  desc: { fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', maxWidth: '500px' },
  statsRow: { display: 'flex', gap: '10px', marginTop: '16px' } as React.CSSProperties,
  statBox: { flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px', textAlign: 'center' as const },
  statNum: { fontFamily: '"Bebas Neue", sans-serif', fontSize: '28px', color: '#fff', lineHeight: 1 },
  statLabel: { fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' },
  statMax: { fontSize: '10px', color: 'rgba(255,255,255,0.25)' },
  body: { padding: '24px', display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  dropzone: (active: boolean) => ({
    border: `2px dashed ${active ? '#FF6B00' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '14px',
    padding: '28px 24px',
    background: active ? 'rgba(255,107,0,0.06)' : 'rgba(0,0,0,0.2)',
    transition: 'all 0.2s',
    textAlign: 'center' as const,
    cursor: 'pointer',
  }),
  uploadBtn: { display: 'inline-block', padding: '10px 24px', borderRadius: '8px', background: '#FF6B00', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', marginTop: '12px' },
  ytSection: { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' } as React.CSSProperties,
  ytInput: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0a', color: '#fff', fontSize: '12px', fontFamily: '"DM Sans", sans-serif', outline: 'none', marginTop: '12px', boxSizing: 'border-box' as const },
  ytBtn: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans", sans-serif', marginTop: '8px' },
  mediaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginTop: '16px' } as React.CSSProperties,
  card: (dragging: boolean) => ({
    borderRadius: '14px',
    border: `1px solid ${dragging ? '#FF6B00' : 'rgba(255,255,255,0.08)'}`,
    background: '#0f0f0f',
    overflow: 'hidden',
    cursor: 'grab',
    transition: 'border-color 0.2s',
  }),
  cardThumb: { position: 'relative' as const, width: '100%', aspectRatio: '16/10', background: '#000', overflow: 'hidden' },
  cardBadge: { position: 'absolute' as const, top: '8px', left: '8px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.6)', fontSize: '9px', fontWeight: 700, color: '#fff', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  cardDelete: { position: 'absolute' as const, top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' },
  cardInfo: { padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as React.CSSProperties,
  cardTitle: { fontSize: '11px', fontWeight: 600, color: '#fff' },
  cardMeta: { fontSize: '9px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginTop: '2px' },
  slotBadge: { position: 'absolute' as const, bottom: '8px', left: '8px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', fontSize: '9px', color: 'rgba(255,255,255,0.7)' },
  progressBar: { height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: '8px' } as React.CSSProperties,
  progressFill: (pct: number, error: boolean) => ({ height: '100%', borderRadius: '2px', background: error ? '#ff4444' : '#FF6B00', width: `${pct}%`, transition: 'width 0.3s' }),
  emptyState: { textAlign: 'center' as const, padding: '40px 20px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '14px', background: 'rgba(0,0,0,0.15)' },
};

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
    setUploadQueue((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const validateFiles = (files: File[]) => {
    if (!files.length) return false;
    let newPhotos = 0, newVideos = 0;
    for (const file of files) {
      if (file.type.startsWith('image/')) newPhotos += 1;
      else if (file.type.startsWith('video/')) newVideos += 1;
      else { toast.error(`${file.name} is not a supported file.`); return false; }
    }
    if (media.length + files.length > MAX_MEDIA_ITEMS) { toast.error(`Max ${MAX_MEDIA_ITEMS} media items.`); return false; }
    if (photoCount + newPhotos > MAX_PHOTOS) { toast.error(`Max ${MAX_PHOTOS} photos.`); return false; }
    if (videoCount + newVideos > MAX_VIDEOS) { toast.error(`Max ${MAX_VIDEOS} videos.`); return false; }
    return true;
  };

  const uploadFiles = async (files: File[]) => {
    if (!validateFiles(files)) return;
    setIsUploading(true);
    const queueItems = files.map((file, index) => ({
      id: buildUploadId(file, index), name: file.name, progress: 0,
      status: 'signing' as UploadStatus,
      type: (file.type.startsWith('image/') ? 'photo' : 'video') as 'photo' | 'video',
    }));
    setUploadQueue(queueItems);

    const results = await Promise.allSettled(
      files.map(async (file, index) => {
        const queueId = queueItems[index].id;
        const resourceType = file.type.startsWith('image/') ? 'image' : 'video';
        try {
          const uploaded = await uploadAdminAsset(file, resourceType, (progress) => {
            updateQueueItem(queueId, { progress: Math.max(progress, 5), status: 'uploading' });
          });
          updateQueueItem(queueId, { progress: 100, status: 'done' });
          return { index, item: { duration: uploaded.duration, order: media.length + index, source: 'upload' as const, thumbnailUrl: uploaded.thumbnailUrl, type: resourceType === 'image' ? 'photo' : 'video', url: uploaded.url } };
        } catch (error) { updateQueueItem(queueId, { status: 'error' }); throw error; }
      })
    );

    const uploadedMedia = results.filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled').map((r) => r.value).sort((a, b) => a.index - b.index).map((r) => r.item);
    const failedCount = results.filter((r) => r.status === 'rejected').length;
    if (uploadedMedia.length > 0) {
      onChange([...media, ...uploadedMedia].map((item, index) => ({ ...item, order: index })));
      toast.success(uploadedMedia.length === 1 ? 'Media uploaded!' : `${uploadedMedia.length} files uploaded!`);
    }
    if (failedCount > 0) toast.error(`${failedCount} file(s) failed to upload.`);
    setIsUploading(false);
    window.setTimeout(() => setUploadQueue([]), 1200);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    await uploadFiles(Array.from(event.target.files));
    event.target.value = '';
  };

  const handleAddYouTube = () => {
    if (!ytUrl.trim()) return;
    if (media.length >= MAX_MEDIA_ITEMS) { toast.error(`Max ${MAX_MEDIA_ITEMS} media items.`); return; }
    if (videoCount >= MAX_VIDEOS) { toast.error(`Max ${MAX_VIDEOS} videos.`); return; }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = ytUrl.match(regExp);
    const ytId = match && match[2].length === 11 ? match[2] : null;
    if (!ytId) { toast.error('Enter a valid YouTube URL.'); return; }
    onChange([...media, { order: media.length, source: 'youtube', thumbnailUrl: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`, type: 'video', url: ytUrl }]);
    setYtUrl('');
    toast.success('YouTube video added.');
  };

  const removeItem = (index: number) => {
    onChange(media.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i })));
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const items = [...media];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    onChange(items.map((item, index) => ({ ...item, order: index })));
  };

  return (
    <section style={S.section}>
      {/* HEADER */}
      <div style={S.header}>
        <div style={S.label}>Photos & Media</div>
        <div style={S.heading}>Build a visual story for this post</div>
        <div style={S.desc}>Upload photos and videos directly, or embed a YouTube link. Drag cards below to reorder.</div>
        <div style={S.statsRow}>
          <div style={S.statBox}>
            <div style={S.statNum}>{media.length}</div>
            <div style={S.statLabel}>Total <span style={S.statMax}>/ {MAX_MEDIA_ITEMS}</span></div>
          </div>
          <div style={S.statBox}>
            <div style={S.statNum}>{photoCount}</div>
            <div style={S.statLabel}>Photos <span style={S.statMax}>/ {MAX_PHOTOS}</span></div>
          </div>
          <div style={S.statBox}>
            <div style={S.statNum}>{videoCount}</div>
            <div style={S.statLabel}>Videos <span style={S.statMax}>/ {MAX_VIDEOS}</span></div>
          </div>
        </div>
      </div>

      <div style={S.body}>
        {/* UPLOAD DROPZONE */}
        <div
          style={S.dropzone(isDragActive)}
          onDragEnter={(e) => { e.preventDefault(); setIsDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); if (e.currentTarget.contains(e.relatedTarget as Node | null)) return; setIsDragActive(false); }}
          onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
          onDrop={(e) => { e.preventDefault(); setIsDragActive(false); void uploadFiles(Array.from(e.dataTransfer.files)); }}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/mp4" onChange={handleFileUpload} disabled={isUploading} style={{ display: 'none' }} />
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>☁️</div>
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '16px', fontWeight: 700, color: '#fff' }}>
            {isUploading ? 'Uploading to Cloudinary...' : 'Drop files here or click to browse'}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
            JPG, PNG, WEBP, MP4 — {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
          </div>
          {!isUploading && <button type="button" style={S.uploadBtn} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Choose Files</button>}
        </div>

        {/* YOUTUBE EMBED */}
        <div style={S.ytSection}>
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '15px', fontWeight: 700, color: '#fff' }}>🔗 Embed YouTube Video</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Paste a YouTube link to embed without uploading a local file.</div>
          <input type="url" value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." style={S.ytInput} />
          <button type="button" onClick={handleAddYouTube} style={S.ytBtn}>Add YouTube Video</button>
        </div>

        {/* UPLOAD PROGRESS */}
        {uploadQueue.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {uploadQueue.map((item) => (
              <div key={item.id} style={{ background: '#0a0a0a', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{item.type} / {item.status}</div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#FF6B00', flexShrink: 0, marginLeft: '8px' }}>{item.progress}%</div>
                </div>
                <div style={S.progressBar}><div style={S.progressFill(item.progress, item.status === 'error')} /></div>
              </div>
            ))}
          </div>
        )}

        {/* MEDIA GRID */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '15px', fontWeight: 700, color: '#fff' }}>Media Layout</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Drag cards to reorder. First slot is the featured image.</div>
            </div>
          </div>

          {media.length === 0 ? (
            <div style={S.emptyState}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🖼️</div>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '16px', fontWeight: 700, color: '#fff' }}>No media added yet</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px', maxWidth: '300px', margin: '6px auto 0' }}>Upload images or videos to create a stronger post preview.</div>
            </div>
          ) : (
            <div style={S.mediaGrid}>
              {media.map((item, index) => (
                <div
                  key={`${item.url}-${index}`}
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (draggedIndex !== null) moveItem(draggedIndex, index); setDraggedIndex(null); }}
                  onDragEnd={() => setDraggedIndex(null)}
                  style={S.card(draggedIndex === index)}
                >
                  <div style={S.cardThumb}>
                    {item.type === 'photo' || item.thumbnailUrl ? (
                      <Image src={item.thumbnailUrl || item.url} alt="Media preview" fill sizes="250px" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,107,0,0.15), transparent 50%)', color: 'rgba(255,255,255,0.5)', fontSize: '24px' }}>🎬</div>
                    )}
                    <div style={S.cardBadge}>{item.type}</div>
                    <button type="button" onClick={() => removeItem(index)} style={S.cardDelete} title="Remove">✕</button>
                    <div style={S.slotBadge}>Slot {index + 1}</div>
                    {item.type === 'video' && (
                      <div style={{ position: 'absolute', bottom: '8px', right: '8px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', fontSize: '9px', color: 'rgba(255,255,255,0.7)' }}>
                        {item.source === 'youtube' ? 'YouTube' : formatDuration(item.duration) || 'Video'}
                      </div>
                    )}
                  </div>
                  <div style={S.cardInfo}>
                    <div>
                      <div style={S.cardTitle}>{item.source === 'youtube' ? 'YouTube embed' : item.type === 'photo' ? 'Uploaded photo' : 'Uploaded video'}</div>
                      <div style={S.cardMeta}>{item.source === 'upload' ? 'Cloudinary' : 'External'}</div>
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>⠿</div>
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
