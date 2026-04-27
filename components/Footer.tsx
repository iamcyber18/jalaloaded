import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <img src="/images/jalaloadedlogo.png" alt="Jalaloaded Logo" style={{ height: '64px', width: 'auto', objectFit: 'contain' }} />
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>
          © {new Date().getFullYear()} Jalaloaded. All rights reserved.
        </div>
      </div>
      <div className="footer-links">
        <Link href="/" className="footer-link" style={{ textDecoration: 'none' }}>Home</Link>
        <Link href="/blog" className="footer-link" style={{ textDecoration: 'none' }}>Blog</Link>
        <Link href="/music" className="footer-link" style={{ textDecoration: 'none' }}>Music</Link>
        <Link href="/videos" className="footer-link" style={{ textDecoration: 'none' }}>Videos</Link>
        <Link href="/privacy" className="footer-link" style={{ textDecoration: 'none' }}>Privacy</Link>
        <Link href="/contact" className="footer-link" style={{ textDecoration: 'none' }}>Contact</Link>
      </div>
      <div className="socials">
        <div className="soc-btn">𝕏</div>
        <div className="soc-btn">in</div>
        <div className="soc-btn">▶</div>
        <div className="soc-btn">📸</div>
      </div>
    </footer>
  );
}
