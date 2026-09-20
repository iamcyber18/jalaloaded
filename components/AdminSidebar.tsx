'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CalendarClock,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Music2,
  Radio,
  Settings,
  UsersRound,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAdminSession } from '@/components/useAdminSession';
import IdleLogoutGuard from '@/components/IdleLogoutGuard';

type NavItemProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick?: () => void;
};

function NavItem({ href, label, icon: Icon, active, onClick }: NavItemProps) {
  return (
    <Link href={href} className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <Icon className="nav-icon" size={16} strokeWidth={1.8} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

function NavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="nav-group" aria-label={title}>
      <div className="nav-section">{title}</div>
      <div className="nav-group-items">{children}</div>
    </section>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAdminSession();
  const [isOpen, setIsOpen] = useState(false);

  const profileName = session?.displayName || 'Admin';
  const profileInitials = profileName.slice(0, 2).toUpperCase();
  const isAdmin = session?.role === 'admin';
  const postsLabel = loading ? 'Posts' : isAdmin ? 'All Posts' : 'My Posts';

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const closeMenu = () => setIsOpen(false);

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle ESC key and lock body scroll when sidebar drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  return (
    <>
      <IdleLogoutGuard />

      {/* Mobile Backdrop Overlay */}
      <div
        className={`admin-sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <aside className="admin-sidebar">
        {/* Desktop Top Brand / Mobile Header Bar */}
        <div className="logo-area">
          <div className="admin-brand">
            <img src="/images/jalaloadedlogo.png" alt="Jalaloaded" className="admin-logo" />
            <div className="logo-sub">Admin workspace</div>
          </div>
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setIsOpen(true)}
            aria-label="Open navigation sidebar"
            aria-expanded={isOpen}
          >
            <Menu size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Sidebar Navigation (Desktop Fixed / Mobile Slide-in Drawer) */}
        <div
          className={`nav-links-container ${isOpen ? 'open' : ''}`}
          role="dialog"
          aria-modal={isOpen ? 'true' : undefined}
          aria-label="Admin Navigation"
        >
          {/* Mobile Drawer Header */}
          <div className="mobile-sidebar-header">
            <div className="admin-brand">
              <img src="/images/jalaloadedlogo.png" alt="Jalaloaded" className="admin-logo" />
              <div className="logo-sub">Admin workspace</div>
            </div>
            <button
              type="button"
              className="mobile-sidebar-close-btn"
              onClick={closeMenu}
              aria-label="Close navigation sidebar"
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>

          <nav className="admin-navigation" aria-label="Admin navigation">
            <NavGroup title="Overview">
              <NavItem href="/admin/dashboard" label="Dashboard" icon={LayoutDashboard} active={pathname === '/admin/dashboard'} onClick={closeMenu} />
            </NavGroup>

            <NavGroup title="Publishing">
              <NavItem href="/admin" label="Create Post" icon={FilePlus2} active={pathname === '/admin'} onClick={closeMenu} />
              <NavItem href="/admin/posts" label={postsLabel} icon={FileText} active={pathname === '/admin/posts'} onClick={closeMenu} />
              {isAdmin && <NavItem href="/admin/live" label="Live Stream" icon={Radio} active={pathname === '/admin/live'} onClick={closeMenu} />}
              {isAdmin && <NavItem href="/admin/videos" label="Videos" icon={Video} active={pathname === '/admin/videos'} onClick={closeMenu} />}
            </NavGroup>

            {isAdmin && (
              <NavGroup title="Music">
                <NavItem href="/admin/music" label="Music Library" icon={Music2} active={pathname === '/admin/music'} onClick={closeMenu} />
                <NavItem href="/admin/artists" label="Artists" icon={UsersRound} active={pathname === '/admin/artists'} onClick={closeMenu} />
                <NavItem href="/admin/upcoming" label="Upcoming Releases" icon={CalendarClock} active={pathname === '/admin/upcoming'} onClick={closeMenu} />
              </NavGroup>
            )}

            <NavGroup title="Administration">
              {isAdmin && <NavItem href="/admin/adverts" label="Adverts" icon={Megaphone} active={pathname === '/admin/adverts'} onClick={closeMenu} />}
              {isAdmin && <NavItem href="/admin/newsletter" label="Newsletter" icon={Mail} active={pathname === '/admin/newsletter'} onClick={closeMenu} />}
              {isAdmin && <NavItem href="/admin/users" label="Team" icon={UsersRound} active={pathname === '/admin/users'} onClick={closeMenu} />}
              <NavItem href="/admin/account" label="Account Settings" icon={Settings} active={pathname === '/admin/account'} onClick={closeMenu} />
            </NavGroup>
          </nav>

          <div className="author-area">
            <div className="author-row">
              <div
                className="av"
                style={{
                  background: (session as any)?.profileImageUrl ? `url(${(session as any).profileImageUrl}) center/cover` : 'var(--orange)',
                  color: (session as any)?.profileImageUrl ? 'transparent' : '#fff',
                }}
              >
                {!(session as any)?.profileImageUrl && profileInitials}
              </div>
              <div className="admin-profile-copy">
                <div className="av-name">{profileName}</div>
                <div className="av-role">{isAdmin ? 'Administrator' : 'Sub-admin'}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={13} strokeWidth={2} aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
