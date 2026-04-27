export default function Footer() {
  return (
    <footer className="footer">
      <div>
        <img src="/images/jalaloadedlogo.png" alt="Jalaloaded" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>
          © {new Date().getFullYear()} Jalaloaded. All rights reserved.
        </div>
      </div>
      <div className="footer-links">
        <div className="footer-link">Home</div>
        <div className="footer-link">Blog</div>
        <div className="footer-link">Music</div>
        <div className="footer-link">Videos</div>
        <div className="footer-link">Privacy</div>
        <div className="footer-link">Contact</div>
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
