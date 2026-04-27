'use client';

import { useState, useEffect } from 'react';

interface Advert {
  _id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  advertiser: string;
}

export default function AdBanner({ placement = 'blog-inline' }: { placement?: string }) {
  const [ad, setAd] = useState<Advert | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const res = await fetch(`/api/adverts?placement=${placement}&active=true`);
        if (res.ok) {
          const ads = await res.json();
          if (ads.length > 0) {
            // Pick a random ad from the available ones
            const randomAd = ads[Math.floor(Math.random() * ads.length)];
            setAd(randomAd);
          }
        }
      } catch (error) {
        console.error('Failed to load ad:', error);
      }
    };
    fetchAd();
  }, [placement]);

  if (!ad) return null;

  const handleClick = async () => {
    // Track click
    try {
      await fetch(`/api/adverts/${ad._id}`, { method: 'POST' });
    } catch {}
    window.open(ad.linkUrl, '_blank', 'noopener');
  };

  return (
    <div className="ad-banner">
      <div className="ad-label">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>
        </svg>
        Sponsored &bull; {ad.advertiser}
      </div>
      <div className="ad-content" onClick={handleClick} style={{ cursor: 'pointer' }}>
        <img src={ad.imageUrl} alt={ad.title} className="ad-image" />
      </div>
      <div className="ad-title">{ad.title}</div>
    </div>
  );
}
