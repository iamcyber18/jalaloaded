'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import AdminSidebar from '@/components/AdminSidebar';
import { useAdminSession } from '@/components/useAdminSession';

interface ArtistItem {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  bio?: string;
  genre?: string;
  createdAt: string;
}

export default function AdminArtistsPage() {
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

  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ name: '', image: '', bio: '', genre: '' });

  useEffect(() => { fetchArtists(); }, []);

  const fetchArtists = async () => {
    try {
      const res = await fetch('/api/artists');
      const data = await res.json();
      setArtists(data);
    } catch { toast.error('Failed to load artists'); }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ name: '', image: '', bio: '', genre: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const sigRes = await fetch('/api/upload/signature');
      const { signature, timestamp, cloudName, apiKey, folder } = await sigRes.json();

      const fd = new FormData();
      fd.append('file', file);
      fd.append('signature', signature);
      fd.append('timestamp', String(timestamp));
      fd.append('api_key', apiKey);
      fd.append('folder', folder);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          setForm(f => ({ ...f, image: data.secure_url }));
          toast.success('Image uploaded');
        } else { toast.error('Upload failed'); }
        setUploading(false);
        setUploadProgress(0);
      };
      xhr.onerror = () => { toast.error('Upload error'); setUploading(false); };
      xhr.send(fd);
    } catch { toast.error('Upload failed'); setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Artist name is required');
    setSaving(true);
    try {
      const url = editingId ? `/api/artists/${editingId}` : '/api/artists';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) {
        toast.success(editingId ? 'Artist updated' : 'Artist created');
        resetForm();
        fetchArtists();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save');
      }
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const handleEdit = (a: ArtistItem) => {
    setForm({ name: a.name, image: a.image || '', bio: a.bio || '', genre: a.genre || '' });
    setEditingId(a._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this artist?')) return;
    try {
      const res = await fetch(`/api/artists/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Artist deleted'); fetchArtists(); }
      else toast.error('Failed to delete');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="jl">
      <AdminSidebar />
      <div className="main">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', fontFamily: '"Syne", sans-serif' }}>Artists</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>Manage your music artists</div>
          </div>
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={{
            padding: '8px 18px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', border: 'none',
            background: showForm ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #FF6B00, #ff8533)', color: '#fff'
          }}>
            {showForm ? '✕ Close' : '+ New Artist'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
              {editingId ? 'Edit Artist' : 'New Artist'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>Artist Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Wizkid" className="jl-input" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '12px' }} />
              </div>
              {/* Genre */}
              <div>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>Genre</label>
                <input value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
                  placeholder="e.g. Afrobeats" className="jl-input" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '12px' }} />
              </div>
            </div>

            {/* Bio */}
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>Bio</label>
              <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Short bio about the artist..." rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '12px', resize: 'vertical' }} />
            </div>

            {/* Image Upload */}
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>Artist Photo</label>
              <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {form.image ? (
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,107,0,0.3)' }}>
                    <img src={form.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '20px', opacity: 0.3 }}>🎤</span>
                  </div>
                )}
                <button onClick={() => imgInputRef.current?.click()} disabled={uploading} style={{
                  padding: '8px 16px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)'
                }}>
                  {uploading ? `Uploading ${uploadProgress}%` : form.image ? 'Change Photo' : 'Upload Photo'}
                </button>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving || uploading} style={{
              marginTop: '16px', padding: '10px 24px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none',
              background: 'linear-gradient(135deg, #FF6B00, #ff8533)', color: '#fff', opacity: saving ? 0.6 : 1
            }}>
              {saving ? 'Saving...' : editingId ? 'Update Artist' : 'Create Artist'}
            </button>
          </div>
        )}

        {/* Artists List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Loading...</div>
        ) : artists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.25)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎤</div>
            <div style={{ fontSize: '13px' }}>No artists yet. Create your first artist!</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {artists.map(a => (
              <div key={a._id} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px',
                padding: '16px', display: 'flex', gap: '14px', alignItems: 'center', transition: 'border-color 0.2s'
              }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                  background: a.image ? `url(${a.image}) center/cover` : 'linear-gradient(135deg, #FF6B00, #c84b00)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid rgba(255,107,0,0.2)'
                }}>
                  {!a.image && <span style={{ fontSize: '18px' }}>🎤</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{a.name}</div>
                  {a.genre && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{a.genre}</div>}
                  {a.bio && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.bio}</div>}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button onClick={() => handleEdit(a)} style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>✏️</button>
                  <button onClick={() => handleDelete(a._id)} style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
