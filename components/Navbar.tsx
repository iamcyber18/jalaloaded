'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/music', label: 'Music' },
    { href: '/videos', label: 'Videos' },
    { href: '/about', label: 'About' },
  ];

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo">JALALOADED</Link>
      
      <div className="nav-links hidden md:flex">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`nl ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input 
          type="text" 
          placeholder="Search..." 
          className="nav-search"
        />
      </div>
    </nav>
  );
}
