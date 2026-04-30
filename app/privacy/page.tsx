import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - Jalaloaded',
  description: 'Privacy Policy for Jalaloaded. Learn how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="jlh min-h-screen" style={{ background: 'var(--color-background-tertiary)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '36px', fontWeight: 800, color: 'var(--orange)', marginBottom: '8px' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Last Updated: {currentDate}
          </p>
        </div>

        {/* Content */}
        <div style={{ 
          background: 'var(--color-background-secondary)', 
          padding: '40px', 
          borderRadius: '16px', 
          border: '1px solid var(--color-border-tertiary)',
          color: 'var(--color-text-primary)',
          lineHeight: '1.7',
          fontSize: '15px'
        }}>
          
          <p style={{ marginBottom: '24px' }}>
            Welcome to Jalaloaded! This Privacy Policy describes how we collect, use, and protect your personal information when you visit and use our website. By using Jalaloaded, you agree to the terms outlined in this policy.
          </p>

          <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', fontWeight: 700, marginTop: '32px', marginBottom: '16px', color: '#fff' }}>
            1. Information We Collect
          </h2>
          <ul style={{ paddingLeft: '20px', marginBottom: '24px', listStyleType: 'disc', color: 'var(--color-text-secondary)' }}>
            <li style={{ marginBottom: '8px' }}><strong>Personal Information:</strong> If you sign up for our newsletter, contact us, or leave comments, we may collect your name, email address, and any other information you provide.</li>
            <li style={{ marginBottom: '8px' }}><strong>Usage Data:</strong> We automatically collect information about how you interact with our website, such as your IP address, browser type, pages visited, and time spent on the site.</li>
            <li><strong>Cookies:</strong> We use cookies to enhance your browsing experience, remember your preferences, and analyze site traffic.</li>
          </ul>

          <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', fontWeight: 700, marginTop: '32px', marginBottom: '16px', color: '#fff' }}>
            2. How We Use Your Information
          </h2>
          <p style={{ marginBottom: '12px', color: 'var(--color-text-secondary)' }}>We use the information we collect for the following purposes:</p>
          <ul style={{ paddingLeft: '20px', marginBottom: '24px', listStyleType: 'disc', color: 'var(--color-text-secondary)' }}>
            <li style={{ marginBottom: '8px' }}>To provide, maintain, and improve our services (such as music streaming and downloads).</li>
            <li style={{ marginBottom: '8px' }}>To communicate with you, including responding to inquiries and sending newsletters.</li>
            <li style={{ marginBottom: '8px' }}>To analyze site usage and trends to better understand our audience.</li>
            <li>To detect and prevent fraudulent activities and protect the security of our platform.</li>
          </ul>

          <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', fontWeight: 700, marginTop: '32px', marginBottom: '16px', color: '#fff' }}>
            3. Third-Party Services
          </h2>
          <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
            We may use third-party tools (such as Google Analytics or advertising networks) that collect, monitor, and analyze data to help us improve our services. These third parties have their own privacy policies regarding how they handle your information. We also use third-party services like Cloudinary for media hosting, which processes media files accessed through our platform.
          </p>

          <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', fontWeight: 700, marginTop: '32px', marginBottom: '16px', color: '#fff' }}>
            4. Data Security
          </h2>
          <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
            We take the security of your data seriously and implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, or destruction. However, please note that no method of transmission over the internet or electronic storage is 100% secure.
          </p>

          <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', fontWeight: 700, marginTop: '32px', marginBottom: '16px', color: '#fff' }}>
            5. Your Rights
          </h2>
          <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
            You have the right to request access to the personal information we hold about you, request corrections to inaccurate data, or ask for your data to be deleted. To exercise these rights, please contact us.
          </p>

          <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', fontWeight: 700, marginTop: '32px', marginBottom: '16px', color: '#fff' }}>
            6. Changes to This Policy
          </h2>
          <p style={{ marginBottom: '24px', color: 'var(--color-text-secondary)' }}>
            We may update this Privacy Policy from time to time to reflect changes in our practices or for legal reasons. We encourage you to review this page periodically for any updates.
          </p>

          <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', fontWeight: 700, marginTop: '32px', marginBottom: '16px', color: '#fff' }}>
            7. Contact Us
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            If you have any questions or concerns about this Privacy Policy, please feel free to reach out to us at <Link href="/contact" style={{ color: 'var(--orange)', textDecoration: 'none' }}>our Contact page</Link>.
          </p>

        </div>
      </div>
    </div>
  );
}
