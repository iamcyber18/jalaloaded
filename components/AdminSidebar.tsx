'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminSession } from '@/components/useAdminSession';

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`nav-item ${active ? 'active' : ''}`}>
      <div className="nav-dot"></div>
      {label}
    </Link>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAdminSession();

  const profileName = session?.displayName || 'Admin';
  const profileInitials = profileName.slice(0, 2).toUpperCase();
  const isSubAdmin = session?.role === 'sub-admin';
  const postsLabel = loading ? 'Posts' : isSubAdmin ? 'My Posts' : 'All Posts';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="admin-sidebar">
      <div className="logo-area">
        <div className="logo">JALALOADED</div>
        <div className="logo-sub">Admin Panel</div>
      </div>

      <div className="nav-section">Content</div>
      {isSubAdmin && <NavLink href="/admin/dashboard" label="Dashboard" active={pathname === '/admin/dashboard'} />}
      <NavLink href="/admin" label="New Post" active={pathname === '/admin'} />
      <NavLink href="/admin/posts" label={postsLabel} active={pathname === '/admin/posts'} />

      <div className="nav-section">Manage</div>
      {session?.role === 'admin' && <NavLink href="/admin/users" label="Sub Admins" active={pathname === '/admin/users'} />}
      {session?.role === 'admin' && <NavLink href="/admin/adverts" label="Adverts" active={pathname === '/admin/adverts'} />}
      {isSubAdmin && <NavLink href="/admin/account" label="Change Password" active={pathname === '/admin/account'} />}

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
  );
}
