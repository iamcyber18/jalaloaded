'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/music', label: 'Music' },
    { href: '/upcoming', label: 'Upcoming' },
    { href: '/videos', label: 'Videos' },
    { href: '/about', label: 'About' },
  ];

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults(null);
      setShowResults(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setResults(data);
        setShowResults(true);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleResultClick = () => {
    setQuery('');
    setResults(null);
    setShowResults(false);
    setMenuOpen(false);
  };

  const totalResults = results
    ? (results.posts?.length || 0) + (results.songs?.length || 0) + (results.videos?.length || 0)
    : 0;

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <Image src="/images/jalaloadedlogo.png" alt="Jalaloaded Logo" width={200} height={64} className="nav-logo-img" priority />
        </Link>

        {/* Desktop links */}
        <div className="nav-links">
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
          {/* Search bar with dropdown */}
          <div className="search-wrapper" ref={searchRef}>
            <div className="search-input-wrap">
              <svg className="search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search posts, music, videos..."
                className="nav-search"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => { if (results && totalResults > 0) setShowResults(true); }}
              />
              {loading && <div className="search-spinner"></div>}
            </div>

            {/* Results dropdown */}
            {showResults && results && (
              <div className="search-dropdown">
                {totalResults === 0 ? (
                  <div className="search-empty">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.4 }}>
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <span>No results found for &ldquo;{query}&rdquo;</span>
                  </div>
                ) : (
                  <>
                    {/* Posts */}
                    {results.posts?.length > 0 && (
                      <div className="search-group">
                        <div className="search-group-label">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          Posts
                        </div>
                        {results.posts.map((post: any) => (
                          <Link
                            key={post._id}
                            href={`/blog/${post.slug}`}
                            className="search-item"
                            onClick={handleResultClick}
                          >
                            {post.media?.find((m: any) => m.type === 'photo')?.url ? (
                              <img src={post.media.find((m: any) => m.type === 'photo').url} alt="" className="search-thumb" />
                            ) : (
                              <div className="search-thumb search-thumb-placeholder">JL</div>
                            )}
                            <div className="search-item-info">
                              <div className="search-item-title">{post.title}</div>
                              <div className="search-item-meta">{post.category}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Songs */}
                    {results.songs?.length > 0 && (
                      <div className="search-group">
                        <div className="search-group-label">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                          Music
                        </div>
                        {results.songs.map((song: any) => (
                          <Link
                            key={song._id}
                            href="/music"
                            className="search-item"
                            onClick={handleResultClick}
                          >
                            <div className="search-thumb search-thumb-music">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                            </div>
                            <div className="search-item-info">
                              <div className="search-item-title">{song.title}</div>
                              <div className="search-item-meta">{song.artist}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Videos */}
                    {results.videos?.length > 0 && (
                      <div className="search-group">
                        <div className="search-group-label">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                          Videos
                        </div>
                        {results.videos.map((video: any) => (
                          <Link
                            key={video._id}
                            href="/videos"
                            className="search-item"
                            onClick={handleResultClick}
                          >
                            <div className="search-thumb search-thumb-video">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            </div>
                            <div className="search-item-info">
                              <div className="search-item-title">{video.title}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hamburger button — only visible on mobile */}
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`ham-bar ${menuOpen ? 'open' : ''}`}></span>
            <span className={`ham-bar ${menuOpen ? 'open' : ''}`}></span>
            <span className={`ham-bar ${menuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
