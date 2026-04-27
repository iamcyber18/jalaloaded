'use client';

interface Advert {
  _id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  advertiser: string;
}

export default function AdBanner({ ad }: { ad?: Advert | null }) {
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
