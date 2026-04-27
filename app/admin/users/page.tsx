'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AdminSidebar from '@/components/AdminSidebar';
import { useAdminSession } from '@/components/useAdminSession';
import { timeAgo } from '@/lib/utils';

type SubAdminUser = {
  _id: string;
  username: string;
  displayName: string;
  role: 'sub-admin';
  active: boolean;
  createdByUsername: string;
  lastLoginAt?: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const { session, loading: sessionLoading } = useAdminSession();
  const [users, setUsers] = useState<SubAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: '',
    displayName: '',
    password: '',
  });

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setLoading(true);

      try {
        const res = await fetch('/api/admin-users', { cache: 'no-store' });
        const data = await res.json();

        if (!isMounted) {
          return;
        }

        if (!res.ok) {
          toast.error(data.error || 'Failed to load sub-admins.');
          setUsers([]);
          return;
        }

        setUsers(data);
      } catch {
        if (!isMounted) {
          return;
        }

        toast.error('Something went wrong while loading sub-admins.');
        setUsers([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      isMounted = false;
    };
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
        toast.error(data.error || 'Failed to create sub-admin.');
        return;
      }

      setUsers((current) => [data, ...current]);
      setForm({ username: '', displayName: '', password: '' });
      toast.success('Sub-admin created.');
    } catch {
      toast.error('Something went wrong while creating the sub-admin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="jl">
      <AdminSidebar />

      <div className="main">
        <div className="topbar">
          <div>
            <div className="page-title">Sub Admins</div>
            <div className="admin-subtitle">Create sub-admin accounts that can only work on their own posts.</div>
          </div>
        </div>

        <div className="post-manager">
          {sessionLoading ? (
            <div className="post-empty-card">Loading your permissions...</div>
          ) : session?.role !== 'admin' ? (
            <div className="post-empty-card">Only the main admin can manage sub-admin accounts.</div>
          ) : (
            <div className="post-manager-grid">
              <div className="form-card">
                <div className="side-title">Create Sub-admin</div>
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
                    placeholder="Display name"
                    value={form.displayName}
                    onChange={(e) => setForm((current) => ({ ...current, displayName: e.target.value }))}
                    required
                  />
                  <input
                    className="field-input"
                    type="password"
                    placeholder="Temporary password"
                    value={form.password}
                    onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
                    required
                  />
                  <button className="btn-publish" type="submit" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Sub-admin'}
                  </button>
                </form>
              </div>

              <div className="post-list-card">
                <div className="side-title">Existing Sub-admins</div>
                {loading ? (
                  <div className="post-empty-card" style={{ marginTop: '14px' }}>Loading sub-admin accounts...</div>
                ) : users.length === 0 ? (
                  <div className="post-empty-card" style={{ marginTop: '14px' }}>No sub-admin accounts yet.</div>
                ) : (
                  <div className="post-list">
                    {users.map((user) => (
                      <div key={user._id} className="post-row">
                        <div className="post-row-head">
                          <div className="post-row-title">{user.displayName}</div>
                          <div className="post-badge published">{user.role}</div>
                        </div>
                        <div className="post-row-meta">
                          <span>@{user.username}</span>
                          <span>created by {user.createdByUsername}</span>
                          <span>{timeAgo(user.createdAt)}</span>
                        </div>
                        <div className="post-row-footer">
                          <span className="post-row-slug">{user.active ? 'active' : 'inactive'}</span>
                          <div className="post-row-stats">
                            <span>{user.lastLoginAt ? `last login ${timeAgo(user.lastLoginAt)}` : 'never logged in'}</span>
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
