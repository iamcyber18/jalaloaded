import type { Metadata } from 'next'
import AppShell from '@/components/AppShell'
import Toast from '@/components/Toast'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://jalaloaded.vercel.app'),
  title: {
    default: 'Jalaloaded — Premier Entertainment, Music, Latest News & Live Scores',
    template: '%s | Jalaloaded',
  },
  description: 'Your ultimate hub for the latest music downloads, trending news, viral videos, lifestyle updates, and live football scores.',
  keywords: [
    'Jalaloaded',
    'Jalaloaded Music',
    'Jalaloaded Blog',
    'Jalaloaded Entertainment',
    'Jalaloaded News',
    'Jalaloaded Videos',
    'Jalaloaded Live Scores',
    'Jalaloaded Mp3 Download',
    'Nigerian Music',
    'Afrobeats',
  ],
  authors: [{ name: 'Jalaloaded' }],
  creator: 'Jalaloaded',
  publisher: 'Jalaloaded',
  alternates: {
    canonical: 'https://jalaloaded.vercel.app',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/images/jalaloadedlogo.png',
    apple: '/images/jalaloadedlogo.png',
  },
  openGraph: {
    title: 'Jalaloaded — Premier Entertainment, Music, Latest News & Live Scores',
    description: 'Your ultimate hub for the latest music downloads, trending news, viral videos, lifestyle updates, and live football scores.',
    url: 'https://jalaloaded.vercel.app',
    siteName: 'Jalaloaded',
    images: [{ url: '/images/jalaloadedlogo.png', width: 1200, height: 630, alt: 'Jalaloaded' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jalaloaded — Premier Entertainment, Music, Latest News & Live Scores',
    description: 'Your ultimate hub for the latest music downloads, trending news, viral videos, lifestyle updates, and live football scores.',
    images: ['/images/jalaloadedlogo.png'],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://jalaloaded.vercel.app/#website',
      'url': 'https://jalaloaded.vercel.app',
      'name': 'Jalaloaded',
      'alternateName': ['Jalaloaded Music', 'Jalaloaded Blog', 'Jalaloaded Entertainment'],
      'description': 'Your ultimate hub for the latest music downloads, trending news, viral videos, lifestyle updates, and live football scores.',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': 'https://jalaloaded.vercel.app/blog?q={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }
    },
    {
      '@type': 'Organization',
      '@id': 'https://jalaloaded.vercel.app/#organization',
      'name': 'Jalaloaded',
      'url': 'https://jalaloaded.vercel.app',
      'logo': 'https://jalaloaded.vercel.app/images/jalaloadedlogo.png',
      'contactPoint': [
        {
          '@type': 'ContactPoint',
          'telephone': '+2347051978758',
          'contactType': 'customer service',
          'email': 'jalaloaded.new@gmail.com',
          'availableLanguage': 'English',
          'areaServed': 'NG',
        },
        {
          '@type': 'ContactPoint',
          'telephone': '+2349047527504',
          'contactType': 'customer service',
          'email': 'jalaloaded.new@gmail.com',
          'availableLanguage': 'English',
          'areaServed': 'NG',
        },
      ],
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': 'Jalingo',
        'addressRegion': 'Taraba State',
        'addressCountry': 'NG',
      },
    }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Bebas+Neue&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <AppShell>{children}</AppShell>
        <Toast />
      </body>
    </html>
  )
}
