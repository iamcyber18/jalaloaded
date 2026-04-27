'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Advert {
  _id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  placement: string;
  isActive: boolean;
  clicks: number;
  impressions: number;
  advertiser: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export default function AdvertsPage() {
  const [adverts, setAdverts] = useState<Advert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    placement: 'blog-inline',
    advertiser: '',
    isActive: true,
    startDate: '',
    endDate: '',
  });

  const fetchAdverts = async () => {
    try {
      const res = await fetch('/api/adverts?active=false');
      if (res.ok) {
        const data = await res.json();
        setAdverts(data);
      }
    } catch {
      toast.error('Failed to load adverts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdverts(); }, []);

  const resetForm = () => {
    setForm({ title: '', imageUrl: '', linkUrl: '', placement: 'blog-inline', advertiser: '', isActive: true, startDate: '', endDate: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, imageUrl: data.url }));
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (err) {
      toast.error('Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.imageUrl || !form.linkUrl || !form.advertiser) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = { ...form };
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;

      if (editingId) {
        const res = await fetch(`/api/adverts/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success('Advert updated!');
          resetForm();
          fetchAdverts();
        }
      } else {
        const res = await fetch('/api/adverts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success('Advert created!');
          resetForm();
          fetchAdverts();
        }
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ad: Advert) => {
    setForm({
      title: ad.title,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      placement: ad.placement,
      advertiser: ad.advertiser,
      isActive: ad.isActive,
      startDate: ad.startDate ? ad.startDate.split('T')[0] : '',
      endDate: ad.endDate ? ad.endDate.split('T')[0] : '',
    });
    setEditingId(ad._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this advert?')) return;
    try {
      const res = await fetch(`/api/adverts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Advert deleted');
        fetchAdverts();
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggleActive = async (ad: Advert) => {
    try {
      await fetch(`/api/adverts/${ad._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !ad.isActive }),
      });
      fetchAdverts();
      toast.success(ad.isActive ? 'Ad paused' : 'Ad activated');
    } catch {
      toast.error('Failed to toggle');
    }
  };

  return (
    <div className="adverts-page">
      {/* HEADER */}
      <div className="adverts-header">
        <div>
          <Link href="/admin" style={{ fontSize: '11px', color: 'var(--orange)', textDecoration: 'none', fontFamily: '"DM Sans", sans-serif' }}>&larr; Back to Dashboard</Link>
          <h1 className="adverts-title">Ad Manager</h1>
          <p className="adverts-subtitle">{adverts.length} adverts &bull; {adverts.filter(a => a.isActive).length} active</p>
        </div>
        <button className="adverts-create-btn" onClick={() => { resetForm(); setShowForm(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Advert
        </button>
      </div>

      {/* CREATE / EDIT FORM */}
      {showForm && (
        <form className="ad-form" onSubmit={handleSubmit}>
          <div className="ad-form-title">{editingId ? 'Edit Advert' : 'Create New Advert'}</div>

          <div className="ad-form-grid">
            <div className="ad-field">
              <label className="ad-label-text">Title *</label>
              <input
                type="text"
                className="ad-input"
                placeholder="e.g. MTN Data Bundle Promo"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="ad-field">
              <label className="ad-label-text">Advertiser *</label>
              <input
                type="text"
                className="ad-input"
                placeholder="e.g. MTN Nigeria"
                value={form.advertiser}
                onChange={e => setForm({ ...form, advertiser: e.target.value })}
                required
              />
            </div>

            <div className="ad-field" style={{ gridColumn: 'span 2' }}>
              <label className="ad-label-text">Advert Image *</label>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ position: 'relative', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer', transition: '0.2s', borderColor: isUploading ? 'var(--orange)' : '' }} className="hover:border-[var(--orange)]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
                    />
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{isUploading ? '⏳' : '📤'}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{isUploading ? 'Uploading...' : 'Click or Drag Image Here'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>Supports JPG, PNG, WEBP</div>
                  </div>
                </div>

                {form.imageUrl && (
                  <div style={{ width: '140px', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                    <img src={form.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>

            <div className="ad-field" style={{ gridColumn: 'span 2' }}>
              <label className="ad-label-text">Link URL *</label>
              <input
                type="url"
                className="ad-input"
                placeholder="https://example.com/promo"
                value={form.linkUrl}
                onChange={e => setForm({ ...form, linkUrl: e.target.value })}
                required
              />
            </div>

            <div className="ad-field">
              <label className="ad-label-text">Placement</label>
              <select
                className="ad-input"
                value={form.placement}
                onChange={e => setForm({ ...form, placement: e.target.value })}
              >
                <option value="blog-inline">Blog (In-Article)</option>
                <option value="sidebar">Sidebar</option>
                <option value="homepage">Homepage</option>
              </select>
            </div>

            <div className="ad-field">
              <label className="ad-label-text">Status</label>
              <select
                className="ad-input"
                value={form.isActive ? 'active' : 'paused'}
                onChange={e => setForm({ ...form, isActive: e.target.value === 'active' })}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div className="ad-field">
              <label className="ad-label-text">Start Date (optional)</label>
              <input
                type="date"
                className="ad-input"
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
              />
            </div>

            <div className="ad-field">
              <label className="ad-label-text">End Date (optional)</label>
              <input
                type="date"
                className="ad-input"
                value={form.endDate}
                onChange={e => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="ad-form-actions">
            <button type="button" className="ad-btn-cancel" onClick={resetForm}>Cancel</button>
            <button type="submit" className="ad-btn-save" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update Advert' : 'Create Advert'}
            </button>
          </div>
        </form>
      )}

      {/* ADVERTS LIST */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-tertiary)', fontSize: '13px' }}>Loading adverts...</div>
      ) : adverts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-tertiary)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>📢</div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>No adverts yet</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>Create your first advert to start earning</div>
        </div>
      ) : (
        <div className="ad-list">
          {adverts.map(ad => (
            <div key={ad._id} className={`ad-card ${!ad.isActive ? 'ad-card-paused' : ''}`}>
              <div className="ad-card-img">
                <img src={ad.imageUrl} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className={`ad-status-badge ${ad.isActive ? 'active' : 'paused'}`}>
                  {ad.isActive ? 'LIVE' : 'PAUSED'}
                </div>
              </div>
              <div className="ad-card-body">
                <div className="ad-card-title">{ad.title}</div>
                <div className="ad-card-advertiser">{ad.advertiser}</div>
                <div className="ad-card-stats">
                  <div className="ad-stat">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    {ad.impressions}
                  </div>
                  <div className="ad-stat">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    {ad.clicks}
                  </div>
                  <div className="ad-stat" style={{ color: 'var(--orange)' }}>
                    {ad.placement}
                  </div>
                </div>
                <div className="ad-card-actions">
                  <button className="ad-act-btn" onClick={() => toggleActive(ad)}>
                    {ad.isActive ? '⏸ Pause' : '▶ Activate'}
                  </button>
                  <button className="ad-act-btn" onClick={() => handleEdit(ad)}>✏️ Edit</button>
                  <button className="ad-act-btn ad-act-delete" onClick={() => handleDelete(ad._id)}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
