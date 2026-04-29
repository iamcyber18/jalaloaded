'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import AdminSidebar from '@/components/AdminSidebar';
import { useAdminSession } from '@/components/useAdminSession';
import Image from 'next/image';

interface SongItem {
  _id: string;
  title: string;
  artist: string;
  genre: string;
  year: number;
  mediaUrl: string;
  streamUrl?: string;
  downloadUrl?: string;
  coverUrl?: string;
  plays: number;
  downloads: number;
  createdAt: string;
}

export default function AdminMusicPage() {
  const { session, loading: sessionLoading } = useAdminSession();

  // Block sub-admins
  if (!sessionLoading && session?.role === 'sub-admin') {
    return (
      <div className="jl">
        <AdminSidebar />
        <div className="main">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '32px' }}>🔒</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Access Denied</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Only the main admin can manage music.</div>
          </div>
        </div>
      </div>
    );
  }
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [artistsList, setArtistsList] = useState<{_id:string;name:string}[]>([]);
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
    genre: 'Afrobeats',
    year: new Date().getFullYear(),
    featured: false,
    mediaUrl: '',
    streamUrl: '',
    downloadUrl: '',
    coverUrl: '',
    description: '',
  });
  const [coverProgress, setCoverProgress] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);

  const genres = ['Afrobeats', 'Amapiano', 'Highlife', 'R&B', 'Gospel', 'Hip-hop', 'Other'];

  useEffect(() => {
    fetchSongs();
    fetchArtists();
  }, []);

  const fetchSongs = async () => {
    try {
      const res = await fetch('/api/songs?limit=50');
      const data = await res.json();
      setSongs(data);
    } catch { toast.error('Failed to load songs'); }
    setLoading(false);
  };
  const fetchArtists = async () => {
    try {
      const res = await fetch('/api/artists');
      const data = await res.json();
      setArtistsList(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load artists for dropdown');
    }
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
      setForm(f => ({ ...f, mediaUrl: data.url, downloadUrl: data.url }));
      toast.success('Audio uploaded!');
    } catch { toast.error('Audio upload failed'); }
    setUploadingAudio(false);
    setAudioProgress(0);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.artist.trim()) {
      toast.error('Title and artist are required');
      return;
    }
    if (!form.mediaUrl && !form.streamUrl) {
      toast.error('Upload an audio file or add a stream URL');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Song published! 🎶');
      setForm({ title: '', artist: '', genre: 'Afrobeats', year: new Date().getFullYear(), featured: false, mediaUrl: '', streamUrl: '', downloadUrl: '', coverUrl: '', description: '' });
      setShowForm(false);
      fetchSongs();
    } catch { toast.error('Failed to publish song'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this song?')) return;
    try {
      const res = await fetch(`/api/songs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Song deleted');
      setSongs(songs.filter(s => s._id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const S = {
    card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px', marginBottom: '16px' } as React.CSSProperties,
    label: { fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' } as React.CSSProperties,
    input: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#fff', outline: 'none', fontFamily: '"DM Sans", sans-serif' } as React.CSSProperties,
    select: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#fff', outline: 'none', fontFamily: '"DM Sans", sans-serif' } as React.CSSProperties,
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' } as React.CSSProperties,
    uploadBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '10px', border: '2px dashed rgba(255,107,0,0.2)', background: 'rgba(255,107,0,0.03)', color: '#FF6B00', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' } as React.CSSProperties,
    songRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '8px', transition: 'background 0.2s' } as React.CSSProperties,
  };

  return (
    <div className="jl">
      <AdminSidebar />
      <div className="main">
        <div className="topbar">
          <div className="page-title">Music</div>
          <div className="topbar-actions">
            <button className="btn-publish" onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Close' : '+ Upload Song'}
            </button>
          </div>
        </div>

        <div style={{ padding: '0 24px 40px', maxWidth: '900px' }}>
          {/* UPLOAD FORM */}
          {showForm && (
            <div style={S.card}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>🎵 Upload New Song</div>

              {/* Cover Image */}
              <div style={{ marginBottom: '16px' }}>
                <div style={S.label}>Cover Art</div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div
                    onClick={() => !uploadingCover && coverInputRef.current?.click()}
                    style={{
                      width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', cursor: uploadingCover ? 'default' : 'pointer',
                      background: form.coverUrl ? `url(${form.coverUrl}) center/cover` : 'linear-gradient(135deg, rgba(255,107,0,0.15), rgba(255,107,0,0.05))',
                      border: '2px dashed rgba(255,107,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    {uploadingCover && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#FF6B00' }}>{coverProgress}%</div>
                        <div style={{ width: '60px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          <div style={{ width: `${coverProgress}%`, height: '100%', background: '#FF6B00', borderRadius: '2px', transition: 'width 0.3s' }} />
                        </div>
                      </div>
                    )}
                    {!form.coverUrl && !uploadingCover && (
                      <div style={{ textAlign: 'center', color: '#FF6B00', fontSize: '10px' }}>+ Cover</div>
                    )}
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={handleCoverUpload} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                      {uploadingCover ? `Uploading cover... ${coverProgress}%` : form.coverUrl ? '✅ Cover uploaded — click image to replace' : 'Click to upload cover art. JPG/PNG recommended.'}
                    </div>
                  </div>
                  {form.coverUrl && !uploadingCover && (
                    <button onClick={() => setForm({ ...form, coverUrl: '' })} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                  )}
                </div>
              </div>

              {/* Title & Artist */}
              <div style={S.row}>
                <div>
                  <div style={S.label}>Song Title *</div>
                  <input style={S.input} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Loaded Vibes" />
                </div>
                <div>
                  <div style={S.label}>Artist *</div>
                  <select style={S.select} value={form.artist} onChange={e => setForm({ ...form, artist: e.target.value })}>
                    <option value="" style={{ background: '#111' }}>Select Artist</option>
                    {artistsList.map(a => <option key={a._id} value={a.name} style={{ background: '#111' }}>{a.name}</option>)}
                  </select>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>Manage artists from the <a href="/admin/artists" style={{ color: '#FF6B00' }}>Artists page</a></div>
                </div>
              </div>

              {/* Genre & Year */}
              <div style={S.row}>
                <div>
                  <div style={S.label}>Genre</div>
                  <select style={S.select} value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })}>
                    {genres.map(g => <option key={g} value={g} style={{ background: '#111' }}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <div style={S.label}>Year</div>
                  <input style={S.input} type="number" value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) || new Date().getFullYear() })} />
                </div>
              </div>

              {/* Audio Upload */}
              <div style={{ marginBottom: '12px' }}>
                <div style={S.label}>Audio File *</div>
                {form.mediaUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(29,190,115,0.08)', border: '1px solid rgba(29,190,115,0.15)' }}>
                    <span style={{ fontSize: '16px' }}>✅</span>
                    <span style={{ fontSize: '11px', color: '#1DBE73', fontWeight: 600, flex: 1 }}>Audio uploaded successfully</span>
                    <button onClick={() => setForm({ ...form, mediaUrl: '', downloadUrl: '' })} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
                  </div>
                ) : uploadingAudio ? (
                  <div style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255,107,0,0.15)', background: 'rgba(255,107,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#FF6B00', fontWeight: 600 }}>⏳ Uploading audio...</span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#FF6B00' }}>{audioProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ width: `${audioProgress}%`, height: '100%', background: 'linear-gradient(90deg, #FF6B00, #ff8533)', borderRadius: '2px', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                ) : (
                  <div onClick={() => audioInputRef.current?.click()} style={S.uploadBtn}>
                    🎧 Click to upload audio file (MP3, WAV, OGG)
                  </div>
                )}
                <input ref={audioInputRef} type="file" accept="audio/*" hidden onChange={handleAudioUpload} />
              </div>

              {/* Stream URL */}
              <div style={{ marginBottom: '12px' }}>
                <div style={S.label}>Stream URL (Spotify, Apple Music, etc.)</div>
                <input style={S.input} value={form.streamUrl} onChange={e => setForm({ ...form, streamUrl: e.target.value })} placeholder="https://open.spotify.com/track/..." />
              </div>

              {/* Download URL (auto-filled or manual) */}
              <div style={{ marginBottom: '12px' }}>
                <div style={S.label}>Download URL (auto-filled from upload)</div>
                <input style={S.input} value={form.downloadUrl} onChange={e => setForm({ ...form, downloadUrl: e.target.value })} placeholder="Auto-filled when you upload audio, or paste a link" />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <div style={S.label}>Description (optional)</div>
                <textarea style={{ ...S.input, minHeight: '60px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="A short note about the track..." />
              </div>

              {/* Featured Toggle */}
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  onClick={() => setForm({ ...form, featured: !form.featured })}
                  style={{
                    width: '40px', height: '22px', borderRadius: '11px', cursor: 'pointer',
                    background: form.featured ? '#FF6B00' : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'background 0.2s'
                  }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: '2px', transition: 'left 0.2s',
                    left: form.featured ? '20px' : '2px'
                  }} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: form.featured ? '#FF6B00' : 'rgba(255,255,255,0.5)' }}>
                    ⭐ Featured Song
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Shows in the featured carousel on the music page</div>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                  background: saving ? 'rgba(255,107,0,0.3)' : 'linear-gradient(135deg, #FF6B00, #ff8533)',
                  color: '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'default' : 'pointer',
                  fontFamily: '"DM Sans", sans-serif'
                }}
              >
                {saving ? 'Publishing...' : '🎶 Publish Song'}
              </button>
            </div>
          )}

          {/* SONGS LIST */}
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>All Songs ({songs.length})</div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Loading songs...</div>
            ) : songs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>No songs uploaded yet. Click &quot;Upload Song&quot; to get started!</div>
            ) : (
              songs.map((song, i) => (
                <div key={song._id} style={S.songRow}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontWeight: 700, width: '24px', textAlign: 'center' }}>{String(i + 1).padStart(2, '0')}</div>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0,
                    background: song.coverUrl ? `url(${song.coverUrl}) center/cover` : 'linear-gradient(135deg, #FF6B00, #c84b00)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {!song.coverUrl && <span style={{ fontSize: '16px' }}>🎵</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{song.artist} • {song.genre} • {song.year}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                    <span>▶ {song.plays || 0}</span>
                    <span>⬇ {song.downloads || 0}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(song._id)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '14px', padding: '4px' }}
                    title="Delete song"
                  >🗑</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
