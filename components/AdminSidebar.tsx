'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

type AdminSidebarProps = {
  currentAuthor?: string;
};

function getProfile(author?: string) {
  if (author === 'jalal') {
    return { initials: 'JA', name: 'Jalal', role: 'Author' };
  }

  if (author === 'co-friend') {
    return { initials: 'CO', name: 'Co-friend', role: 'Author' };
  }

  const fallbackName = (process.env.NEXT_PUBLIC_ADMIN_USERNAME || author || 'Admin').trim();

  return {
    initials: fallbackName.slice(0, 2).toUpperCase(),
    name: fallbackName,
    role: 'Administrator',
  };
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`nav-item ${active ? 'active' : ''}`}>
      <div className="nav-dot"></div>
      {label}
    </Link>
  );
}

export default function AdminSidebar({ currentAuthor }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const profile = getProfile(currentAuthor);

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
      <NavLink href="/admin" label="New Post" active={pathname === '/admin'} />
      <NavLink href="/admin/posts" label="All Posts" active={pathname === '/admin/posts'} />
      <div className="nav-item admin-nav-muted"><div className="nav-dot"></div>Music</div>
      <div className="nav-item admin-nav-muted"><div className="nav-dot"></div>Videos</div>

      <div className="nav-section">Manage</div>
      <div className="nav-item admin-nav-muted"><div className="nav-dot"></div>Media Library</div>
      <div className="nav-item admin-nav-muted"><div className="nav-dot"></div>Comments</div>
      <NavLink href="/admin/adverts" label="Adverts" active={pathname === '/admin/adverts'} />
      <div className="nav-item admin-nav-muted"><div className="nav-dot"></div>Settings</div>

      <div className="author-area">
        <div className="author-row">
          <div className="av">{profile.initials}</div>
          <div>
            <div className="av-name">{profile.name}</div>
            <div className="av-role">{profile.role}</div>
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
