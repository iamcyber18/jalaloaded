'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminSidebar from '@/components/AdminSidebar';
import { useAdminSession } from '@/components/useAdminSession';

interface ILiveStream {
  _id: string;
  title: string;
  platform: 'youtube' | 'facebook';
  url: string;
  isActive: boolean;
  description?: string;
}

export default function AdminLivePage() {
  const { session, loading: sessionLoading } = useAdminSession();
  const [streams, setStreams] = useState<ILiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    platform: 'youtube' as 'youtube' | 'facebook',
    url: '',
    isActive: false,
    description: ''
  });

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const res = await fetch('/api/live');
      const data = await res.json();
      setStreams(data);
    } catch {
      toast.error('Failed to load streams');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        toast.success('Live stream added!');
        setForm({ title: '', platform: 'youtube', url: '', isActive: false, description: '' });
        fetchStreams();
      } else {
        toast.error('Failed to add stream');
      }
    } catch {
      toast.error('An error occurred');
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/live', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus })
      });
      if (res.ok) {
        toast.success(!currentStatus ? 'Stream is now LIVE!' : 'Stream turned off');
        fetchStreams();
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this stream?')) return;
    try {
      const res = await fetch(`/api/live/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Deleted');
        fetchStreams();
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  if (sessionLoading) return null;
  if (session?.role !== 'admin') {
    return (
      <div className="jl">
        <AdminSidebar />
        <div className="main">
          <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Access Denied. Admins only.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="jl">
      <AdminSidebar />
      <div className="main">
        <div className="topbar">
          <div className="page-title">Live Streaming</div>
        </div>

        <div style={{ padding: '0 24px 40px', maxWidth: '800px' }}>
          {/* Create Form */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '20px', fontFamily: '"Syne", sans-serif' }}>Setup New Stream</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase' }}>Stream Title</label>
                  <input 
                    className="ad-input" 
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)' }}
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                    placeholder="e.g. Sunday Morning Live"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase' }}>Platform</label>
                  <select 
                    className="ad-input" 
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)' }}
                    value={form.platform}
                    onChange={e => setForm({...form, platform: e.target.value as any})}
                  >
                    <option value="youtube" style={{background:'#111'}}>YouTube</option>
                    <option value="facebook" style={{background:'#111'}}>Facebook</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase' }}>Stream URL (Full Link)</label>
                <input 
                  className="ad-input" 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)' }}
                  value={form.url}
                  onChange={e => setForm({...form, url: e.target.value})}
                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                />
              </div>

              <button 
                type="submit" 
                disabled={saving}
                style={{ 
                  background: '#FF6B00', color: '#fff', border: 'none', padding: '12px', 
                  borderRadius: '10px', fontWeight: 700, cursor: 'pointer', transition: '0.2s'
                }}
              >
                {saving ? 'Saving...' : 'Add Stream'}
              </button>
            </form>
          </div>

          {/* List */}
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '16px', fontFamily: '"Syne", sans-serif' }}>Past & Scheduled Streams</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {streams.map(s => (
              <div key={s._id} style={{ 
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px'
              }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '8px', background: s.platform === 'youtube' ? '#ff000022' : '#0066ff22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.platform === 'youtube' ? '#ff4444' : '#4488ff', fontSize: '20px'
                }}>
                  {s.platform === 'youtube' ? '📺' : '👥'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{s.title}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{s.platform} • {s.url}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    onClick={() => toggleActive(s._id, s.isActive)}
                    style={{ 
                      background: s.isActive ? '#1DBE73' : 'rgba(255,255,255,0.05)',
                      color: s.isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                      border: 'none', padding: '6px 14px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, cursor: 'pointer'
                    }}
                  >
                    {s.isActive ? '🔴 LIVE NOW' : 'GO LIVE'}
                  </button>
                </div>
              </div>
            ))}
            {streams.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>No streams added yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
