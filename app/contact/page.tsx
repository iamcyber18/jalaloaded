import type { Metadata } from 'next';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us & About — Jalaloaded',
  description: 'Get in touch with Jalaloaded. Learn about our mission, music promotion, advertisements, sponsorships, or general inquiries. Reach us via email, phone, or WhatsApp.',
  openGraph: {
    title: 'Contact Us & About Jalaloaded',
    description: 'Get in touch with Jalaloaded for music submissions, adverts, and general inquiries.',
    url: 'https://jalaloaded.vercel.app/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="jlh min-h-screen" style={{ paddingBottom: '60px' }}>
      
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(255, 107, 0, 0.15) 0%, rgba(13, 13, 13, 0.95) 100%)',
        paddingTop: '50px', paddingBottom: '40px', textAlign: 'center',
        borderBottom: '1px solid rgba(255,107,0,0.15)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
          width: '500px', height: '300px',
          background: 'radial-gradient(circle, rgba(255,107,0,0.18) 0%, transparent 70%)',
          pointerEvents: 'none', filter: 'blur(50px)'
        }} />
        <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '54px', color: '#fff', margin: '0 0 10px 0', letterSpacing: '2px', textShadow: '0 0 20px rgba(255,107,0,0.3)' }}>
          CONTACT & <span style={{ color: 'var(--orange, #FF6B00)' }}>ABOUT US</span>
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', maxWidth: '580px', margin: '0 auto', fontSize: '15px', lineHeight: '1.6', padding: '0 20px', fontFamily: '"Syne", sans-serif' }}>
          Welcome to <strong style={{ color: '#fff' }}>Jalaloaded</strong> — your ultimate hub for music downloads, viral entertainment, trending news, and live sports. Have a question or inquiry? We&apos;d love to connect!
        </p>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 20px 0' }}>

        {/* ABOUT JALALOADED SECTION */}
        <div style={{ marginBottom: '40px' }}>
          <div className="sec-hdr" style={{ marginBottom: '16px' }}>
            <div className="sec-title">
              <span className="sec-icon">🔥</span>
              <div className="sec-line"></div>
              About Jalaloaded
            </div>
          </div>
          <div className="s-card" style={{ padding: '28px', fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, borderRadius: '16px', background: 'linear-gradient(180deg, #161616 0%, #0d0d0d 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#fff' }}>Jalaloaded</strong> is a premier digital entertainment platform dedicated to delivering fast, accurate, and high-quality content across music streaming, entertainment news, lifestyle, and live sports coverage.
            </p>
            <p style={{ marginBottom: '16px' }}>
              Born from a passion for amplifying creative talent, we bridge the gap between emerging artists, mainstream culture, and millions of passionate fans worldwide.
            </p>
          </div>
        </div>

        {/* WHAT WE DO GRID */}
        <div style={{ marginBottom: '44px' }}>
          <div className="sec-hdr" style={{ marginBottom: '16px' }}>
            <div className="sec-title">
              <span className="sec-icon">🚀</span>
              <div className="sec-line"></div>
              What We Do
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div className="s-card" style={{ padding: '24px', borderRadius: '14px' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>🎵</div>
              <strong style={{ color: 'var(--orange, #FF6B00)', display: 'block', fontSize: '16px', marginBottom: '6px', fontFamily: '"Syne", sans-serif' }}>
                Music Promotion & Distribution
              </strong>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>
                Host and promote your latest singles, albums, and mixtapes to reach thousands of active music lovers daily.
              </p>
            </div>

            <div className="s-card" style={{ padding: '24px', borderRadius: '14px' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>🎬</div>
              <strong style={{ color: 'var(--orange, #FF6B00)', display: 'block', fontSize: '16px', marginBottom: '6px', fontFamily: '"Syne", sans-serif' }}>
                Video Hosting & Premieres
              </strong>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>
                Exclusive music video premieres, viral skits, interviews, and high-definition video hosting.
              </p>
            </div>

            <div className="s-card" style={{ padding: '24px', borderRadius: '14px' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>⚽</div>
              <strong style={{ color: 'var(--orange, #FF6B00)', display: 'block', fontSize: '16px', marginBottom: '6px', fontFamily: '"Syne", sans-serif' }}>
                Live Football & News
              </strong>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>
                Real-time live match scores, league updates, trending editorials, and breaking news.
              </p>
            </div>
          </div>
        </div>

        {/* CONTACT FORM SECTION */}
        <div>
          <div className="sec-hdr" style={{ marginBottom: '16px' }}>
            <div className="sec-title">
              <span className="sec-icon">📩</span>
              <div className="sec-line"></div>
              Get In Touch With Us
            </div>
          </div>
          <ContactForm />
        </div>

      </div>
    </div>
  );
}
