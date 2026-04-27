'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import AdminSidebar from '@/components/AdminSidebar';
import { useAdminSession } from '@/components/useAdminSession';

export default function AdminAccountPage() {
  const { session, loading } = useAdminSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to change password.');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully.');
    } catch {
      toast.error('Something went wrong while changing the password.');
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
            <div className="page-title">Account</div>
            <div className="admin-subtitle">Update your login credentials.</div>
          </div>
        </div>

        <div className="post-manager">
          {loading ? (
            <div className="post-empty-card">Loading account details...</div>
          ) : session?.role !== 'sub-admin' ? (
            <div className="post-empty-card">
              The main admin password is managed from environment settings and cannot be changed here.
            </div>
          ) : (
            <div className="post-manager-grid">
              <div className="form-card">
                <div className="side-title">Change Password</div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  <input
                    className="field-input"
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <input
                    className="field-input"
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <input
                    className="field-input"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button className="btn-publish" type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Update Password'}
                  </button>
                </form>
              </div>

              <div className="side-card">
                <div className="side-title">Account Details</div>
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  <div>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Display Name</strong>
                    <div>{session.displayName}</div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Username</strong>
                    <div>{session.username}</div>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-text-primary)' }}>Role</strong>
                    <div>Sub-admin</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
