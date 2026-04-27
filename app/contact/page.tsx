'use client';

import { useState } from 'react';
import Head from 'next/head';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (status !== 'idle') setStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus('error');
      setFeedbackMsg('Name, email, and message are required.');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setFeedbackMsg(data.message || 'Message sent successfully!');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
        setFeedbackMsg(data.error || 'Failed to send message.');
      }
    } catch (err) {
      setStatus('error');
      setFeedbackMsg('An error occurred. Please try again later.');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.3s ease',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px'
  };

  return (
    <div className="jlh min-h-screen" style={{ paddingBottom: '60px' }}>
      <title>Contact Us - Jalaloaded</title>
      
      {/* Hero Section */}
      <div style={{ background: 'linear-gradient(to bottom, rgba(255, 107, 0, 0.15), transparent)', paddingTop: '60px', paddingBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '56px', color: '#fff', margin: '0 0 10px 0', letterSpacing: '2px' }}>
          Get In <span style={{ color: 'var(--orange, #FF6B00)' }}>Touch</span>
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', maxWidth: '500px', margin: '0 auto', fontSize: '15px', lineHeight: '1.6', padding: '0 20px' }}>
          Have a question, music submission, or advert inquiry? Fill out the form below and the Jalaloaded team will get back to you shortly.
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
          
          {/* Contact Info */}
          <div>
            <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>Contact Information</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 107, 0, 0.1)', color: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Us</div>
                <div style={{ fontSize: '16px', color: '#fff', fontWeight: '500' }}>jalaloaded.new@gmail.com</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 107, 0, 0.1)', color: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Call / WhatsApp</div>
                <div style={{ fontSize: '16px', color: '#fff', fontWeight: '500' }}>07051978758, 09047527504</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 107, 0, 0.1)', color: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Location</div>
                <div style={{ fontSize: '16px', color: '#fff', fontWeight: '500' }}>Jalingo, Taraba State.</div>
              </div>
            </div>

            <div style={{ background: '#111', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#fff' }}>Music Submissions 🎵</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>
                Want your track featured on Jalaloaded? Please include a streaming link (Spotify/Apple Music) or an MP3 attachment link in your message.
              </p>
            </div>
          </div>

          {/* Form */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Your Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} placeholder="John Doe" disabled={status === 'loading'} required />
                </div>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} placeholder="john@example.com" disabled={status === 'loading'} required />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Subject</label>
                <input type="text" name="subject" value={formData.subject} onChange={handleChange} style={inputStyle} placeholder="e.g. Music Submission / Advert" disabled={status === 'loading'} />
              </div>

              <div>
                <label style={labelStyle}>Your Message *</label>
                <textarea name="message" value={formData.message} onChange={handleChange} style={{ ...inputStyle, resize: 'vertical', minHeight: '180px' }} placeholder="How can we help you today?" disabled={status === 'loading'} required />
              </div>

              <button 
                type="submit" 
                disabled={status === 'loading'}
                style={{ 
                  padding: '16px', 
                  fontSize: '16px', 
                  background: 'var(--orange, #FF6B00)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: status === 'loading' ? 0.7 : 1,
                  marginTop: '8px'
                }}
              >
                {status === 'loading' ? 'Sending Message...' : 'Send Message'}
              </button>

              {status === 'success' && <div style={{ color: '#4ade80', fontSize: '14px', padding: '16px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.2)', textAlign: 'center' }}>{feedbackMsg}</div>}
              {status === 'error' && <div style={{ color: '#ff4d4d', fontSize: '14px', padding: '16px', background: 'rgba(255, 77, 77, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 77, 77, 0.2)', textAlign: 'center' }}>{feedbackMsg}</div>}
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
