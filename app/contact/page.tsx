import type { Metadata } from 'next';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us — Jalaloaded',
  description: 'Get in touch with Jalaloaded. For music submissions, advertisements, sponsorships, or general inquiries, fill out our contact form or reach us via email, phone, or WhatsApp.',
  openGraph: {
    title: 'Contact Us — Jalaloaded',
    description: 'Get in touch with Jalaloaded for music submissions, adverts, and general inquiries.',
    url: 'https://jalaloaded.vercel.app/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="jlh min-h-screen" style={{ paddingBottom: '60px' }}>
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
        <ContactForm />
      </div>
    </div>
  );
}
