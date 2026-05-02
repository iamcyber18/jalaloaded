'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AdminSidebar from '@/components/AdminSidebar';
import { useAdminSession } from '@/components/useAdminSession';
import { timeAgo } from '@/lib/utils';

type AdminUser = {
  _id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'sub-admin';
  active: boolean;
  createdByUsername: string;
  lastLoginAt?: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const { session, loading: sessionLoading } = useAdminSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: '',
    displayName: '',
    password: '',
    role: 'sub-admin' as 'admin' | 'sub-admin'
  });

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setLoading(true);

      try {
        const res = await fetch('/api/admin-users', { cache: 'no-store' });
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok) {
          toast.error(data.error || 'Failed to load team members.');
          setUsers([]);
          return;
        }

        setUsers(data);
      } catch {
        if (isMounted) {
          toast.error('Something went wrong while loading team members.');
          setUsers([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadUsers();
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to create account.');
        return;
      }

      setUsers((current) => [data, ...current]);
      setForm({ username: '', displayName: '', password: '', role: 'sub-admin' });
      toast.success('Account created successfully.');
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this team member? This action cannot be undone.')) return;

    try {
      const res = await fetch(`/api/admin-users?id=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== userId));
        toast.success('Account deleted.');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete account.');
      }
    } catch {
      toast.error('Something went wrong.');
    }
  };

  return (
    <div className="jl">
      <AdminSidebar />

      <div className="main">
        <div className="topbar">
          <div>
            <div className="page-title">Team Management</div>
            <div className="admin-subtitle">Manage Main Admins and Sub-Admins who can contribute to Jalaloaded.</div>
          </div>
        </div>

        <div className="post-manager">
          {sessionLoading ? (
            <div className="post-empty-card">Loading permissions...</div>
          ) : session?.role !== 'admin' ? (
            <div className="post-empty-card">Only the main admin can manage the team.</div>
          ) : (
            <div className="post-manager-grid">
              <div className="form-card">
                <div className="side-title">Add Team Member</div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  <input
                    className="field-input"
                    placeholder="Username"
                    value={form.username}
                    onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))}
                    required
                  />
                  <input
                    className="field-input"
                    placeholder="Display Name (e.g. cyber)"
                    value={form.displayName}
                    onChange={(e) => setForm((current) => ({ ...current, displayName: e.target.value }))}
                    required
                  />
                  
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Account Role</div>
                    <select 
                      className="field-input"
                      value={form.role}
                      onChange={(e) => setForm(f => ({ ...f, role: e.target.value as any }))}
                      style={{ appearance: 'auto', paddingRight: '10px' }}
                    >
                      <option value="sub-admin">Sub-Admin (Only manage own posts)</option>
                      <option value="admin">Main Admin (Full control)</option>
                    </select>
                  </div>

                  <input
                    className="field-input"
                    type="password"
                    placeholder="Temporary Password"
                    value={form.password}
                    onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
                    required
                  />
                  
                  <button className="btn-publish" type="submit" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Account'}
                  </button>
                </form>
              </div>

              <div className="post-list-card">
                <div className="side-title">Existing Team Members</div>
                {loading ? (
                  <div className="post-empty-card" style={{ marginTop: '14px' }}>Loading...</div>
                ) : users.length === 0 ? (
                  <div className="post-empty-card" style={{ marginTop: '14px' }}>No accounts found.</div>
                ) : (
                  <div className="post-list">
                    {users.map((user) => (
                      <div key={user._id} className="post-row">
                        <div className="post-row-head">
                          <div className="post-row-title">{user.displayName}</div>
                          <div className={`post-badge ${user.role === 'admin' ? 'featured' : 'published'}`}>
                            {user.role}
                          </div>
                        </div>
                        <div className="post-row-meta">
                          <span>@{user.username}</span>
                          <span>added by {user.createdByUsername}</span>
                          <span>{timeAgo(user.createdAt)}</span>
                        </div>
                        <div className="post-row-footer" style={{ justifyContent: 'space-between' }}>
                          <span className="post-row-slug">{user.active ? 'active' : 'inactive'}</span>
                          <div className="post-row-stats" style={{ gap: '12px' }}>
                            <button 
                              onClick={() => handleDelete(user._id)}
                              style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              DELETE
                            </button>
                            <span>{user.lastLoginAt ? `last login ${timeAgo(user.lastLoginAt)}` : 'never'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
