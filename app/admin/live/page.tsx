'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarClock,
  Circle,
  ExternalLink,
  MonitorPlay,
  Pencil,
  Plus,
  Radio,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import { useAdminSession } from '@/components/useAdminSession';

interface ILiveStream {
  _id: string;
  title: string;
  platform: 'youtube' | 'facebook';
  url: string;
  isActive: boolean;
  description?: string;
  startTime?: string;
  updatedAt?: string;
}

const emptyForm = {
  title: '',
  platform: 'youtube' as 'youtube' | 'facebook',
  url: '',
  isActive: false,
  description: '',
  startTime: '',
};

function toDateTimeInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 16);
}

export default function AdminLivePage() {
  const { session, loading: sessionLoading } = useAdminSession();
  const [streams, setStreams] = useState<ILiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const liveCount = useMemo(() => streams.filter((stream) => stream.isActive).length, [streams]);
  const scheduledCount = useMemo(() => streams.filter((stream) => !stream.isActive && stream.startTime).length, [streams]);
  const activeStream = useMemo(() => streams.find((stream) => stream.isActive), [streams]);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const res = await fetch('/api/live');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setStreams(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load streams');
    } finally {
      setLoading(false);
    }
  };

  const closeForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startNewStream = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const startEditing = (stream: ILiveStream) => {
    setForm({
      title: stream.title,
      platform: stream.platform,
      url: stream.url,
      isActive: stream.isActive,
      description: stream.description || '',
      startTime: toDateTimeInput(stream.startTime),
    });
    setEditingId(stream._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.url.trim()) {
      toast.error('Add a stream title and URL first');
      return;
    }

    setSaving(true);
    try {
      const isEditing = Boolean(editingId);
      const res = await fetch('/api/live', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? { id: editingId, ...form } : form),
      });
      if (!res.ok) throw new Error('Failed');

      toast.success(isEditing ? 'Live stream updated' : 'Live stream created');
      closeForm();
      fetchStreams();
    } catch {
      toast.error(editingId ? 'Could not update the stream' : 'Could not create the stream');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/live', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(!currentStatus ? 'Stream is now live' : 'Stream taken offline');
      fetchStreams();
    } catch {
      toast.error('Failed to update stream status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this live stream? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/live/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Live stream deleted');
      if (editingId === id) closeForm();
      fetchStreams();
    } catch {
      toast.error('Could not delete this stream');
    }
  };

  if (sessionLoading) return null;
  if (session?.role !== 'admin') {
    return (
      <div className="jl"><AdminSidebar /><main className="main"><div className="admin-access-denied">Access denied. Only administrators can manage live streams.</div></main></div>
    );
  }

  return (
    <div className="jl">
      <AdminSidebar />
      <main className="main">
        <div className="live-admin-shell">
          <header className="live-admin-header">
            <div>
              <div className="live-admin-eyebrow"><Radio size={14} /> Broadcast centre</div>
              <h1>Live streams</h1>
              <p>Create, schedule, publish, and update every broadcast from one place.</p>
            </div>
            <button className="live-admin-primary" onClick={showForm ? closeForm : startNewStream}>
              {showForm ? <><X size={16} /> Close editor</> : <><Plus size={16} /> New live stream</>}
            </button>
          </header>

          <section className="live-admin-spotlight">
            <div className={`live-spotlight-signal ${activeStream ? 'is-live' : ''}`}><Radio size={28} /><span /></div>
            <div className="live-spotlight-copy">
              <span className="live-spotlight-label">Broadcast status</span>
              <h2>{activeStream ? activeStream.title : 'Your studio is ready'}</h2>
              <p>{activeStream ? `Currently streaming on ${activeStream.platform === 'youtube' ? 'YouTube' : 'Facebook'}. Use the library below to update or take it offline.` : 'Set up a stream, add the broadcast link, and publish when you are ready to go live.'}</p>
            </div>
            <div className="live-spotlight-action">
              <span className={activeStream ? 'live-spotlight-state is-live' : 'live-spotlight-state'}><Circle size={7} fill="currentColor" /> {activeStream ? 'Live now' : 'No active stream'}</span>
              {activeStream ? <button onClick={() => startEditing(activeStream)}><Pencil size={14} /> Edit broadcast</button> : <button onClick={startNewStream}><Plus size={14} /> Set up stream</button>}
            </div>
          </section>

          <section className="live-admin-stats" aria-label="Live stream summary">
            <div><span className="live-admin-stat-icon"><MonitorPlay size={17} /></span><strong>{streams.length}</strong><span>Total streams</span></div>
            <div><span className="live-admin-stat-icon is-live"><Circle size={14} fill="currentColor" /></span><strong>{liveCount}</strong><span>Live now</span></div>
            <div><span className="live-admin-stat-icon is-scheduled"><CalendarClock size={17} /></span><strong>{scheduledCount}</strong><span>Scheduled</span></div>
          </section>

          {showForm && (
            <section className="live-stream-editor">
              <div className="live-editor-heading">
                <div>
                  <span>{editingId ? 'Edit stream' : 'New stream'}</span>
                  <h2>{editingId ? 'Update broadcast details' : 'Set up your broadcast'}</h2>
                </div>
                {editingId && <div className="live-editor-editing"><Pencil size={13} /> Editing existing stream</div>}
              </div>

              <form onSubmit={handleSubmit} className="live-editor-form">
                <label className="live-field live-field-wide">
                  <span>Stream title <b>*</b></span>
                  <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Sunday Morning Live" />
                </label>
                <label className="live-field">
                  <span>Platform <b>*</b></span>
                  <select value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value as 'youtube' | 'facebook' })}>
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </label>
                <label className="live-field">
                  <span>Start time</span>
                  <input type="datetime-local" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} />
                </label>
                <label className="live-field live-field-wide">
                  <span>Stream URL <b>*</b></span>
                  <input type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
                </label>
                <label className="live-field live-field-wide">
                  <span>Description</span>
                  <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Tell your audience what this stream is about..." />
                </label>
                <label className="live-publish-toggle">
                  <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
                  <span className="live-toggle-control" />
                  <span><strong>Go live immediately</strong><small>Make this stream visible to visitors as soon as you save.</small></span>
                </label>
                <div className="live-editor-actions">
                  <button type="button" className="live-cancel-action" onClick={closeForm}>Cancel</button>
                  <button type="submit" className="live-admin-primary" disabled={saving}><Save size={15} /> {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create stream'}</button>
                </div>
              </form>
            </section>
          )}

          <section className="live-streams-panel">
            <div className="live-panel-heading">
              <div><span>Broadcast library</span><h2>Your streams <em>{streams.length}</em></h2></div>
              <p>{liveCount ? `${liveCount} stream${liveCount > 1 ? 's are' : ' is'} live right now.` : 'Choose a stream below to edit or take it live.'}</p>
            </div>

            {loading ? <div className="live-empty-state">Loading live streams...</div> : streams.length === 0 ? (
              <div className="live-empty-state"><Radio size={22} /><strong>No live streams yet</strong><span>Create your first broadcast to get started.</span><button onClick={startNewStream}>Create live stream</button></div>
            ) : (
              <div className="live-stream-list">
                {streams.map((stream) => (
                  <article key={stream._id} className={`live-stream-card ${stream.isActive ? 'is-active' : ''}`}>
                    <div className={`live-platform-mark ${stream.platform}`}><MonitorPlay size={19} /></div>
                    <div className="live-stream-info">
                      <div className="live-stream-title-row"><h3>{stream.title}</h3>{stream.isActive && <span className="live-now-badge"><Circle size={6} fill="currentColor" /> Live now</span>}</div>
                      <p>{stream.description || `${stream.platform === 'youtube' ? 'YouTube' : 'Facebook'} broadcast`}</p>
                      <div className="live-stream-meta"><span>{stream.platform === 'youtube' ? 'YouTube' : 'Facebook'}</span>{stream.startTime && <span><CalendarClock size={12} /> {new Date(stream.startTime).toLocaleString()}</span>}</div>
                    </div>
                    <div className="live-stream-actions">
                      <button className={`live-status-action ${stream.isActive ? 'is-live' : ''}`} onClick={() => toggleActive(stream._id, stream.isActive)}>{stream.isActive ? 'Take offline' : 'Go live'}</button>
                      <button className="live-icon-action" onClick={() => startEditing(stream)} title="Edit stream" aria-label={`Edit ${stream.title}`}><Pencil size={15} /></button>
                      <a className="live-icon-action" href={stream.url} target="_blank" rel="noreferrer" title="Open stream" aria-label={`Open ${stream.title}`}><ExternalLink size={15} /></a>
                      <button className="live-icon-action danger" onClick={() => handleDelete(stream._id)} title="Delete stream" aria-label={`Delete ${stream.title}`}><Trash2 size={15} /></button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
