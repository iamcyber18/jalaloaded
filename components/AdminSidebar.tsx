'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminSession } from '@/components/useAdminSession';

function NavLink({ href, label, active, onClick }: { href: string; label: string; active: boolean; onClick?: () => void }) {
  return (
    <Link href={href} className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="nav-dot"></div>
      {label}
    </Link>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAdminSession();
  const [isOpen, setIsOpen] = useState(false);

  const profileName = session?.displayName || 'Admin';
  const profileInitials = profileName.slice(0, 2).toUpperCase();
  const isSubAdmin = session?.role === 'sub-admin';
  const postsLabel = loading ? 'Posts' : isSubAdmin ? 'My Posts' : 'All Posts';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <div className="admin-sidebar">
      <div className="logo-area" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/images/jalaloadedlogo.png" alt="Jalaloaded Logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
          <div className="logo-sub" style={{ marginTop: '4px' }}>Admin Panel</div>
        </div>
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
          style={{ background: 'none', border: 'none', color: '#fff', padding: '8px', cursor: 'pointer' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      <div className={`nav-links-container ${isOpen ? 'open' : ''}`}>
        <div className="nav-section">Content</div>
        <NavLink href="/admin/dashboard" label="Dashboard" active={pathname === '/admin/dashboard'} onClick={closeMenu} />
        <NavLink href="/admin" label="New Post" active={pathname === '/admin'} onClick={closeMenu} />
        <NavLink href="/admin/posts" label={postsLabel} active={pathname === '/admin/posts'} onClick={closeMenu} />
        {session?.role === 'admin' && <NavLink href="/admin/music" label="Music" active={pathname === '/admin/music'} onClick={closeMenu} />}
        {session?.role === 'admin' && <NavLink href="/admin/artists" label="Artists" active={pathname === '/admin/artists'} onClick={closeMenu} />}

        <div className="nav-section">Manage</div>
        {session?.role === 'admin' && <NavLink href="/admin/newsletter" label="Newsletter" active={pathname === '/admin/newsletter'} onClick={closeMenu} />}
        {session?.role === 'admin' && <NavLink href="/admin/users" label="Sub Admins" active={pathname === '/admin/users'} onClick={closeMenu} />}
        {session?.role === 'admin' && <NavLink href="/admin/adverts" label="Adverts" active={pathname === '/admin/adverts'} onClick={closeMenu} />}
        {isSubAdmin && <NavLink href="/admin/account" label="Change Password" active={pathname === '/admin/account'} onClick={closeMenu} />}

        <div className="author-area">
          <div className="author-row">
            <div className="av">{profileInitials}</div>
            <div>
              <div className="av-name">{profileName}</div>
              <div className="av-role">{isSubAdmin ? 'Sub-admin' : 'Administrator'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
