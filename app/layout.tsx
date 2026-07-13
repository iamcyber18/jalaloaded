import type { Metadata } from 'next'
import AppShell from '@/components/AppShell'
import Toast from '@/components/Toast'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://jalaloaded.vercel.app'),
  title: 'Jalaloaded — Latest Posts, Music, Videos & Live Scores',
  description: 'Your go-to spot for the freshest updates, music drops, and street vibes from Jalal and Co-friend.',
  icons: {
    icon: '/images/jalaloadedlogo.png',
    apple: '/images/jalaloadedlogo.png',
  },
  openGraph: {
    title: 'Jalaloaded — Latest Posts, Music, Videos & Live Scores',
    description: 'Your go-to spot for the freshest updates, music drops, and street vibes.',
    images: ['/images/jalaloadedlogo.png'],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}


const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
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
