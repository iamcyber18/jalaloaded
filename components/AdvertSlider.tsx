'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Advert {
  _id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
}

interface AdvertSliderProps {
  adverts: Advert[];
  interval?: number; // In milliseconds
  seedOffset?: number; // Optional offset so multiple sliders on the same page don't look identical
}

export default function AdvertSlider({ adverts, interval = 5000, seedOffset = 0 }: AdvertSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(seedOffset % (adverts.length || 1));

  useEffect(() => {
    if (!adverts || adverts.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % adverts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [adverts, interval]);

  if (!adverts || adverts.length === 0) return null;

  const currentAd = adverts[currentIndex];

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'transparent' }}>
      <a href={`/api/adverts/${currentAd._id}/click`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
        {adverts.map((ad, index) => (
          <div
            key={ad._id}
            style={{
              display: index === currentIndex ? 'block' : 'none',
              width: '100%',
              transition: 'opacity 0.5s ease-in-out',
              opacity: index === currentIndex ? 1 : 0,
            }}
          >
            <img 
              src={ad.imageUrl} 
              alt={ad.title} 
              style={{ width: '100%', maxHeight: '300px', display: 'block', objectFit: 'cover', objectPosition: 'center' }} 
            />
          </div>
        ))}
      </a>
      <div style={{ position: 'absolute', bottom: '4px', right: '8px', fontSize: '9px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
        Advertisement
      </div>
    </div>
  );
}
