'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import AdminSidebar from '@/components/AdminSidebar';
import { useAdminSession } from '@/components/useAdminSession';

export default function AdminAccountPage() {
  const { session, loading, refreshSession } = useAdminSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const { uploadAdminAsset } = await import('@/lib/adminUpload');
      const data = await uploadAdminAsset(file, 'image', setProgress);
      
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImageUrl: data.url }),
      });

      if (res.ok) {
        toast.success('Profile picture updated!');
        refreshSession();
      } else {
        toast.error('Failed to update profile picture.');
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

  const isEnvAdmin = session?.userId === 'env-admin';

  return (
    <div className="jl">
      <AdminSidebar />

      <div className="main">
        <div className="topbar">
          <div>
            <div className="page-title">Account Settings</div>
            <div className="admin-subtitle">Manage your profile and security.</div>
          </div>
        </div>

        <div className="post-manager">
          {loading ? (
            <div className="post-empty-card">Loading account details...</div>
          ) : (
            <div className="post-manager-grid">
              {/* Left Column: Profile */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Profile Card */}
                <div className="form-card">
                  <div className="side-title">Public Profile</div>
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginTop: '20px' }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ 
                        width: '100px', height: '100px', borderRadius: '50%', 
                        background: (session as any)?.profileImageUrl ? `url(${(session as any).profileImageUrl}) center/cover` : 'var(--color-background-tertiary)',
                        border: '2px solid rgba(255,107,0,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px'
                      }}>
                        {!(session as any)?.profileImageUrl && '👤'}
                      </div>
                      <label style={{ 
                        position: 'absolute', bottom: '0', right: '0', 
                        background: '#FF6B00', width: '32px', height: '32px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        border: '3px solid #000'
                      }}>
                        <input type="file" accept="image/*" hidden onChange={handleProfileUpload} disabled={isEnvAdmin} />
                        <span style={{ fontSize: '14px' }}>📸</span>
                      </label>
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{session?.displayName}</div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>@{session?.username}</div>
                      <div style={{ fontSize: '11px', color: '#FF6B00', background: 'rgba(255,107,0,0.1)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontWeight: 600, textTransform: 'uppercase' }}>
                        {session?.role}
                      </div>
                    </div>
                  </div>
                  {uploading && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Uploading profile picture... {progress}%</div>
                      <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: '#FF6B00', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )}
                  {isEnvAdmin && (
                    <div style={{ marginTop: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                      * Profile changes are disabled for the environment-based admin.
                    </div>
                  )}
                </div>

                {/* Password Card */}
                <div className="form-card">
                  <div className="side-title">Change Password</div>
                  {isEnvAdmin ? (
                    <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                      The main admin password is managed from environment settings and cannot be changed here.
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
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
                  )}
                </div>
              </div>

              {/* Right Column: Info */}
              <div className="side-card">
                <div className="side-title">Account Info</div>
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Public Name</div>
                    <div style={{ color: '#fff' }}>{session?.displayName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Username</div>
                    <div style={{ color: '#fff' }}>@{session?.username}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Account ID</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontFamily: 'monospace' }}>{session?.userId}</div>
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
