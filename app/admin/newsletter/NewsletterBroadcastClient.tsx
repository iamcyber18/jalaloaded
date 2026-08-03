'use client';

import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';

export default function NewsletterBroadcastClient({ initialCount }: { initialCount: number }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  
  // Image Upload Modal States
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageAltInput, setImageAltInput] = useState('Newsletter image');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Formatting helper to insert tags or markdown into textarea
  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody((current) => current + `${prefix}${defaultText}${suffix}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end);

    let replacement = '';
    let newCursorStart = start;
    let newCursorEnd = end;

    if (selectedText.length > 0) {
      replacement = `${prefix}${selectedText}${suffix}`;
      newCursorStart = start + prefix.length;
      newCursorEnd = start + prefix.length + selectedText.length;
    } else {
      replacement = `${prefix}${defaultText}${suffix}`;
      newCursorStart = start + prefix.length;
      newCursorEnd = start + prefix.length + defaultText.length;
    }

    const updatedText = currentText.substring(0, start) + replacement + currentText.substring(end);
    setBody(updatedText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorStart, newCursorEnd);
    }, 0);
  };

  // Device File Upload Handler
  const handleDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadProgress(0);

    try {
      const { uploadAdminAsset } = await import('@/lib/adminUpload');
      const data = await uploadAdminAsset(file, 'image', setUploadProgress);
      setImageUrlInput(data.url);
      toast.success('Image uploaded successfully! 🖼️');
    } catch {
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleConfirmInsertImage = () => {
    if (!imageUrlInput.trim()) {
      toast.error('Please select an image file or enter an image URL');
      return;
    }
    const alt = imageAltInput.trim() || 'Newsletter image';
    insertFormatting(`\n\n![${alt}](${imageUrlInput.trim()})\n\n`, '', '');
    setShowImageModal(false);
    setImageUrlInput('');
    setImageAltInput('Newsletter image');
  };


  // Add CTA Button dialog
  const handleAddButton = () => {
    const label = prompt('Enter Button Text (e.g. Listen Now or Read Article):', 'Download MP3') || 'Click Here';
    const url = prompt('Enter Destination Link URL:', 'https://jalaloaded.vercel.app') || 'https://jalaloaded.vercel.app';
    const buttonHtml = `\n\n<div style="text-align: center; margin: 24px 0;"><a href="${url}" target="_blank" style="background: #FF6B00; color: #ffffff; padding: 13px 28px; border-radius: 24px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; font-family: Arial, sans-serif; box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);">${label}</a></div>\n\n`;
    insertFormatting(buttonHtml, '', '');
  };

  // Preset Template Starters
  const loadMusicTemplate = () => {
    setSubject('🎵 New Music Drop: [Artist Name] - [Song Title]');
    setBody(
      `## **New Music Alert!**\n\nFresh vibes just dropped on Jalaloaded! Check out the brand new single by **[Artist Name]** titled **"[Song Title]"**.\n\n![Song Cover Art](https://jalaloaded.vercel.app/images/jalaloadedlogo.png)\n\n> "This track is currently trending across Nigeria. Don't miss out on the hottest sound of the week!"\n\n### **Song Details:**\n- **Artist:** [Artist Name]\n- **Track Title:** [Song Title]\n- **Category:** Afrobeats / Music\n\n<div style="text-align: center; margin: 24px 0;"><a href="https://jalaloaded.vercel.app/music" target="_blank" style="background: #FF6B00; color: #ffffff; padding: 13px 28px; border-radius: 24px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; font-family: Arial, sans-serif;">🎧 Listen & Download MP3 Now</a></div>\n\nEnjoy the music and share with friends!`
    );
  };

  const loadNewsTemplate = () => {
    setSubject('📰 Trending Story: [Insert Headline Here]');
    setBody(
      `## **[Insert Main Headline Here]**\n\nHere is the latest breaking update from Jalaloaded News & Entertainment.\n\n![Headline Feature Image](https://jalaloaded.vercel.app/images/jalaloadedlogo.png)\n\nWrite a short catchy summary of what happened here. Give your readers the key highlights and quotes.\n\n<div style="text-align: center; margin: 24px 0;"><a href="https://jalaloaded.vercel.app/blog" target="_blank" style="background: #FF6B00; color: #ffffff; padding: 13px 28px; border-radius: 24px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; font-family: Arial, sans-serif;">📖 Read Full Article on Jalaloaded</a></div>\n\nStay tuned for more updates!`
    );
  };

  // Parse Markdown & custom HTML tags into full responsive email HTML
  const parseEmailContent = (text: string): string => {
    if (!text.trim()) return '<span style="color: #aaa; font-style: italic;">Your newsletter email content will preview here...</span>';

    let html = text;

    // Convert markdown images ![alt](url) -> <div style="text-align:center;margin:18px 0;"><img src="url" alt="alt" style="max-width:100%;height:auto;border-radius:8px;display:inline-block;" /></div>
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div style="text-align:center;margin:18px 0;"><img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:8px;display:inline-block;box-shadow:0 2px 10px rgba(0,0,0,0.1);" /></div>');

    // Convert markdown links [text](url) -> <a href="url" style="color:#FF6B00;text-decoration:underline;">text</a>
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#FF6B00;text-decoration:underline;" target="_blank">$1</a>');

    // Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#111;font-weight:700;">$1</strong>');

    // Italic *text*
    html = html.replace(/\*([^*]+)\*/g, '<em style="font-style:italic;">$1</em>');

    // Headings ## H2, ### H3
    html = html.replace(/^##\s+(.*)$/gm, '<h2 style="font-size:20px;font-weight:800;color:#111;margin:20px 0 12px 0;border-left:4px solid #FF6B00;padding-left:10px;line-height:1.3;">$1</h2>');
    html = html.replace(/^###\s+(.*)$/gm, '<h3 style="font-size:17px;font-weight:700;color:#222;margin:16px 0 8px 0;">$1</h3>');

    // Blockquotes > text
    html = html.replace(/^>\s+(.*)$/gm, '<blockquote style="background:#FFF5EE;border-left:4px solid #FF6B00;padding:12px 16px;margin:16px 0;font-style:italic;color:#444;border-radius:0 8px 8px 0;">$1</blockquote>');

    // Bullet lists - item
    html = html.replace(/^\s*-\s+(.*)$/gm, '<li style="margin-bottom:6px;color:#333;list-style-type:circle;">$1</li>');

    // Dividers ---
    html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #eaeaea;margin:24px 0;" />');

    // Split paragraphs
    const paragraphs = html.split(/\n\n+/);
    return paragraphs
      .map((p) => {
        const trimmed = p.trim();
        if (!trimmed) return '';
        if (
          trimmed.startsWith('<h') ||
          trimmed.startsWith('<blockquote') ||
          trimmed.startsWith('<div') ||
          trimmed.startsWith('<hr') ||
          trimmed.startsWith('<li')
        ) {
          return trimmed;
        }
        return `<p style="font-size:15px;line-height:1.65;color:#333333;margin:0 0 14px 0;">${trimmed.replace(/\n/g, '<br/>')}</p>`;
      })
      .filter(Boolean)
      .join('');
  };

  // Build complete HTML email wrapper for Nodemailer
  const buildFullHtmlEmail = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;padding:20px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#0D0D0D;padding:24px;text-align:center;border-bottom:3px solid #FF6B00;">
              <img src="https://jalaloaded.vercel.app/images/jalaloadedlogo.png" alt="Jalaloaded" style="height:54px;width:auto;max-width:100%;display:inline-block;" />
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;background-color:#ffffff;color:#333333;font-size:15px;line-height:1.65;">
              ${parseEmailContent(body)}
            </td>
          </tr>
          <tr>
            <td style="background-color:#fafafa;padding:20px 24px;border-top:1px solid #eaeaea;text-align:center;">
              <p style="font-size:12px;color:#888888;margin:0 0 6px 0;font-family:Arial,sans-serif;">
                You are receiving this because you subscribed to updates on <strong>Jalaloaded</strong>.
              </p>
              <p style="font-size:11px;color:#aaaaaa;margin:0;font-family:Arial,sans-serif;">
                &copy; ${new Date().getFullYear()} Jalaloaded. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setStatus('error');
      setMessage('Subject and email content are required.');
      return;
    }

    if (!confirm(`Are you sure you want to send this newsletter to ${initialCount} subscribers?`)) return;

    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), html: buildFullHtmlEmail() }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(`Success! Email broadcast delivered to ${data.recipients} subscribers.`);
        setSubject('');
        setBody('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to send broadcast.');
      }
    } catch {
      setStatus('error');
      setMessage('An error occurred. Check your network connection.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1280px' }}>

      {/* STAT CARD & QUICK TEMPLATES */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-background-secondary, #1a1a1a)', padding: '20px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255, 107, 0, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>
            📧
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary, #888)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Subscribers Count</div>
            <div style={{ fontSize: '32px', fontFamily: '"Bebas Neue", sans-serif', color: 'var(--orange, #FF6B00)', lineHeight: '1' }}>{initialCount}</div>
          </div>
        </div>

        {/* QUICK STARTERS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', textTransform: 'uppercase' }}>Quick Templates:</span>
          <button type="button" onClick={loadMusicTemplate} className="rich-btn text-btn" style={{ background: 'rgba(255,107,0,0.15)', borderColor: 'rgba(255,107,0,0.3)', color: '#FF6B00' }}>
            🎵 Music Release
          </button>
          <button type="button" onClick={loadNewsTemplate} className="rich-btn text-btn" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
            📰 Blog / News
          </button>
          <button type="button" onClick={() => { setSubject(''); setBody(''); }} className="rich-btn text-btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>
            🧹 Clear
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', alignItems: 'start' }}>

        {/* EMAIL EDITOR FORM */}
        <div className="rich-editor-card" style={{ background: 'var(--color-background-secondary, #1a1a1a)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>✉️ Email Newsletter Editor</h3>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Rich HTML Emails</span>
          </div>

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* SUBJECT */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Email Subject
              </label>
              <input
                type="text"
                placeholder="e.g. 🎵 New Music Drop: Burna Boy - Higher!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={status === 'loading'}
                required
                className="rich-textarea"
                style={{ minHeight: 'auto', padding: '10px 12px', fontSize: '14px' }}
              />
            </div>

            {/* FORMATTING TOOLBAR */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Email Content
              </label>

              <div className="rich-toolbar" style={{ marginBottom: '8px' }}>
                <div className="rich-toolbar-group">
                  <button type="button" className="rich-btn" title="Bold" onClick={() => insertFormatting('**', '**', 'bold text')}>
                    <strong>B</strong>
                  </button>
                  <button type="button" className="rich-btn" title="Italic" onClick={() => insertFormatting('*', '*', 'italic text')}>
                    <em>I</em>
                  </button>
                </div>

                <div className="rich-toolbar-sep"></div>

                <div className="rich-toolbar-group">
                  <button type="button" className="rich-btn text-btn" title="Heading 2" onClick={() => insertFormatting('## ', '', 'Main Title')}>
                    H2
                  </button>
                  <button type="button" className="rich-btn text-btn" title="Subheading 3" onClick={() => insertFormatting('### ', '', 'Sub Title')}>
                    H3
                  </button>
                </div>

                <div className="rich-toolbar-sep"></div>

                <div className="rich-toolbar-group">
                  <button type="button" className="rich-btn text-btn" title="Add Image" onClick={() => setShowImageModal(true)} style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00' }}>
                    🖼️ Image
                  </button>
                  <button type="button" className="rich-btn text-btn" title="Add CTA Button" onClick={handleAddButton} style={{ background: 'var(--orange, #FF6B00)', color: '#fff' }}>
                    🔘 Button
                  </button>
                </div>


                <div className="rich-toolbar-sep"></div>

                <div className="rich-toolbar-group">
                  <button type="button" className="rich-btn" title="Bulleted List" onClick={() => insertFormatting('- ', '', 'List item')}>
                    &bull;
                  </button>
                  <button type="button" className="rich-btn" title="Quote Block" onClick={() => insertFormatting('> ', '', 'Quote text')}>
                    &ldquo;
                  </button>
                  <button type="button" className="rich-btn" title="Link" onClick={() => {
                    const url = prompt('Enter Link URL:', 'https://');
                    if (url) insertFormatting('[', `](${url})`, 'link text');
                  }}>
                    🔗
                  </button>
                  <button type="button" className="rich-btn" title="Divider" onClick={() => insertFormatting('\n\n---\n\n', '', '')}>
                    —
                  </button>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                className="rich-textarea"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email body here... Add bold text, headings, images, and CTA buttons using the toolbar."
                disabled={status === 'loading'}
                required
                style={{ minHeight: '260px' }}
              />
            </div>

            {/* SEND BUTTON */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingTop: '8px' }}>
              <button
                type="submit"
                disabled={status === 'loading' || initialCount === 0}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  background: 'var(--orange, #FF6B00)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (status === 'loading' || initialCount === 0) ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: (status === 'loading' || initialCount === 0) ? 0.6 : 1,
                  boxShadow: '0 4px 15px rgba(255, 107, 0, 0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                {status === 'loading' ? '🚀 Sending Broadcast...' : '🚀 Blast Email to All Subscribers'}
              </button>

              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                {body.length} chars
              </span>
            </div>

            {status === 'success' && <div style={{ color: '#4ade80', fontSize: '14px', padding: '12px 16px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.2)' }}>{message}</div>}
            {status === 'error' && <div style={{ color: '#ff4d4d', fontSize: '14px', padding: '12px 16px', background: 'rgba(255, 77, 77, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 77, 77, 0.2)' }}>{message}</div>}
          </form>
        </div>

        {/* LIVE EMAIL PREVIEW PANEL */}
        <div style={{ background: '#eef1f5', color: '#333', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px' }}>
              👁️ Live Email Client Preview
            </div>

            {/* DEVICE TOGGLE */}
            <div style={{ display: 'flex', gap: '4px', background: '#cbd5e1', padding: '2px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: 'none',
                  background: previewDevice === 'desktop' ? '#fff' : 'transparent',
                  color: previewDevice === 'desktop' ? '#FF6B00' : '#475569',
                  cursor: 'pointer'
                }}
              >
                💻 Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: 'none',
                  background: previewDevice === 'mobile' ? '#fff' : 'transparent',
                  color: previewDevice === 'mobile' ? '#FF6B00' : '#475569',
                  cursor: 'pointer'
                }}
              >
                📱 Mobile
              </button>
            </div>
          </div>

          {/* EMAIL HEADER SNAPSHOT */}
          <div style={{ background: '#fff', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
            <div style={{ marginBottom: '4px' }}><strong style={{ color: '#334155' }}>From:</strong> Jalaloaded &lt;noreply@jalaloaded.com&gt;</div>
            <div style={{ marginBottom: '6px' }}><strong style={{ color: '#334155' }}>To:</strong> {initialCount} Subscribers (BCC)</div>
            <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: 800, paddingTop: '4px', borderTop: '1px solid #f1f5f9' }}>
              {subject || 'Subject line preview...'}
            </div>
          </div>

          {/* SIMULATED EMAIL CONTAINER */}
          <div style={{
            maxWidth: previewDevice === 'mobile' ? '360px' : '100%',
            margin: '0 auto',
            background: '#ffffff',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            transition: 'max-width 0.25s ease'
          }}>
            {/* EMAIL BRANDING HEADER */}
            <div style={{ backgroundColor: '#0D0D0D', padding: '20px', textAlign: 'center', borderBottom: '3px solid #FF6B00' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/jalaloadedlogo.png" alt="Jalaloaded Logo" style={{ height: '48px', width: 'auto', maxWidth: '100%', display: 'inline-block' }} />
            </div>

            {/* EMAIL BODY CONTENT PREVIEW */}
            <div
              style={{ padding: '24px 20px', fontFamily: 'Arial, sans-serif', color: '#333333', minHeight: '220px' }}
              dangerouslySetInnerHTML={{ __html: parseEmailContent(body) }}
            />

            {/* EMAIL FOOTER */}
            <div style={{ backgroundColor: '#fafafa', padding: '16px 20px', borderTop: '1px solid #eaeaea', textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#888888', margin: '0 0 4px 0', fontFamily: 'Arial, sans-serif' }}>
                You are receiving this because you subscribed to updates on <strong>Jalaloaded</strong>.
              </p>
              <p style={{ fontSize: '10px', color: '#aaaaaa', margin: 0, fontFamily: 'Arial, sans-serif' }}>
                &copy; {new Date().getFullYear()} Jalaloaded. All rights reserved.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* IMAGE UPLOAD & INSERT MODAL */}
      {showImageModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🖼️ Add Image to Newsletter
              </div>
              <button 
                type="button"
                onClick={() => setShowImageModal(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            {/* HIDDEN FILE INPUT */}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleDeviceUpload} 
              style={{ display: 'none' }} 
            />

            {/* OPTION 1: DEVICE UPLOAD BOX */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(255, 107, 0, 0.4)',
                background: 'rgba(255, 107, 0, 0.05)',
                borderRadius: '12px',
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: '16px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B00', marginBottom: '4px' }}>
                {uploadingImage ? `Uploading... ${uploadProgress}%` : 'Upload Image from Phone/PC'}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                Click to browse files on your device (JPG, PNG, WEBP)
              </div>
            </div>

            {/* OR DIVIDER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0', opacity: 0.5 }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
              <span style={{ fontSize: '10px', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>OR PASTE LINK</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* OPTION 2: URL INPUT */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                Image Web URL
              </label>
              <input 
                type="text" 
                placeholder="https://jalaloaded.vercel.app/images/..." 
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                style={{
                  width: '100%',
                  background: '#111',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {/* IMAGE DESCRIPTION */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
                Image Caption / Alt Description
              </label>
              <input 
                type="text" 
                placeholder="e.g. Song Artwork or Breaking News Photo" 
                value={imageAltInput}
                onChange={(e) => setImageAltInput(e.target.value)}
                style={{
                  width: '100%',
                  background: '#111',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {/* IMAGE PREVIEW IF URL AVAILABLE */}
            {imageUrlInput && (
              <div style={{ marginBottom: '20px', textAlign: 'center', background: '#0a0a0a', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrlInput} alt="Preview" style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }} />
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setShowImageModal(false)}
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleConfirmInsertImage}
                style={{ background: '#FF6B00', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Insert into Email 🖼️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
