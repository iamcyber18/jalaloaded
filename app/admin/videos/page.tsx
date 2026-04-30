'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import AdminSidebar from '@/components/AdminSidebar';
import { useAdminSession } from '@/components/useAdminSession';
import Image from 'next/image';

interface VideoItem {
  _id: string;
  title: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  description?: string;
  author: string;
  views: number;
  likes: number;
  category?: string;
  createdAt: string;
}

export default function AdminVideosPage() {
  const { session, loading: sessionLoading } = useAdminSession();

  if (!sessionLoading && session?.role === 'sub-admin') {
    return (
      <div className="jl">
        <AdminSidebar />
        <div className="main">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '32px' }}>🔒</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Access Denied</div>
          </div>
        </div>
      </div>
    );
  }

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    mediaUrl: '',
    thumbnailUrl: '',
    description: '',
    category: 'All',
  });
  const [thumbProgress, setThumbProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);

  const categories = ['All', 'Music Videos', 'Comedy', 'Interviews', 'Sports Highlights'];

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos?limit=50');
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load videos'); }
    setLoading(false);
  };

  const uploadWithProgress = (file: File, fileType: string, onProgress: (p: number) => void): Promise<any> => {
    return new Promise((resolve, reject) => {
      // Validate file size (50MB limit for videos, 10MB for images)
      const maxSize = fileType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        reject(new Error(`File too large. Max size: ${fileType === 'video' ? '50MB' : '10MB'}`));
        return;
      }

      // Validate file type
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'];
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      
      if (fileType === 'video' && !validVideoTypes.includes(file.type)) {
        reject(new Error('Invalid video format. Supported: MP4, WebM, OGG, AVI, MOV'));
        return;
      }
      
      if (fileType === 'image' && !validImageTypes.includes(file.type)) {
        reject(new Error('Invalid image format. Supported: JPEG, PNG, GIF, WebP'));
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', fileType);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      
      // Set timeout (5 minutes for videos, 2 minutes for images)
      xhr.timeout = fileType === 'video' ? 300000 : 120000;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { 
            const response = JSON.parse(xhr.responseText);
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          }
          catch { reject(new Error('Invalid server response')); }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.ontimeout = () => reject(new Error('Upload timeout. Please try with a smaller file.'));
      xhr.onerror = () => reject(new Error('Network error. Please check your connection.'));
      xhr.send(formData);
    });
  };

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingThumb(true);
    setThumbProgress(0);
    
    try {
      const data = await uploadWithProgress(file, 'image', setThumbProgress);
      setForm(f => ({ ...f, thumbnailUrl: data.url }));
      toast.success('Thumbnail uploaded successfully!');
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Thumbnail upload failed';
      toast.error(errorMessage);
    } finally {
      setUploadingThumb(false);
      setThumbProgress(0);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingVideo(true);
    setVideoProgress(0);
    
    try {
      const data = await uploadWithProgress(file, 'video', setVideoProgress);
      
      // Cloudinary can generate thumbnails for videos by changing extension to .jpg
      const autoThumbUrl = data.url.replace(/\.[^/.]+$/, ".jpg");
      
      setForm(f => ({ 
        ...f, 
        mediaUrl: data.url,
        // Only auto-set thumbnail if one isn't already uploaded
        thumbnailUrl: f.thumbnailUrl || autoThumbUrl
      }));
      
      toast.success('Video uploaded successfully!');
    } catch (error) {
      console.error('Video upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Video upload failed';
      toast.error(errorMessage);
    } finally {
      setUploadingVideo(false);
      setVideoProgress(0);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.mediaUrl.trim()) {
      return toast.error('Title and video URL are required');
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        author: session?.role === 'admin' ? 'jalal' : 'co-friend',
      };
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success('Video published!');
        setForm({ title: '', mediaUrl: '', thumbnailUrl: '', description: '', category: 'All' });
        setShowForm(false);
        fetchVideos();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to publish');
      }
    } catch { toast.error('Failed to publish'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Video deleted');
        fetchVideos();
      } else {
        toast.error('Failed to delete');
      }
    } catch { toast.error('Failed to delete'); }
  };

  const S = {
    row: { display: 'flex', gap: '16px', marginBottom: '16px' },
    label: { fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' } as React.CSSProperties,
    input: { width: '100%', padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px', outline: 'none', transition: '0.2s' },
    select: { width: '100%', padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px', outline: 'none' },
    btnGroup: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }
  };

  return (
    <div className="jl">
      <AdminSidebar />
      <div className="main">
        {/* Header */}
        <div className="topbar">
          <div>
            <h1 className="page-title">Videos</h1>
            <div className="admin-subtitle">Manage Jalaloaded TV content</div>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
            background: showForm ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #FF6B00, #ff8533)', color: '#fff'
          }}>
            {showForm ? 'Cancel' : '+ New Video'}
          </button>
        </div>

        {/* Upload Form */}
        {showForm && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
            <div className="admin-video-form-grid">
              
              {/* Left Column - Files */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: '#fff' }}>Media Files</h3>
                
                {/* Thumbnail Upload */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '16px' }}>
                  <div style={S.label}>Custom Thumbnail (Optional)</div>
                  <div className="admin-video-thumb-row">
                    <div 
                      onClick={() => !uploadingThumb && thumbInputRef.current?.click()}
                      style={{ 
                        width: '80px', height: '50px', borderRadius: '8px', 
                        background: form.thumbnailUrl ? `url(${form.thumbnailUrl}) center/cover` : 'rgba(255,255,255,0.05)',
                        border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: uploadingThumb ? 'default' : 'pointer', flexShrink: 0,
                        opacity: uploadingThumb ? 0.6 : 1
                      }}>
                      {uploadingThumb ? (
                        <div style={{ fontSize: '10px', color: '#FF6B00' }}>{thumbProgress}%</div>
                      ) : !form.thumbnailUrl ? (
                        <span style={{ fontSize: '18px', opacity: 0.5 }}>🖼️</span>
                      ) : null}
                    </div>
                    <input ref={thumbInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" hidden onChange={handleThumbUpload} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                        {uploadingThumb 
                          ? `Uploading thumbnail... ${thumbProgress}%` 
                          : form.thumbnailUrl 
                            ? '✅ Custom thumbnail set' 
                            : 'Click thumbnail to upload custom image (Max 10MB). If omitted, one will be auto-generated from the video.'
                        }
                      </div>
                      {uploadingThumb && (
                        <div style={{ marginTop: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', height: '3px' }}>
                          <div style={{ 
                            height: '100%', 
                            background: 'linear-gradient(90deg, #FF6B00, #ff8533)', 
                            width: `${thumbProgress}%`, 
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Video Upload */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={S.label}>Video Source *</div>
                  <div className="admin-video-upload-row">
                    <button 
                      onClick={() => !uploadingVideo && videoInputRef.current?.click()}
                      disabled={uploadingVideo}
                      style={{ 
                        padding: '10px 16px', borderRadius: '8px', background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)',
                        color: '#FF6B00', fontSize: '12px', fontWeight: 600, cursor: uploadingVideo ? 'default' : 'pointer',
                        opacity: uploadingVideo ? 0.6 : 1
                      }}
                    >
                      {uploadingVideo ? `Uploading... ${videoProgress}%` : 'Upload Video File'}
                    </button>
                    <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg,video/avi,video/mov,video/quicktime" hidden onChange={handleVideoUpload} />
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', flex: 1 }}>
                      {uploadingVideo 
                        ? `Uploading video... This may take a few minutes for large files.`
                        : 'Max 50MB. Supported: MP4, WebM, OGG, AVI, MOV'
                      }
                    </div>
                  </div>
                  
                  {uploadingVideo && (
                    <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '4px', 
                        background: 'linear-gradient(90deg, #FF6B00, #ff8533)', 
                        width: `${videoProgress}%`, 
                        transition: 'width 0.3s ease',
                        borderRadius: '4px'
                      }} />
                    </div>
                  )}
                  
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: '12px', marginTop: '12px' }}>— OR PASTE EXTERNAL LINK —</div>
                  <input 
                    style={S.input} 
                    value={form.mediaUrl} 
                    onChange={e => setForm({ ...form, mediaUrl: e.target.value })} 
                    placeholder="e.g. YouTube/Vimeo link or direct .mp4 URL"
                    disabled={uploadingVideo}
                  />
                  {form.mediaUrl && !uploadingVideo && (
                    <div style={{ fontSize: '11px', color: '#4CAF50', marginTop: '6px' }}>✅ Video source attached</div>
                  )}
                </div>
              </div>

              {/* Right Column - Details */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: '#fff' }}>Video Details</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={S.label}>Video Title *</div>
                  <input style={S.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Burna Boy Live Performance" />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={S.label}>Category</div>
                  <select style={S.select} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {categories.map(c => <option key={c} value={c} style={{ background: '#111' }}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <div style={S.label}>Description</div>
                  <textarea 
                    value={form.description} 
                    onChange={e => setForm({ ...form, description: e.target.value })} 
                    placeholder="Brief description about the video..." 
                    style={{ ...S.input, height: '100px', resize: 'vertical' }}
                  />
                </div>

                <div className="admin-video-btn-group">
                  <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSave} disabled={saving || uploadingVideo || uploadingThumb} style={{ padding: '10px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #FF6B00, #ff8533)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: (saving || uploadingVideo || uploadingThumb) ? 0.6 : 1 }}>
                    {saving ? 'Publishing...' : 'Publish Video'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Loading videos...</div>
        ) : videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎥</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>No videos found</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Click "New Video" to start Jalaloaded TV!</div>
          </div>
        ) : (
          <div className="admin-video-grid">
            {videos.map(video => (
              <div key={video._id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ height: '140px', background: video.thumbnailUrl ? `url(${video.thumbnailUrl}) center/cover` : '#111', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                    {video.category && <span style={{ padding: '3px 8px', background: 'rgba(255,107,0,0.8)', color: '#fff', fontSize: '9px', fontWeight: 700, borderRadius: '4px', textTransform: 'uppercase' }}>{video.category}</span>}
                  </div>
                  <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '10px', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px' }}>
                    {new Date(video.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{video.title}</div>
                  <div className="admin-video-card-footer">
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                      <span>👁 {video.views || 0}</span>
                      <span>👍 {video.likes || 0}</span>
                    </div>
                    <button onClick={() => handleDelete(video._id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
