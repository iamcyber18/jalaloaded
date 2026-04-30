'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import AdminSidebar from '@/components/AdminSidebar';
import { useAdminSession } from '@/components/useAdminSession';

interface UpcomingMusic {
  _id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  releaseDate: string;
  description?: string;
  snippetUrl?: string;
}

export default function AdminUpcomingPage() {
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

  const [items, setItems] = useState<UpcomingMusic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  
  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    artist: '',
    coverUrl: '',
    snippetUrl: '',
    releaseDate: '',
    description: '',
  });

  const [coverProgress, setCoverProgress] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);

  // For artist dropdown if we want to use existing artists
  const [artistsList, setArtistsList] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    fetchItems();
    fetchArtists();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/upcoming-music');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { toast.error('Failed to load upcoming music'); }
    setLoading(false);
  };

  const fetchArtists = async () => {
    try {
      const res = await fetch('/api/artists');
      const data = await res.json();
      setArtistsList(Array.isArray(data) ? data : []);
    } catch {}
  };

  const uploadWithProgress = (file: File, fileType: string, onProgress: (p: number) => void): Promise<any> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', fileType);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { reject(new Error('Invalid response')); }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(formData);
    });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setCoverProgress(0);
    try {
      const data = await uploadWithProgress(file, 'image', setCoverProgress);
      setForm(f => ({ ...f, coverUrl: data.url }));
      toast.success('Cover uploaded!');
    } catch { toast.error('Cover upload failed'); }
    setUploadingCover(false);
    setCoverProgress(0);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    setAudioProgress(0);
    try {
      const data = await uploadWithProgress(file, 'video', setAudioProgress);
      setForm(f => ({ ...f, snippetUrl: data.url }));
      toast.success('Snippet uploaded!');
    } catch { toast.error('Snippet upload failed'); }
    setUploadingAudio(false);
    setAudioProgress(0);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.artist.trim() || !form.releaseDate) {
      return toast.error('Title, Artist, and Release Date are required');
    }
    setSaving(true);
    try {
      const res = await fetch('/api/upcoming-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          releaseDate: new Date(form.releaseDate).toISOString()
        })
      });
      if (res.ok) {
        toast.success('Upcoming drop scheduled!');
        setForm({ title: '', artist: '', coverUrl: '', snippetUrl: '', releaseDate: '', description: '' });
        setShowForm(false);
        fetchItems();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to schedule drop');
      }
    } catch { toast.error('Failed to schedule drop'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this upcoming track?')) return;
    try {
      const res = await fetch(`/api/upcoming-music/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Track deleted');
        fetchItems();
      } else {
        toast.error('Failed to delete');
      }
    } catch { toast.error('Failed to delete'); }
  };

  const S = {
    row: { display: 'flex', gap: '16px', marginBottom: '16px' },
    label: { fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' } as React.CSSProperties,
    input: { width: '100%', padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px', outline: 'none', transition: '0.2s' },
    btnGroup: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }
  };

  // Convert string to local datetime-local format for the input
  const formatForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      // Adjust to local timezone format "YYYY-MM-DDThh:mm"
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  return (
    <div className="jl">
      <AdminSidebar />
      <div className="main">
        {/* Header */}
        <div className="topbar">
          <div>
            <h1 className="page-title">Upcoming Drops</h1>
            <div className="admin-subtitle">Schedule music releases to build hype</div>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none',
            background: showForm ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #FF6B00, #ff8533)', color: '#fff'
          }}>
            {showForm ? 'Cancel' : '+ New Drop'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              {/* Left Column */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: '#fff' }}>Track Info</h3>
                
                <div style={S.row}>
                  <div style={{ flex: 1 }}>
                    <div style={S.label}>Track Title *</div>
                    <input style={S.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Last Last" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={S.label}>Artist *</div>
                    <input 
                      style={S.input} 
                      value={form.artist} 
                      onChange={e => setForm({ ...form, artist: e.target.value })} 
                      placeholder="e.g. Burna Boy" 
                      list="artists-datalist"
                    />
                    <datalist id="artists-datalist">
                      {artistsList.map(a => <option key={a._id} value={a.name} />)}
                    </datalist>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={S.label}>Release Date & Time *</div>
                  <input 
                    type="datetime-local"
                    style={{ ...S.input, colorScheme: 'dark' }} 
                    value={form.releaseDate} 
                    onChange={e => setForm({ ...form, releaseDate: e.target.value })} 
                  />
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                    The countdown timer will track exactly to this moment.
                  </div>
                </div>

                <div>
                  <div style={S.label}>Hype Description (Optional)</div>
                  <textarea 
                    value={form.description} 
                    onChange={e => setForm({ ...form, description: e.target.value })} 
                    placeholder="Build some hype! e.g. Burna Boy's highly anticipated summer anthem..." 
                    style={{ ...S.input, height: '100px', resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: '#fff' }}>Media Files</h3>
                
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '16px' }}>
                  <div style={S.label}>Cover Art</div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div 
                      onClick={() => !uploadingCover && coverInputRef.current?.click()}
                      style={{ 
                        width: '80px', height: '80px', borderRadius: '8px', 
                        background: form.coverUrl ? `url(${form.coverUrl}) center/cover` : 'rgba(255,255,255,0.05)',
                        border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0
                      }}>
                      {!form.coverUrl && <span style={{ fontSize: '24px', opacity: 0.5 }}>🎨</span>}
                    </div>
                    <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={handleCoverUpload} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                        {uploadingCover ? `Uploading... ${coverProgress}%` : 'Click the box to upload cover art. A placeholder is shown if left empty.'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={S.label}>Audio Teaser/Snippet (Optional)</div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button 
                      onClick={() => !uploadingAudio && audioInputRef.current?.click()}
                      disabled={uploadingAudio}
                      style={{ 
                        padding: '10px 16px', borderRadius: '8px', background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)',
                        color: '#FF6B00', fontSize: '12px', fontWeight: 600, cursor: uploadingAudio ? 'default' : 'pointer'
                      }}
                    >
                      {uploadingAudio ? `Uploading... ${audioProgress}%` : 'Upload 10s Teaser'}
                    </button>
                    <input ref={audioInputRef} type="file" accept="audio/*,video/*" hidden onChange={handleAudioUpload} />
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', flex: 1 }}>
                      {form.snippetUrl ? '✅ Teaser attached' : 'Optional short clip for fans to preview.'}
                    </div>
                  </div>
                </div>

                <div style={S.btnGroup}>
                  <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSave} disabled={saving || uploadingAudio || uploadingCover} style={{ padding: '10px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #FF6B00, #ff8533)', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: (saving || uploadingAudio || uploadingCover) ? 0.6 : 1 }}>
                    {saving ? 'Scheduling...' : 'Schedule Drop'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Loading upcoming tracks...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>No upcoming drops</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Schedule your next big release here!</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {items.map(item => {
              const isOut = new Date(item.releaseDate) <= new Date();
              return (
                <div key={item._id} style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: isOut ? '1px solid rgba(255,107,0,0.5)' : '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: item.coverUrl ? `url(${item.coverUrl}) center/cover` : 'var(--color-background-tertiary)', flexShrink: 0 }}></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '10px', color: 'var(--orange)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                      {isOut ? 'AVAILABLE NOW' : 'UPCOMING'}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.artist}</div>
                    <div style={{ fontSize: '11px', color: '#fff', background: 'rgba(0,0,0,0.4)', display: 'inline-block', padding: '4px 8px', borderRadius: '4px' }}>
                      🕒 {new Date(item.releaseDate).toLocaleString()}
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleDelete(item._id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
